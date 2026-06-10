import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import type {
  ApiResponse,
  SchoolFacility,
  SchoolServiceRecord,
  SchoolActivityRecord,
  SchoolLanguageRecord,
  PhysicalFacility,
  SchoolService,
  Activity,
  ForeignLanguage,
} from "../../types";
import { ACTIVITY_LABELS, FACILITY_LABELS, LANGUAGE_LABELS, SERVICE_LABELS } from "./labels";
import { ListRow, SectionCard } from "./SectionCard";
import { SelectModal } from "./SelectModal";

type ModalKind = "facility" | "service" | "activity" | "language" | null;

type Props = {
  schoolId: string;
};

export function SchoolDetailsTab({ schoolId }: Props) {
  const queryClient = useQueryClient();
  const invalidate = (key: string) => queryClient.invalidateQueries({ queryKey: [key, schoolId] });

  const { data: facilities = [] } = useQuery({
    queryKey: ["school-facilities", schoolId],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolFacility[]>>(`/schools/${schoolId}/facilities`)
        .then((r) => r.data.data || []),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["school-services", schoolId],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolServiceRecord[]>>(`/schools/${schoolId}/services`)
        .then((r) => r.data.data || []),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["school-activities", schoolId],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolActivityRecord[]>>(`/schools/${schoolId}/activities`)
        .then((r) => r.data.data || []),
  });

  const { data: languages = [] } = useQuery({
    queryKey: ["school-languages", schoolId],
    queryFn: () =>
      api
        .get<ApiResponse<SchoolLanguageRecord[]>>(`/schools/${schoolId}/languages`)
        .then((r) => r.data.data || []),
  });

  const [openModal, setOpenModal] = useState<ModalKind>(null);
  const [selected, setSelected] = useState<string>("");

  const closeModal = () => {
    setOpenModal(null);
    setSelected("");
  };

  const addFacility = useMutation({
    mutationFn: (facility: PhysicalFacility) =>
      api.post(`/schools/${schoolId}/facilities`, { facility }),
    onSuccess: () => {
      invalidate("school-facilities");
      closeModal();
    },
  });
  const removeFacility = useMutation({
    mutationFn: (id: string) => api.delete(`/schools/${schoolId}/facilities/${id}`),
    onSuccess: () => invalidate("school-facilities"),
  });

  const addService = useMutation({
    mutationFn: (service: SchoolService) =>
      api.post(`/schools/${schoolId}/services`, { service }),
    onSuccess: () => {
      invalidate("school-services");
      closeModal();
    },
  });
  const removeService = useMutation({
    mutationFn: (id: string) => api.delete(`/schools/${schoolId}/services/${id}`),
    onSuccess: () => invalidate("school-services"),
  });

  const addActivity = useMutation({
    mutationFn: (activity: Activity) =>
      api.post(`/schools/${schoolId}/activities`, { activity }),
    onSuccess: () => {
      invalidate("school-activities");
      closeModal();
    },
  });
  const removeActivity = useMutation({
    mutationFn: (id: string) => api.delete(`/schools/${schoolId}/activities/${id}`),
    onSuccess: () => invalidate("school-activities"),
  });

  const addLanguage = useMutation({
    mutationFn: (language: ForeignLanguage) =>
      api.post(`/schools/${schoolId}/languages`, { language }),
    onSuccess: () => {
      invalidate("school-languages");
      closeModal();
    },
  });
  const removeLanguage = useMutation({
    mutationFn: (id: string) => api.delete(`/schools/${schoolId}/languages/${id}`),
    onSuccess: () => invalidate("school-languages"),
  });

  function submitModal() {
    if (!selected) return;
    switch (openModal) {
      case "facility":
        addFacility.mutate(selected as PhysicalFacility);
        break;
      case "service":
        addService.mutate(selected as SchoolService);
        break;
      case "activity":
        addActivity.mutate(selected as Activity);
        break;
      case "language":
        addLanguage.mutate(selected as ForeignLanguage);
        break;
    }
  }

  const modalConfig = (() => {
    switch (openModal) {
      case "facility":
        return { title: "Fiziksel İmkan Ekle", labels: FACILITY_LABELS, pending: addFacility.isPending };
      case "service":
        return { title: "Hizmet Ekle", labels: SERVICE_LABELS, pending: addService.isPending };
      case "activity":
        return { title: "Aktivite Ekle", labels: ACTIVITY_LABELS, pending: addActivity.isPending };
      case "language":
        return { title: "Yabancı Dil Ekle", labels: LANGUAGE_LABELS, pending: addLanguage.isPending };
      default:
        return null;
    }
  })();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionCard
          title={`Fiziksel İmkanlar (${facilities.length})`}
          addTitle="İmkan Ekle"
          onAdd={() => setOpenModal("facility")}
          emptyText="Fiziksel imkan eklenmemiş"
        >
          {facilities.map((f) => (
            <ListRow
              key={f.id}
              label={FACILITY_LABELS[f.facility]}
              onRemove={() => removeFacility.mutate(f.id)}
              disabled={removeFacility.isPending}
            />
          ))}
        </SectionCard>

        <SectionCard
          title={`Hizmetler (${services.length})`}
          addTitle="Hizmet Ekle"
          onAdd={() => setOpenModal("service")}
          emptyText="Hizmet eklenmemiş"
        >
          {services.map((s) => (
            <ListRow
              key={s.id}
              label={SERVICE_LABELS[s.service]}
              onRemove={() => removeService.mutate(s.id)}
              disabled={removeService.isPending}
            />
          ))}
        </SectionCard>

        <SectionCard
          title={`Aktiviteler (${activities.length})`}
          addTitle="Aktivite Ekle"
          onAdd={() => setOpenModal("activity")}
          emptyText="Aktivite eklenmemiş"
          fullWidth
          gridLayout
        >
          {activities.map((a) => (
            <ListRow
              key={a.id}
              label={ACTIVITY_LABELS[a.activity]}
              onRemove={() => removeActivity.mutate(a.id)}
              disabled={removeActivity.isPending}
              compact
            />
          ))}
        </SectionCard>

        <SectionCard
          title={`Yabancı Diller (${languages.length})`}
          addTitle="Dil Ekle"
          onAdd={() => setOpenModal("language")}
          emptyText="Yabancı dil eklenmemiş"
          fullWidth
        >
          {languages.map((l) => (
            <ListRow
              key={l.id}
              label={LANGUAGE_LABELS[l.language]}
              onRemove={() => removeLanguage.mutate(l.id)}
              disabled={removeLanguage.isPending}
            />
          ))}
        </SectionCard>
      </div>

      {modalConfig && (
        <SelectModal
          title={modalConfig.title}
          labels={modalConfig.labels}
          value={selected}
          onChange={setSelected}
          onSubmit={submitModal}
          onClose={closeModal}
          pending={modalConfig.pending}
        />
      )}
    </>
  );
}
