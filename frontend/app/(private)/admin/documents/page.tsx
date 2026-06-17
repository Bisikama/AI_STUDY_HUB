'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi, PendingDocument } from '@/services/adminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
}

function fileTypeLabel(mime: string): string {
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('word') || mime.includes('docx')) return 'DOCX';
  if (mime.includes('presentation') || mime.includes('pptx')) return 'PPTX';
  if (mime.includes('sheet') || mime.includes('xlsx')) return 'XLSX';
  return mime.split('/')[1]?.toUpperCase() ?? 'FILE';
}

const fileTypeBg: Record<string, string> = {
  PDF:  'bg-red-100 text-red-600',
  DOCX: 'bg-blue-100 text-blue-600',
  PPTX: 'bg-orange-100 text-orange-600',
  XLSX: 'bg-emerald-100 text-emerald-600',
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const DocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmModal({ open, title, description, confirmLabel, confirmClass, onConfirm, onCancel, loading }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${confirmClass}`}>
            {loading && <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FullText Slide-Over Panel ─────────────────────────────────────────────────

interface SlideOverProps {
  doc: PendingDocument | null;
  pendingAction: 'approve' | 'reject' | null;
  onClose: () => void;
  onApprove: (doc: PendingDocument) => void;
  onReject: (doc: PendingDocument) => void;
  actionLoading: boolean;
}

function FullTextPanel({ doc, pendingAction, onClose, onApprove, onReject, actionLoading }: SlideOverProps) {
  const isOpen = !!doc;

  // Trap focus / close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[520px] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {!doc ? null : (
          <>
            {/* ── Panel Header ── */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <DocIcon />
                </div>
                <div>
                  <h2 className="text-sm font-bold leading-snug text-slate-900">{doc.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {doc.subject.name} · {doc.user.fullName} · {formatDate(doc.createdAt)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <CloseIcon />
              </button>
            </div>

            {/* ── Meta strip ── */}
            <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500">
              <span>
                <span className="font-semibold text-slate-700">Type: </span>
                <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${fileTypeBg[fileTypeLabel(doc.fileType)] ?? 'bg-slate-100 text-slate-500'}`}>
                  {fileTypeLabel(doc.fileType)}
                </span>
              </span>
              <span><span className="font-semibold text-slate-700">Size: </span>{formatSize(doc.fileSize)}</span>
              <span><span className="font-semibold text-slate-700">Email: </span>{doc.user.email}</span>
            </div>

            {/* ── Full Text Content ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Text Content</p>
              {doc.fullText ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700">
                    {doc.fullText}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-slate-400">
                  <DocIcon />
                  <p className="text-sm font-medium">No full text available</p>
                  <p className="text-xs">This document hasn't been processed by AI yet.</p>
                </div>
              )}
            </div>

            {/* ── Action Footer ── */}
            <div className="border-t border-slate-100 bg-white px-6 py-4">
              {pendingAction === 'approve' ? (
                <div className="flex items-center gap-3">
                  <button onClick={onClose} disabled={actionLoading}
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={() => onApprove(doc)} disabled={actionLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">
                    {actionLoading
                      ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      : <CheckIcon />}
                    Confirm Approve
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={onClose} disabled={actionLoading}
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={() => onReject(doc)} disabled={actionLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50">
                    {actionLoading
                      ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      : <XIcon />}
                    Confirm Reject
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; type: 'success' | 'error' }

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Slide-over state: which doc + what action intent
  const [panel, setPanel] = useState<{
    doc: PendingDocument | null;
    intent: 'approve' | 'reject' | null;
  }>({ doc: null, intent: null });

  // Confirm modal (for Delete only)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; doc: PendingDocument | null }>({ open: false, doc: null });

  // ── Fetch ──
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPendingDocuments();
      setDocs(data);
    } catch {
      setError('Không thể tải danh sách tài liệu chờ duyệt.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // ── Toast ──
  const addToast = (text: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // ── Open slide-over ──
  const openPanel = (doc: PendingDocument, intent: 'approve' | 'reject') => {
    setPanel({ doc, intent });
  };

  // ── Execute approve from panel ──
  const handleApprove = async (doc: PendingDocument) => {
    setActionLoading((p) => ({ ...p, [doc.id]: true }));
    try {
      await adminApi.approveDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setPanel({ doc: null, intent: null });
      addToast(`✅ "${doc.title}" đã được phê duyệt.`, 'success');
    } catch {
      addToast(`Approve thất bại. Vui lòng thử lại.`, 'error');
    } finally {
      setActionLoading((p) => ({ ...p, [doc.id]: false }));
    }
  };

  // ── Execute reject from panel ──
  const handleReject = async (doc: PendingDocument) => {
    setActionLoading((p) => ({ ...p, [doc.id]: true }));
    try {
      await adminApi.rejectDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setPanel({ doc: null, intent: null });
      addToast(`🚫 "${doc.title}" đã bị từ chối.`, 'success');
    } catch {
      addToast(`Reject thất bại. Vui lòng thử lại.`, 'error');
    } finally {
      setActionLoading((p) => ({ ...p, [doc.id]: false }));
    }
  };

  // ── Execute delete from modal ──
  const handleDelete = async () => {
    const doc = deleteModal.doc;
    if (!doc) return;
    setDeleteModal({ open: false, doc: null });
    setActionLoading((p) => ({ ...p, [doc.id]: true }));
    try {
      await adminApi.deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      addToast(`🗑️ "${doc.title}" đã bị xóa hoàn toàn.`, 'success');
    } catch {
      addToast(`Delete thất bại. Vui lòng thử lại.`, 'error');
    } finally {
      setActionLoading((p) => ({ ...p, [doc.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending Documents</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review full text content before approving or rejecting documents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                {docs.length} pending
              </span>
            )}
            <button onClick={fetchDocs} disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50">
              <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">⚠️ {error}</div>
        )}

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Document</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Subject</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Uploaded By</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Size</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${50 + j * 8}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <DocIcon />
                      <p className="text-sm font-medium">No pending documents</p>
                      <p className="text-xs">All documents have been reviewed.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => {
                  const ext = fileTypeLabel(doc.fileType);
                  const isActing = !!actionLoading[doc.id];
                  const isThisPanel = panel.doc?.id === doc.id;
                  return (
                    <tr key={doc.id}
                      className={`group transition-colors ${isThisPanel ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'}`}>

                      {/* Document */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${fileTypeBg[ext] ?? 'bg-slate-100 text-slate-500'}`}>
                            {ext}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 line-clamp-1">{doc.title}</p>
                            {doc.description && (
                              <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{doc.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">{doc.subject.name}</p>
                        <p className="text-xs text-slate-400">{doc.subject.code}</p>
                      </td>

                      {/* Uploader */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">{doc.user.fullName}</p>
                        <p className="text-xs text-slate-400">{doc.user.email}</p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-500">{formatDate(doc.createdAt)}</td>

                      {/* Size */}
                      <td className="px-6 py-4 text-slate-500">{formatSize(doc.fileSize)}</td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve — mở slide-over */}
                          <button onClick={() => openPanel(doc, 'approve')} disabled={isActing}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 ${isThisPanel && panel.intent === 'approve' ? 'bg-emerald-700 ring-2 ring-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            <EyeIcon />
                            Approve
                          </button>

                          {/* Reject — mở slide-over */}
                          <button onClick={() => openPanel(doc, 'reject')} disabled={isActing}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${isThisPanel && panel.intent === 'reject' ? 'border-amber-300 bg-amber-50 text-amber-700 ring-2 ring-amber-300' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                            <EyeIcon />
                            Reject
                          </button>

                          {/* Delete — confirm modal trực tiếp */}
                          <button onClick={() => setDeleteModal({ open: true, doc })} disabled={isActing}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-50 disabled:opacity-50">
                            {isActing
                              ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                              : <TrashIcon />}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loading && docs.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-3">
              <p className="text-xs text-slate-400">
                {docs.length} pending document{docs.length !== 1 ? 's' : ''} — oldest first
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── FullText Slide-Over ── */}
      <FullTextPanel
        doc={panel.doc}
        pendingAction={panel.intent}
        onClose={() => setPanel({ doc: null, intent: null })}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={panel.doc ? !!actionLoading[panel.doc.id] : false}
      />

      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        open={deleteModal.open}
        title="Xóa vĩnh viễn tài liệu"
        description={`Hành động này không thể hoàn tác! File "${deleteModal.doc?.title}" sẽ bị xóa hoàn toàn khỏi Cloud Storage và Database.`}
        confirmLabel="Delete Permanently"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, doc: null })}
        loading={deleteModal.doc ? !!actionLoading[deleteModal.doc.id] : false}
      />

      {/* ── Toast Stack ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.type === 'success' ? 'bg-slate-800' : 'bg-red-600'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
