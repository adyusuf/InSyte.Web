import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Video, ApiResponse, PagedResult } from "../types";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { Plus } from "lucide-react";

export default function VideosPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["videos", search, page],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Video>>>("/videos", {
          params: { search, page, pageSize: 20 },
        })
        .then((r) => r.data.data!),
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Videolar</h1>
        <Link
          to="/videos/upload"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Video Yükle
        </Link>
      </div>

      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Video ara..." />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Başlık</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Okul</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Öğretmen</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Konu</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Boyut</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/videos/${video.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {video.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{video.schoolName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{video.teacherName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{video.subject || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatSize(video.fileSize)}</td>
                    <td className="px-6 py-4"><StatusBadge status={video.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(video.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Video bulunamadı</td>
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
