import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface UseCRUDFormConfig<T> {
  endpoint: string;
  queryKey: string[];
  onSuccess?: () => void;
  validate?: (data: T) => Record<string, string>;
}

export function useCRUDForm<T extends Record<string, any>>(
  initialForm: T,
  config: UseCRUDFormConfig<T>
) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: T) => api.post(config.endpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
      resetForm();
      config.onSuccess?.();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || "Hata oluştu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: T) =>
      api.put(`${config.endpoint}/${editingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
      resetForm();
      config.onSuccess?.();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || "Hata oluştu" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = config.validate?.(form) || {};
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    if (editingId) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setEditingId(null);
  };

  const startEdit = (id: string, data: T) => {
    setEditingId(id);
    setForm(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return {
    form,
    setForm,
    errors,
    editingId,
    isLoading,
    handleSubmit,
    resetForm,
    startEdit,
    submitError: errors.submit,
  };
}
