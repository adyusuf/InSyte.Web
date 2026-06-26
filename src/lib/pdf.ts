import api from "./api";

// Küratörlü rapor PDF'i (GET — karşılaştırma id ile). Blob → tarayıcı indirmesi.
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
