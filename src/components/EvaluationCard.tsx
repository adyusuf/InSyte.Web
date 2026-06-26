import { useState } from "react";
import { ChevronDown, RefreshCw, Loader2, FileText, Clapperboard } from "lucide-react";
import EvaluationReport from "./EvaluationReport";
import MomentTimeline from "./MomentTimeline";
import { parseEvaluation } from "../lib/evaluation";
import { EVALUATION_STAGE_LABEL, EVALUATION_STAGE_COLOR, EVALUATION_IN_PROGRESS } from "../lib/constants";
import type { Evaluation } from "../types";

type Props = {
  evaluation: Evaluation;
  questionText?: Record<string, string>;
  onSeek: (seconds: number) => void;
  onRetry: (id: string) => void;
  defaultOpen?: boolean;
};

/** Tek değerlendirme: akordiyon başlık + içinde "Rapor | Önemli Anlar" sekmeleri. */
export default function EvaluationCard({ evaluation: e, questionText, onSeek, onRetry, defaultOpen }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [tab, setTab] = useState<"rapor" | "anlar">("rapor");
  const parsed = parseEvaluation(e.result);
  const momentCount = parsed.onemliAnlar.length;

  return (
    <div>
      {/* Başlık (akordiyon) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 text-left"
      >
        <div className="flex items-start gap-2 min-w-0">
          <ChevronDown className={`w-4 h-4 text-gray-400 mt-0.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{e.criteriaName}</p>
            <p className="text-xs text-gray-500 mt-1">{e.aiModelName}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(e.createdAt).toLocaleString("tr-TR")}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${EVALUATION_STAGE_COLOR[e.stage] ?? "bg-gray-100 text-gray-600"}`}>
            {EVALUATION_IN_PROGRESS.includes(e.stage) && <Loader2 className="w-3 h-3 animate-spin" />}
            {EVALUATION_STAGE_LABEL[e.stage] ?? e.stage}
          </span>
          {e.attempt > 1 && <p className="text-xs text-gray-400 mt-1">{e.attempt}. deneme</p>}
          {e.errorMessage && <p className="text-xs text-red-600 mt-1 max-w-xs break-words">{e.errorMessage}</p>}
          {e.stage === "Failed" && (
            <span
              onClick={(ev) => {
                ev.stopPropagation();
                onRetry(e.id);
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Yeniden Dene
            </span>
          )}
        </div>
      </button>

      {/* İçerik: sekmeler */}
      {open && e.result && (
        <div className="px-6 pb-5">
          <div className="flex gap-1 border-b border-gray-200 mb-3">
            <button
              onClick={() => setTab("rapor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "rapor" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4" /> Rapor
            </button>
            <button
              onClick={() => setTab("anlar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "anlar" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Clapperboard className="w-4 h-4" /> Önemli Anlar
              {momentCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">{momentCount}</span>
              )}
            </button>
          </div>

          {tab === "rapor" ? (
            <EvaluationReport result={e.result} questionText={questionText} onSeek={onSeek} />
          ) : (
            <MomentTimeline moments={parsed.onemliAnlar} onSeek={onSeek} />
          )}
        </div>
      )}
      {open && !e.result && (
        <p className="px-6 pb-5 text-sm text-gray-500">Sonuç henüz hazır değil.</p>
      )}
    </div>
  );
}
