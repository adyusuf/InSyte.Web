// Common constants used across the application

export const DEFAULT_PAGE_SIZE = 20;

// Turkish UI Labels
export const LABELS = {
  // Actions
  SAVE: "Kaydet",
  CANCEL: "İptal",
  DELETE: "Sil",
  EDIT: "Düzenle",
  ADD: "Ekle",
  BACK: "Geri",
  SEARCH: "Ara...",
  PREVIOUS: "Önceki",
  NEXT: "Sonraki",

  // Status
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
  PENDING: "Bekleme",
  COMPLETED: "Tamamlandı",

  // Pages
  EVALUATION_CRITERIA: "Değerlendirme Kriterleri",
  EVALUATION_QUESTIONS: "Değerlendirme Soruları",
  AI_SYSTEMS: "AI Sistemleri",
  SETTINGS: "Ayarlar",

  // Forms
  NAME: "Adı",
  SUBJECT: "Konu",
  DESCRIPTION: "Açıklama",
  INSTRUCTIONS: "Talimatlar",
  AI_INSTRUCTIONS: "AI Talimatları",
  NEW_ITEM: "Yeni {item} Ekle",
  EDIT_ITEM: "{item} Düzenle",
} as const;

export const STATUS_COLORS = {
  ACTIVE: {
    bg: "bg-green-100",
    text: "text-green-700",
  },
  INACTIVE: {
    bg: "bg-red-100",
    text: "text-red-700",
  },
} as const;

// AI Provider types
export const AI_PROVIDERS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
  DEEPSEEK: "deepseek",
  QWEN: "qwen",
  OLLAMA: "ollama",
  LMSTUDIO: "lmstudio",
  CUSTOM: "custom",
} as const;

export type AIProviderType = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

// Sağlayıcı seçenekleri (UI). `local` olanlar yerel/offline çalışır:
// Base URL zorunlu, API anahtarı opsiyonel.
export const AI_PROVIDER_OPTIONS: {
  value: AIProviderType;
  label: string;
  local: boolean;
}[] = [
  { value: "openai", label: "OpenAI", local: false },
  { value: "anthropic", label: "Anthropic", local: false },
  { value: "google", label: "Google", local: false },
  { value: "deepseek", label: "DeepSeek", local: false },
  { value: "qwen", label: "Qwen", local: false },
  { value: "ollama", label: "Ollama (yerel)", local: true },
  { value: "lmstudio", label: "LM Studio (yerel)", local: true },
  { value: "custom", label: "Özel (OpenAI uyumlu)", local: false },
];

// Yerel/offline sağlayıcılar için varsayılan Base URL ipuçları.
export const AI_PROVIDER_DEFAULT_BASE_URL: Partial<Record<AIProviderType, string>> = {
  ollama: "http://localhost:11434/v1",
  lmstudio: "http://localhost:1234/v1",
};

// Modele göre değerlendirme rolü — modalite-bazlı uzman + sentez mimarisi.
export const AI_MODEL_ROLES = {
  MULTIMODAL: "Multimodal",
  VIDEO: "Video",
  AUDIO: "Audio",
  TRANSCRIPT: "Transcript",
  SYNTHESIS: "Synthesis",
} as const;

export type AIModelRole = typeof AI_MODEL_ROLES[keyof typeof AI_MODEL_ROLES];

export const AI_MODEL_ROLE_OPTIONS: { value: AIModelRole; label: string }[] = [
  { value: "Multimodal", label: "Multimodal (video+ses birlikte)" },
  { value: "Video", label: "Video (hareket/beden dili)" },
  { value: "Audio", label: "Ses (ton/tempo/netlik)" },
  { value: "Transcript", label: "Transkript (ses→metin)" },
  { value: "Synthesis", label: "Sentez (birleştirme)" },
];

export const AI_MODEL_ROLE_LABEL: Record<string, string> = {
  Multimodal: "🎬🔊 Multimodal",
  Video: "🎬 Video",
  Audio: "🔊 Ses",
  Transcript: "📝 Transkript",
  Synthesis: "🧩 Sentez",
};
