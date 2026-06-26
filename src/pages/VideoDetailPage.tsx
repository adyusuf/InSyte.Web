import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Video, Evaluation, Criteria, AIModel, AIProvider, ApiResponse, PagedResult } from "../types";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import VideoPlayer from "../components/VideoPlayer";
import EvaluationCard from "../components/EvaluationCard";
import { downloadCuratedReportPdf } from "../lib/pdf";
import { EVALUATION_IN_PROGRESS } from "../lib/constants";
import { ArrowLeft, Plus, FileDown, Loader2, FilePlus, FileText } from "lucide-react";
import type { Comparison } from "../types";
import { useRef, useState } from "react";

const anyInProgress = (evals?: Evaluation[]) =>
  !!evals?.some((e) => EVALUATION_IN_PROGRESS.includes(e.stage));

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ criteriaId: "", aiModelId: "" });
  const seekRef = useRef<((seconds: number) => void) | null>(null);

  // Bir kriterin (tamamlanmış) değerlendirmelerinden rapor hazırla → editöre geç
  const [buildingCriteria, setBuildingCriteria] = useState<string>("");
  const buildReportForCriterion = async (criteriaName: string, evalIds: string[]) => {
    if (evalIds.length === 0) return;
    setBuildingCriteria(criteriaName);
    try {
      const res = await api.post<ApiResponse<{ id: string }>>("/comparisons", {
        videoId: id,
        evaluationIds: evalIds,
        title: criteriaName,
      });
      navigate(`/comparisons/${res.data.data!.id}/rapor`);
    } catch {
      alert("Rapor oluşturulamadı.");
      setBuildingCriteria("");
    }
  };

  // Kanıt/timeline tıklaması: üstteki videoyu o ana sür + videoyu göster
  const handleSeek = (seconds: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    seekRef.current?.(seconds);
  };

  const { data: evaluations } = useQuery({
    queryKey: ["evaluations", id],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Evaluation>>>("/evaluations", {
          params: { videoId: id, pageSize: 100 },
        })
        .then((r) => r.data.data!),
    // İşlem sürerken canlı güncelle (3 sn). Sayfa sadece okur; işi etkilemez.
    refetchInterval: (q) => (anyInProgress(q.state.data?.items) ? 3000 : false),
  });

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () =>
      api.get<ApiResponse<Video>>(`/videos/${id}`).then((r) => r.data.data!),
    refetchInterval: anyInProgress(evaluations?.items) ? 3000 : false,
  });

  const retryMutation = useMutation({
    mutationFn: (evalId: string) => api.post(`/evaluations/${evalId}/retry`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluations", id] }),
  });

  // Rapordaki soru metinleri için: değerlendirmelerin kriterlerinin sorularını çek
  const criteriaIds = [...new Set((evaluations?.items ?? []).map((e) => e.criteriaId))];
  const { data: questionTextMap } = useQuery({
    queryKey: ["question-text", criteriaIds.join(",")],
    enabled: criteriaIds.length > 0,
    queryFn: async () => {
      const map: Record<string, string> = {};
      for (const cid of criteriaIds) {
        const qs = await api
          .get<ApiResponse<{ id: string; question: string }[]>>(`/criteria/${cid}/questions`)
          .then((r) => r.data.data ?? []);
        qs.forEach((q) => (map[q.id] = q.question));
      }
      return map;
    },
  });

  // Bu videonun kayıtlı karşılaştırmaları (her birinin opsiyonel raporu)
  const { data: comparisons } = useQuery({
    queryKey: ["comparisons", id],
    queryFn: () => api.get<ApiResponse<Comparison[]>>("/comparisons", { params: { videoId: id } }).then((r) => r.data.data ?? []),
  });

  const { data: criteria } = useQuery({
    queryKey: ["criteria"],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Criteria>>>("/criteria", { params: { pageSize: 100 } })
        .then((r) => r.data.data!),
  });

  const { data: models } = useQuery({
    queryKey: ["ai-models"],
    queryFn: async () => {
      const providers = await api
        .get<ApiResponse<AIProvider[]>>("/ai-providers")
        .then((r) => r.data.data!);

      const allModels: AIModel[] = [];
      for (const provider of providers) {
        const providerModels = await api
          .get<ApiResponse<AIModel[]>>(`/ai-providers/${provider.id}/models`)
          .then((r) => r.data.data!);
        allModels.push(...providerModels);
      }
      return allModels;
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: () =>
      api.post(`/videos/${id}/evaluate`, {
        criteriaId: form.criteriaId,
        aiModelId: form.aiModelId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations", id] });
      queryClient.invalidateQueries({ queryKey: ["video", id] });
      setShowModal(false);
      setForm({ criteriaId: "", aiModelId: "" });
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;
  if (!video) return <div className="text-center py-12 text-gray-500">Video bulunamadi</div>;

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    evaluateMutation.mutate();
  };

  // Değerlendirmeleri kritere göre grupla (her kriter = 1+ model değerlendirmesi)
  const criteriaGroups = (() => {
    const map = new Map<string, { name: string; evals: Evaluation[] }>();
    (evaluations?.items ?? []).forEach((e) => {
      if (!map.has(e.criteriaId)) map.set(e.criteriaId, { name: e.criteriaName, evals: [] });
      map.get(e.criteriaId)!.evals.push(e);
    });
    return [...map.values()];
  })();

  return (
    <div>
      <Link to="/videos" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Videolara don
      </Link>

      {/* Üst: video + bilgi */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {video.schoolName} • {video.teacherName}
            </p>
          </div>
          <div className="text-right">
            <StatusBadge status={video.status} />
            <p className="text-xs text-gray-500 mt-2">
              {new Date(video.createdAt).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-4 pt-4 border-t border-gray-200">
          {/* Video oynatıcı (kanıt/timeline tıklamaları buraya atlar) */}
          <div className="w-full md:w-80 shrink-0">
            <VideoPlayer
              thumbnailUrl={video.thumbnailUrl}
              playbackUrl={video.playbackUrl}
              streamUid={video.streamUid}
              title={video.title}
              seekRef={seekRef}
            />
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 text-sm flex-1 self-start">
            <div>
              <span className="text-gray-500">Dosya Adi:</span>
              <p className="font-medium break-all">{video.originalFileName || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Boyut:</span>
              <p className="font-medium">{(video.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <div>
              <span className="text-gray-500">Konu:</span>
              <p className="font-medium">{video.subject || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Degerlendirmeler:</span>
              <p className="font-medium">{video.evaluationCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for new evaluation */}
      <Modal isOpen={showModal} title="Yeni Degerlendirme" onClose={() => setShowModal(false)}>
        <form onSubmit={handleEvaluate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kriter *</label>
            <select
              required
              value={form.criteriaId}
              onChange={(e) => setForm({ ...form, criteriaId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Kriter secin</option>
              {criteria?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.subject && `(${c.subject})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Modeli *</label>
            <select
              required
              value={form.aiModelId}
              onChange={(e) => setForm({ ...form, aiModelId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Modeli secin</option>
              {models?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.providerName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={evaluateMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {evaluateMutation.isPending ? "Baslatiliyor..." : "Degerlendirmeyi Basla"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Iptal
            </button>
          </div>
        </form>
      </Modal>

      {/* Değerlendirmeler — kritere göre gruplu; her kriterden rapor hazırlanır */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Degerlendirmeler ({evaluations?.items.length || 0})</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Degerlendirme
        </button>
      </div>

      {criteriaGroups.length > 0 ? (
        <div className="space-y-5">
          {criteriaGroups.map((g, gi) => {
            const tamamlanan = g.evals.filter((e) => e.result).map((e) => e.id);
            return (
              <div key={g.name + gi}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">
                    {g.name} <span className="text-xs font-normal text-gray-400">• {g.evals.length} model</span>
                  </h3>
                  <button
                    onClick={() => buildReportForCriterion(g.name, tamamlanan)}
                    disabled={tamamlanan.length === 0 || buildingCriteria !== ""}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    title={tamamlanan.length === 0 ? "Tamamlanmış değerlendirme yok" : ""}
                  >
                    {buildingCriteria === g.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                    Rapor Hazırla
                  </button>
                </div>
                <div className="space-y-3">
                  {g.evals.map((e, i) => (
                    <div key={e.id} className="bg-white rounded-xl border border-gray-200">
                      <EvaluationCard
                        evaluation={e}
                        questionText={questionTextMap}
                        onSeek={handleSeek}
                        onRetry={(eid) => retryMutation.mutate(eid)}
                        defaultOpen={gi === 0 && i === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 px-6 py-4">
          Degerlendirme yok
        </p>
      )}

      {/* Kayıtlı karşılaştırmalar + raporları */}
      {comparisons && comparisons.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-gray-900 mb-3">Karşılaştırmalar & Raporlar ({comparisons.length})</h2>
          <div className="space-y-2">
            {comparisons.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {c.title || "Karşılaştırma"} <span className="text-xs text-gray-400">• {c.evaluationIds.length} değerlendirme</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(c.createdAt).toLocaleString("tr-TR")}
                    {c.reportId && <span className="ml-2 text-green-700">• Rapor: {c.reportTitle || "hazır"} ({c.reportStatus})</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.reportId && (
                    <button
                      onClick={() => downloadCuratedReportPdf(c.id).catch(() => alert("PDF indirilemedi"))}
                      className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      <FileDown className="w-3.5 h-3.5" /> PDF
                    </button>
                  )}
                  <Link
                    to={`/comparisons/${c.id}/rapor`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <FileText className="w-3.5 h-3.5" /> {c.reportId ? "Raporu Düzenle" : "Rapor Hazırla"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
