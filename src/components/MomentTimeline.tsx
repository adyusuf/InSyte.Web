import { Play } from "lucide-react";
import { formatTime, type KeyMoment } from "../lib/evaluation";

type Props = {
  moments: KeyMoment[];
  onSeek: (seconds: number) => void;
};

const TIP_STYLE: Record<KeyMoment["tip"], { dot: string; label: string; chip: string }> = {
  guclu: { dot: "bg-green-500", label: "Güçlü", chip: "bg-green-100 text-green-700" },
  zayif: { dot: "bg-amber-500", label: "Geliştirilmeli", chip: "bg-amber-100 text-amber-700" },
  notr: { dot: "bg-gray-400", label: "Nötr", chip: "bg-gray-100 text-gray-600" },
};

/** Bir değerlendirmenin "önemli anlar" zaman çizelgesi. Tıklanınca üstteki video o ana atlar. */
export default function MomentTimeline({ moments, onSeek }: Props) {
  if (moments.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Bu değerlendirmede işaretlenmiş önemli an yok. (Yeni şemayla yapılan değerlendirmelerde
        kritik anlar burada görünür.)
      </p>
    );
  }

  const sorted = [...moments].sort((a, b) => a.zaman - b.zaman);

  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-3">
      {sorted.map((m) => {
        const st = TIP_STYLE[m.tip];
        return (
          <li key={`${m.zaman}-${m.baslik}`} className="ml-4">
            <span className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full ${st.dot} ring-2 ring-white`} />
            <div className="flex items-start gap-2">
              <button
                onClick={() => onSeek(m.zaman)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition shrink-0"
              >
                <Play className="w-2.5 h-2.5" fill="currentColor" />
                {formatTime(m.zaman)}
              </button>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                  {m.baslik}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${st.chip}`}>{st.label}</span>
                </p>
                {m.aciklama && <p className="text-xs text-gray-600 mt-0.5">{m.aciklama}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
