import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { AIProvider, AIModel, ApiResponse } from "../types";
import { Plus, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AISettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "openai", apiKey: "", baseUrl: "" });
  const [modelForm, setModelForm] = useState({ name: "", modelId: "", maxTokens: 4096 });
  const [showModelForm, setShowModelForm] = useState<string | null>(null);

  const { data: providers } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => api.get<ApiResponse<AIProvider[]>>("/ai-providers").then((r) => r.data.data!),
  });

  const { data: models } = useQuery({
    queryKey: ["ai-models", expanded],
    queryFn: () => api.get<ApiResponse<AIModel[]>>(`/ai-providers/${expanded}/models`).then((r) => r.data.data!),
    enabled: !!expanded,
  });

  const createProvider = useMutation({
    mutationFn: (data: typeof form) => api.post("/ai-providers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      setShowForm(false);
      setForm({ name: "", provider: "openai", apiKey: "", baseUrl: "" });
    },
  });

  const createModel = useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: typeof modelForm }) =>
      api.post(`/ai-providers/${providerId}/models`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      setShowModelForm(null);
      setModelForm({ name: "", modelId: "", maxTokens: 4096 });
    },
  });

  return (
    <div>
      <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">AI Sistemleri</h2>
          <button onClick={() => setShowForm(!showForm)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ekle
          </button>
        </div>

        {showForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={(e) => { e.preventDefault(); createProvider.mutate(form); }} className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Ad" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
              <input type="text" placeholder="API Key" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Base URL (opsiyonel)" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Kaydet</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Iptal</button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {providers?.map((p) => (
            <div key={p.id}>
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {expanded === p.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-gray-500">({p.provider})</span>
                  <span className="text-xs text-gray-400">{p.modelCount} model</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {p.isActive ? "Aktif" : "Pasif"}
                </span>
              </button>
              {expanded === p.id && (
                <div className="px-6 pb-4 pl-14">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Modeller</span>
                    <button onClick={() => setShowModelForm(showModelForm === p.id ? null : p.id)} className="text-xs text-blue-600 hover:underline">
                      + Model Ekle
                    </button>
                  </div>
                  {showModelForm === p.id && (
                    <form onSubmit={(e) => { e.preventDefault(); createModel.mutate({ providerId: p.id, data: modelForm }); }}
                      className="flex gap-2 mb-3">
                      <input type="text" placeholder="Model Adi" required value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" placeholder="Model ID" required value={modelForm.modelId} onChange={(e) => setModelForm({ ...modelForm, modelId: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" placeholder="Max Token" value={modelForm.maxTokens} onChange={(e) => setModelForm({ ...modelForm, maxTokens: parseInt(e.target.value) })}
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Ekle</button>
                    </form>
                  )}
                  {models?.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span>{m.name} <span className="text-gray-400">({m.modelId})</span></span>
                      <span className="text-xs text-gray-500">Max: {m.maxTokens.toLocaleString()}</span>
                    </div>
                  ))}
                  {models?.length === 0 && <p className="text-xs text-gray-500">Model tanimlanmamis</p>}
                </div>
              )}
            </div>
          ))}
          {(!providers || providers.length === 0) && (
            <p className="px-6 py-4 text-sm text-gray-500">AI sistemi tanimlanmamis</p>
          )}
        </div>
      </div>
    </div>
  );
}
