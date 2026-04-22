import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Video, Evaluation, Criteria, AIModel, ApiResponse, PagedResult } from "../types";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ criteriaId: "", aiModelId: "" });

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () =>
      api.get<ApiResponse<Video>>(`/videos/${id}`).then((r) => r.data.data!),
  });

  const { data: evaluations } = useQuery({
    queryKey: ["evaluations", id],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Evaluation>>>("/evaluations", {
          params: { videoId: id, pageSize: 100 },
        })
        .then((r) => r.data.data!),
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
        .get<ApiResponse<any[]>>("/ai-providers")
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

  return (
    <div>
      <Link to="/videos" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Videolara don
      </Link>

      {/* Video Info */}
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-gray-200">
          <div>
            <span className="text-gray-500">Dosya Adi:</span>
            <p className="font-medium">{video.originalFileName || "-"}</p>
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

      {/* Evaluations List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Degerlendirmeler ({evaluations?.items.length || 0})</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Degerlendirme
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {evaluations?.items && evaluations.items.length > 0 ? (
            evaluations.items.map((e) => (
              <div key={e.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.criteriaName}</p>
                    <p className="text-xs text-gray-500 mt-1">{e.aiModelName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(e.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={e.status} />
                    {e.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{e.errorMessage}</p>
                    )}
                  </div>
                </div>
                {e.result && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
                    {e.result}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="px-6 py-4 text-sm text-gray-500">Degerlendirme yok</p>
          )}
        </div>
      </div>
    </div>
  );
}
