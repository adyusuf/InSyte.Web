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

// Modele göre değerlendirme modalitesi — yalnızca NATIVE modeller.
// (Kare-kare okuyan veya yalnızca metin/transkript işleyen modeller tanımlanmaz.)
export const AI_MODEL_ROLES = {
  AUDIO_VIDEO: "AudioVideo",
  AUDIO: "Audio",
  VIDEO: "Video",
} as const;

export type AIModelRole = typeof AI_MODEL_ROLES[keyof typeof AI_MODEL_ROLES];

export const AI_MODEL_ROLE_OPTIONS: { value: AIModelRole; label: string }[] = [
  { value: "AudioVideo", label: "Ses + Video (native — ikisi birden)" },
  { value: "Audio", label: "Ses (native)" },
  { value: "Video", label: "Video (native — görüntü)" },
];

export const AI_MODEL_ROLE_LABEL: Record<string, string> = {
  AudioVideo: "🎬🔊 Ses+Video",
  Audio: "🔊 Ses",
  Video: "🎬 Video",
};
