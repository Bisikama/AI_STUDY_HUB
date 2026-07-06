'use client';

import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import { adminApi, AdminQuiz } from '@/services/adminApi';
import { subjectsApi } from '@/services/subjectsApi';
import QuizAnalyticsModal from './QuizAnalyticsModal';
import QuizDetailModal from './QuizDetailModal';

// ─── Inline SVGs ─────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
const AssignmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);

// ─── Delete Confirm Modal ───
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
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

// ─── Main Component ───
export default function AdminQuizManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);

  // Modal states
  const [activeQuiz, setActiveQuiz] = useState<AdminQuiz | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [deletingLoading, setDeletingLoading] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; type: 'success' | 'error' }>>([]);
  const addToast = (text: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // Fetch subjects
  const { data: subjects } = useSWR('/subjects', () => subjectsApi.getSubjects());

  // Fetch quizzes using SWR
  const { data: quizData, error: quizError, isLoading: quizzesLoading, mutate } = useSWR(
    ['/admin/quizzes', page, search, subjectId],
    () =>
      adminApi.getQuizzes({
        page,
        limit: 10,
        search: search.trim() || undefined,
        subjectId: subjectId || undefined,
      })
  );

  const handleRefresh = () => {
    void mutate();
    addToast('Refreshing data...', 'success');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset back to first page
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setSubjectId(val);
    setPage(1);
  };

  const executeDelete = async () => {
    if (!activeQuiz) return;
    try {
      setDeletingLoading(true);
      await adminApi.deleteQuiz(activeQuiz.id);
      addToast(`🗑️ Successfully deleted quiz "${activeQuiz.title}".`, 'success');
      void mutate();
      setIsDeleteOpen(false);
      setActiveQuiz(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      addToast(err.response?.data?.message || 'Failed to delete quiz', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('vi-VN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 w-full">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quiz Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Moderate, view statistics of attempts, or directly edit questions and answers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {quizData && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {quizData.totalItems} quizzes
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={quizzesLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <span className={quizzesLoading ? 'animate-spin' : ''}>
                <RefreshIcon />
              </span>
              Refresh
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by quiz title or document..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="min-w-[200px]">
            <select
              value={subjectId || ''}
              onChange={handleSubjectChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600"
            >
              <option value="">All Subjects</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error alert */}
        {quizError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            ⚠️ Failed to load quizzes. Please try again.
          </div>
        )}

        {/* Table list */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Source Document
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizzesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div
                            className="h-4 animate-pulse rounded bg-slate-100"
                            style={{ width: `${50 + (j % 3) * 15}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : quizData?.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <AssignmentIcon />
                        <p className="text-sm font-medium">No quizzes found</p>
                        <p className="text-xs">Try changing the search keyword or selecting a different course.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  quizData?.data.map((quiz) => (
                    <tr key={quiz.id} className="group hover:bg-slate-50/70 transition-colors">
                      {/* Title */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 line-clamp-1">{quiz.title}</p>
                      </td>

                      {/* Original Document */}
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {quiz.document?.title || <span className="text-slate-400 italic">Document deleted</span>}
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4 text-slate-600">
                        {quiz.document?.subject?.name ? (
                          <>
                            <p className="font-medium text-slate-700">{quiz.document.subject.name}</p>
                            <p className="text-xs text-slate-400">{quiz.document.subject.code}</p>
                          </>
                        ) : (
                          'N/A'
                        )}
                      </td>

                      {/* Creator */}
                      <td className="px-6 py-4">
                        {quiz.createdBy === null ? (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            AI Assistant
                          </span>
                        ) : (
                          <>
                            <p className="font-medium text-slate-700">{quiz.user?.fullName}</p>
                            <p className="text-xs text-slate-400">{quiz.user?.email}</p>
                          </>
                        )}
                      </td>

                      {/* Question Count */}
                      <td className="px-6 py-4 text-slate-600 font-semibold">
                        {quiz._count.questions} questions
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-slate-500">{formatDate(quiz.createdAt)}</td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveQuiz(quiz);
                              setIsAnalyticsOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                          >
                            <EyeIcon />
                            Stats
                          </button>

                          <button
                            onClick={() => {
                              setActiveQuiz(quiz);
                              setIsEditOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            <EditIcon />
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              setActiveQuiz(quiz);
                              setIsDeleteOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-50"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {quizData && quizData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
              <div className="text-xs text-slate-500">
                Showing page {page} / {quizData.totalPages} ({quizData.totalItems} results)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, quizData.totalPages))}
                  disabled={page === quizData.totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Analytics Modal ── */}
      {activeQuiz && (
        <QuizAnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => {
            setIsAnalyticsOpen(false);
            setActiveQuiz(null);
          }}
          quizId={activeQuiz.id}
          quizTitle={activeQuiz.title}
        />
      )}

      {/* ── Edit Questions Modal ── */}
      {activeQuiz && (
        <QuizDetailModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setActiveQuiz(null);
          }}
          quizId={activeQuiz.id}
          quizTitle={activeQuiz.title}
          onUpdateSuccess={() => void mutate()}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {activeQuiz && (
        <ConfirmModal
          open={isDeleteOpen}
          title="Delete Quiz"
          description={`This action cannot be undone! The quiz "${activeQuiz.title}" will be permanently deleted from the database.`}
          confirmLabel="Permanently Delete"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={executeDelete}
          onCancel={() => {
            setIsDeleteOpen(false);
            setActiveQuiz(null);
          }}
          loading={deletingLoading}
        />
      )}

      {/* ── Toast notifications ── */}
      <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.type === 'success' ? 'bg-slate-800' : 'bg-red-600'
              }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
