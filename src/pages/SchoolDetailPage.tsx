import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { School, SchoolTeacher, ApiResponse, SchoolFacility, SchoolServiceRecord, SchoolActivityRecord, SchoolLanguageRecord, PhysicalFacility, SchoolService, Activity, ForeignLanguage } from "../types";
import Modal from "../components/Modal";
import { ArrowLeft, Users, FileText, Plus, X, Trash2 } from "lucide-react";
import { useState } from "react";

// Label maps for enums
const FACILITY_LABELS: Record<PhysicalFacility, string> = {
  UykuOdasi: "Uyku Odası",
  Yemekhane: "Yemekhane",
  Havuz: "Havuz",
  BilgisayarLaboratorivari: "Bilgisayar Laboratuvarı",
  KapalISporSalonu: "Kapalı Spor Salonu",
  FutbolSahasi: "Futbol Sahası",
  KonferansSalonu: "Konferans Salonu",
  Laboratorivari: "Laboratuvarı",
  SanatAtoliyesi: "Sanat Atölyesi",
  Kantin: "Kantin",
  Kutupahane: "Kütüphane",
  MuzikOdasi: "Müzik Odası",
  OyunAlani: "Oyun Alanı",
  Revir: "Revir",
  Bahce: "Bahçe",
  Lojman: "Lojman",
  AkillTahta: "Akıllı Tahta",
  HayvanatBahcesi: "Hayvanat Bahçesi",
  Sera: "Sera",
  IcBoyutluOdasi: "İç Boyutlu Odası",
  MutfakAtoliyesi: "Mutfak Atölyesi",
  SporAlani: "Spor Alanı",
  KumHavuzu: "Kum Havuzu",
};

const SERVICE_LABELS: Record<SchoolService, string> = {
  Guvenlik: "Güvenlik",
  Rehberlik: "Rehberlik",
  YazOkulu: "Yaz Okulu",
  Servis: "Servis",
  HaftasonuEgitim: "Hafta Sonu Eğitim",
  OrganikBeslenme: "Organik Beslenme",
  OyunGrubu: "Oyun Grubu",
  AnneCocukOyunGrubu: "Anne-Çocuk Oyun Grubu",
  DiniEgitim: "Dini Eğitim",
};

const ACTIVITY_LABELS: Record<Activity, string> = {
  Futbol: "Futbol",
  Voleybol: "Voleybol",
  Basketbol: "Basketbol",
  Judo: "Judo",
  MasaTenisi: "Masa Tenisi",
  SuTopu: "Su Topu",
  Fotografcilik: "Fotoğrafçılık",
  Satranc: "Satranç",
  Yuzme: "Yüzme",
  Seramik: "Seramik",
  Bale: "Bale",
  Origami: "Origami",
  Hentbol: "Hentbol",
  Sinema: "Sinema",
  SuBalesi: "Su Balesi",
  DekoratifSanatlar: "Dekoratif Sanatlar",
  YabancıDilKlubu: "Yabancı Dil Kulübü",
  Heykel: "Heykel",
  Muzik: "Müzik",
  ModernDans: "Modern Dans",
  Tenis: "Tenis",
  Drama: "Drama",
  GoruselSanatlar: "Görüsel Sanatlar",
  Tiyatro: "Tiyatro",
  Eskrim: "Eskrim",
  Gures: "Güreş",
  Ebru: "Ebru",
  Izcilik: "İzcilik",
  Atletizm: "Atletizm",
  Binicilik: "Binicilik",
  Okculuk: "Okçuluk",
  Proje: "Proje",
  BuzPateni: "Buz Pateni",
  Gezi: "Gezi",
  Tirmanis: "Tırmanış",
  Perkusyon: "Perkusyon",
  Piyano: "Piyano",
  IngilizzeDrama: "İngilizce Drama",
  BilisimKlubu: "Bilişim Kulübü",
  Gazetecilik: "Gazetecilik",
  Orkestra: "Orkestra",
  Koro: "Koro",
  Jimnastik: "Jimnastik",
  Ekoloji: "Ekoloji",
  HalkOyunlari: "Halk Oyunları",
  Dans: "Dans",
  AkilVeZekaOyunlari: "Akıl ve Zeka Oyunları",
  Yoga: "Yoga",
  ElSanatlari: "El Sanatları",
  DegerlerEgitimi: "Değerler Eğitimi",
  Orff: "Orff",
  PlanetariumGokBilimi: "Planetarium Gök Bilimi",
  Robotik: "Robotik",
  Badminton: "Badminton",
  BedEnEgitimi: "Beden Eğitimi",
  Taekwondo: "Taekwondo",
  Gitar: "Gitar",
  Karate: "Karate",
  Pilates: "Pilates",
  ESpor: "E-Spor",
  Kodlama: "Kodlama",
};

