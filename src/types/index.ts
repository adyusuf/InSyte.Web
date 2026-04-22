export type UserRole = "Admin" | "Advisor" | "SchoolAdmin" | "Teacher";
export type VideoStatus = "Uploaded" | "Processing" | "Evaluated" | "Approved" | "Rejected";
export type EvaluationStatus = "Pending" | "Processing" | "Completed" | "Failed";
export type ReportStatus = "Draft" | "Approved" | "Sent";
export type RecipientType = "Principal" | "Teacher" | "Advisor" | "Other";
export type SchoolType = "Anaokulu" | "Ilkokul" | "Ortaokul" | "Lise" | "UniversitePrepare" | "Universitesi" | "Meslek";
export type InstitutionType = "Devlet" | "Ozel" | "Vakif";
export type LiseType =
  | "AnadoluMeslekLisesi"
  | "AnadoluLisesi"
  | "SosyalBilimleriLisesi"
  | "FenLisesi"
  | "GuzelSanatlarLisesi"
  | "CokProgramliAnadoluLisesi"
  | "AnadoluImamHatipLisesi"
  | "SporLisesi"
  | "AksamLisesi"
  | "FenVeTeknolojiLisesi"
  | "MeslekiVeTeknikAnadoluLise";
export type EducationSystem =
  | "MEBOdakliEgitim"
  | "KlasikSistem"
  | "EklektikYaklas"
  | "CokluZekaModeli"
  | "UBD"
  | "PYP"
  | "CommonCoreStateStandards"
  | "APlusCinqBEgitim"
  | "WaldorfPedagojisi"
  | "STEM"
  | "AktifOgrenmeSistemi"
  | "HibritEgitimModeli"
  | "MasalTerapisiEgitimi"
  | "AfayTekniği"
  | "MYP"
  | "DP"
  | "AileCalismaSosyalHizmetlerBakanligi"
  | "GölgeEgitimSistemi"
  | "ProjeTemelliOgrenme"
  | "SinavOdakliEgitim"
  | "IsbirlikliOgrenmeModeli"
  | "YaparakYasayarakOgrenme"
  | "OgrenciMerkezliEgitimModeli"
  | "BilingualEgitim"
  | "InternationalBaccalaureate"
  | "CambridgeEgitimSistemi"
  | "TamZamanliIngilizceEgitimi"
  | "EkolojiTemelliBgitim"
  | "IGCSE"
  | "TamOgrenmeModeli"
  | "HolistikEgitim"
  | "KariyerGelistimProgrami"
  | "BeceriYetkinlikGelistimProgrami"
  | "AdvancedPlacementProgram"
  | "SATProgram"
  | "UCASProgram";
export type ClassLevel = "Level1" | "Level2" | "Level3" | "Level4" | "Level5" | "Level6" | "Level7" | "Level8" | "Level9" | "Level10" | "Level11" | "Level12" | "Other";
export type ScheduleDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string;
  latitude?: number;
  longitude?: number;
  schoolType?: SchoolType;
  institutionType?: InstitutionType;
  liseType?: LiseType;
  educationSystem?: EducationSystem;
  isActive: boolean;
  createdAt: string;
  advisorCount: number;
  teacherCount: number;
  videoCount: number;
}

export interface SchoolTeacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  assignedAt: string;
}

export interface Video {
  id: string;
  title: string;
  originalFileName?: string;
  fileSize: number;
  schoolId: string;
  schoolName: string;
  teacherUserId: string;
  teacherName: string;
  subject?: string;
  status: VideoStatus;
  createdAt: string;
  evaluationCount: number;
}

