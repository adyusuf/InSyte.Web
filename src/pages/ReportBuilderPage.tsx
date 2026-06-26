import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import api from "../lib/api";
import { Comparison, Evaluation, ApiResponse, PagedResult } from "../types";
import { evaluationToSelectable, flattenSelectable, MADDE_GRUPLARI, type SelItem, type MaddeGrup } from "../lib/reportItems";
import ComparisonSelectMatrix from "../components/ComparisonSelectMatrix";
import { downloadCuratedReportPdf } from "../lib/pdf";
import { ArrowLeft, FileDown, Loader2, Trash2, Check } from "lucide-react";

type EditItem = { id: string; grup: MaddeGrup; baslik: string; metin: string; kaynak: string; puan?: number };

const grupSira = (g: MaddeGrup) => MADDE_GRUPLARI.findIndex((x) => x.key === g);

export default function ReportBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: comparison } = useQuery({
    queryKey: ["comparison", id],
    queryFn: () => api.get<ApiResponse<Comparison>>(`/comparisons/${id}`).then((r) => r.data.data!),
  });

  const { data: evalData } = useQuery({
    queryKey: ["evaluations", comparison?.videoId],
    enabled: !!comparison?.videoId,
    queryFn: () =>
      api.get<ApiResponse<PagedResult<Evaluation>>>("/evaluations", { params: { videoId: comparison!.videoId, pageSize: 100 } }).then((r) => r.data.data!),
  });

  const evals = useMemo(() => {
    const ids = new Set(comparison?.evaluationIds ?? []);
    return (evalData?.items ?? []).filter((e) => ids.has(e.id));
  }, [evalData, comparison]);

  const criteriaIds = [...new Set(evals.map((e) => e.criteriaId))];
  const { data: questionText } = useQuery({
    queryKey: ["question-text", criteriaIds.join(",")],
    enabled: criteriaIds.length > 0,
    queryFn: async () => {
      const map: Record<string, string> = {};
      for (const cid of criteriaIds) {
        const qs = await api.get<ApiResponse<{ id: string; question: string }[]>>(`/criteria/${cid}/questions`).then((r) => r.data.data ?? []);
        qs.forEach((q) => (map[q.id] = q.question));
      }
      return map;
    },
  });

  // Matris sütunları (her değerlendirme) + tüm seçilebilir maddelerin id haritası
  const cols = useMemo(() => evals.map((e) => ({ e, sel: evaluationToSelectable(e, questionText) })), [evals, questionText]);

  const allById = useMemo(() => {
    const m = new Map<string, SelItem>();
    cols.forEach((c) => flattenSelectable(c.sel).forEach((it) => m.set(it.id, it)));
    return m;
  }, [cols]);

  // Soru sırası (ilk görülme) — matris satırları
  const questionOrder = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; text: string }[] = [];
    cols.forEach((c) =>
      Object.values(c.sel.soru).forEach((s) => {
        const sid = s.id.split("::soru::")[1];
        if (sid && !seen.has(sid)) {
          seen.add(sid);
          out.push({ id: sid, text: s.baslik });
        }
      })
    );
    return out;
  }, [cols]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"sec" | "duzenle">("sec");
  const [title, setTitle] = useState("");
  const [giris, setGiris] = useState("");
  const [sonuc, setSonuc] = useState("");
  const [items, setItems] = useState<EditItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (itemId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });

  const buildFromSelection = () => {
    const chosen = [...selected].map((id) => allById.get(id)).filter((it): it is SelItem => !!it);
    // Gruba göre sırala (Genel → Özet → Soru → Güçlü → Gelişim → Anlar)
    chosen.sort((a, b) => grupSira(a.grup) - grupSira(b.grup));
    setItems(chosen.map((it) => ({ id: it.id, grup: it.grup, baslik: it.baslik, metin: it.metin || it.baslik, kaynak: it.kaynak, puan: it.puan })));
    setTitle(comparison?.title || "Öğretmen Değerlendirme Raporu");
    setPhase("duzenle");
    setSaved(false);
  };

  const loadExisting = () => {
    if (!comparison?.reportContentJson) return;
    try {
      const c = JSON.parse(comparison.reportContentJson) as { giris?: string; sonuc?: string; maddeler?: Partial<EditItem>[] };
      setGiris(c.giris ?? "");
      setSonuc(c.sonuc ?? "");
      setItems((c.maddeler ?? []).map((m, i) => ({ id: `ex-${i}`, grup: (m.grup ?? "soru") as MaddeGrup, baslik: m.baslik ?? "", metin: m.metin ?? "", kaynak: m.kaynak ?? "", puan: m.puan })));
      setTitle(comparison.reportTitle ?? comparison.title ?? "");
      setPhase("duzenle");
    } catch {
      /* yoksay */
    }
  };

  const updateItem = (itemId: string, patch: Partial<EditItem>) =>
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)));
  const removeItem = (itemId: string) => setItems((prev) => prev.filter((it) => it.id !== itemId));

  const save = async () => {
    setSaving(true);
    try {
      const content = { giris, maddeler: items.map(({ grup, baslik, metin, kaynak, puan }) => ({ grup, baslik, metin, kaynak, puan })), sonuc };
      await api.post(`/comparisons/${id}/report`, { title, contentJson: JSON.stringify(content) });
      setSaved(true);
    } catch {
      alert("Rapor kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (!comparison) return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;

  return (
    <div className={phase === "sec" ? "" : "max-w-4xl mx-auto"}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Rapor Hazırla</h1>
        <div className="flex gap-1 text-sm">
          <span className={phase === "sec" ? "font-semibold text-blue-600" : "text-gray-400"}>1. Madde Seç</span>
          <span className="text-gray-300">›</span>
          <span className={phase === "duzenle" ? "font-semibold text-blue-600" : "text-gray-400"}>2. Düzenle & Kaydet</span>
        </div>
      </div>

      {phase === "sec" ? (
        <div className="space-y-4">
          {comparison.reportId && (
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
              <span>Bu karşılaştırmanın bir raporu var.</span>
              <button onClick={loadExisting} className="text-blue-600 hover:underline font-medium">Mevcut raporu düzenle</button>
            </div>
          )}
          <p className="text-sm text-gray-600">
            Soru ve değerlendirme matrisinden rapora eklemek istediğin hücreleri/maddeleri seç. Sonra düzenleyip kaydedebilirsin.
          </p>

          <ComparisonSelectMatrix cols={cols} questionOrder={questionOrder} selected={selected} onToggle={toggle} />

          <div className="sticky bottom-4 flex justify-end">
            <button
              onClick={buildFromSelection}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Seçilenlerden Rapor Oluştur ({selected.size})
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giriş</label>
              <textarea value={giris} onChange={(e) => setGiris(e.target.value)} rows={3} placeholder="Raporun giriş paragrafı..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="space-y-5">
            {MADDE_GRUPLARI.map((grup) => {
              const grupItems = items.filter((it) => it.grup === grup.key);
              if (grupItems.length === 0) return null;
              return (
                <div key={grup.key} className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{grup.label} ({grupItems.length})</h3>
                  {grupItems.map((it) => (
                    <div key={it.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <input value={it.baslik} onChange={(e) => updateItem(it.id, { baslik: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <textarea value={it.metin} onChange={(e) => updateItem(it.id, { metin: e.target.value })} rows={2} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <p className="text-[11px] text-gray-400">Kaynak: {it.kaynak}{it.puan != null && ` • Puan: ${it.puan}`}</p>
                        </div>
                        <button onClick={() => removeItem(it.id)} aria-label="Maddeyi çıkar" className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sonuç</label>
            <textarea value={sonuc} onChange={(e) => setSonuc(e.target.value)} rows={3} placeholder="Genel değerlendirme / sonuç..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setPhase("sec")} className="text-sm text-gray-500 hover:text-gray-700">‹ Madde seçimine dön</button>
            <div className="flex items-center gap-2">
              {saved && (
                <button onClick={() => downloadCuratedReportPdf(id!)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileDown className="w-4 h-4" /> PDF indir
                </button>
              )}
              <button onClick={save} disabled={saving || items.length === 0} className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                {saved ? "Kaydedildi" : "Raporu Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
