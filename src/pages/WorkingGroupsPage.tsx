import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Users, X } from "lucide-react";
import api from "../lib/api";

const workingGroupSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı").max(100, "Ad en fazla 100 karakter olabilir"),
  description: z.string().max(500, "Açıklama en fazla 500 karakter olabilir").optional().or(z.literal("")),
});

interface WorkingGroup {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

interface WorkingGroupMember {
  id: string;
  workingGroupId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedAt: string;
}

export default function WorkingGroupsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkingGroupMember[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(workingGroupSchema),
    defaultValues: { name: "", description: "" },
  });

  const { data: groups, isLoading } = useQuery({
    queryKey: ["working-groups"],
    queryFn: async () => {
      const response = await api.get("/v1/working-groups");
      return response.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/working-groups/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["working-groups"] }),
    onError: () => setFormError("Grup silinirken bir hata oluştu."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof workingGroupSchema> }) =>
      api.put(`/v1/working-groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["working-groups"] });
      setEditingId(null);
      form.reset();
      setShowForm(false);
      setFormError(null);
    },
    onError: () => setFormError("Grup güncellenirken bir hata oluştu."),
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof workingGroupSchema>) => api.post("/v1/working-groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["working-groups"] });
      form.reset();
      setShowForm(false);
      setFormError(null);
    },
    onError: () => setFormError("Grup oluşturulurken bir hata oluştu."),
  });

  const filteredGroups = groups?.filter((g: WorkingGroup) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddOrUpdateGroup = async (data: z.infer<typeof workingGroupSchema>) => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEditGroup = (group: WorkingGroup) => {
    setEditingId(group.id);
    form.reset({ name: group.name, description: group.description || "" });
    setShowForm(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (window.confirm("Bu grubu silmek istediğinizden emin misiniz?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const fetchMembers = async (groupId: string) => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      const response = await api.get(`/v1/working-groups/${groupId}/members`);
      setMembers(response.data.data || []);
    } catch {
      setMemberError("Üyeler yüklenirken bir hata oluştu.");
    } finally {
      setMemberLoading(false);
    }
  };

  const handleViewMembers = async (groupId: string) => {
    setShowMembersModal(groupId);
    await fetchMembers(groupId);
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    if (!window.confirm("Bu üyeyi gruptan kaldırmak istediğinizden emin misiniz?")) return;
    setMemberError(null);
    try {
      await api.delete(`/v1/working-groups/${groupId}/members/${memberId}`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {
      setMemberError("Üye kaldırılırken bir hata oluştu.");
    }
  };

  const handleAddMember = async (groupId: string, userId: string) => {
    if (!userId.trim()) return;
    setMemberError(null);
    try {
      await api.post(`/v1/working-groups/${groupId}/members`, { userId, role: "Üye" });
      await fetchMembers(groupId);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message;
      setMemberError(msg || "Üye eklenirken bir hata oluştu.");
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="Yükleniyor">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Çalışma Grupları</h1>
          <p className="text-gray-600">Okul içindeki çalışma gruplarını yönet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          aria-label="Yeni çalışma grubu ekle"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Yeni Grup Ekle
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? "Grubu Düzenle" : "Yeni Grup Ekle"}</h2>
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
              {formError}
            </div>
          )}
          <form onSubmit={form.handleSubmit(handleAddOrUpdateGroup)} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Grup Adı"
                {...form.register("name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <textarea
                placeholder="Açıklama (isteğe bağlı)"
                {...form.register("description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {editingId ? "Güncelle" : "Ekle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  form.reset();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <label htmlFor="group-search" className="sr-only">Grup ara</label>
      <input
        id="group-search"
        type="search"
        placeholder="Grup ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Groups List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Grup bulunamadı</div>
        ) : (
          filteredGroups.map((group: WorkingGroup) => (
            <div key={group.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                {group.description && <p className="text-sm text-gray-600">{group.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.memberCount} Üye
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewMembers(group.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`${group.name} üyelerini yönet`}
                  title="Üyeleri Yönet"
                >
                  <Users className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleEditGroup(group)}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  aria-label={`${group.name} grubunu düzenle`}
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`${group.name} grubunu sil`}
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Grup Üyeleri</h2>
              <button
                onClick={() => setShowMembersModal(null)}
                className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Modalı kapat"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Hata mesajı */}
            {memberError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700" role="alert">
                {memberError}
              </div>
            )}

            {/* Add Member Form */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold mb-2">Üye Ekle</h3>
              <input
                type="text"
                id="wg-userId"
                placeholder="Kullanıcı ID veya E-posta"
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                    handleAddMember(showMembersModal, (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Enter tuşuna basarak ekle</p>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              {memberLoading ? (
                <div className="flex justify-center py-4" role="status" aria-label="Yükleniyor">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Grup üyesi yok</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">{member.role || "Üye"}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(showMembersModal, member.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`${member.firstName} ${member.lastName} üyesini kaldır`}
                      title="Üyeyi Kaldır"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
