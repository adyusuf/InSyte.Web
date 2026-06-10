import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import api from "../lib/api";
import type { School, SchoolTeacher, ApiResponse } from "../types";
import { SchoolInfoCard } from "./SchoolDetail/SchoolInfoCard";
import { AdvisorsTab } from "./SchoolDetail/AdvisorsTab";
import { TeachersTab } from "./SchoolDetail/TeachersTab";
import { SchoolDetailsTab } from "./SchoolDetail/SchoolDetailsTab";

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: school, isLoading } = useQuery({
    queryKey: ["school", id],
    queryFn: () => api.get<ApiResponse<School>>(`/schools/${id}`).then((r) => r.data.data!),
  });

  const { data: teachers } = useQuery({
    queryKey: ["school-teachers", id],
    queryFn: () =>
      api.get<ApiResponse<SchoolTeacher[]>>(`/schools/${id}/teachers`).then((r) => r.data.data!),
  });

  const { data: advisors } = useQuery({
    queryKey: ["school-advisors", id],
    queryFn: () =>
      api.get<ApiResponse<SchoolTeacher[]>>(`/schools/${id}/advisors`).then((r) => r.data.data!),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  if (!school || !id) return <div className="text-center py-12 text-gray-500">Okul bulunamadı</div>;

  return (
    <div>
      <Link
        to="/schools"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Okullara dön
      </Link>

      <SchoolInfoCard school={school} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AdvisorsTab advisors={advisors} />
        <TeachersTab schoolId={id} teachers={teachers} />
      </div>

      <SchoolDetailsTab schoolId={id} />

      <div className="mt-6">
        <Link
          to={`/reports?schoolId=${id}`}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-5 h-5 text-blue-600" />
          Bu okula ait raporları görüntüle
        </Link>
      </div>
    </div>
  );
}
