import React, { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { apiEndpoints } from "../lib/endpoints";
import { ApiResponse, PagedResult } from "../types";
import FormModal from "../components/FormModal";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import BackButton from "../components/BackButton";
import { useCRUDForm } from "../hooks/useCRUDForm";
import { LABELS, DEFAULT_PAGE_SIZE, STATUS_COLORS } from "../lib/constants";

interface Criteria {
  id: string;
  name: string;
  description: string;
  instructions: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
}

export default function CriteriaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null);

  const pageSize = DEFAULT_PAGE_SIZE;

  const { data } = useQuery({
    queryKey: ["criteria", search, page],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Criteria>>>("/criteria", {
          params: { search: search || undefined, page, pageSize },
        })
        .then((r) => r.data.data!),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(apiEndpoints.criteria.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["criteria"] }),
  });

  // Sadece modal UI'ını kapatır — crud bağımlılığı yok, useCRUDForm'a güvenle geçilebilir
  const closeModalUI = () => {
    setShowModal(false);
    setEditingCriteria(null);
  };

  // useCRUDForm: form state + create/update mutations (onSuccess içinde resetForm zaten çağrılır)
  const crud = useCRUDForm(
    { name: "", description: "", instructions: "", subject: "" },
    { endpoint: apiEndpoints.criteria.list(), queryKey: ["criteria"], onSuccess: closeModalUI }
  );

  const handleOpenModal = (criteria?: Criteria) => {
    if (criteria) {
      setEditingCriteria(criteria);
      crud.startEdit(criteria.id, {
        name: criteria.name,
        description: criteria.description,
        instructions: criteria.instructions,
        subject: criteria.subject,
      });
    } else {
      setEditingCriteria(null);
      crud.resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    closeModalUI();
    crud.resetForm();
  };

  const handleSave = () => {
    crud.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="space-y-6">
      <BackButton />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{LABELS.EVALUATION_CRITERIA}</h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> {LABELS.ADD}
          </button>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder={LABELS.SEARCH} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {data?.items.map((c) => (
            <div key={c.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    {c.subject && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{c.subject}</span>}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.isActive ? STATUS_COLORS.ACTIVE.bg + " " + STATUS_COLORS.ACTIVE.text : STATUS_COLORS.INACTIVE.bg + " " + STATUS_COLORS.INACTIVE.text
                      }`}
                    >
                      {c.isActive ? LABELS.ACTIVE : LABELS.INACTIVE}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleOpenModal(c)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Pagination page={page} totalCount={data?.totalCount || 0} pageSize={pageSize} onPageChange={setPage} />

      <FormModal
        isOpen={showModal}
        title={editingCriteria ? `${LABELS.EVALUATION_CRITERIA.split(" ")[1]} ${LABELS.EDIT}` : `${LABELS.EVALUATION_CRITERIA.split(" ")[1]} ${LABELS.ADD}`}
        onClose={handleCloseModal}
        onSubmit={handleSave}
        isLoading={crud.isLoading}
      >
        <input
          type="text"
          placeholder={LABELS.NAME}
          required
          value={crud.form.name}
          onChange={(e) => crud.setForm({ ...crud.form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder={LABELS.SUBJECT}
          value={crud.form.subject}
          onChange={(e) => crud.setForm({ ...crud.form, subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder={LABELS.DESCRIPTION}
          value={crud.form.description}
          onChange={(e) => crud.setForm({ ...crud.form, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder={LABELS.AI_INSTRUCTIONS}
          required
          value={crud.form.instructions}
          onChange={(e) => crud.setForm({ ...crud.form, instructions: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormModal>
    </div>
  );
}
