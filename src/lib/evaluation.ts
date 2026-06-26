// AI değerlendirme sonucu (JSON) için ortak parser + tipler.
// Hem yeni şema (kanıt/gerekçe/önemli anlar) hem eski şema (düz metin) desteklenir.

export type Evidence = { baslangic: number; bitis?: number | null; aciklama?: string };
export type ReportItem = { baslik: string; kanitlar: Evidence[] };
export type ReportQuestion = {
  soruId?: string;
  puan?: number;
  yorum?: string;
  gerekce?: string;
  kanitlar: Evidence[];
};
export type MomentType = "guclu" | "zayif" | "notr";
export type KeyMoment = {
  zaman: number;
  baslik: string;
  aciklama?: string;
  tip: MomentType;
  /** Hangi değerlendirmeden geldiği (timeline birleştirmesi için) */
  kaynak?: string;
};

export type ParsedEvaluation = {
  ok: boolean; // bilinen şemada mı
  genelPuan?: number;
  ozet?: string;
  gucluYonler: ReportItem[];
  gelisimAlanlari: ReportItem[];
  sorular: ReportQuestion[];
  onemliAnlar: KeyMoment[];
  raw: unknown;
};

const num = (v: unknown): number | undefined =>
  typeof v === "number" && !Number.isNaN(v) ? v : undefined;

const toEvidence = (v: unknown): Evidence[] => {
  if (!Array.isArray(v)) return [];
  const out: Evidence[] = [];
  for (const k of v) {
    const o = k as Record<string, unknown>;
    const baslangic = num(o.baslangic) ?? num(o.zaman);
    if (baslangic == null) continue;
    out.push({ baslangic, bitis: num(o.bitis) ?? null, aciklama: typeof o.aciklama === "string" ? o.aciklama : undefined });
  }
  return out;
};

// Madde: string (eski) veya { baslik/metin, kanitlar } (yeni)
const toItems = (v: unknown): ReportItem[] => {
  if (!Array.isArray(v)) return [];
  const out: ReportItem[] = [];
  for (const it of v) {
    if (typeof it === "string") {
      out.push({ baslik: it, kanitlar: [] });
      continue;
    }
    const o = it as Record<string, unknown>;
    const baslik = (o.baslik ?? o.metin ?? o.text) as string | undefined;
    if (!baslik) continue;
    out.push({ baslik, kanitlar: toEvidence(o.kanitlar) });
  }
  return out;
};

const toMomentType = (v: unknown): MomentType =>
  v === "guclu" || v === "zayif" ? v : "notr";

export function parseEvaluation(result?: string | null): ParsedEvaluation {
  const empty: ParsedEvaluation = {
    ok: false,
    gucluYonler: [],
    gelisimAlanlari: [],
    sorular: [],
    onemliAnlar: [],
    raw: result ?? null,
  };
  if (!result) return empty;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(result);
  } catch {
    return empty;
  }

  const ok =
    data.genelPuan != null || !!data.ozet || !!data.sorular || !!data.gucluYonler;
  if (!ok) return { ...empty, raw: data };

  // eski yazım hatası guancluYonler'a da bak
  const gucluRaw = data.gucluYonler ?? (data as Record<string, unknown>).guancluYonler;

  const sorular: ReportQuestion[] = Array.isArray(data.sorular)
    ? (data.sorular as Record<string, unknown>[]).map((s) => ({
        soruId: typeof s.soruId === "string" ? s.soruId : undefined,
        puan: num(s.puan),
        yorum: typeof s.yorum === "string" ? s.yorum : undefined,
        gerekce: typeof s.gerekce === "string" ? s.gerekce : undefined,
        kanitlar: toEvidence(s.kanitlar),
      }))
    : [];

  const onemliAnlar: KeyMoment[] = [];
  if (Array.isArray(data.onemliAnlar)) {
    for (const m of data.onemliAnlar as Record<string, unknown>[]) {
      const zaman = num(m.zaman) ?? num(m.baslangic);
      if (zaman == null) continue;
      onemliAnlar.push({
        zaman,
        baslik: (m.baslik as string) ?? "",
        aciklama: typeof m.aciklama === "string" ? m.aciklama : undefined,
        tip: toMomentType(m.tip),
      });
    }
  }

  return {
    ok: true,
    genelPuan: num(data.genelPuan),
    ozet: typeof data.ozet === "string" ? data.ozet : undefined,
    gucluYonler: toItems(gucluRaw),
    gelisimAlanlari: toItems(data.gelisimAlanlari),
    sorular,
    onemliAnlar,
    raw: data,
  };
}

/** Saniyeyi m:ss biçimine çevirir (örn. 75 → "1:15"). */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
