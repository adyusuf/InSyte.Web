import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { School, User, ApiResponse } from "../types";
import { ArrowLeft, Upload } from "lucide-react";

export default function VideoUploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    schoolId: "",
    teacherId: "",
    subject: "",
  });
  const [dragActive, setDragActive] = useState(false);

  const { data: schools } = useQuery({
    queryKey: ["schools-all"],
    queryFn: () =>
      api
        .get<ApiResponse<{ items: School[] }>>("/schools", { params: { pageSize: 100 } })
        .then((r) => r.data.data!),
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers-all", form.schoolId],
    queryFn: () =>
      api
        .get<ApiResponse<{ items: User[] }>>("/teachers", { params: { pageSize: 100 } })
        .then((r) => r.data.data!),
    enabled: !!form.schoolId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file || !form.title || !form.schoolId || !form.teacherId) {
        throw new Error("Tüm alanlar gerekli");
      }

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("schoolId", form.schoolId);
      formData.append("teacherId", form.teacherId);
      formData.append("subject", form.subject);
      formData.append("file", file);

      return api.post("/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      navigate("/videos");
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <Link to="/videos" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Videolara don
      </Link>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Video Yukle</h1>

        <form onSubmit={(e) => uploadMutation.mutate(e)} className="space-y-6">
          {/* Drag and drop area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Degistir
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Video dosyasini surukleyin</p>
                <p className="text-xs text-gray-500 mt-1">veya</p>
                <label className="inline-block mt-2">
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">dosya secin</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Baslik *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Video basligi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Okul *</label>
                <select
                  required
                  value={form.schoolId}
                  onChange={(e) => setForm({ ...form, schoolId: e.target.value, teacherId: "" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Okul secin</option>
                  {schools?.items.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ogretmen *</label>
                <select
                  required
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  disabled={!form.schoolId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Ogretmen secin</option>
                  {teachers?.items.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Konu (opsiyonel)"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploadMutation.isPending || !file}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {uploadMutation.isPending ? "Yukleniyor..." : "Yukle"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/videos")}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Iptal
            </button>
          </div>

          {uploadMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{(uploadMutation.error as any)?.message || "Bir hata olustu"}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
