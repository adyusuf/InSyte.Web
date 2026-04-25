# Web — React + Vite

> Bu dosya `web/` klasöründe çalışırken Claude Code'un okuduğu rehberdir.
> Kök kurallar `../CLAUDE.md`'de.

## Stack

- **React 18+** (function component + hooks)
- **Vite** (dev server + build)
- **TypeScript** — `strict: true`. `any` yasak
- **React Router** — routing
- **TanStack Query (React Query)** — server state
- **Zustand** — client state (kullanıcı, aktif okul, tema)
- **TanStack Table** — veri tabloları (tüm liste sayfaları için)
- **React Hook Form** + **Zod** — form ve validasyon
- **Tailwind CSS** — stil
- **shadcn/ui** veya **Radix** + custom — kompozit bileşenler için baz
- **Axios** — API client
- **Video.js** veya **Plyr** — video oynatma
- **react-pdf** — PDF önizleme (raporları görüntüleme)
- **date-fns** — tarih işlemleri
- **Vitest** + **Testing Library** — test
- **MSW** — API mocking
- **Playwright** — E2E
- **ESLint** + **Prettier**

## Klasör yapısı

```
web/
├── src/
│   ├── app/                ← Router, layout, providers
│   ├── pages/              ← Route-level sayfalar
│   │   ├── giris/
│   │   ├── dashboard/
│   │   ├── okullar/
│   │   ├── ogretmenler/
│   │   ├── dersler/
│   │   ├── siniflar/
│   │   ├── ders-programi/
│   │   ├── videolar/
│   │   ├── raporlar/
│   │   ├── ekip/
│   │   ├── tanimlar/
│   │   │   ├── ai/
│   │   │   ├── kriterler/
│   │   │   └── roller/
│   │   └── ayarlar/
│   ├── features/
│   │   ├── auth/
│   │   ├── okul/
│   │   ├── ogretmen/
│   │   ├── ders/
│   │   ├── sinif/
│   │   ├── ders-programi/
│   │   ├── video/
│   │   │   ├── api.ts
│   │   │   ├── components/
│   │   │   │   ├── VideoYukle.tsx     ← presigned URL ile direkt upload
│   │   │   │   ├── VideoOynatici.tsx
│   │   │   │   └── IncelemeyeGonder.tsx
│   │   │   └── ...
│   │   ├── rapor/
│   │   │   ├── components/
│   │   │   │   ├── RaporDetay.tsx
│   │   │   │   ├── OnayPaneli.tsx
│   │   │   │   └── PdfOnizleme.tsx
│   │   │   └── ...
│   │   ├── ai-tanim/
│   │   ├── kriter/
│   │   ├── rol/
│   │   ├── ekip/
│   │   └── yetki/
│   ├── components/         ← Paylaşılan UI: Tablo, Form, Modal, Toast...
│   ├── hooks/
│   ├── lib/                ← API client, utils, constants
│   ├── types/
│   └── styles/
├── public/
└── docs/
    ├── tasarim-tokenlari.md
    ├── api-tipleri.md
    ├── form-rehberi.md
    └── video-yukleme.md
```

## Bileşen kuralları

- **Function component + named export.** Default export yok.
- **Props tipi:** Component üstünde `type Props = { ... }`.
- **Anahtar isimleri stable:** `key={item.id}`, `key={index}` **YASAK**.
- **`forwardRef`** sebepsiz kullanma.

## State yönetimi

- **Server state → React Query.** API verisi `useState`'te tutulmaz.
- **Form state → React Hook Form.**
- **UI state → `useState`.**
- **Global app state (kullanıcı, aktif okul, tema) → Zustand.**
- **URL state → React Router params/search.** Filtre/sayfa parametreleri URL'de.

## Aktif okul context'i

Kullanıcı birden fazla okula erişebiliyorsa **aktif okul** seçicisi üst nav'da. Seçim Zustand'da tutulur, tüm sorgulara `okulId` parametresi olarak gider.

```ts
const aktifOkul = useAktifOkul();

useQuery({
  queryKey: ['ogretmenler', aktifOkul.id],
  queryFn: () => apiClient.get('/api/v1/ogretmenler', { params: { okulId: aktifOkul.id } }),
});
```

Admin için "Tüm okullar" seçeneği var (bazı sayfalar için).

## Liste sayfaları (genel pattern)

Her liste sayfası (Okullar, Öğretmenler, Dersler vb.) aynı yapıyı kullanır — **TanStack Table + URL'de filtre**.

**Standart elemanlar:**
- Başlık + "Yeni" butonu (yetki varsa)
- Arama input'u (debounced)
- Filtre paneli (gerekirse)
- Tablo: sıralama, pagination
- Aksiyon kolonu: detay, düzenle, sil (yetki bazlı)

