import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Users, X } from "lucide-react";
import api from "../lib/api";

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
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [showMembersModal, setShowMembersModal] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkingGroupMember[]>([]);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["working-groups"],
    queryFn: async () => {
      const response = await api.get("/WorkingGroups");
      return response.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/working-groups/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["working-groups"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      api.put(`/working-groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["working-groups"] });
      setEditingId(null);
      setFormData({ name: "", description: "" });
      setShowForm(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post("/working-groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["working-groups"] });
      setFormData({ name: "", description: "" });
      setShowForm(false);
    },
  });

  const filteredGroups = groups?.filter((g: WorkingGroup) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddOrUpdateGroup = async () => {
    if (!formData.name.trim()) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleEditGroup = (group: WorkingGroup) => {
    setEditingId(group.id);
    setFormData({ name: group.name, description: group.description || "" });
    setShowForm(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (window.confirm("Bu grubu silmek istediğinizden emin misiniz?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleViewMembers = async (groupId: string) => {
    try {
      const response = await api.get(`/working-groups/${groupId}/members`);
      setMembers(response.data.data || []);
      setShowMembersModal(groupId);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    if (window.confirm("Bu üyeyi grupta kaldırmak istediğinizden emin misiniz?")) {
      try {
        await api.delete(`/working-groups/${groupId}/members/${memberId}`);
        setMembers(members.filter(m => m.id !== memberId));
      } catch (err) {
        console.error("Error removing member:", err);
      }
    }
  };

  if (isLoading) return <div>Yukleniyor...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Çalisma Gruplari</h1>
          <p className="text-gray-600">Okul içindeki çalışma gruplarını yönet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Yeni Grup Ekle
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? "Grubu Düzenle" : "Yeni Grup Ekle"}</h2>
          <input
            type="text"
            placeholder="Grup Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Açıklama (isteğe bağlı)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddOrUpdateGroup}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {editingId ? "Güncelle" : "Ekle"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: "", description: "" });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Grup ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Üyeleri Yönet"
                >
                  <Users className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditGroup(group)}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Grup Üyeleri</h2>
              <button
                onClick={() => setShowMembersModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-gray-500 text-sm">Grup üyesi yok</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(showMembersModal, member.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Üyeyi Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
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