export interface Evaluation {
  id: string;
  videoId: string;
  videoTitle: string;
  criteriaId: string;
  criteriaName: string;
  aiModelId: string;
  aiModelName: string;
  result?: string;
  tokenUsageInput: number;
  tokenUsageOutput: number;
  status: EvaluationStatus;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Report {
  id: string;
  evaluationId: string;
  videoTitle: string;
  schoolName: string;
  teacherName: string;
  pdfPath?: string;
  approvedByName?: string;
  approvedAt?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface AIProvider {
  id: string;
  name: string;
  provider: string;
  baseUrl?: string;
  isActive: boolean;
  createdAt: string;
  modelCount: number;
}

export interface AIModel {
  id: string;
  aiProviderId: string;
  providerName: string;
  name: string;
  modelId: string;
  maxTokens: number;
  isActive: boolean;
  createdAt: string;
}

export interface Criteria {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  subject?: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmailConfig {
  id: string;
  schoolId: string;
  recipientEmail: string;
  recipientName?: string;
  recipientType: RecipientType;
  isActive: boolean;
}

export interface Class {
  id: string;
  schoolId: string;
  name: string;
  level: ClassLevel;
  type: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  branch: string;
  level: string;
  description?: string;
  weeklyHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Schedule {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherUserId: string;
  dayOfWeek: ScheduleDay;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PhysicalFacility =
  | "UykuOdasi"
  | "Yemekhane"
  | "Havuz"
  | "BilgisayarLaboratorivari"
  | "KapalISporSalonu"
  | "FutbolSahasi"
  | "KonferansSalonu"
  | "Laboratorivari"
  | "SanatAtoliyesi"
  | "Kantin"
  | "Kutupahane"
  | "MuzikOdasi"
  | "OyunAlani"
  | "Revir"
  | "Bahce"
  | "Lojman"
  | "AkillTahta"
  | "HayvanatBahcesi"
  | "Sera"
  | "IcBoyutluOdasi"
  | "MutfakAtoliyesi"
  | "SporAlani"
  | "KumHavuzu";

export type SchoolService =
  | "Guvenlik"
  | "Rehberlik"
  | "YazOkulu"
  | "Servis"
  | "HaftasonuEgitim"
  | "OrganikBeslenme"
  | "OyunGrubu"
  | "AnneCocukOyunGrubu"
  | "DiniEgitim";

export type Activity =
  | "Futbol"
  | "Voleybol"
  | "Basketbol"
  | "Judo"
  | "MasaTenisi"
  | "SuTopu"
  | "Fotografcilik"
  | "Satranc"
  | "Yuzme"
  | "Seramik"
  | "Bale"
  | "Origami"
  | "Hentbol"
  | "Sinema"
  | "SuBalesi"
  | "DekoratifSanatlar"
  | "YabancıDilKlubu"
  | "Heykel"
  | "Muzik"
  | "ModernDans"
  | "Tenis"
  | "Drama"
  | "GoruselSanatlar"
  | "Tiyatro"
  | "Eskrim"
  | "Gures"
  | "Ebru"
  | "Izcilik"
  | "Atletizm"
  | "Binicilik"
  | "Okculuk"
  | "Proje"
  | "BuzPateni"
  | "Gezi"
  | "Tirmanis"
  | "Perkusyon"
  | "Piyano"
  | "IngilizzeDrama"
  | "BilisimKlubu"
  | "Gazetecilik"
  | "Orkestra"
  | "Koro"
  | "Jimnastik"
  | "Ekoloji"
  | "HalkOyunlari"
  | "Dans"
  | "AkilVeZekaOyunlari"
  | "Yoga"
  | "ElSanatlari"
  | "DegerlerEgitimi"
  | "Orff"
  | "PlanetariumGokBilimi"
  | "Robotik"
  | "Badminton"
  | "BedEnEgitimi"
  | "Taekwondo"
  | "Gitar"
  | "Karate"
  | "Pilates"
  | "ESpor"
  | "Kodlama";

export type ForeignLanguage =
  | "Ingilizce"
  | "Almanca"
  | "Francizca"
  | "Ispanyolca"
  | "Italyanca"
  | "Cinece"
  | "Ruscaj"
  | "Arapca"
  | "Japonica"
  | "Ibrahimce"
  | "Ermenice"
  | "Ukraynaca";

export interface SchoolFacility {
  id: string;
  schoolId: string;
  facility: PhysicalFacility;
  createdAt: string;
}

export interface SchoolServiceRecord {
  id: string;
  schoolId: string;
  service: SchoolService;
  createdAt: string;
}

export interface SchoolActivityRecord {
  id: string;
  schoolId: string;
  activity: Activity;
  createdAt: string;
}

export interface SchoolLanguageRecord {
  id: string;
  schoolId: string;
  language: ForeignLanguage;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
