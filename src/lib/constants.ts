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
} as const;

export type AIProviderType = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];
