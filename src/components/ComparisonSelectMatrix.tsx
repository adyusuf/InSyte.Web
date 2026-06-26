import type { Evaluation } from "../types";
import type { EvalSelectable, SelItem } from "../lib/reportItems";

type Col = { e: Evaluation; sel: EvalSelectable };
type Props = {
  cols: Col[];
  questionOrder: { id: string; text: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
};

const normalize = (v: number) => (v <= 10 ? v * 10 : v);
const scoreColor = (v: number) => {
  const n = normalize(v);
  if (n >= 80) return "text-green-700";
  if (n >= 60) return "text-amber-700";
  return "text-red-700";
};

/**
 * Sorular × değerlendirmeler matrisi. Her hücrede puan + altında tüm detay;
 * her hücre/madde seçilebilir (checkbox). Seçilenler rapora gider.
 * Not: alt render'lar düz fonksiyon (satır-içi bileşen DEĞİL) — remount olmasın.
 */
export default function ComparisonSelectMatrix({ cols, questionOrder, selected, onToggle }: Props) {
  // Tek seçilebilir hücre (puan + detay)
  const cell = (item?: SelItem, showText = false) => {
    if (!item) return <span className="text-gray-300">—</span>;
    const on = selected.has(item.id);
    return (
      <label className={`flex gap-2 cursor-pointer rounded p-1.5 -m-1 ${on ? "bg-blue-50" : "hover:bg-gray-50"}`}>
        <input type="checkbox" checked={on} onChange={() => onToggle(item.id)} className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0" />
        <div className="min-w-0">
          {item.puan != null && <span className={`font-bold ${scoreColor(item.puan)}`}>{item.puan}</span>}
          {item.metin && (showText || item.puan != null) && <p className="text-xs text-gray-600 mt-0.5">{item.metin}</p>}
        </div>
      </label>
    );
  };

  // Bir hücredeki madde listesi (güçlü/gelişim/an)
  const cellList = (items: SelItem[]) =>
    items.length === 0 ? (
      <span className="text-gray-300">—</span>
    ) : (
      <div className="space-y-1">
        {items.map((it) => {
          const on = selected.has(it.id);
          return (
            <label key={it.id} className={`flex gap-2 cursor-pointer rounded p-1 -m-0.5 text-xs ${on ? "bg-blue-50" : "hover:bg-gray-50"}`}>
              <input type="checkbox" checked={on} onChange={() => onToggle(it.id)} className="mt-0.5 w-3.5 h-3.5 accent-blue-600 shrink-0" />
              <span className="text-gray-700">{it.metin}</span>
            </label>
          );
        })}
      </div>
    );

  const row = (key: string, label: string, render: (c: Col) => React.ReactNode) => (
    <tr key={key} className="align-top">
      <th scope="row" className="text-left p-2 bg-gray-50 border-b border-gray-100 font-medium text-gray-700 w-56 sticky left-0">
        {label}
      </th>
      {cols.map((c) => (
        <td key={c.e.id} className="p-2 border-b border-gray-100 border-l">
          {render(c)}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th scope="col" className="text-left p-2 bg-blue-600 text-white sticky left-0 w-56">Ölçüt</th>
            {cols.map((c) => (
              <th key={c.e.id} scope="col" className="text-left p-2 bg-blue-600 text-white border-l border-blue-500 min-w-[220px]">
                <div className="font-semibold">{c.e.aiModelName}</div>
                <div className="text-[11px] font-normal opacity-90">{c.e.criteriaName}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {row("genel", "Genel Puan", (c) => cell(c.sel.genel))}
          {questionOrder.map((q) => row(q.id, q.text, (c) => cell(c.sel.soru[q.id])))}
          {row("ozet", "Özet", (c) => cell(c.sel.ozet, true))}
          {row("guclu", "Güçlü Yönler", (c) => cellList(c.sel.guclu))}
          {row("gelisim", "Gelişim Alanları", (c) => cellList(c.sel.gelisim))}
        </tbody>
      </table>
    </div>
  );
}
