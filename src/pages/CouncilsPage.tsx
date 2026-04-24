import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Users, X } from "lucide-react";
import api from "../lib/api";

interface Council {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

interface CouncilMember {
  id: string;
  councilId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedAt: string;
}

export default function CouncilsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [showMembersModal, setShowMembersModal] = useState<string | null>(null);
  const [members, setMembers] = useState<CouncilMember[]>([]);

  const { data: councils, isLoading } = useQuery({
    queryKey: ["councils"],
    queryFn: async () => {
      const response = await api.get("/Councils");
      return response.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/councils/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["councils"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      api.put(`/councils/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["councils"] });
      setEditingId(null);
      setFormData({ name: "", description: "" });
      setShowForm(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post("/councils", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["councils"] });
      setFormData({ name: "", description: "" });
      setShowForm(false);
    },
  });

  const filteredCouncils = councils?.filter((c: Council) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddOrUpdateCouncil = async () => {
    if (!formData.name.trim()) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleEditCouncil = (council: Council) => {
    setEditingId(council.id);
    setFormData({ name: council.name, description: council.description || "" });
    setShowForm(true);
  };

  const handleDeleteCouncil = async (id: string) => {
    if (window.confirm("Bu kurulu silmek istediğinizden emin misiniz?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleViewMembers = async (councilId: string) => {
    try {
      const response = await api.get(`/councils/${councilId}/members`);
      setMembers(response.data.data || []);
      setShowMembersModal(councilId);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const handleRemoveMember = async (councilId: string, memberId: string) => {
    if (window.confirm("Bu üyeyi kuruldan kaldırmak istediğinizden emin misiniz?")) {
      try {
        await api.delete(`/councils/${councilId}/members/${memberId}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Kurullar</h1>
          <p className="text-gray-600">Okul içindeki kurulları yönet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Yeni Kurul Ekle
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? "Kurulu Düzenle" : "Yeni Kurul Ekle"}</h2>
          <input
            type="text"
            placeholder="Kurul Adı"
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
              onClick={handleAddOrUpdateCouncil}
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
        placeholder="Kurul ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />

      {/* Councils List */}
      <div className="space-y-3">
        {filteredCouncils.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Kurul bulunamadı</div>
        ) : (
          filteredCouncils.map((council: Council) => (
            <div key={council.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{council.name}</h3>
                {council.description && <p className="text-sm text-gray-600">{council.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {council.memberCount} Üye
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewMembers(council.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Üyeleri Yönet"
                >
                  <Users className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditCouncil(council)}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCouncil(council.id)}
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
              <h2 className="text-lg font-semibold">Kurul Üyeleri</h2>
              <button
                onClick={() => setShowMembersModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-gray-500 text-sm">Kurul üyesi yok</p>
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
