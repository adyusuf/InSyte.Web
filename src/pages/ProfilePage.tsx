import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const ROLE_LABELS: Record<string, string> = {
  Admin: "Yönetici",
  Advisor: "Danışman",
  SchoolAdmin: "Okul Yöneticisi",
  Teacher: "Öğretmen",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  const updateMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      api.put(`/v1/users/${user?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setIsEditing(false);
      setErrorMsg(null);
    },
    onError: () => {
      setErrorMsg("Profil güncellenirken bir hata oluştu.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg("Ad ve soyadı boş bırakılamaz.");
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
    setIsEditing(false);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Geri dön"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profilim</h1>
          <p className="text-gray-600">Kullanıcı bilgilerini görüntüle ve düzenle</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Avatar Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 flex items-center gap-6">
          <div
            className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            aria-hidden="true"
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600">{ROLE_LABELS[user?.role ?? ""] ?? user?.role}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="space-y-6">
            {/* First Name */}
            <div>
              <label htmlFor="profile-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Ad
              </label>
              <input
                id="profile-firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isEditing ? "bg-gray-50 text-gray-600" : "bg-white"
                }`}
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="profile-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Soyadı
              </label>
              <input
                id="profile-lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isEditing ? "bg-gray-50 text-gray-600" : "bg-white"
                }`}
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez.</p>
            </div>

            {/* Role (read-only) */}
            <div>
              <label htmlFor="profile-role" className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <input
                id="profile-role"
                type="text"
                value={ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
                Düzenle
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  İptal
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
