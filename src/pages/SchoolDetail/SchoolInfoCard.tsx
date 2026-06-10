import type { School } from "../../types";

type Props = {
  school: School;
};

export function SchoolInfoCard({ school }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            school.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {school.isActive ? "Aktif" : "Pasif"}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Şehir:</span>{" "}
          <span className="font-medium">{school.city || "-"}</span>
        </div>
        <div>
          <span className="text-gray-500">Adres:</span>{" "}
          <span className="font-medium">{school.address || "-"}</span>
        </div>
        <div>
          <span className="text-gray-500">Telefon:</span>{" "}
          <span className="font-medium">{school.phone || "-"}</span>
        </div>
        <div>
          <span className="text-gray-500">E-posta:</span>{" "}
          <span className="font-medium">{school.email || "-"}</span>
        </div>
      </div>
    </div>
  );
}
