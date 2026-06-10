import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Subject, School, ApiResponse, PagedResult } from "../types";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";

type FormState = {
  name: string;
  branch: string;
  level: string;
  weeklyHours: number;
  description: string;
  schoolId: string;
};

const emptyForm: FormState = {
  name: "",
  branch: "",
  level: "",
  weeklyHours: 2,
  description: "",
  schoolId: "",
};

export default function SubjectsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ["schools-all"],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<School>>>("/schools", {
          params: { pageSize: 100 },
        })
        .then((r) => r.data.data!),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subjects", schoolFilter, search, page],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Subject>>>("/subjects", {
          params: {
            schoolId: schoolFilter || undefined,
            search,
            page,
            pageSize: 20,
          },
        })
        .then((r) => r.data.data!),
  });

  const saveMutation = useMutation({
    mutationFn: (d: FormState) =>
      editingId
        ? api.put(`/subjects/${editingId}?schoolId=${d.schoolId}`, d)
        : api.post("/subjects", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, schoolId }: { id: string; schoolId: string }) =>
      api.delete(`/subjects/${id}?schoolId=${schoolId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, schoolId: schoolFilter });
    setShowModal(true);
  };

  const openEdit = (s: Subject) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      branch: s.branch,
      level: s.level,
      weeklyHours: s.weeklyHours,
      description: s.description ?? "",
      schoolId: s.schoolId,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dersler</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ders
        </button>
      </div>

      <Modal
        isOpen={showModal}
        title={editingId ? "Dersi Düzenle" : "Yeni Ders"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Okul *
            </label>
            <select
              required
              value={form.schoolId}
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Okul seçin</option>
              {schools?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ders Adı *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Matematik"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branş
              </label>
              <input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sayısal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seviye
              </label>
              <input
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Haftalık Ders Saati *
            </label>
            <input
              type="number"
              required
              min={1}
              max={40}
              value={form.weeklyHours}
              onChange={(e) =>
                setForm({ ...form, weeklyHours: parseInt(e.target.value) || 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </Modal>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-48">
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Okullar</option>
            {schools?.items.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Ders ara..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Ders Adı
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Branş
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Seviye
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Hf. Saat
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Okul
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {subject.branch || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {subject.level || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {subject.weeklyHours}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {schools?.items.find((s) => s.id === subject.schoolId)?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          subject.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {subject.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(subject)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Ders silinsin mi?"))
                              deleteMutation.mutate({ id: subject.id, schoolId: subject.schoolId });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Ders bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data && (
            <Pagination
              page={page}
              totalCount={data.totalCount}
              pageSize={data.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
