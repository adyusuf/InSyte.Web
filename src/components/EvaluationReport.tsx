import { useState } from "react";
import { Code, ThumbsUp, TrendingUp, Play } from "lucide-react";
import { parseEvaluation, formatTime, type Evidence } from "../lib/evaluation";

// 0-10 veya 0-100 ölçeğini 100'e normalize eder (renk için).
const normalize = (v: number) => (v <= 10 ? v * 10 : v);
const scoreColor = (v: number) => {
  const n = normalize(v);
  if (n >= 80) return "text-green-700 bg-green-100";
  if (n >= 60) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
};

type Props = {
  result?: string;
  questionText?: Record<string, string>;
  /** Bir kanıt zamanına tıklanınca videoda o ana atla */
  onSeek?: (seconds: number) => void;
};

// Kanıt zaman damgası çipleri — tıklanınca videoda o ana atlar
function EvidenceChips({ kanitlar, onSeek }: { kanitlar: Evidence[]; onSeek?: Props["onSeek"] }) {
  if (kanitlar.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {kanitlar.map((k) => (
        <button
          key={`${k.baslangic}-${k.bitis ?? "x"}-${k.aciklama?.slice(0, 12) ?? ""}`}
          onClick={() => onSeek?.(k.baslangic)}
          disabled={!onSeek}
          title={k.aciklama}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium hover:bg-blue-100 disabled:opacity-60 disabled:cursor-default transition"
        >
          <Play className="w-2.5 h-2.5" fill="currentColor" />
          {formatTime(k.baslangic)}
          {k.bitis != null && k.bitis > k.baslangic && `–${formatTime(k.bitis)}`}
        </button>
      ))}
    </div>
  );
}

export default function EvaluationReport({ result, questionText, onSeek }: Props) {
  const [showJson, setShowJson] = useState(false);
  if (!result) return null;

  const d = parseEvaluation(result);

  // Beklenen şema değilse: ham metni göster
  if (!d.ok) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
        {result}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      {/* Genel puan + özet */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        {d.genelPuan != null && (
          <div className={`flex flex-col items-center justify-center rounded-lg px-4 py-2 ${scoreColor(d.genelPuan)}`}>
            <span className="text-2xl font-bold leading-none">{d.genelPuan}</span>
            <span className="text-[10px] mt-1 opacity-80">{d.genelPuan <= 10 ? "/10" : "/100"}</span>
          </div>
        )}
        {d.ozet && <p className="text-sm text-gray-700 flex-1">{d.ozet}</p>}
      </div>

      {/* Güçlü yönler + gelişim alanları */}
      <div className="grid md:grid-cols-2 gap-4">
        {d.gucluYonler.length > 0 && (
          <div className="p-3 rounded-lg border border-green-100 bg-green-50/50">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800 mb-2">
              <ThumbsUp className="w-4 h-4" /> Güçlü Yönler
            </p>
            <ul className="space-y-2">
              {d.gucluYonler.map((g) => (
                <li key={g.baslik} className="text-xs text-gray-700">
                  <span className="flex gap-1.5">
                    <span className="text-green-600">•</span> {g.baslik}
                  </span>
                  <EvidenceChips kanitlar={g.kanitlar} onSeek={onSeek} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {d.gelisimAlanlari.length > 0 && (
          <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/50">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 mb-2">
              <TrendingUp className="w-4 h-4" /> Gelişim Alanları
            </p>
            <ul className="space-y-2">
              {d.gelisimAlanlari.map((g) => (
                <li key={g.baslik} className="text-xs text-gray-700">
                  <span className="flex gap-1.5">
                    <span className="text-amber-600">•</span> {g.baslik}
                  </span>
                  <EvidenceChips kanitlar={g.kanitlar} onSeek={onSeek} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Soru bazlı değerlendirme */}
      {d.sorular.length > 0 && (
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            Soru Değerlendirmeleri ({d.sorular.length})
          </p>
          {d.sorular.map((s, i) => (
            <div key={s.soruId ?? `s-${i}`} className="px-3 py-2.5 flex gap-3">
              {s.puan != null && (
                <span className={`shrink-0 self-start px-2 py-0.5 rounded text-xs font-semibold ${scoreColor(s.puan)}`}>
                  {s.puan}
                </span>
              )}
              <div className="min-w-0">
                {questionText && s.soruId && questionText[s.soruId] && (
                  <p className="text-xs font-medium text-gray-800 mb-0.5">{questionText[s.soruId]}</p>
                )}
                <p className="text-xs text-gray-600">{s.yorum}</p>
                {s.gerekce && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    <span className="font-medium text-gray-600">Gerekçe:</span> {s.gerekce}
                  </p>
                )}
                <EvidenceChips kanitlar={s.kanitlar} onSeek={onSeek} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ham JSON — istenirse aç */}
      <div>
        <button
          onClick={() => setShowJson((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <Code className="w-3.5 h-3.5" /> {showJson ? "JSON'ı gizle" : "Ham JSON'ı göster"}
        </button>
        {showJson && (
          <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-[11px] overflow-x-auto max-h-64">
            {JSON.stringify(d.raw, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
