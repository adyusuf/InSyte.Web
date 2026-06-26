import { parseEvaluation, type Evidence, formatTime } from "./evaluation";
import type { Evaluation } from "../types";

export type MaddeGrup = "genel" | "ozet" | "soru" | "guclu" | "gelisim" | "an";

// Rapor maddeleri gruplama sırası + etiketleri
export const MADDE_GRUPLARI: { key: MaddeGrup; label: string }[] = [
  { key: "genel", label: "Genel Puan" },
  { key: "ozet", label: "Özet" },
  { key: "soru", label: "Soru Değerlendirmeleri" },
  { key: "guclu", label: "Güçlü Yönler" },
  { key: "gelisim", label: "Gelişim Alanları" },
  { key: "an", label: "Önemli Anlar" },
];

// Matriste/raporda seçilebilen tek bir madde
export type SelItem = {
  id: string;
  evalId: string;
  kaynak: string; // model adı
  grup: MaddeGrup;
  turEtiket: string;
  baslik: string;
  metin: string;
  puan?: number;
};

// Bir değerlendirmenin seçilebilir maddeleri — matris için yapısal
export type EvalSelectable = {
  genel?: SelItem;
  ozet?: SelItem;
  soru: Record<string, SelItem>; // soruId → madde
  guclu: SelItem[];
  gelisim: SelItem[];
  anlar: SelItem[];
};

const times = (kanitlar: Evidence[]) =>
  kanitlar.length ? " [" + kanitlar.map((x) => formatTime(x.baslangic)).join(", ") + "]" : "";

export function evaluationToSelectable(e: Evaluation, questionText?: Record<string, string>): EvalSelectable {
  const d = parseEvaluation(e.result);
  const k = e.aiModelName;
  const out: EvalSelectable = { soru: {}, guclu: [], gelisim: [], anlar: [] };

  if (d.genelPuan != null)
    out.genel = { id: `${e.id}::genel`, evalId: e.id, kaynak: k, grup: "genel", turEtiket: "Genel Puan", baslik: "Genel Puan", metin: "", puan: d.genelPuan };

  if (d.ozet)
    out.ozet = { id: `${e.id}::ozet`, evalId: e.id, kaynak: k, grup: "ozet", turEtiket: "Özet", baslik: "Genel Özet", metin: d.ozet };

  d.sorular.forEach((s) => {
    if (!s.soruId) return;
    const q = questionText?.[s.soruId] || "Soru";
    const metin = [s.yorum, s.gerekce ? `Gerekçe: ${s.gerekce}` : "", times(s.kanitlar).trim()].filter(Boolean).join(" ");
    out.soru[s.soruId] = { id: `${e.id}::soru::${s.soruId}`, evalId: e.id, kaynak: k, grup: "soru", turEtiket: "Soru", baslik: q, metin, puan: s.puan };
  });

  d.gucluYonler.forEach((g, i) =>
    out.guclu.push({ id: `${e.id}::guclu::${i}`, evalId: e.id, kaynak: k, grup: "guclu", turEtiket: "Güçlü Yön", baslik: g.baslik, metin: g.baslik + times(g.kanitlar) })
  );
  d.gelisimAlanlari.forEach((g, i) =>
    out.gelisim.push({ id: `${e.id}::gelisim::${i}`, evalId: e.id, kaynak: k, grup: "gelisim", turEtiket: "Gelişim Alanı", baslik: g.baslik, metin: g.baslik + times(g.kanitlar) })
  );
  d.onemliAnlar.forEach((m, i) =>
    out.anlar.push({ id: `${e.id}::an::${i}`, evalId: e.id, kaynak: k, grup: "an", turEtiket: "Önemli An", baslik: `${formatTime(m.zaman)} — ${m.baslik}`, metin: m.aciklama ?? m.baslik })
  );

  return out;
}

// Bir EvalSelectable'daki tüm maddeleri düz listele (id→madde haritası için)
export function flattenSelectable(s: EvalSelectable): SelItem[] {
  return [s.genel, s.ozet, ...Object.values(s.soru), ...s.guclu, ...s.gelisim, ...s.anlar].filter((x): x is SelItem => !!x);
}
