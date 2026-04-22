import { cn } from "../lib/utils";

const statusColors: Record<string, string> = {
  Uploaded: "bg-gray-100 text-gray-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Evaluated: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Pending: "bg-gray-100 text-gray-700",
  Completed: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<string, string> = {
  Uploaded: "Yuklendi",
  Processing: "Isleniyor",
  Evaluated: "Degerlendirildi",
  Approved: "Onaylandi",
  Rejected: "Reddedildi",
  Pending: "Bekliyor",
  Completed: "Tamamlandi",
  Failed: "Basarisiz",
  Draft: "Taslak",
  Sent: "Gonderildi",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusColors[status] || "bg-gray-100 text-gray-700"
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
