import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { AIProvider, AIModel, ApiResponse } from "../types";
import { AI_PROVIDER_OPTIONS, AI_PROVIDER_DEFAULT_BASE_URL, AIProviderType, AI_MODEL_ROLE_OPTIONS, AI_MODEL_ROLE_LABEL } from "../lib/constants";
import { Plus, ChevronDown, ChevronRight, ArrowLeft, Pencil, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ProviderForm = { name: string; provider: string; apiKey: string; baseUrl: string };
type ModelForm = { name: string; modelId: string; maxTokens: number; contextWindow: string; supportsMemory: boolean; role: string };

const EMPTY_PROVIDER: ProviderForm = { name: "", provider: "openai", apiKey: "", baseUrl: "" };
const EMPTY_MODEL: ModelForm = { name: "", modelId: "", maxTokens: 4096, contextWindow: "", supportsMemory: false, role: "Multimodal" };

const isLocal = (p: string) => AI_PROVIDER_OPTIONS.find((o) => o.value === p)?.local ?? false;

export default function AISettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Sağlayıcı formu (ekle + düzenle)
  const [providerForm, setProviderForm] = useState<ProviderForm>(EMPTY_PROVIDER);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);

  // Model formu (ekle + düzenle), hangi sağlayıcı altında açık
  const [modelForm, setModelForm] = useState<ModelForm>(EMPTY_MODEL);
  const [modelFormProvider, setModelFormProvider] = useState<string | null>(null);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const { data: providers } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => api.get<ApiResponse<AIProvider[]>>("/ai-providers").then((r) => r.data.data!),
  });

  const { data: models } = useQuery({
    queryKey: ["ai-models", expanded],
    queryFn: () => api.get<ApiResponse<AIModel[]>>(`/ai-providers/${expanded}/models`).then((r) => r.data.data!),
    enabled: !!expanded,
  });

  const invalidateProviders = () => queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
  const invalidateModels = () => queryClient.invalidateQueries({ queryKey: ["ai-models"] });

  const resetProviderForm = () => {
    setProviderForm(EMPTY_PROVIDER);
    setShowProviderForm(false);
    setEditingProviderId(null);
  };

  const saveProvider = useMutation({
    mutationFn: (data: ProviderForm) =>
      editingProviderId
        ? api.put(`/ai-providers/${editingProviderId}`, data)
        : api.post("/ai-providers", data),
    onSuccess: () => {
      invalidateProviders();
      resetProviderForm();
    },
  });

  const deleteProvider = useMutation({
    mutationFn: (id: string) => api.delete(`/ai-providers/${id}`),
    onSuccess: invalidateProviders,
  });

  const resetModelForm = () => {
    setModelForm(EMPTY_MODEL);
    setModelFormProvider(null);
    setEditingModelId(null);
  };

  const saveModel = useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: ModelForm }) => {
      const payload = {
        name: data.name,
        modelId: data.modelId,
        maxTokens: data.maxTokens,
        contextWindow: data.contextWindow === "" ? null : Number(data.contextWindow),
        supportsMemory: data.supportsMemory,
        role: data.role,
      };
      return editingModelId
        ? api.put(`/ai-models/${editingModelId}`, payload)
        : api.post(`/ai-providers/${providerId}/models`, payload);
    },
    onSuccess: () => {
      invalidateModels();
      invalidateProviders();
      resetModelForm();
    },
  });

  const deleteModel = useMutation({
    mutationFn: (id: string) => api.delete(`/ai-models/${id}`),
    onSuccess: () => {
      invalidateModels();
      invalidateProviders();
    },
  });

  const openCreateProvider = () => {
    setEditingProviderId(null);
    setProviderForm(EMPTY_PROVIDER);
    setShowProviderForm(true);
  };

  const openEditProvider = (p: AIProvider) => {
    setEditingProviderId(p.id);
    setProviderForm({ name: p.name, provider: p.provider, apiKey: "", baseUrl: p.baseUrl ?? "" });
    setShowProviderForm(true);
  };

  const openModelForm = (providerId: string, model?: AIModel) => {
    setModelFormProvider(providerId);
    if (model) {
      setEditingModelId(model.id);
      setModelForm({
        name: model.name,
        modelId: model.modelId,
        maxTokens: model.maxTokens,
        contextWindow: model.contextWindow != null ? String(model.contextWindow) : "",
        supportsMemory: model.supportsMemory,
        role: model.role || "Multimodal",
      });
    } else {
      setEditingModelId(null);
      setModelForm(EMPTY_MODEL);
    }
  };

  const onProviderTypeChange = (value: string) => {
    setProviderForm((f) => ({
      ...f,
      provider: value,
      // Yerel sağlayıcıda Base URL boşsa varsayılanı öner
      baseUrl: f.baseUrl || AI_PROVIDER_DEFAULT_BASE_URL[value as AIProviderType] || "",
    }));
  };

  const inputCls =
    "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div>
      <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">AI Sistemleri</h2>
          <button onClick={openCreateProvider} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ekle
          </button>
        </div>

        {showProviderForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {editingProviderId ? "Sağlayıcı Düzenle" : "Yeni Sağlayıcı"}
              </span>
              <button onClick={resetProviderForm} className="text-gray-400 hover:text-gray-600" aria-label="Kapat">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveProvider.mutate(providerForm); }} className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Ad" required value={providerForm.name}
                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} className={inputCls} />
              <select value={providerForm.provider} onChange={(e) => onProviderTypeChange(e.target.value)} className={inputCls}>
                {AI_PROVIDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input type="password" autoComplete="new-password"
                placeholder={
                  editingProviderId
                    ? "API Key (değiştirmek için yaz, boş = koru)"
                    : isLocal(providerForm.provider)
                      ? "API Key (yerel için opsiyonel)"
                      : "API Key"
                }
                value={providerForm.apiKey}
                onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })} className={inputCls} />
              <input type="text"
                placeholder={isLocal(providerForm.provider) ? "Base URL (zorunlu)" : "Base URL (opsiyonel)"}
                value={providerForm.baseUrl}
                onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })} className={inputCls} />
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Kaydet</button>
                <button type="button" onClick={resetProviderForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Iptal</button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {providers?.map((p) => (
            <div key={p.id}>
              <div className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="flex items-center gap-3 flex-1 text-left">
                  {expanded === p.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-gray-500">({p.provider})</span>
                  <span className="text-xs text-gray-400">{p.modelCount} model</span>
                  {p.hasApiKey ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">🔑 anahtar tanımlı</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">anahtar yok</span>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {p.isActive ? "Aktif" : "Pasif"}
                  </span>
                  <button onClick={() => openEditProvider(p)} className="text-gray-400 hover:text-blue-600" aria-label="Sağlayıcıyı düzenle">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`"${p.name}" sağlayıcısı pasife alınsın mı?`)) deleteProvider.mutate(p.id); }}
                    className="text-gray-400 hover:text-red-600" aria-label="Sağlayıcıyı sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expanded === p.id && (
                <div className="px-6 pb-4 pl-14">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Modeller</span>
                    <button onClick={() => openModelForm(p.id)} className="text-xs text-blue-600 hover:underline">+ Model Ekle</button>
                  </div>

                  {modelFormProvider === p.id && (
                    <form onSubmit={(e) => { e.preventDefault(); saveModel.mutate({ providerId: p.id, data: modelForm }); }}
                      className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-3 rounded-lg">
                      <input type="text" placeholder="Model Adı" required value={modelForm.name}
                        onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} className={inputCls} />
                      <input type="text" placeholder="Model ID (örn. gpt-4o, deepseek-chat)" required value={modelForm.modelId}
                        onChange={(e) => setModelForm({ ...modelForm, modelId: e.target.value })} className={inputCls} />
                      <input type="number" placeholder="Maks. çıktı token" value={modelForm.maxTokens}
                        onChange={(e) => setModelForm({ ...modelForm, maxTokens: parseInt(e.target.value) || 0 })} className={inputCls} />
                      <input type="number" placeholder="Bağlam penceresi (token)" value={modelForm.contextWindow}
                        onChange={(e) => setModelForm({ ...modelForm, contextWindow: e.target.value })} className={inputCls} />
                      <select value={modelForm.role} onChange={(e) => setModelForm({ ...modelForm, role: e.target.value })}
                        className={`col-span-2 ${inputCls}`} aria-label="Değerlendirme rolü">
                        {AI_MODEL_ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={modelForm.supportsMemory}
                          onChange={(e) => setModelForm({ ...modelForm, supportsMemory: e.target.checked })} />
                        Bağlam/konuşma hafızası destekleniyor
                      </label>
                      <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          {editingModelId ? "Güncelle" : "Ekle"}
                        </button>
                        <button type="button" onClick={resetModelForm} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">Iptal</button>
                      </div>
                    </form>
                  )}

                  {models?.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="flex items-center gap-2">
                        {m.name} <span className="text-gray-400">({m.modelId})</span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600">{AI_MODEL_ROLE_LABEL[m.role] ?? m.role}</span>
                        {m.supportsMemory && <span className="text-xs text-purple-600">🧠 hafıza</span>}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Çıktı: {m.maxTokens.toLocaleString()}
                          {m.contextWindow ? ` · Bağlam: ${m.contextWindow.toLocaleString()}` : ""}
                        </span>
                        <button onClick={() => openModelForm(p.id, m)} className="text-gray-400 hover:text-blue-600" aria-label="Modeli düzenle">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`"${m.name}" modeli pasife alınsın mı?`)) deleteModel.mutate(m.id); }}
                          className="text-gray-400 hover:text-red-600" aria-label="Modeli sil">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {models?.length === 0 && <p className="text-xs text-gray-500">Model tanımlanmamış</p>}
                </div>
              )}
            </div>
          ))}
          {(!providers || providers.length === 0) && (
            <p className="px-6 py-4 text-sm text-gray-500">AI sistemi tanımlanmamış</p>
          )}
        </div>
      </div>
    </div>
  );
}
