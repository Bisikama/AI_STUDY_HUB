'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  adminApi,
  AdminReport,
  ReportStatus,
  ReportReason,
  DocumentModerationStatus,
  GetReportsParams,
} from '@/services/adminApi';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Chờ xử lý',
  REVIEWING: 'Đang xem xét',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Đã từ chối',
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  REVIEWING: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-slate-100 text-slate-600',
};

const REASON_LABELS: Record<ReportReason, string> = {
  INCORRECT_CONTENT: 'Nội dung sai',
  WRONG_SUBJECT: 'Sai môn học',
  OUTDATED_SYLLABUS: 'Tài liệu lỗi thời',
  DUPLICATED_DOCUMENT: 'Tài liệu trùng lặp',
  FILE_ERROR: 'File bị lỗi',
  LOW_QUALITY: 'Chất lượng thấp',
  SPAM: 'Spam',
  COPYRIGHT_VIOLATION: 'Vi phạm bản quyền',
  INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp',
  OTHER: 'Khác',
};

const DOC_STATUS_LABELS: Record<DocumentModerationStatus, string> = {
  ACTIVE: 'Hoạt động',
  UNDER_REVIEW: 'Đang xem xét',
  HIDDEN: 'Đã ẩn',
  REMOVED: 'Đã gỡ bỏ',
};

const DOC_STATUS_COLORS: Record<DocumentModerationStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  HIDDEN: 'bg-orange-100 text-orange-700',
  REMOVED: 'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  report: AdminReport;
  onClose: () => void;
  onResolved: () => void;
}

