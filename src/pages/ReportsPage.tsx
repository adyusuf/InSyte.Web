import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { Report, ApiResponse, PagedResult } from "../types";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";

export default function ReportsPage() {
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", search, page, schoolId],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Report>>>("/reports", {
          params: { search, page, pageSize: 20, schoolId },
        })
        .then((r) => r.data.data!),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
      </div>

      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Rapor ara..." />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Video</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Okul</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Öğretmen</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Onaylayan</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.videoTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.schoolName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.teacherName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.approvedByName || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge status={report.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.pdfPath && (
                        <a
                          href={`http://localhost:5090/api/reports/${report.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Rapor bulunamadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data && <Pagination page={page} totalCount={data.totalCount} pageSize={data.pageSize} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
