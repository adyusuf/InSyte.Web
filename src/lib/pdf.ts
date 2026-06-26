import api from "./api";

// Seçilen değerlendirmeleri backend'den PDF olarak indirir (blob → tarayıcı indirmesi).
async function downloadPdf(url: string, ids: string[], fallbackName: string) {
  const res = await api.post(url, { ids }, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const cd = res.headers["content-disposition"] as string | undefined;
  const name = cd?.match(/filename="?([^"]+)"?/)?.[1] ?? fallbackName;

  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export const downloadReportPdf = (ids: string[]) =>
  downloadPdf("/evaluations/report-pdf", ids, "degerlendirme-raporu.pdf");

export const downloadComparisonPdf = (ids: string[]) =>
  downloadPdf("/evaluations/comparison-pdf", ids, "karsilastirma.pdf");

// Küratörlü rapor PDF'i (GET — karşılaştırma id ile)
export async function downloadCuratedReportPdf(comparisonId: string) {
  const res = await api.get(`/comparisons/${comparisonId}/report/pdf`, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const cd = res.headers["content-disposition"] as string | undefined;
  const name = cd?.match(/filename="?([^"]+)"?/)?.[1] ?? "rapor.pdf";
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