function ReportDetailModal({ report, onClose, onResolved }: DetailModalProps) {
  const [status, setStatus] = useState<ReportStatus>('RESOLVED');
  const [docStatus, setDocStatus] = useState<DocumentModerationStatus | ''>('');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.resolveReport(report.id, {
        status,
        ...(status === 'RESOLVED' && docStatus ? { documentStatus: docStatus as DocumentModerationStatus } : {}),
        ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
      });
      onResolved();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Xử lý báo cáo thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  const isPending = report.status === 'PENDING' || report.status === 'REVIEWING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Chi tiết báo cáo</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Thông tin báo cáo */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Thông tin báo cáo</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400 mb-1">Lý do</p>
                <p className="font-medium text-slate-800">{REASON_LABELS[report.reason]}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400 mb-1">Trạng thái</p>
                <Badge label={STATUS_LABELS[report.status]} className={STATUS_COLORS[report.status]} />
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400 mb-1">Người báo cáo</p>
                <p className="font-medium text-slate-800 truncate">{report.reporter.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{report.reporter.email}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400 mb-1">Ngày gửi</p>
                <p className="font-medium text-slate-800">{formatDate(report.createdAt)}</p>
              </div>
              {report.description && (
                <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Mô tả chi tiết</p>
                  <p className="text-slate-700">{report.description}</p>
                </div>
              )}
            </div>
          </section>

          {/* Tài liệu bị báo cáo */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Tài liệu bị báo cáo</p>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{report.document.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">
                    Bởi {report.document.user.fullName} &bull; {report.document.user.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge label={DOC_STATUS_LABELS[report.document.status]} className={DOC_STATUS_COLORS[report.document.status]} />
                </div>
              </div>
            </div>
          </section>

          {/* Đã xử lý trước đó */}
          {report.reviewer && (
            <section className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">Đã xử lý bởi Admin</p>
              <p className="text-sm font-medium text-blue-800">{report.reviewer.fullName}</p>
              {report.reviewedAt && <p className="text-xs text-blue-600 mt-0.5">{formatDate(report.reviewedAt)}</p>}
              {report.adminNote && <p className="mt-2 text-sm text-blue-700 italic">"{report.adminNote}"</p>}
            </section>
          )}

          {/* Form xử lý (chỉ hiện khi báo cáo chưa được xử lý xong) */}
          {isPending && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Xử lý báo cáo</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Trạng thái báo cáo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quyết định <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['RESOLVED', 'REJECTED'] as ReportStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                          status === s
                            ? s === 'RESOLVED'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-slate-400 bg-slate-50 text-slate-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {s === 'RESOLVED' ? '✓ Chấp nhận báo cáo' : '✗ Bác bỏ báo cáo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trạng thái tài liệu (chỉ hiện khi RESOLVED) */}
                {status === 'RESOLVED' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Xử lý tài liệu
                      <span className="ml-1 text-xs text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <select
                      value={docStatus}
                      onChange={(e) => setDocStatus(e.target.value as DocumentModerationStatus | '')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Không thay đổi trạng thái tài liệu</option>
                      <option value="ACTIVE">Khôi phục hoạt động (ACTIVE)</option>
                      <option value="UNDER_REVIEW">Chuyển sang xem xét (UNDER_REVIEW)</option>
                      <option value="HIDDEN">Ẩn tài liệu (HIDDEN)</option>
                      <option value="REMOVED">Gỡ bỏ tài liệu (REMOVED)</option>
                    </select>
                  </div>
                )}

                {/* Ghi chú Admin */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Ghi chú Admin
                    <span className="ml-1 text-xs text-slate-400 font-normal">(tùy chọn, tối đa 1000 ký tự)</span>
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Nhập ghi chú về quyết định xử lý..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{adminNote.length}/1000</p>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Row ───────────────────────────────────────────────────────────────────────

function ReportRow({ report, onSelect }: { report: AdminReport; onSelect: (r: AdminReport) => void }) {
  return (
    <tr
      onClick={() => onSelect(report)}
      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors"
    >
      <td className="px-5 py-3.5">
        <p className="text-sm font-medium text-slate-800 line-clamp-1 max-w-[220px]">{report.document.title}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{report.document.user.fullName}</p>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-slate-700">{REASON_LABELS[report.reason]}</p>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-slate-700 truncate max-w-[160px]">{report.reporter.fullName}</p>
        <p className="text-xs text-slate-400 truncate max-w-[160px]">{report.reporter.email}</p>
      </td>
      <td className="px-5 py-3.5">
        <Badge label={STATUS_LABELS[report.status]} className={STATUS_COLORS[report.status]} />
      </td>
      <td className="px-5 py-3.5">
        <Badge
          label={DOC_STATUS_LABELS[report.document.status]}
          className={DOC_STATUS_COLORS[report.document.status]}
        />
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(report.createdAt)}</td>
      <td className="px-5 py-3.5">
        <span className="text-slate-400 hover:text-blue-600 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </span>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminReportManager() {
  const [filters, setFilters] = useState<GetReportsParams>({ page: 1, limit: 10 });
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  // Build SWR key từ filters
  const swrKey = ['admin-reports', JSON.stringify(filters)];

  const { data, isLoading, error, mutate } = useSWR(
    swrKey,
    () => adminApi.getReports(filters),
    { keepPreviousData: true },
  );

  const setFilter = useCallback(<K extends keyof GetReportsParams>(key: K, value: GetReportsParams[K] | '') => {
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      if (value === '') {
        delete next[key];
      } else {
        (next as GetReportsParams)[key] = value as GetReportsParams[K];
      }
      return next;
    });
  }, []);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const reports = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  const currentPage = filters.page ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Quản lý báo cáo</h1>
        <p className="mt-1 text-sm text-slate-500">Xem xét và xử lý các báo cáo tài liệu từ người dùng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Lọc trạng thái */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilter('status', e.target.value as ReportStatus | '')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        {/* Lọc lý do */}
        <select
          value={filters.reason ?? ''}
          onChange={(e) => setFilter('reason', e.target.value as ReportReason | '')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tất cả lý do</option>
          {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
            <option key={r} value={r}>{REASON_LABELS[r]}</option>
          ))}
        </select>

        {/* Badge tổng số */}
        {!isLoading && (
          <span className="ml-auto self-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {totalItems} báo cáo
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="ml-3 text-sm text-slate-500">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-20 text-center">
            <svg className="mb-3 text-red-400" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <p className="text-sm font-medium text-slate-700">Không thể tải danh sách báo cáo</p>
            <button onClick={() => mutate()} className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-600 hover:bg-blue-100">Thử lại</button>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <svg className="mb-3 text-slate-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
            <p className="text-sm font-medium text-slate-700">Không có báo cáo nào</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc để xem kết quả khác</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Tài liệu', 'Lý do', 'Người báo cáo', 'Trạng thái báo cáo', 'Trạng thái tài liệu', 'Ngày tạo', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <ReportRow key={r.id} report={r} onSelect={setSelectedReport} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                p === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Sau →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolved={() => mutate()}
        />
      )}
    </div>
  );
}
