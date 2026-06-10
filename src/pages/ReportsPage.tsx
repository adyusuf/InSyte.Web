import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { Report, School, ApiResponse, PagedResult } from "../types";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";

function StatusBadge({ status }: { status: Report["status"] }) {
  const map: Record<Report["status"], { label: string; className: string }> = {
    Draft: { label: "Taslak", className: "bg-yellow-100 text-yellow-800" },
    Approved: { label: "Onaylandı", className: "bg-green-100 text-green-800" },
    Sent: { label: "Gönderildi", className: "bg-blue-100 text-blue-800" },
    Rejected: { label: "Reddedildi", className: "bg-red-100 text-red-800" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const schoolFilter = searchParams.get("schoolId") ?? "";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ["schools-all"],
    queryFn: () =>
      api.get<ApiResponse<PagedResult<School>>>("/schools", { params: { pageSize: 100 } })
        .then((r) => r.data.data!),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", schoolFilter, search, page],
    queryFn: () =>
      api
        .get<ApiResponse<PagedResult<Report>>>("/reports", {
          params: { schoolId: schoolFilter || undefined, search, page, pageSize: 20 },
        })
        .then((r) => r.data.data!),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/reports/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/reports/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setShowRejectModal(false);
      setRejectReason("");
      setRejectTargetId(null);
      setRejectError("");
    },
  });

  const handleSchoolChange = (id: string) => {
    setPage(1);
    if (id) setSearchParams({ schoolId: id });
    else setSearchParams({});
  };

  const handleApprove = (id: string) => {
    if (window.confirm("Bu raporu onaylamak istediğinizden emin misiniz?")) {
      approveMutation.mutate(id);
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason("");
    setRejectError("");
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectTargetId(null);
    setRejectReason("");
    setRejectError("");
  };

  const handleRejectSubmit = () => {
    if (!rejectTargetId) return;
    if (rejectReason.trim().length < 5) {
      setRejectError("Ret gerekçesi en az 5 karakter olmalıdır.");
      return;
    }
    rejectMutation.mutate({ id: rejectTargetId, reason: rejectReason.trim() });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-48">
          <select
            value={schoolFilter}
            onChange={(e) => handleSchoolChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Okullar</option>
            {schools?.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 max-w-xs">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Rapor ara..." />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Video</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Okul</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Öğretmen</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Onaylayan</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksiyonlar</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.videoTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.schoolName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.teacherName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.approvedByName || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge status={report.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === "Draft" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(report.id)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(report.id)}
                            disabled={rejectMutation.isPending}
                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Reddet
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.pdfPath && (
                        <a
                          href={`http://localhost:5090/api/reports/${report.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Rapor bulunamadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data && <Pagination page={page} totalCount={data.totalCount} pageSize={data.pageSize} onPageChange={setPage} />}
        </>
      )}

      <Modal isOpen={showRejectModal} title="Raporu Reddet" onClose={handleCloseRejectModal}>
        <div className="space-y-4">
          <div>
            <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-1">
              Ret Gerekçesi
            </label>
            <textarea
              id="rejectReason"
              rows={4}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError("");
              }}
              placeholder="Ret nedenini açıklayın..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            {rejectError && (
              <p className="mt-1 text-xs text-red-600">{rejectError}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCloseRejectModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {rejectMutation.isPending ? "Reddediliyor..." : "Reddet"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
