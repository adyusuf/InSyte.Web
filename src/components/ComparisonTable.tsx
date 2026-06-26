import { parseEvaluation, type ParsedEvaluation } from "../lib/evaluation";
import type { Evaluation } from "../types";

type Props = {
  evaluations: Evaluation[];
  questionText?: Record<string, string>;
};

const normalize = (v: number) => (v <= 10 ? v * 10 : v);
const scoreColor = (v: number) => {
  const n = normalize(v);
  if (n >= 80) return "text-green-700";
  if (n >= 60) return "text-amber-700";
  return "text-red-700";
};

// Bir satırdaki en yüksek puanı bul (hepsi eşitse vurgulama yapma)
const maxOf = (vals: (number | undefined)[]) => {
  const defined = vals.filter((v): v is number => v != null);
  if (defined.length === 0) return undefined;
  const max = Math.max(...defined);
  return defined.every((v) => v === max) ? undefined : max;
};

export default function ComparisonTable({ evaluations, questionText }: Props) {
  const cols = evaluations.map((e) => ({ e, d: parseEvaluation(e.result) }));

  // Tüm değerlendirmelerdeki soruları birleştir (ilk görülme sırasıyla)
  const questionOrder: string[] = [];
  const seen = new Set<string>();
  for (const { d } of cols)
    for (const s of d.sorular)
      if (s.soruId && !seen.has(s.soruId)) {
        seen.add(s.soruId);
        questionOrder.push(s.soruId);
      }

  const genelMax = maxOf(cols.map((c) => c.d.genelPuan));

  const puanFor = (d: ParsedEvaluation, soruId: string) =>
    d.sorular.find((s) => s.soruId === soruId)?.puan;

  return (
    <div className="space-y-6">
      {/* Puan tablosu */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th scope="col" className="text-left p-2 bg-gray-50 border-b border-gray-200 font-medium text-gray-500 w-1/3">
                Ölçüt
              </th>
              {cols.map(({ e }) => (
                <th key={e.id} scope="col" className="text-center p-2 bg-blue-600 text-white border-b border-blue-700">
                  <div className="font-semibold">{e.aiModelName}</div>
                  <div className="text-[11px] font-normal opacity-90">{e.criteriaName}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="text-left p-2 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700">
                Genel Puan
              </th>
              {cols.map(({ e, d }) => (
                <td
                  key={e.id}
                  className={`text-center p-2 border-b border-gray-100 font-bold ${
                    d.genelPuan != null && d.genelPuan === genelMax ? "bg-green-50" : ""
                  } ${d.genelPuan != null ? scoreColor(d.genelPuan) : "text-gray-400"}`}
                >
                  {d.genelPuan ?? "—"}
                </td>
              ))}
            </tr>
            {questionOrder.map((soruId) => {
              const rowVals = cols.map((c) => puanFor(c.d, soruId));
              const rowMax = maxOf(rowVals);
              return (
                <tr key={soruId}>
                  <th scope="row" className="text-left p-2 border-b border-gray-100 font-normal text-gray-700">
                    {questionText?.[soruId] ?? soruId}
                  </th>
                  {rowVals.map((p, idx) => (
                    <td
                      key={cols[idx].e.id}
                      className={`text-center p-2 border-b border-gray-100 font-semibold ${
                        p != null && p === rowMax ? "bg-green-50" : ""
                      } ${p != null ? scoreColor(p) : "text-gray-400"}`}
                    >
                      {p ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Yan yana metinsel karşılaştırma */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
        {cols.map(({ e, d }) => (
          <div key={e.id} className="border border-gray-200 rounded-lg p-3 text-xs space-y-2">
            <p className="font-semibold text-gray-800">{e.aiModelName}</p>
            {d.ozet && <p className="text-gray-600">{d.ozet}</p>}
            {d.gucluYonler.length > 0 && (
              <div>
                <p className="font-medium text-green-700">Güçlü Yönler</p>
                <ul className="mt-0.5 space-y-0.5">
                  {d.gucluYonler.map((g) => (
                    <li key={g.baslik} className="text-gray-600">• {g.baslik}</li>
                  ))}
                </ul>
              </div>
            )}
            {d.gelisimAlanlari.length > 0 && (
              <div>
                <p className="font-medium text-amber-700">Gelişim Alanları</p>
                <ul className="mt-0.5 space-y-0.5">
                  {d.gelisimAlanlari.map((g) => (
                    <li key={g.baslik} className="text-gray-600">• {g.baslik}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
