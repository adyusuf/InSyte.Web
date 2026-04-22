import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { School, ApiResponse, PagedResult, SchoolType, InstitutionType, LiseType, EducationSystem } from "../types";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import { Plus, MapPin, Users, FileVideo } from "lucide-react";

const SCHOOL_TYPES: SchoolType[] = ["Anaokulu", "Ilkokul", "Ortaokul", "Lise", "UniversitePrepare", "Universitesi", "Meslek"];
const INSTITUTION_TYPES: InstitutionType[] = ["Devlet", "Ozel", "Vakif"];
const LISE_TYPES: LiseType[] = [
  "AnadoluMeslekLisesi",
  "AnadoluLisesi",
  "SosyalBilimleriLisesi",
  "FenLisesi",
  "GuzelSanatlarLisesi",
  "CokProgramliAnadoluLisesi",
  "AnadoluImamHatipLisesi",
  "SporLisesi",
  "AksamLisesi",
  "FenVeTeknolojiLisesi",
  "MeslekiVeTeknikAnadoluLise"
];

const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  Anaokulu: "Anaokulu",
  Ilkokul: "İlkokul",
  Ortaokul: "Ortaokul",
  Lise: "Lise",
  UniversitePrepare: "Üniversite Hazırlık",
  Universitesi: "Üniversite",
  Meslek: "Meslek"
};

const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  Devlet: "Devlet",
  Ozel: "Özel",
  Vakif: "Vakıf"
};

const LISE_TYPE_LABELS: Record<LiseType, string> = {
  AnadoluMeslekLisesi: "Anadolu Meslek Lisesi",
  AnadoluLisesi: "Anadolu Lisesi",
  SosyalBilimleriLisesi: "Sosyal Bilimler Lisesi",
  FenLisesi: "Fen Lisesi",
  GuzelSanatlarLisesi: "Güzel Sanatlar Lisesi",
  CokProgramliAnadoluLisesi: "Çok Programlı Anadolu Lisesi",
  AnadoluImamHatipLisesi: "Anadolu İmam Hatip Lisesi",
  SporLisesi: "Spor Lisesi",
  AksamLisesi: "Akşam Lisesi",
  FenVeTeknolojiLisesi: "Fen ve Teknoloji Lisesi",
  MeslekiVeTeknikAnadoluLise: "Mesleki ve Teknik Anadolu Lise"
};

const EDUCATION_SYSTEMS: EducationSystem[] = [
  "MEBOdakliEgitim",
  "KlasikSistem",
  "EklektikYaklas",
  "CokluZekaModeli",
  "UBD",
  "PYP",
  "CommonCoreStateStandards",
  "APlusCinqBEgitim",
  "WaldorfPedagojisi",
  "STEM",
  "AktifOgrenmeSistemi",
  "HibritEgitimModeli",
  "MasalTerapisiEgitimi",
  "AfayTekniği",
  "MYP",
  "DP",
  "AileCalismaSosyalHizmetlerBakanligi",
  "GölgeEgitimSistemi",
  "ProjeTemelliOgrenme",
  "SinavOdakliEgitim",
  "IsbirlikliOgrenmeModeli",
  "YaparakYasayarakOgrenme",
  "OgrenciMerkezliEgitimModeli",
  "BilingualEgitim",
  "InternationalBaccalaureate",
  "CambridgeEgitimSistemi",
  "TamZamanliIngilizceEgitimi",
  "EkolojiTemelliBgitim",
  "IGCSE",
  "TamOgrenmeModeli",
  "HolistikEgitim",
  "KariyerGelistimProgrami",
  "BeceriYetkinlikGelistimProgrami",
  "AdvancedPlacementProgram",
  "SATProgram",
  "UCASProgram"
];