`features/<modül>/components/<Modül>Tablosu.tsx` standart şablon olur.

## Form ve validasyon

- React Hook Form + Zod resolver
- Validasyon Türkçe mesajlar
- Server-side hatalar form'a yansır

```ts
const schema = z.object({
  ad: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  okulId: z.string().uuid('Okul seçilmeli'),
});
```

## Çalışma Grupları & Kurullar Yönetimi

**Sayfalar:**
- `pages/WorkingGroupsPage.tsx` — grup liste + CRUD + üye yönetimi
- `pages/CouncilsPage.tsx` — kurul liste + CRUD + üye yönetimi

**Özellikler:**
- React Hook Form + Zod validasyonu (ad min 2, max 100 karakter)
- TanStack Query state management
- Member modal: ekle (input field + Enter) / sil (confirmation)
- Search + pagination
- Edit/delete işlemleri modal-moda

**Pattern:**
```tsx
const form = useForm({
  resolver: zodResolver(workingGroupSchema),
  defaultValues: { name: "", description: "" },
});
```

## Yetki kontrolü (UI)

UI yetki kontrolü **sadece UX için**. Backend zaten kontrol eder.

```tsx
const { yapabilirMi, okulErisimi } = useYetki();

{yapabilirMi('rapor.onayla') && okulErisimi(rapor.okulId) && (
  <Button onClick={onayla}>Onayla</Button>
)}
```

Yetki kuralları sunucudan gelen kullanıcı objesinden okunur, hard-code edilmez.

## Video yükleme

**Direkt upload** ile büyük dosya backend'i bloklamaz:

1. Client → `POST /api/v1/videolar/yukleme-url` → presigned URL
2. Client → PUT directly to S3-uyumlu endpoint (XHR with progress)
3. Upload bitince → `POST /api/v1/videolar/onayla` (metadata kayıt)

UI progress bar, iptal, hata yönetimi. 2GB'a kadar destek.

Detay: `docs/video-yukleme.md`.

## Rapor onay süreci

Onay paneli: AI sonucunu (JSON) okunabilir formda gösterir, yönetici inceler. Üç aksiyon:

- **Onayla** → PDF üret + e-posta gönder
- **Düzelt** → AI sonucunu manuel düzenleme + tekrar onay
- **Reddet** → rapor reddedilir, kullanıcıya not bırakılır

PDF önizleme onay öncesi sağda ya da modal'da gösterilir.

## Stil

- **Tailwind utility-first.** Hard-code renk yok; tüm renkler token'lardan.
- **shadcn/ui** veya custom — temel kompozitler (Button, Input, Dialog, Toast).
- **Tasarım token'ları** `tailwind.config.ts` içinde.
- **Dark mode:** İleride; şimdiden hazırla.

## Erişilebilirlik (a11y)

- Buton-benzeri her şey gerçekten `<button>`
- Görsele `alt`, ikonlu butona `aria-label`
- Form alanı `<label>` ile bağlı
- Klavye ile gezilebilir, focus göstergesi gizlenmez
- Renk kontrastı WCAG AA (4.5:1)
- Veri tabloları: `<th>` + `scope`, ekran okuyucu dostu

## Performans

- Liste render'ında `key` doğru, `memo` gerekirse
- Code splitting: route-level `lazy()` + `Suspense`
- Görseller lazy-load
- Hedef: First Contentful Paint < 1.5s, Lighthouse > 85
- Büyük tablolarda virtualization (TanStack Virtual)

## Test

- **Vitest** + **React Testing Library**
- Bileşen testi: kullanıcı davranışı, implementation detail değil
- Mock: MSW
- E2E (Playwright): giriş, video yükle, AI'a gönder (mocklu), rapor onayla, PDF görüntüle

## Geliştirme akışı

```bash
npm install
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
npm run typecheck
```

`.env.local`:
```
VITE_API_URL=http://localhost:5000
```

## Yapma

- ❌ `any` tipi
- ❌ `useEffect` ile fetch — React Query var
- ❌ `index` as `key`
- ❌ Inline `style={{ ... }}` (animasyon hariç)
- ❌ Yetki kontrolünü hard-code etme
- ❌ Video dosyasını backend üzerinden upload (presigned URL kullan)
- ❌ AI sonucunu kullanıcıya onaysız PDF olarak göstermek
- ❌ 300+ satır component — parçala
- ❌ Magic string — `lib/constants.ts`'te topla
- ❌ Doğrudan `localStorage`/`sessionStorage` çağrısı — wrapper kullan
