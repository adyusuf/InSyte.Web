import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Schedule,
  ScheduleDay,
  School,
  Class,
  Subject,
  ApiResponse,
  PagedResult,
} from "../types";
import Modal from "../components/Modal";
import { Plus, Trash2 } from "lucide-react";

const DAYS: { key: ScheduleDay; label: string }[] = [
  { key: "Monday", label: "Pazartesi" },
  { key: "Tuesday", label: "Salı" },
  { key: "Wednesday", label: "Çarşamba" },
  { key: "Thursday", label: "Perşembe" },
  { key: "Friday", label: "Cuma" },
];

const TIME_SLOTS = [
  "08:00", "08:45", "09:30", "10:15", "11:00",
  "11:45", "12:30", "13:15", "14:00", "14:45",
  "15:30", "16:15",
];

type FormState = {
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherUserId: string;
  dayOfWeek: ScheduleDay;
  startTime: string;
  endTime: string;
  room: string;
  notes: string;
};

const emptyForm: FormState = {
  schoolId: "",
  classId: "",
  subjectId: "",
  teacherUserId: "",
  dayOfWeek: "Monday",
  startTime: "08:00",
  endTime: "08:45",
  room: "",
  notes: "",
};

function slotKey(day: ScheduleDay, time: string) {
  return `${day}_${time}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function scheduleFitsSlot(s: Schedule, day: ScheduleDay, slotTime: string): boolean {
  if (s.dayOfWeek !== day) return false;
  const slotMin = timeToMinutes(slotTime);
  const startMin = timeToMinutes(s.startTime.slice(0, 5));
  const endMin = timeToMinutes(s.endTime.slice(0, 5));
  return slotMin >= startMin && slotMin < endMin;
}

export default function SchedulesPage() {
  const [schoolFilter, setSchoolFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ["schools-all"],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<School>>>("/schools", {
          params: { pageSize: 100 },
        })
        .then((r) => r.data.data!),
  });

  const { data: classes } = useQuery({
    queryKey: ["classes-all", schoolFilter],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Class>>>("/classes", {
          params: { schoolId: schoolFilter || undefined, pageSize: 100 },
        })
        .then((r) => r.data.data!),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects-all", schoolFilter],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Subject>>>("/subjects", {
          params: { schoolId: schoolFilter || undefined, pageSize: 100 },
        })
        .then((r) => r.data.data!),
  });

  // O(1) subject lookup — subjects.find() yerine Map kullan
  const subjectMap = useMemo(
    () => new Map((subjects?.items ?? []).map((s) => [s.id, s])),
    [subjects],
  );

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["schedules", schoolFilter, classFilter],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Schedule>>>("/schedules", {
          params: {
            schoolId: schoolFilter || undefined,
            classId: classFilter || undefined,
            pageSize: 200,
          },
        })
        .then((r) => r.data.data!),
  });

  const saveMutation = useMutation({
    mutationFn: (d: FormState) => api.post("/schedules", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}?schoolId=${schoolFilter}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });

  const openCreate = (day?: ScheduleDay, startTime?: string) => {
    const pre: Partial<FormState> = {
      schoolId: schoolFilter,
      classId: classFilter,
      dayOfWeek: day,
      startTime,
      endTime: startTime
        ? (() => {
            const total = timeToMinutes(startTime) + 45;
            return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
          })()
        : undefined,
    };
    setForm({ ...emptyForm, ...pre });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const scheduleList = schedules?.items ?? [];

  // Build a lookup: day → startTime → schedule entries
  const cellMap = new Map<string, Schedule[]>();
  for (const s of scheduleList) {
    for (const slot of TIME_SLOTS) {
      if (scheduleFitsSlot(s, s.dayOfWeek, slot)) {
        const key = slotKey(s.dayOfWeek, slot);
        const existing = cellMap.get(key) ?? [];
        existing.push(s);
        cellMap.set(key, existing);
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ders Programı</h1>
        <button
          onClick={() => openCreate()}
          disabled={false}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ders Ekle
        </button>
      </div>

      <Modal
        isOpen={showModal}
        title="Ders Programına Ekle"
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Okul *
            </label>
            <select
              required
              value={form.schoolId}
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Okul seçin</option>
              {schools?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sınıf *
              </label>
              <select
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sınıf seçin</option>
                {classes?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ders *
              </label>
              <select
                required
                value={form.subjectId}
                onChange={(e) =>
                  setForm({ ...form, subjectId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Ders seçin</option>
                {subjects?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gün *
            </label>
            <select
              required
              value={form.dayOfWeek}
              onChange={(e) =>
                setForm({ ...form, dayOfWeek: e.target.value as ScheduleDay })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç *
              </label>
              <select
                required
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş *
              </label>
              <select
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_SLOTS.filter(
                  (t) => timeToMinutes(t) > timeToMinutes(form.startTime)
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Derslik
            </label>
            <input
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="A-101"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </Modal>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="w-56">
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setClassFilter("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Okul seçin</option>
            {schools?.items.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {schoolFilter && (
          <div className="w-48">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Sınıflar</option>
              {classes?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full table-fixed min-w-[700px]">
            <colgroup>
              <col className="w-20" />
              {DAYS.map((d) => <col key={d.key} />)}
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Saat
                </th>
                {DAYS.map((d) => (
                  <th
                    key={d.key}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TIME_SLOTS.map((slot) => (
                <tr key={slot} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 text-xs font-mono text-gray-400 whitespace-nowrap">
                    {slot}
                  </td>
                  {DAYS.map((d) => {
                    const key = slotKey(d.key, slot);
                    const entries = cellMap.get(key) ?? [];
                    return (
                      <td
                        key={d.key}
                        className="px-2 py-1.5 text-center align-top"
                        onClick={() =>
                          entries.length === 0 && openCreate(d.key, slot)
                        }
                      >
                        {entries.length > 0 ? (
                          <div className="space-y-1">
                            {entries.map((s) => (
                              <div
                                key={s.id}
                                className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1 text-left group relative"
                              >
                                <p className="text-xs font-semibold text-blue-800 leading-tight">
                                  {subjectMap.get(s.subjectId)?.name ?? "Ders"}
                                </p>
                                <p className="text-[10px] text-blue-500">
                                  {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                                  {s.room ? ` · ${s.room}` : ""}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Bu ders silinsin mi?"))
                                      deleteMutation.mutate(s.id);
                                  }}
                                  className="absolute top-0.5 right-0.5 hidden group-hover:flex p-0.5 text-blue-300 hover:text-red-500 transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-8 rounded cursor-pointer hover:bg-blue-50 transition-colors" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
