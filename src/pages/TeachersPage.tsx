import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { User, School, ApiResponse, PagedResult, UserRole } from "../types";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import { Plus } from "lucide-react";

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", schoolId: "" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", search, page],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<User>>>("/teachers", {
          params: { search, page, pageSize: 20 },
        })
        .then((r) => r.data.data!),
  });

  const { data: schools } = useQuery({
    queryKey: ["schools-all"],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<School>>>("/schools", { params: { pageSize: 100 } })
        .then((r) => r.data.data!),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: Omit<typeof form, "schoolId">) =>
      api.post("/users", { ...data, role: "Teacher" as UserRole }),
    onSuccess: (res: any) => {
      if (form.schoolId) {
        assignToSchool(res.data.data?.id || res.data?.id);
      } else {
        queryClient.invalidateQueries({ queryKey: ["teachers"] });
        setShowModal(false);
        setForm({ email: "", password: "", firstName: "", lastName: "", schoolId: "" });
      }
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ schoolId, userId }: { schoolId: string; userId: string }) =>
      api.post(`/schools/${schoolId}/teachers`, { userId, role: "Teacher" as UserRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["school"] });
      setShowModal(false);
      setForm({ email: "", password: "", firstName: "", lastName: "", schoolId: "" });
    },
  });

  const assignToSchool = (userId: string) => {
    if (form.schoolId) {
      assignMutation.mutate({ schoolId: form.schoolId, userId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { schoolId, ...userData } = form;
    createUserMutation.mutate(userData);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ogretmenler</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ogretmen
        </button>
      </div>

      <Modal isOpen={showModal} title="Yeni Ogretmen Ekle" onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Soyad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ornek@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sifre *</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sifre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Okul (Opsiyonel)</label>
            <select
              value={form.schoolId}
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Okul secin</option>
              {schools?.items.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={createUserMutation.isPending || assignMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createUserMutation.isPending || assignMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Iptal
            </button>
          </div>
        </form>
      </Modal>

      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Ogretmen ara..." />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yukleniyor...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">E-posta</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kayit Tarihi</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {teacher.firstName} {teacher.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{teacher.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${teacher.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {teacher.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(teacher.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/reports?teacherId=${teacher.id}`} className="text-sm text-blue-600 hover:underline">
                        Raporlar
                      </Link>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Ogretmen bulunamadi</td>
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