const LANGUAGE_LABELS: Record<ForeignLanguage, string> = {
  Ingilizce: "İngilizce",
  Almanca: "Almanca",
  Francizca: "Fransızca",
  Ispanyolca: "İspanyolca",
  Italyanca: "İtalyanca",
  Cinece: "Çince",
  Ruscaj: "Rusça",
  Arapca: "Arapça",
  Japonica: "Japonca",
  Ibrahimce: "İbrahimce",
  Ermenice: "Ermenice",
  Ukraynaca: "Ukraynaca",
};

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<PhysicalFacility | "">("");
  const [selectedService, setSelectedService] = useState<SchoolService | "">("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | "">("");
  const [selectedLanguage, setSelectedLanguage] = useState<ForeignLanguage | "">("");
  const queryClient = useQueryClient();

  const { data: school, isLoading } = useQuery({
    queryKey: ["school", id],
    queryFn: () =>
      api.get<ApiResponse<School>>(`/schools/${id}`).then((r) => r.data.data!),
  });

  const { data: teachers } = useQuery({
    queryKey: ["school-teachers", id],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolTeacher[]>>(`/schools/${id}/teachers`)
        .then((r) => r.data.data!),
  });

  const { data: advisors } = useQuery({
    queryKey: ["school-advisors", id],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolTeacher[]>>(`/schools/${id}/advisors`)
        .then((r) => r.data.data!),
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ["school-facilities", id],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolFacility[]>>(`/schools/${id}/facilities`)
        .then((r) => r.data.data || []),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["school-services", id],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolServiceRecord[]>>(`/schools/${id}/services`)
        .then((r) => r.data.data || []),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["school-activities", id],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolActivityRecord[]>>(`/schools/${id}/activities`)
        .then((r) => r.data.data || []),
  });

  const { data: languages = [] } = useQuery({
    queryKey: ["school-languages", id],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolLanguageRecord[]>>(`/schools/${id}/languages`)
        .then((r) => r.data.data || []),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post("/users", { ...data, role: "Teacher" }),
    onSuccess: (res: any) => {
      const userId = res.data?.data?.id || res.data?.id;
      assignMutation.mutate({ schoolId: id!, userId });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ schoolId, userId }: { schoolId: string; userId: string }) =>
      api.post(`/schools/${schoolId}/teachers`, { userId, role: "Teacher" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-teachers", id] });
      setShowModal(false);
      setForm({ email: "", password: "", firstName: "", lastName: "" });
    },
  });

  const addFacilityMutation = useMutation({
    mutationFn: (facility: PhysicalFacility) =>
      api.post(`/schools/${id}/facilities`, { facility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-facilities", id] });
      setShowFacilityModal(false);
      setSelectedFacility("");
    },
  });

  const removeFacilityMutation = useMutation({
    mutationFn: (facilityId: string) =>
      api.delete(`/schools/${id}/facilities/${facilityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-facilities", id] });
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: (service: SchoolService) =>
      api.post(`/schools/${id}/services`, { service }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-services", id] });
      setShowServiceModal(false);
      setSelectedService("");
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: (serviceId: string) =>
      api.delete(`/schools/${id}/services/${serviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-services", id] });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: (activity: Activity) =>
      api.post(`/schools/${id}/activities`, { activity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-activities", id] });
      setShowActivityModal(false);
      setSelectedActivity("");
    },
  });

  const removeActivityMutation = useMutation({
    mutationFn: (activityId: string) =>
      api.delete(`/schools/${id}/activities/${activityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-activities", id] });
    },
  });

  const addLanguageMutation = useMutation({
    mutationFn: (language: ForeignLanguage) =>
      api.post(`/schools/${id}/languages`, { language }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-languages", id] });
      setShowLanguageModal(false);
      setSelectedLanguage("");
    },
  });

  const removeLanguageMutation = useMutation({
    mutationFn: (languageId: string) =>
      api.delete(`/schools/${id}/languages/${languageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-languages", id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(form);
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  if (!school) return <div className="text-center py-12 text-gray-500">Okul bulunamadı</div>;

  return (
    <div>
      <Link to="/schools" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Okullara dön
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${school.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {school.isActive ? "Aktif" : "Pasif"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Şehir:</span> <span className="font-medium">{school.city || "-"}</span></div>
          <div><span className="text-gray-500">Adres:</span> <span className="font-medium">{school.address || "-"}</span></div>
          <div><span className="text-gray-500">Telefon:</span> <span className="font-medium">{school.phone || "-"}</span></div>
          <div><span className="text-gray-500">E-posta:</span> <span className="font-medium">{school.email || "-"}</span></div>
        </div>
      </div>

      <Modal isOpen={showModal} title="Öğretmen Ekle" onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={createUserMutation.isPending || assignMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createUserMutation.isPending || assignMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Advisors */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Danışmanlar ({advisors?.length || 0})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {advisors?.map((a) => (
              <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-gray-500">{a.email}</p>
                </div>
              </div>
            ))}
            {(!advisors || advisors.length === 0) && (
              <p className="px-6 py-4 text-sm text-gray-500">Danışman atanmamış</p>
            )}
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Öğretmenler ({teachers?.length || 0})</h2>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
              title="Öğretmen Ekle"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {teachers?.map((t) => (
              <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.firstName} {t.lastName}</p>
                  <p className="text-xs text-gray-500">{t.email}</p>
                </div>
                <Link to={`/teachers/${t.userId}`} className="text-xs text-blue-600 hover:underline">Detay</Link>
              </div>
            ))}
            {(!teachers || teachers.length === 0) && (
              <p className="px-6 py-4 text-sm text-gray-500">Öğretmen atanmamış</p>
            )}
          </div>
        </div>
      </div>

      {/* School Details Grid - 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Facilities */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Fiziksel İmkanlar ({facilities.length})</h2>
            <button
              onClick={() => setShowFacilityModal(true)}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
              title="İmkan Ekle"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-200">
            {facilities.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">Fiziksel imkan eklenmemiş</p>
            ) : (
              facilities.map((f) => (
                <div key={f.id} className="px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-medium text-gray-700">{FACILITY_LABELS[f.facility]}</p>
                  <button
                    onClick={() => removeFacilityMutation.mutate(f.id)}
                    disabled={removeFacilityMutation.isPending}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Hizmetler ({services.length})</h2>
            <button
              onClick={() => setShowServiceModal(true)}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
              title="Hizmet Ekle"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-200">
            {services.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">Hizmet eklenmemiş</p>
            ) : (
              services.map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-medium text-gray-700">{SERVICE_LABELS[s.service]}</p>
                  <button
                    onClick={() => removeServiceMutation.mutate(s.id)}
                    disabled={removeServiceMutation.isPending}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-xl border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Aktiviteler ({activities.length})</h2>
            <button
              onClick={() => setShowActivityModal(true)}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
              title="Aktivite Ekle"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">Aktivite eklenmemiş</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                {activities.map((a) => (
                  <div key={a.id} className="px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg">
                    <p className="text-sm font-medium text-gray-700">{ACTIVITY_LABELS[a.activity]}</p>
                    <button
                      onClick={() => removeActivityMutation.mutate(a.id)}
                      disabled={removeActivityMutation.isPending}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-xl border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Yabancı Diller ({languages.length})</h2>
            <button
              onClick={() => setShowLanguageModal(true)}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
              title="Dil Ekle"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {languages.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">Yabancı dil eklenmemiş</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {languages.map((l) => (
                  <div key={l.id} className="px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-medium text-gray-700">{LANGUAGE_LABELS[l.language]}</p>
                    <button
                      onClick={() => removeLanguageMutation.mutate(l.id)}
                      disabled={removeLanguageMutation.isPending}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Facility Modal */}
      {showFacilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Fiziksel İmkan Ekle</h3>
              <button onClick={() => setShowFacilityModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value as PhysicalFacility)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              {(Object.keys(FACILITY_LABELS) as PhysicalFacility[]).map((f) => (
                <option key={f} value={f}>
                  {FACILITY_LABELS[f]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => selectedFacility && addFacilityMutation.mutate(selectedFacility)}
                disabled={!selectedFacility || addFacilityMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addFacilityMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </button>
              <button
                onClick={() => setShowFacilityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hizmet Ekle</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as SchoolService)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              {(Object.keys(SERVICE_LABELS) as SchoolService[]).map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => selectedService && addServiceMutation.mutate(selectedService)}
                disabled={!selectedService || addServiceMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addServiceMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </button>
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Aktivite Ekle</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value as Activity)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-80"
            >
              <option value="">Seçiniz</option>
              {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                <option key={a} value={a}>
                  {ACTIVITY_LABELS[a]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => selectedActivity && addActivityMutation.mutate(selectedActivity)}
                disabled={!selectedActivity || addActivityMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addActivityMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </button>
              <button
                onClick={() => setShowActivityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Yabancı Dil Ekle</h3>
              <button onClick={() => setShowLanguageModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as ForeignLanguage)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              {(Object.keys(LANGUAGE_LABELS) as ForeignLanguage[]).map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => selectedLanguage && addLanguageMutation.mutate(selectedLanguage)}
                disabled={!selectedLanguage || addLanguageMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addLanguageMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </button>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports link */}
      <div className="mt-6">
        <Link
          to={`/reports?schoolId=${id}`}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-5 h-5 text-blue-600" />
          Bu okula ait raporları görüntüle
        </Link>
      </div>
    </div>
  );
}
