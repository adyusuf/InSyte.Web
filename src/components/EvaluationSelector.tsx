import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { AIModel, Criteria, ApiResponse, PagedResult } from "../types";

export type EvalMode = "combined" | "separate";

export type EvalSelection = {
  enabled: boolean;
  criteriaId: string;
  mode: EvalMode;
  audioVideoModelId: string;
  audioModelId: string;
  videoModelId: string;
};

export const EMPTY_EVAL: EvalSelection = {
  enabled: false,
  criteriaId: "",
  mode: "combined",
  audioVideoModelId: "",
  audioModelId: "",
  videoModelId: "",
};

/** Seçimi /videos/:id/evaluate gövdesine çevirir; geçersizse null. */
export function buildEvaluatePayload(s: EvalSelection): Record<string, string> | null {
  if (!s.enabled || !s.criteriaId) return null;
  if (s.mode === "combined") {
    return s.audioVideoModelId ? { criteriaId: s.criteriaId, audioVideoModelId: s.audioVideoModelId } : null;
  }
  if (!s.audioModelId && !s.videoModelId) return null;
  const p: Record<string, string> = { criteriaId: s.criteriaId };
  if (s.audioModelId) p.audioModelId = s.audioModelId;
  if (s.videoModelId) p.videoModelId = s.videoModelId;
  return p;
}

type Props = { value: EvalSelection; onChange: (v: EvalSelection) => void };

const selectCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50";

export function EvaluationSelector({ value, onChange }: Props) {
  const set = (patch: Partial<EvalSelection>) => onChange({ ...value, ...patch });

  const { data: models } = useQuery({
    queryKey: ["ai-models-active"],
    queryFn: () => api.get<ApiResponse<AIModel[]>>("/ai-models").then((r) => r.data.data!),
    enabled: value.enabled,
  });

  const { data: criteria } = useQuery({
    queryKey: ["criteria-all"],
    queryFn: () =>
      api.get<ApiResponse<PagedResult<Criteria>>>("/criteria", { params: { pageSize: 100 } }).then((r) => r.data.data!),
    enabled: value.enabled,
  });

  const byRole = (role: string) => (models ?? []).filter((m) => m.role === role && m.isActive);
  const av = byRole("AudioVideo");
  const audio = byRole("Audio");
  const video = byRole("Video");

  const ModelOptions = ({ list }: { list: AIModel[] }) => (
    <>
      <option value="">Model seçin</option>
      {list.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name} ({m.providerName})
        </option>
      ))}
    </>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        Yüklenince AI değerlendirmesi başlat
      </label>

      {value.enabled && (
        <div className="space-y-4 pl-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kriter seti *</label>
            <select value={value.criteriaId} onChange={(e) => set({ criteriaId: e.target.value })} className={selectCls}>
              <option value="">Kriter seçin</option>
              {criteria?.items.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Mod seçimi */}
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={() => set({ mode: "combined" })}
              className={`flex-1 px-3 py-2 rounded-lg border ${value.mode === "combined" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300"}`}>
              🎬🔊 Ses+Video (tek model)
            </button>
            <button type="button" onClick={() => set({ mode: "separate" })}
              className={`flex-1 px-3 py-2 rounded-lg border ${value.mode === "separate" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300"}`}>
              🎬 + 🔊 Ayrı (Video + Ses)
            </button>
          </div>

          {value.mode === "combined" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ses+Video modeli (native)</label>
              <select value={value.audioVideoModelId} onChange={(e) => set({ audioVideoModelId: e.target.value })} className={selectCls}>
                <ModelOptions list={av} />
              </select>
              {av.length === 0 && <p className="text-xs text-amber-600 mt-1">Tanımlı native ses+video modeli yok.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Video modeli (native)</label>
                <select value={value.videoModelId} onChange={(e) => set({ videoModelId: e.target.value })} className={selectCls}>
                  <ModelOptions list={video} />
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🔊 Ses modeli (native)</label>
                <select value={value.audioModelId} onChange={(e) => set({ audioModelId: e.target.value })} className={selectCls}>
                  <ModelOptions list={audio} />
                </select>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Yükleme sonrası seçilen modellere gönderilir; sonuçlar video detayında görünür.
          </p>
        </div>
      )}
    </div>
  );
}
