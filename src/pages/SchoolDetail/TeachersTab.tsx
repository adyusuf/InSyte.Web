import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus } from "lucide-react";
import api from "../../lib/api";
import Modal from "../../components/Modal";
import type { SchoolTeacher } from "../../types";

type TeacherForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const EMPTY_FORM: TeacherForm = { email: "", password: "", firstName: "", lastName: "" };

type Props = {
  schoolId: string;
  teachers: SchoolTeacher[] | undefined;
};

export function TeachersTab({ schoolId, teachers }: Props) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TeacherForm>(EMPTY_FORM);

  const assignMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      api.post(`/schools/${schoolId}/teachers`, { userId, role: "Teacher" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-teachers", schoolId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: TeacherForm) =>
      api.post<{ data?: { id?: string }; id?: string }>("/users", { ...data, role: "Teacher" }),
    onSuccess: (res) => {
      const userId = res.data?.data?.id || res.data?.id;
      if (userId) assignMutation.mutate({ userId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(form);
  };

  const isPending = createUserMutation.isPending || assignMutation.isPending;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Öğretmenler ({teachers?.length || 0})</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
            title="Öğretmen Ekle"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {teachers?.map((t) => (
            <div key={t.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {t.firstName} {t.lastName}
                </p>
                <p className="text-xs text-gray-500">{t.email}</p>
              </div>
              <Link to={`/teachers/${t.userId}`} className="text-xs text-blue-600 hover:underline">
                Detay
              </Link>
            </div>
          ))}
          {(!teachers || teachers.length === 0) && (
            <p className="px-6 py-4 text-sm text-gray-500">Öğretmen atanmamış</p>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} title="Öğretmen Ekle" onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
