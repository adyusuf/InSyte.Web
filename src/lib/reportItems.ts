import { type ParsedEvaluation, type Evidence, formatTime } from "./evaluation";
import type { Evaluation } from "../types";

// Karşılaştırma ekranında tek tek seçilebilen rapor maddesi
export type SelectableItem = {
  id: string;
  evalId: string;
  kaynak: string; // model adı
  tur: "ozet" | "guclu" | "gelisim" | "soru" | "an";
  turEtiket: string;
  baslik: string;
  metin: string;
  puan?: number;
};

const times = (kanitlar: Evidence[]) =>
  kanitlar.length ? "  [" + kanitlar.map((x) => formatTime(x.baslangic)).join(", ") + "]" : "";

// Bir değerlendirmenin sonucunu seçilebilir maddelere ayırır
export function evaluationToItems(
  e: Evaluation,
  parsed: ParsedEvaluation,
  questionText?: Record<string, string>
): SelectableItem[] {
  const items: SelectableItem[] = [];
  const k = e.aiModelName;

  if (parsed.ozet)
    items.push({ id: `${e.id}-ozet`, evalId: e.id, kaynak: k, tur: "ozet", turEtiket: "Özet", baslik: "Genel Özet", metin: parsed.ozet });

  parsed.gucluYonler.forEach((g, i) =>
    items.push({ id: `${e.id}-g${i}`, evalId: e.id, kaynak: k, tur: "guclu", turEtiket: "Güçlü Yön", baslik: g.baslik, metin: g.baslik + times(g.kanitlar) })
  );
  parsed.gelisimAlanlari.forEach((g, i) =>
    items.push({ id: `${e.id}-d${i}`, evalId: e.id, kaynak: k, tur: "gelisim", turEtiket: "Gelişim Alanı", baslik: g.baslik, metin: g.baslik + times(g.kanitlar) })
  );
  parsed.sorular.forEach((s, i) => {
    const q = (s.soruId && questionText?.[s.soruId]) || "Soru";
    const metin = [s.yorum, s.gerekce ? `Gerekçe: ${s.gerekce}` : "", times(s.kanitlar).trim()].filter(Boolean).join(" ");
    items.push({ id: `${e.id}-s${i}`, evalId: e.id, kaynak: k, tur: "soru", turEtiket: "Soru", baslik: q, metin, puan: s.puan });
  });
  parsed.onemliAnlar.forEach((m, i) =>
    items.push({ id: `${e.id}-a${i}`, evalId: e.id, kaynak: k, tur: "an", turEtiket: "Önemli An", baslik: `${formatTime(m.zaman)} — ${m.baslik}`, metin: m.aciklama ?? m.baslik })
  );

  return items;
}
