'use client';

import React, { useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';
import DeleteDocumentModal from '@/components/documents/DeleteDocumentModal';
import { getVisibilityPresentation } from '@/utils/visibility-status';

export default function DocumentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [viewType, setViewType] = useState<'text' | 'summary'>('text');

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const toastId = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id: toastId, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 5000);
  }, []);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR(id ? `/documents/${id}` : null, () => documentsApi.getDocumentById(id));

  const document = response;

  const handleAnalyze = async () => {
    if (!id) return;
    setIsAnalyzing(true);

    // Toast 1: Loading
    addToast('Loading document data...', 'info');

    // Transition Toast 2
    const timer = setTimeout(() => {
      addToast('AI is analyzing and generating questions...', 'info');
    }, 1500);

    try {
      await documentsApi.analyzeDocument(id);
      clearTimeout(timer);
      addToast('Completed! Document has been successfully processed.', 'success');
      mutate();
    } catch (err: any) {
      clearTimeout(timer);
      console.error('Analysis failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Document analysis error';
      addToast(`Error: ${errMsg}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenOriginal = async () => {
    if (!id) return;
    const newTab = window.open('', '_blank');
    if (!newTab) {
      addToast('Popup blocker prevented opening the document.', 'error');
      return;
    }
    try {
      const data = await documentsApi.getDownloadSignedUrl(id);
      newTab.location.href = data.url;
    } catch (err: any) {
      newTab.close();
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    }
  };

  const handleRequestPublic = async () => {
    try {
      addToast('Đang xử lý yêu cầu...', 'info');
      await documentsApi.requestDocumentPublic(id);
      addToast('Đã gửi yêu cầu duyệt công khai.', 'success');
      mutate();
      import('swr').then(({ mutate: globalMutate }) => {
        globalMutate((key: any) => Array.isArray(key) && key[0] === '/documents/me');
      });
    } catch (err: any) {
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    }
  };

  const handleWithdrawPublic = async () => {
    try {
      setIsWithdrawing(true);
      await documentsApi.withdrawDocumentPublic(id);
      addToast('Đã rút tài liệu khỏi Explore.', 'success');
      mutate();
      setIsWithdrawModalOpen(false);
      import('swr').then(({ mutate: globalMutate }) => {
        globalMutate((key: any) => Array.isArray(key) && key[0] === '/documents/me');
      });
    } catch (err: any) {
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Access Denied / Not Found</h2>
        <p className="mb-6 text-gray-500">
          You do not have permission to view this document or it does not exist.
        </p>
        <Link
          href="/dashboard/documents"
          className="rounded-lg bg-[#1a1c23] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-black"
        >
          Back to My Documents
        </Link>
      </div>
    );
  }

  // Extract status presentation logic
  const getExtractionStatusUI = () => {
    switch (document.extractionStatus) {
      case 'READY':
        return {
          title: 'PDF đã được trích xuất thành công',
          icon: 'check_circle',
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          detail: document.pageCount ? `Tài liệu gồm ${document.pageCount} trang.` : '',
        };
      case 'FAILED':
        return {
          title: 'Không thể trích xuất text từ tài liệu này.',
          icon: 'error',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          detail: 'Bạn vẫn có thể xem PDF gốc.',
        };
      case 'PENDING':
        return {
          title: 'Tài liệu đang được xử lý.',
          icon: 'hourglass_empty',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          detail: 'Vui lòng quay lại sau ít phút.',
        };
      default:
        return {
          title: 'Chưa có thông tin trích xuất.',
          icon: 'info',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          detail: '',
        };
    }
  };

  const extractionUI = getExtractionStatusUI();

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl bg-[#F8F9FA] p-6 font-sans md:p-8">
      {/* Top Breadcrumb / Nav */}
      <div className="mb-6 flex items-center text-sm font-medium text-gray-500">
        <Link
          href="/dashboard/documents"
          className="flex items-center transition-colors hover:text-gray-900"
        >
          <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
          Back to My Documents
        </Link>
        <span className="mx-2 text-gray-300">|</span>
        <span className="max-w-[200px] truncate text-gray-400 sm:max-w-md">{document.title}</span>
      </div>

      {/* Main Header Area */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {document.isAIGenerated && (
              <span className="flex items-center gap-1 rounded bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                AI Generated
              </span>
            )}
            <span
              className={`rounded px-2.5 py-1 text-xs font-bold uppercase ${getVisibilityPresentation(document.visibilityStatus).className}`}
            >
              {getVisibilityPresentation(document.visibilityStatus).label}
            </span>
          </div>

          <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight text-gray-900 sm:text-4xl">
            {document.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Added {formatDate(document.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">draft</span>
              {formatSize(document.fileSize)} •{' '}
              {document.fileType.split('/')[1] || document.fileType}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              {document.viewCount} views
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">download</span>
              {document.downloadCount} downloads
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:shrink-0 ">
          {document.summary && (
            <button
              onClick={() => setViewType((prev) => (prev === 'text' ? 'summary' : 'text'))}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {viewType === 'text' ? 'summarize' : 'text_snippet'}
              </span>
              {viewType === 'text' ? 'View Summary' : 'View Full Text'}
            </button>
          )}

          {document.isOwner !== false && (
            <button
              onClick={() => router.push(`/dashboard/documents/${document.id}/edit`)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
          )}

          {document.isOwner === false && (
            <button
              onClick={async () => {
                try {
                  if (document.isFollowed) {
                    await documentsApi.unfollowDocument(document.id);
                    addToast('Unfollowed document successfully.', 'success');
                  } else {
                    await documentsApi.followDocument(document.id);
                    addToast('Followed document successfully.', 'success');
                  }
                  mutate();
                } catch (err) {
                  console.error('Follow toggle failed:', err);
                }
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold shadow-sm transition-colors border ${document.isFollowed
                  ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {document.isFollowed ? 'bookmark_remove' : 'bookmark'}
              </span>
              {document.isFollowed ? 'Unfollow' : 'Follow'}
            </button>
          )}

        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (Main Content) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <span className="material-symbols-outlined text-gray-400">
                  {viewType === 'text' ? 'text_snippet' : 'auto_awesome'}
                </span>
                {viewType === 'text' ? 'Extraction Status / Description' : 'AI Summary & Key Insights'}
              </h2>
            </div>

            {viewType === 'text' ? (
              <>
                {document.description && (
                  <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="mb-2 text-sm font-bold text-gray-700">Description</h3>
                    <p className="text-sm text-gray-600">{document.description}</p>
                  </div>
                )}

                <div className={`flex items-start gap-4 rounded-xl border p-5 ${extractionUI.bg} ${extractionUI.border}`}>
                  <span className={`material-symbols-outlined text-2xl ${extractionUI.color}`}>
                    {extractionUI.icon}
                  </span>
                  <div>
                    <h4 className={`font-bold ${extractionUI.color}`}>{extractionUI.title}</h4>
                    {extractionUI.detail && <p className="mt-1 text-sm text-gray-700">{extractionUI.detail}</p>}

                    <div className="mt-4">
                      <Link
                        href={`/dashboard/documents/${document.id}/preview`}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-300 transition-colors hover:bg-gray-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">preview</span>
                        Xem bản gốc
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {document.summary ? (
                  <>
                    <div className="prose prose-sm max-w-none leading-relaxed text-gray-700">
                      <p className="whitespace-pre-wrap font-medium">{document.summary.summaryText}</p>
                    </div>

                    {document.summary.keyPoints && (
                      <div className="mt-6 border-t border-gray-100 pt-6">
                        <h3 className="mb-3 text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500">lightbulb</span>
                          Key Insights
                        </h3>
                        <ul className="space-y-2.5">
                          {document.summary.keyPoints
                            .split('\n')
                            .filter(Boolean)
                            .map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-primary mt-1 font-bold">•</span>
                                <span>{point.replace(/^•\s*/, '')}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">No summary available.</p>
                )}
              </div>
            )}

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-gray-100 pt-6 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(document as any).quizzes?.length || 0}
                </p>
                <p className="mt-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  QUIZZES
                </p>
              </div>
              <div className="border-r border-l border-gray-100">
                <p className="text-2xl font-bold text-gray-900">
                  {document.summary ? 1 : 0}
                </p>
                <p className="mt-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  SUMMARIES
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {document.subject?.name ??
                    (document.subjectId ? `SUB-${document.subjectId}` : 'N/A')}
                </p>
                <p className="mt-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  STUDY FOLDER
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="flex flex-col gap-6">
          {/* Actions Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase">
              Thao tác tài liệu
            </h3>

            <div className="flex flex-col gap-3">
              {document.deletionStatus !== 'ACTIVE' ? (
                <p className="text-sm text-gray-500">Tài liệu không còn khả dụng để thực hiện thao tác này.</p>
              ) : document.isOwner === false ? (
                <p className="text-sm text-gray-500">Bạn không có quyền thực hiện thao tác trên tài liệu này.</p>
              ) : (
                <>
                  <Link
                    href={`/dashboard/documents/${document.id}/preview`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">preview</span>
                    Preview PDF
                  </Link>

                  <button
                    onClick={handleOpenOriginal}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Download / Open Original
                  </button>

                  {document.visibilityStatus === 'PRIVATE' && (
                    <div className="mt-2 border-t border-gray-100 pt-3">
                      {document.extractionStatus !== 'READY' ? (
                        <div className="group relative">
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">public</span> Request Public
                          </button>
                          <p className="mt-1.5 text-xs text-red-500 text-center">PDF cần trích xuất thành công trước khi gửi duyệt.</p>
                        </div>
                      ) : document.aiStatus !== 'READY' ? (
                        <div className="group relative">
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">public</span> Request Public
                          </button>
                          <p className="mt-1.5 text-xs text-red-500 text-center">Cần hoàn tất AI processing trước khi gửi duyệt.</p>
                        </div>
                      ) : !document.subject ? (
                        <div className="group relative">
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">public</span> Request Public
                          </button>
                          <p className="mt-1.5 text-xs text-gray-500 text-center">Đang kiểm tra điều kiện Subject.</p>
                        </div>
                      ) : !document.subject.isSystem ? (
                        <div className="group relative">
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">public</span> Request Public
                          </button>
                          <p className="mt-1.5 text-xs text-red-500 text-center">Chỉ System Subject mới có thể gửi duyệt công khai.</p>
                        </div>
                      ) : (
                        <button
                          onClick={handleRequestPublic}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1c23] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                        >
                          <span className="material-symbols-outlined text-[18px]">public</span>
                          Request Public
                        </button>
                      )}
                    </div>
                  )}

                  {document.visibilityStatus === 'PUBLIC' && (
                    <div className="mt-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">public_off</span>
                        Withdraw from Explore
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Tags Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase">
              Study Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {document.tags && document.tags.length > 0 ? (
                document.tags.map((t: any) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center rounded-full bg-[#1a1c23] px-3 py-1 text-xs font-medium text-white"
                  >
                    {t.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No tags</span>
              )}
            </div>
          </div>

          {/* Action Card matching "AI Assistant" dark styling */}
          <div className="rounded-2xl bg-[#1a1c23] p-6 text-white shadow-md relative overflow-hidden">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-[#1a1c23]/95 flex flex-col items-center justify-center p-6 text-center z-10">
                <span className="material-symbols-outlined text-5xl text-blue-400 animate-pulse mb-3">
                  psychology
                </span>
                <h4 className="text-lg font-bold mb-1">AI Document Analysis</h4>
                <p className="text-xs text-gray-400 mb-4">
                  Processing content & generating questions...
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Please wait (15-30 seconds)</span>
                </div>
              </div>
            )}

            <h3 className="mb-2 text-xl font-bold">Document Actions</h3>
            <p className="mb-6 text-sm text-gray-400">
              What would you like to do with this document today?
            </p>

            {document.isAIGenerated ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">
                  check_circle
                </span>
                <p className="text-sm font-semibold text-gray-200">
                  Document successfully processed
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Summary and Quiz are ready
                </p>
              </div>
            ) : document.isOwner !== false ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center justify-between rounded-xl bg-[#2a2c35] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-gray-700 disabled:opacity-50 w-full"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-400">auto_awesome</span>
                    Generate Quiz and Summary
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-gray-400">
                    chevron_right
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">
                  lock
                </span>
                <p className="text-sm font-semibold text-gray-200">
                  Followed Document
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  AI Quiz and Summary are not available.
                </p>
              </div>
            )}
          </div>

          {/* System Info Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-blue-500 uppercase">
              DOCUMENT STATUS: {getVisibilityPresentation(document.visibilityStatus).label}
            </h3>
            {/* <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Document ID</span>
                <span
                  className="max-w-[120px] truncate font-mono text-gray-900"
                  title={document.id}
                >
                  {document.id.split('-')[0]}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Uploaded By</span>
                <span
                  className="max-w-[120px] truncate font-mono text-gray-900"
                  title={document.uploadedBy}
                >
                  {document.uploadedBy.split('-')[0]}...
                </span>
              </div>
              {document.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(document.updatedAt)}
                  </span>
                </div>
              )}
            </div> */}

            {document.isOwner !== false ? (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Delete Document
                </button>
              </div>
            ) : (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <button
                  onClick={async () => {
                    try {
                      await documentsApi.unfollowDocument(document.id);
                      addToast('Unfollowed document successfully.', 'success');
                      router.push('/dashboard/documents');
                    } catch (err) {
                      console.error('Failed to unfollow:', err);
                    }
                  }}
                  className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Unfollow Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteDocumentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        documentTitle={document.title}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={async () => {
          try {
            setIsDeleting(true);
            setDeleteError(undefined);
            await documentsApi.deleteDocument(id);
            import('swr').then(({ mutate: globalMutate }) => {
              globalMutate((key: any) => Array.isArray(key) && key[0] === '/documents/me');
            });
            router.push('/dashboard/documents');
          } catch (err: any) {
            setDeleteError(
              err?.response?.data?.message || 'Failed to delete document. Please try again.',
            );
          } finally {
            setIsDeleting(false);
          }
        }}
      />

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-xl font-bold text-gray-900">Withdraw from Explore</h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc chắn muốn rút tài liệu này khỏi Explore? Tài liệu sẽ trở về trạng thái PRIVATE.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                disabled={isWithdrawing}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleWithdrawPublic}
                disabled={isWithdrawing}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isWithdrawing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toasts={toasts} />
    </div>
  );
}

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

function ToastNotification({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[110] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm min-w-[280px] items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ${t.variant === 'success'
              ? 'bg-emerald-600'
              : t.variant === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
        >
          {t.variant === 'success' && (
            <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.variant === 'error' && (
            <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {t.variant === 'info' && (
            <svg className="h-4.5 w-4.5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