const EDUCATION_SYSTEM_LABELS: Record<EducationSystem, string> = {
  MEBOdakliEgitim: "MEB Odaklı Eğitim",
  KlasikSistem: "Klasik Sistem",
  EklektikYaklas: "Eklektik Yaklaşım",
  CokluZekaModeli: "Çoklu Zeka Modeli",
  UBD: "(UbD) Understanding by Design",
  PYP: "(PYP) Primary Years Programme",
  CommonCoreStateStandards: "Common Core State Standards Initiative",
  APlusCinqBEgitim: "a+5b Eğitim Modeli",
  WaldorfPedagojisi: "Waldorf Pedagojisi",
  STEM: "STEM",
  AktifOgrenmeSistemi: "Aktif Öğrenme Sistemi",
  HibritEgitimModeli: "Hibrit Eğitim Modeli",
  MasalTerapisiEgitimi: "Masal Terapisi Eğitimi",
  AfayTekniği: "Afay Tekniği",
  MYP: "(MYP) Middle Years Programme",
  DP: "(DP) Diploma Programme",
  AileCalismaSosyalHizmetlerBakanligi: "Aile, Çalışma ve Sosyal Hizmetler Bakanlığı Odaklı Eğitim",
  GölgeEgitimSistemi: "Gölge Eğitim Sistemi",
  ProjeTemelliOgrenme: "Proje Temelli Öğrenme Eğitim Modeli",
  SinavOdakliEgitim: "Sınav Odaklı Eğitim Sistemi",
  IsbirlikliOgrenmeModeli: "İşbirlikli Öğrenme Modeli",
  YaparakYasayarakOgrenme: "Yaparak Yaşayarak Öğrenme",
  OgrenciMerkezliEgitimModeli: "Öğrenci Merkezli Eğitim Modeli",
  BilingualEgitim: "Bilingual (Çift Dilli) Eğitim Programı",
  InternationalBaccalaureate: "(IB) International Baccalaureate",
  CambridgeEgitimSistemi: "Cambridge Eğitim Sistemi",
  TamZamanliIngilizceEgitimi: "Tam Zamanlı İngilizce Eğitimi",
  EkolojiTemelliBgitim: "Ekoloji Temelli Eğitim Modeli",
  IGCSE: "(IGCSE) International General Certificate of Secondary Education",
  TamOgrenmeModeli: "Tam Öğrenme Modeli",
  HolistikEgitim: "Holistik Eğitim",
  KariyerGelistimProgrami: "Kariyer Gelişim Programı",
  BeceriYetkinlikGelistimProgrami: "Beceri Yetkinlik Gelişim Programı",
  AdvancedPlacementProgram: "Advanced Placement (AP) Programı",
  SATProgram: "SAT (Scholastic Assessment Test)",
  UCASProgram: "UCAS (Universities and Colleges Admissions Service)"
};

export default function SchoolsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    schoolType: "Ilkokul" as SchoolType,
    institutionType: "Devlet" as InstitutionType,
    liseType: "AnadoluLisesi" as LiseType,
    educationSystem: "MEBOdakliEgitim" as EducationSystem,
    logoFile: null as File | null
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["schools", search, page],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<School>>>("/schools", {
          params: { search, page, pageSize: 20 },
        })
        .then((r) => r.data.data!),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("address", data.address);
      formData.append("city", data.city);
      formData.append("phone", data.phone);
      formData.append("email", data.email);
      formData.append("website", data.website);
      formData.append("schoolType", data.schoolType);
      formData.append("institutionType", data.institutionType);
      formData.append("educationSystem", data.educationSystem);
      if (data.schoolType === "Lise") {
        formData.append("liseType", data.liseType);
      }
      if (data.logoFile) {
        formData.append("logo", data.logoFile);
      }
      return api.post("/schools", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setShowModal(false);
      setForm({
        name: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        website: "",
        schoolType: "Ilkokul",
        institutionType: "Devlet",
        liseType: "AnadoluLisesi",
        educationSystem: "MEBOdakliEgitim",
        logoFile: null
      });
      setLogoPreview(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Okullar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Okul
        </button>
      </div>

      <Modal isOpen={showModal} title="Yeni Okul Ekle" onClose={() => setShowModal(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Okul Adi *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Okul adi girin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sehir</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sehir"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Okul adresi"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Okul Türü</label>
              <select
                value={form.schoolType}
                onChange={(e) => setForm({ ...form, schoolType: e.target.value as SchoolType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SCHOOL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SCHOOL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kurum Türü</label>
              <select
                value={form.institutionType}
                onChange={(e) => setForm({ ...form, institutionType: e.target.value as InstitutionType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INSTITUTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {INSTITUTION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.schoolType === "Lise" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lise Türü</label>
              <select
                value={form.liseType}
                onChange={(e) => setForm({ ...form, liseType: e.target.value as LiseType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LISE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {LISE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim Sistemi</label>
            <select
              value={form.educationSystem}
              onChange={(e) => setForm({ ...form, educationSystem: e.target.value as EducationSystem })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EDUCATION_SYSTEMS.map((system) => (
                <option key={system} value={system}>
                  {EDUCATION_SYSTEM_LABELS[system]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setForm({ ...form, logoFile: file });
                        const reader = new FileReader();
                        reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <span className="px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 block text-center">
                    {form.logoFile ? form.logoFile.name : "Dosya secin"}
                  </span>
                </label>
              </div>
              {logoPreview && (
                <div className="w-12 h-12 rounded border border-gray-300 overflow-hidden">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+90 555 123 4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="okul@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Web Sitesi</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.ornek.edu.tr"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Iptal
            </button>
          </div>
        </form>
      </Modal>

      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Okul ara..." />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yukleniyor...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Okul Adi</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sehir</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Danismanlar</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ogretmenler</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Videolar</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/schools/${school.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {school.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {school.city || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{school.advisorCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {school.teacherCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FileVideo className="w-3.5 h-3.5" />
                        {school.videoCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${school.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {school.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Okul bulunamadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data && (
            <Pagination page={page} totalCount={data.totalCount} pageSize={data.pageSize} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
