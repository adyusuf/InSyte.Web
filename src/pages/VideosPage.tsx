import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Video, ApiResponse, PagedResult } from "../types";
import SearchInput from "../components/SearchInput";
import StatusBadge from "../components/StatusBadge";
import { Plus, ChevronDown, Building2, User, Film } from "lucide-react";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function VideosPage() {
  const [search, setSearch] = useState("");
  const [openSchools, setOpenSchools] = useState<Set<string>>(new Set());
  const [openTeachers, setOpenTeachers] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () =>
      api.get<ApiResponse<PagedResult<Video>>>("/videos", { params: { pageSize: 100 } }).then((r) => r.data.data!),
    refetchInterval: (q) => (q.state.data?.items.some((v) => v.status === "Processing") ? 5000 : false),
  });

  // Okul → Öğretmen → Videolar kırılımı (arama filtreli)
  const tree = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (data?.items ?? []).filter(
      (v) => !q || v.title.toLowerCase().includes(q) || v.teacherName.toLowerCase().includes(q) || v.schoolName.toLowerCase().includes(q)
    );
    const schools = new Map<string, { name: string; teachers: Map<string, { name: string; videos: Video[] }> }>();
    for (const v of filtered) {
      if (!schools.has(v.schoolId)) schools.set(v.schoolId, { name: v.schoolName, teachers: new Map() });
      const t = schools.get(v.schoolId)!.teachers;
      if (!t.has(v.teacherUserId)) t.set(v.teacherUserId, { name: v.teacherName, videos: [] });
      t.get(v.teacherUserId)!.videos.push(v);
    }
    return [...schools.entries()].map(([sid, s]) => ({
      sid,
      name: s.name,
      count: [...s.teachers.values()].reduce((n, t) => n + t.videos.length, 0),
      teachers: [...s.teachers.entries()].map(([tid, t]) => ({ tid, name: t.name, videos: t.videos })),
    }));
  }, [data, search]);

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setFn(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Videolar</h1>
        <Link to="/videos/upload" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Video Yükle
        </Link>
      </div>

      <div className="max-w-xs mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Okul, öğretmen veya video ara..." />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : tree.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">Video bulunamadı</p>
      ) : (
        <div className="space-y-3">
          {tree.map((school) => {
            const schoolOpen = openSchools.has(school.sid);
            return (
              <div key={school.sid} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Okul */}
                <button
                  onClick={() => toggle(openSchools, setOpenSchools, school.sid)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 text-left"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${schoolOpen ? "rotate-180" : ""}`} />
                  <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-gray-900 flex-1">{school.name}</span>
                  <span className="text-xs text-gray-400">{school.teachers.length} öğretmen • {school.count} video</span>
                </button>

                {schoolOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {school.teachers.map((teacher) => {
                      const tkey = `${school.sid}:${teacher.tid}`;
                      const teacherOpen = openTeachers.has(tkey);
                      return (
                        <div key={tkey}>
                          {/* Öğretmen */}
                          <button
                            onClick={() => toggle(openTeachers, setOpenTeachers, tkey)}
                            className="w-full flex items-center gap-3 pl-10 pr-5 py-3 hover:bg-gray-50 text-left"
                          >
                            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${teacherOpen ? "rotate-180" : ""}`} />
                            <User className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="font-medium text-gray-800 flex-1">{teacher.name}</span>
                            <span className="text-xs text-gray-400">{teacher.videos.length} video</span>
                          </button>

                          {/* Videolar */}
                          {teacherOpen && (
                            <ul className="bg-gray-50/50">
                              {teacher.videos.map((v) => (
                                <li key={v.id}>
                                  <Link to={`/videos/${v.id}`} className="flex items-center gap-3 pl-16 pr-5 py-2.5 hover:bg-blue-50/50">
                                    <Film className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="text-sm font-medium text-blue-600 flex-1 truncate">{v.title}</span>
                                    <span className="hidden sm:block text-xs text-gray-400">{v.subject || "-"}</span>
                                    <span className="text-xs text-gray-400">{formatSize(v.fileSize)}</span>
                                    <StatusBadge status={v.status} />
                                    <span className="hidden md:block text-xs text-gray-400 w-20 text-right">
                                      {new Date(v.createdAt).toLocaleDateString("tr-TR")}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
