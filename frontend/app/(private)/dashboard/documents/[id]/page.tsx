'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';
import DeleteDocumentModal from '@/components/documents/DeleteDocumentModal';
import { getVisibilityPresentation } from '@/utils/visibility-status';
import { getCleanFileType } from '@/utils/fileUtils';

export default function DocumentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [viewType, setViewType] = useState<'text' | 'summary'>('text');

  // Rating state
  const { data: ratings, mutate: mutateRatings } = useSWR(
    id ? `/documents/${id}/ratings` : null,
    () => documentsApi.getRatings(id)
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [isEditingRating, setIsEditingRating] = useState<boolean>(false);

  // Report state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('INCORRECT_CONTENT');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  React.useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        setCurrentUser(JSON.parse(userJson));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const myRating = ratings?.find((r: any) => r.userId === currentUser?.id);
  React.useEffect(() => {
    if (myRating && !isEditingRating) {
      setRatingValue(myRating.rating);
      setRatingComment(myRating.comment || '');
    }
  }, [myRating, isEditingRating]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingValue < 1 || ratingValue > 5) {
      addToast('Please select a rating (1-5 stars).', 'error');
      return;
    }
    setIsSubmittingRating(true);
    try {
      await documentsApi.rateDocument(id, { rating: ratingValue, comment: ratingComment });
      addToast('Document rated successfully!', 'success');
      mutate();
      mutateRatings();
      setIsEditingRating(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Error rating document';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    try {
      await documentsApi.deleteRating(id);
      addToast('Your review has been deleted.', 'success');
      setRatingValue(0);
      setRatingComment('');
      mutate();
      mutateRatings();
      setIsEditingRating(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Error deleting review';
      addToast(errMsg, 'error');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      await documentsApi.reportDocument(id, { reason: reportReason, description: reportDescription });
      addToast('Document reported successfully! The moderation team will review it soon.', 'success');
      mutate();
      setIsReportModalOpen(false);
      setReportDescription('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Error submitting report';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const toastId = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id: toastId, message, variant }]);
    setTimeout(() => removeToast(toastId), 5000);
    return toastId;
  }, [removeToast]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Copyright Form State
  const [isCopyrightModalOpen, setIsCopyrightModalOpen] = useState(false);
  const [copyrightSourceType, setCopyrightSourceType] = useState('UNKNOWN');
  const [copyrightAuthorName, setCopyrightAuthorName] = useState('');
  const [copyrightSourceUrl, setCopyrightSourceUrl] = useState('');
  const [copyrightLicense, setCopyrightLicense] = useState('');
  const [copyrightAttribution, setCopyrightAttribution] = useState('');
  const [copyrightPermissionReference, setCopyrightPermissionReference] = useState('');
  const [isSubmittingCopyright, setIsSubmittingCopyright] = useState(false);

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

    const loadingToastId1 = addToast('Loading document data...', 'info');
    let loadingToastId2: number | undefined;

    const timer = setTimeout(() => {
      removeToast(loadingToastId1);
      loadingToastId2 = addToast('AI is analyzing and generating questions...', 'info');
    }, 1500);

    try {
      await documentsApi.analyzeDocument(id);
      clearTimeout(timer);
      removeToast(loadingToastId1);
      if (loadingToastId2) removeToast(loadingToastId2);
      addToast('Completed! Document has been successfully processed.', 'success');
      mutate();
    } catch (err: any) {
      clearTimeout(timer);
      removeToast(loadingToastId1);
      if (loadingToastId2) removeToast(loadingToastId2);
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
      const data = await documentsApi.getPreviewSignedUrl(id);
      newTab.location.href = data.url;
    } catch (err: any) {
      newTab.close();
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!id) return;
    setIsDownloading(true);
    try {
      const data = await documentsApi.getDownloadSignedUrl(id);
      const a = window.document.createElement('a');
      a.href = data.url;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (err: any) {
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenCopyrightModal = () => {
    let typeToSet = document?.copyrightSourceType || 'UNKNOWN';
    if (!document?.copyrightDeclaredAt && typeToSet === 'UNKNOWN') {
      typeToSet = 'UNKNOWN';
    }
    setCopyrightSourceType(typeToSet);
    setCopyrightAuthorName(document?.copyrightAuthorName || '');
    setCopyrightSourceUrl(document?.copyrightSourceUrl || '');
    setCopyrightLicense(document?.copyrightLicense || '');
    setCopyrightAttribution(document?.copyrightAttribution || '');
    setCopyrightPermissionReference(document?.copyrightPermissionReference || '');
    setIsCopyrightModalOpen(true);
  };

  useEffect(() => {
    if (isCopyrightModalOpen && document) {
      let typeToSet = document.copyrightSourceType || 'UNKNOWN';
      if (!document.copyrightDeclaredAt && typeToSet === 'UNKNOWN') {
        typeToSet = 'UNKNOWN';
      }
      setCopyrightSourceType(typeToSet);
      setCopyrightAuthorName(document.copyrightAuthorName || '');
      setCopyrightSourceUrl(document.copyrightSourceUrl || '');
      setCopyrightLicense(document.copyrightLicense || '');
      setCopyrightAttribution(document.copyrightAttribution || '');
      setCopyrightPermissionReference(document.copyrightPermissionReference || '');
    }
  }, [isCopyrightModalOpen, document]);

  const handleSubmitCopyright = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSubmittingCopyright(true);

      const cleanStr = (val: string) => {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      };

      const payload: any = {
        sourceType: copyrightSourceType,
      };

      if (copyrightSourceType === 'OPEN_LICENSE') {
        payload.sourceUrl = cleanStr(copyrightSourceUrl);
        payload.license = cleanStr(copyrightLicense);
        payload.attribution = cleanStr(copyrightAttribution);
      }

      await documentsApi.updateCopyright(id, payload);
      addToast('Copyright declared successfully.', 'success');

      mutate((currentData: any) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          copyrightSourceType: payload.sourceType,
          copyrightAuthorName: payload.authorName || null,
          copyrightSourceUrl: payload.sourceUrl || null,
          copyrightLicense: payload.license || null,
          copyrightAttribution: payload.attribution || null,
          copyrightPermissionReference: payload.permissionReference || null,
          copyrightDeclaredAt: new Date().toISOString(),
        };
      }, { revalidate: true });

      setIsCopyrightModalOpen(false);
    } catch (err: any) {
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    } finally {
      setIsSubmittingCopyright(false);
    }
  };

  const handleRequestPublic = async () => {
    let loadingToastId: number | undefined;
    try {
      loadingToastId = addToast('Processing request...', 'info');
      await documentsApi.requestDocumentPublic(id);
      if (loadingToastId) removeToast(loadingToastId);
      addToast('Public review request submitted.', 'success');
      mutate();
      import('swr').then(({ mutate: globalMutate }) => {
        globalMutate((key: any) => Array.isArray(key) && key[0] === '/documents/me');
      });
    } catch (err: any) {
      if (loadingToastId) removeToast(loadingToastId);
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    }
  };

  const handleWithdrawPublic = async () => {
    try {
      setIsWithdrawing(true);
      await documentsApi.withdrawDocumentPublic(id);
      addToast('Withdrew document from Explore.', 'success');
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
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-[#FAFAFA]">
        <span className="material-symbols-outlined animate-spin text-3xl text-gray-400">sync</span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center bg-[#FAFAFA] p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Access Denied</h2>
        <p className="mb-6 text-[13px] text-gray-500 max-w-sm">
          You do not have permission to view this document or it does not exist.
        </p>
        <Link
          href="/dashboard/documents"
          className="rounded-md bg-gray-900 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  const getExtractionStatusUI = () => {
    switch (document.extractionStatus) {
      case 'READY':
        return {
          title: 'Successfully extracted',
          icon: 'check_circle',
          color: 'text-emerald-700',
          bg: 'bg-emerald-50/50',
          border: 'border-emerald-200/60',
          detail: document.pageCount ? `Document contains ${document.pageCount} pages.` : '',
        };
      case 'FAILED':
        return {
          title: 'Extraction failed.',
          icon: 'error',
          color: 'text-red-700',
          bg: 'bg-red-50/50',
          border: 'border-red-200/60',
          detail: 'You can still view the original PDF.',
        };
      case 'PENDING':
        return {
          title: 'Document is processing.',
          icon: 'hourglass_empty',
          color: 'text-amber-700',
          bg: 'bg-amber-50/50',
          border: 'border-amber-200/60',
          detail: 'Please check back in a few minutes.',
        };
      case 'UNSUPPORTED':
        return {
          title: 'Format not supported for AI.',
          icon: 'do_not_disturb',
          color: 'text-gray-600',
          bg: 'bg-gray-100/50',
          border: 'border-gray-200',
          detail: 'View/download only. AI features disabled.',
        };
      default:
        return {
          title: 'No extraction info.',
          icon: 'info',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          detail: '',
        };
    }
  };

  const extractionUI = getExtractionStatusUI();
  const publishCtaText = currentUser?.role === 'STUDENT' ? 'Request to publish' : 'Publish to Explore';

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl bg-[#FAFAFA] p-6 font-sans md:p-10 lg:px-12 text-gray-900">

      {/* Top Breadcrumb */}
      <div className="mb-8 flex items-center text-[13px] font-medium text-gray-500">
        <Link
          href="/dashboard/documents"
          className="flex items-center transition-colors hover:text-gray-900"
        >
          <span className="material-symbols-outlined mr-1 text-[16px]">arrow_back</span>
          Documents
        </Link>
        <span className="material-symbols-outlined mx-1.5 text-[14px] text-gray-300">chevron_right</span>
        <span className="max-w-[200px] truncate text-gray-900 sm:max-w-md">{document.title}</span>
      </div>

      {/* Moderation Warning */}
      {document.status === 'UNDER_REVIEW' && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-amber-800 shadow-sm">
          <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5 text-[20px]">warning</span>
          <div>
            <h4 className="text-[13px] font-semibold text-amber-900 tracking-tight">Under Moderation Review</h4>
            <p className="text-[12.5px] text-amber-700/90 mt-0.5 leading-relaxed">
              This document has received user reports and is being moderated.
              {document.moderationWarning && ` Reason: ${document.moderationWarning}`}
            </p>
          </div>
        </div>
      )}

      {(document.status === 'HIDDEN' || document.status === 'REMOVED') && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-4 text-rose-800 shadow-sm">
          <span className="material-symbols-outlined text-rose-600 shrink-0 mt-0.5 text-[20px]">block</span>
          <div>
            <h4 className="text-[13px] font-semibold text-rose-900 tracking-tight">Tài liệu đã bị ẩn hoặc gỡ bỏ bởi Admin</h4>
            <p className="text-[12.5px] text-rose-700/90 mt-0.5 leading-relaxed">
              Tài liệu này đã bị gỡ bỏ khỏi chế độ tìm kiếm công khai (Explore) và chế độ luyện tập (Practice Mode) do vi phạm quy chế hoặc bị báo cáo vi phạm. Chỉ có bạn (chủ sở hữu) mới có thể xem tài liệu này trong kho cá nhân.
            </p>
          </div>
        </div>
      )}

      {/* Main Header Area */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {document.isAIGenerated && (
              <span className="flex items-center gap-1 rounded bg-gray-900 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-sm">
                <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                AI GENERATED
              </span>
            )}
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border ${getVisibilityPresentation(document.visibilityStatus).className}`}
            >
              {getVisibilityPresentation(document.visibilityStatus).label}
            </span>
          </div>

          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {document.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-gray-500 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-gray-400">calendar_today</span>
              {formatDate(document.createdAt)}
            </div>
            <div className="flex items-center gap-1.5 uppercase">
              <span className="material-symbols-outlined text-[16px] text-gray-400">draft</span>
              {formatSize(document.fileSize)} • {getCleanFileType(document.fileType)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-gray-400">visibility</span>
              {document.viewCount} views
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-gray-400">download</span>
              {document.downloadCount} dls
            </div>
          </div>

          {document.copyrightSourceType && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-gray-600 bg-gray-100/80 px-3 py-2 rounded-md border border-gray-200/50 w-fit">
              <span className="material-symbols-outlined text-[14px] text-gray-500">copyright</span>
              <span className="font-semibold text-gray-700">
                {document.copyrightSourceType === 'OWN_ORIGINAL' && 'Self-authored'}
                {document.copyrightSourceType === 'OPEN_LICENSE' && 'Open Source'}
              </span>
              {document.copyrightLicense && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="font-mono text-[11px] font-semibold text-gray-600">
                    {document.copyrightLicense}
                  </span>
                </>
              )}
              {document.copyrightSourceUrl && (
                <>
                  <span className="text-gray-300">|</span>
                  <a href={document.copyrightSourceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 font-medium">
                    Source <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </>
              )}
              {document.copyrightAttribution && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 italic">
                    By {document.copyrightAttribution}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0">
          {document.summary && (
            <button
              onClick={() => setViewType((prev) => (prev === 'text' ? 'summary' : 'text'))}
              className="flex items-center gap-1.5 rounded-md border border-gray-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {viewType === 'text' ? 'auto_awesome' : 'subject'}
              </span>
              {viewType === 'text' ? 'View AI Summary' : 'View Details'}
            </button>
          )}

          {document.isOwner !== false && (
            <button
              onClick={() => router.push(`/dashboard/documents/${document.id}/edit`)}
              className="flex items-center gap-1.5 rounded-md border border-gray-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Details
            </button>
          )}

          {document.isOwner === false && (
            <>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-red-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-[16px]">report</span>
                Report
              </button>

              <button
                onClick={async () => {
                  try {
                    if (document.isFollowed) {
                      await documentsApi.unfollowDocument(document.id);
                      addToast('Unfollowed document.', 'success');
                    } else {
                      await documentsApi.followDocument(document.id);
                      addToast('Followed document.', 'success');
                    }
                    mutate();
                  } catch (err) {
                    console.error('Follow toggle failed:', err);
                  }
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium shadow-sm transition-colors border ${document.isFollowed
                  ? 'border-gray-200/80 bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'border-gray-900 bg-gray-900 text-white hover:bg-black'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {document.isFollowed ? 'bookmark_remove' : 'bookmark_add'}
                </span>
                {document.isFollowed ? 'Unfollow' : 'Follow Document'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* Left Column (Main Content) */}
        <div className="flex flex-col gap-6 lg:col-span-8">

          <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-8">
            <h3 className="mb-5 text-[11px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <span className="material-symbols-outlined text-[16px]">
                {viewType === 'text' ? 'analytics' : 'auto_awesome'}
              </span>
              {viewType === 'text' ? 'Extraction & Details' : 'AI Summary & Insights'}
            </h3>

            {viewType === 'text' ? (
              <>
                {document.description && (
                  <div className="mb-6">
                    <p className="text-[13px] leading-relaxed text-gray-600">{document.description}</p>
                  </div>
                )}

                <div className={`flex items-start gap-3 rounded-lg border p-4 ${extractionUI.bg} ${extractionUI.border}`}>
                  <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${extractionUI.color}`}>
                    {extractionUI.icon}
                  </span>
                  <div>
                    <h4 className={`text-[13px] font-semibold tracking-tight ${extractionUI.color}`}>{extractionUI.title}</h4>
                    {extractionUI.detail && <p className="mt-0.5 text-[12.5px] opacity-90 text-gray-700">{extractionUI.detail}</p>}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {document.summary ? (
                  <>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700">{document.summary.summaryText}</p>
                    </div>

                    {document.summary.keyPoints && (
                      <div className="mt-8">
                        <h4 className="mb-4 text-[12px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-gray-400">lightbulb</span>
                          Key Insights
                        </h4>
                        <ul className="space-y-3 pl-1">
                          {document.summary.keyPoints
                            .split('\n')
                            .filter(Boolean)
                            .map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2.5 text-[13.5px] text-gray-600 leading-relaxed">
                                <span className="text-gray-300 mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0"></span>
                                <span>{point.replace(/^•\s*/, '')}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] text-gray-400 italic">No AI summary generated yet.</p>
                )}
              </div>
            )}

            {/* Quick Stats Banner */}
            <div className="mt-8 flex items-center rounded-lg border border-gray-100 bg-gray-50/50 p-4 divide-x divide-gray-200">
              <div className="flex-1 text-center">
                <p className="text-xl font-bold tracking-tight text-gray-900">
                  {(document as any).quizzes?.length || 0}
                </p>
                <p className="mt-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Quizzes</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xl font-bold tracking-tight text-gray-900">
                  {document.summary ? 1 : 0}
                </p>
                <p className="mt-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Summaries</p>
              </div>
              <div className="flex-1 text-center px-2">
                <p className="text-sm font-semibold tracking-tight text-gray-900 truncate">
                  {document.subject?.name ?? (document.subjectId ? `SUB-${document.subjectId}` : 'Unfiled')}
                </p>
                <p className="mt-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Folder</p>
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-8">
            <h3 className="mb-6 text-[11px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <span className="material-symbols-outlined text-[16px]">star</span>
              Reviews & Feedback
            </h3>

            {/* Average Rating Summary */}
            <div className="mb-6 flex items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100 max-w-sm">
              <div className="text-3xl font-bold tracking-tighter text-gray-900">
                {document.averageRating ? document.averageRating.toFixed(1) : '0.0'}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[16px] ${i < Math.round(document.averageRating || 0) ? 'filled text-gray-900' : 'text-gray-200'}`}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-wide">
                  Based on {document.ratingCount || 0} reviews
                </p>
              </div>
            </div>

            {/* User review form (only if not owner) */}
            {document.isOwner === false && (
              <div className="mb-8 border-b border-gray-100 pb-8">
                {myRating && !isEditingRating ? (
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 max-w-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        Your review
                      </span>
                      <div className="flex gap-3">
                        <button onClick={() => setIsEditingRating(true)} className="text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors">Edit</button>
                        <button onClick={handleDeleteRating} className="text-[12px] font-medium text-red-600 hover:text-red-800 transition-colors">Delete</button>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[14px] ${i < myRating.rating ? 'filled text-gray-900' : 'text-gray-200'}`}>
                          star
                        </span>
                      ))}
                    </div>
                    {myRating.comment ? (
                      <p className="text-[13px] text-gray-700">{myRating.comment}</p>
                    ) : (
                      <p className="text-[12px] text-gray-400 italic">No written feedback.</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRating} className="space-y-4 max-w-xl">
                    <h4 className="text-[12px] font-bold tracking-wide text-gray-700">
                      {isEditingRating ? 'Update your review' : 'Write a review'}
                    </h4>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => {
                        const starValue = i + 1;
                        const isHighlighted = starValue <= (hoveredStar || ratingValue);
                        return (
                          <button
                            type="button"
                            key={i}
                            onMouseEnter={() => setHoveredStar(starValue)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setRatingValue(starValue)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <span className={`material-symbols-outlined text-[24px] ${isHighlighted ? 'filled text-gray-900' : 'text-gray-200'}`}>
                              star
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Share your thoughts on this document..."
                        maxLength={500}
                        rows={3}
                        className="w-full rounded-md border border-gray-200 p-3 text-[13px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none resize-none bg-white transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingRating || ratingValue === 0}
                        className="rounded-md bg-gray-900 hover:bg-black text-white text-[13px] font-medium py-1.5 px-4 transition-colors disabled:opacity-50"
                      >
                        {isSubmittingRating ? 'Saving...' : 'Submit'}
                      </button>
                      {isEditingRating && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingRating(false);
                            setRatingValue(myRating?.rating || 0);
                            setRatingComment(myRating?.comment || '');
                          }}
                          className="rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 text-[13px] font-medium py-1.5 px-4 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Other reviews list */}
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">
                Recent Reviews ({ratings?.length || 0})
              </h4>
              {ratings && ratings.length > 0 ? (
                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                  {[...ratings]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((review: any) => (
                      <div key={review.id} className="text-[13px] border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {review.user?.avatarUrl ? (
                              <img src={review.user.avatarUrl} alt="Avatar" className="h-5 w-5 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <span className="material-symbols-outlined text-[12px] text-gray-400">person</span>
                              </div>
                            )}
                            <span className="font-semibold text-gray-900 tracking-tight">
                              {review.user?.fullName || 'Anonymous User'}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-1.5 pl-7">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={`material-symbols-outlined text-[12px] ${i < review.rating ? 'filled text-gray-900' : 'text-gray-200'}`}>
                              star
                            </span>
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-gray-600 pl-7">{review.comment}</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="flex flex-col gap-6 lg:col-span-4">

          {/* Action Card (Premium Dark UI) */}
          <div className="rounded-xl bg-gray-950 p-6 text-white shadow-lg relative overflow-hidden border border-gray-800">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 transition-all">
                <span className="material-symbols-outlined text-4xl text-white animate-spin mb-3">
                  sync
                </span>
                <h4 className="text-[14px] font-semibold tracking-tight text-white mb-1">AI Processing...</h4>
                <p className="text-[12px] text-gray-400">Generating insights and quizzes.</p>
              </div>
            )}

            <h3 className="mb-2 text-[15px] font-semibold tracking-tight">AI Assistant</h3>
            <p className="mb-6 text-[12px] text-gray-400 leading-relaxed">
              Unlock the full potential of this document with AI generated insights and study materials.
            </p>

            {document.isAIGenerated ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center">
                <span className="material-symbols-outlined text-2xl text-white mb-2">
                  check_circle
                </span>
                <p className="text-[13px] font-medium text-white tracking-tight">Processed Successfully</p>
                <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">Assets Ready</p>
              </div>
            ) : document.isOwner !== false ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || document.extractionStatus === 'UNSUPPORTED'}
                  title={document.extractionStatus === 'UNSUPPORTED' ? 'Unsupported format' : ''}
                  className="flex items-center justify-between rounded-md bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    Generate AI
                  </span>
                  <span className="material-symbols-outlined text-[16px] opacity-50">arrow_forward</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center">
                <span className="material-symbols-outlined text-2xl text-gray-500 mb-2">lock</span>
                <p className="text-[13px] font-medium text-gray-300">Read Only Access</p>
                <p className="text-[11px] text-gray-500 mt-1">AI generation disabled for guests.</p>
              </div>
            )}
          </div>

          {/* Document Actions Card */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              Manage Document
            </h3>

            <div className="flex flex-col gap-2.5">
              {document.deletionStatus !== 'ACTIVE' ? (
                <p className="text-[13px] text-gray-500">Not available.</p>
              ) : document.isOwner === false ? (
                <p className="text-[13px] text-gray-500">You are viewing a public document.</p>
              ) : (
                <>
                  <Link
                    href={`/dashboard/documents/${document.id}/preview`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200/80 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">preview</span>
                    Preview Document
                  </Link>

                  <button
                    onClick={handleOpenOriginal}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200/80 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Open Original URL
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    {isDownloading ? 'Downloading...' : 'Download File'}
                  </button>

                  <div className="my-2 border-t border-gray-100"></div>

                  {document.isOwner && (
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200/60 bg-white px-3 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete Document
                    </button>
                  )}

                  {/* Public Request Logic */}
                  {document.visibilityStatus === 'PRIVATE' && (
                    <div className="mt-1">
                      {!document.canRequestPublic ? (
                        <div className="group relative text-center">
                          <button disabled className="flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-400 opacity-70">
                            <span className="material-symbols-outlined text-[16px]">public</span> {publishCtaText}
                          </button>
                          <p className="mt-2 text-[11px] text-gray-500 px-2 leading-relaxed">
                            {document.publicationEligibilityReason === 'AI_ANALYSIS_UNSUPPORTED'
                              ? 'This format cannot be shared.'
                              : document.publicationEligibilityReason === 'AI_ANALYSIS_PROCESSING'
                                ? 'AI Analysis is processing...'
                                : document.publicationEligibilityReason === 'AI_ANALYSIS_FAILED'
                                  ? 'AI analysis failed.'
                                  : document.publicationEligibilityReason === 'AI_ANALYSIS_REQUIRED'
                                    ? 'Requires AI Analysis before sharing.'
                                    : document.publicationEligibilityReason === 'COPYRIGHT_SHARING_NOT_ALLOWED'
                                      ? 'Copyright prevents sharing.'
                                      : document.publicationEligibilityReason === 'COPYRIGHT_DECLARATION_REQUIRED' || document.publicationEligibilityReason === 'COPYRIGHT_METADATA_INCOMPLETE'
                                        ? 'Missing copyright declaration.'
                                        : 'Requires AI analysis & copyright.'}
                          </p>
                          {(document.publicationEligibilityReason === 'COPYRIGHT_DECLARATION_REQUIRED' || document.publicationEligibilityReason === 'COPYRIGHT_METADATA_INCOMPLETE') && (
                            <button
                              onClick={handleOpenCopyrightModal}
                              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-900 text-white px-3 py-2 text-[12px] font-medium hover:bg-black transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">copyright</span>
                              Declare Source Now
                            </button>
                          )}
                        </div>
                      ) : !document.subject ? (
                        <div className="text-center">
                          <button disabled className="flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-400 opacity-70">
                            <span className="material-symbols-outlined text-[16px]">public</span> {publishCtaText}
                          </button>
                          <p className="mt-2 text-[11px] text-gray-500">Checking subject eligibility.</p>
                        </div>
                      ) : !document.subject.isSystem ? (
                        <div className="text-center">
                          <button disabled className="flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-400 opacity-70">
                            <span className="material-symbols-outlined text-[16px]">public</span> {publishCtaText}
                          </button>
                          <p className="mt-2 text-[11px] text-gray-500">Only System Subjects can be published.</p>
                        </div>
                      ) : (
                        <button
                          onClick={handleRequestPublic}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-900 bg-white px-3 py-2 text-[13px] font-medium text-gray-900 transition-colors hover:bg-gray-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">public</span>
                          {publishCtaText}
                        </button>
                      )}
                    </div>
                  )}

                  {document.visibilityStatus === 'PUBLIC' && (
                    <div className="mt-1">
                      <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-200/60 bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
                      >
                        <span className="material-symbols-outlined text-[16px]">public_off</span>
                        Withdraw from Explore
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Copyright Section (Owner Only) */}
          {document.isOwner && (
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">copyright</span>
                Copyright Status
              </h3>

              {!document.copyrightSourceType ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[12.5px] text-gray-500 leading-relaxed">
                    Declaration required before sharing publicly.
                  </p>
                  <button
                    onClick={handleOpenCopyrightModal}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Declare Source
                  </button>
                </div>
              ) : (document.copyrightSourceType === 'UNKNOWN') ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 rounded-md bg-gray-50 p-3 border border-gray-200/80">
                    <span className="material-symbols-outlined text-[16px] text-gray-400 shrink-0">lock</span>
                    <p className="text-[12px] text-gray-600">
                      Private document. Update source to share.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCopyrightModal}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Update Source
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 rounded-md bg-gray-50 p-3 border border-gray-200/80">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">check_circle</span>
                    <div className="text-[12px]">
                      <p className="font-semibold text-gray-900">Valid Declaration</p>
                      <p className="text-gray-500 mt-0.5">
                        {document.copyrightSourceType === 'OWN_ORIGINAL' ? 'Self-compiled' : 'Open source'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenCopyrightModal}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit details
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tags Card */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {document.tags && document.tags.length > 0 ? (
                document.tags.map((t: any) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 border border-gray-200/50"
                  >
                    {t.name}
                  </span>
                ))
              ) : (
                <span className="text-[12.5px] text-gray-400 italic">No tags</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
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

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="mb-2 text-[16px] font-semibold tracking-tight text-gray-900">Withdraw Document</h3>
            <p className="mb-6 text-[13px] text-gray-500 leading-relaxed">
              Remove this document from Explore? It will return to PRIVATE status.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                disabled={isWithdrawing}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawPublic}
                disabled={isWithdrawing}
                className="rounded-md bg-red-600 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50 shadow-sm transition-colors"
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <span className="material-symbols-outlined text-[20px]">report</span>
              <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">Report Document</h3>
            </div>
            <p className="mb-5 text-[12px] text-gray-500">
              Help us keep the community clean. Select a reason below.
            </p>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-md border border-gray-200 p-2 text-[13px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none bg-white"
                >
                  <option value="INCORRECT_CONTENT">Incorrect content / Misinformation</option>
                  <option value="WRONG_SUBJECT">Wrong subject</option>
                  <option value="OUTDATED_SYLLABUS">Outdated syllabus</option>
                  <option value="DUPLICATED_DOCUMENT">Duplicate document</option>
                  <option value="FILE_ERROR">File error</option>
                  <option value="LOW_QUALITY">Low quality</option>
                  <option value="SPAM">Spam</option>
                  <option value="COPYRIGHT_VIOLATION">Copyright violation</option>
                  <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Details (Optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Additional information..."
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-md border border-gray-200 p-2.5 text-[13px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsReportModalOpen(false); setReportDescription(''); }}
                  disabled={isSubmittingReport}
                  className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-black transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copyright Modal */}
      {document.isOwner && isCopyrightModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isSubmittingCopyright && setIsCopyrightModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="mb-5 flex items-center gap-2 text-gray-900 border-b border-gray-100 pb-3">
              <span className="material-symbols-outlined text-[20px]">copyright</span>
              <h3 className="text-[15px] font-semibold tracking-tight">Copyright Declaration</h3>
            </div>
            <form onSubmit={handleSubmitCopyright} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Source Type</label>
                <select
                  value={copyrightSourceType}
                  onChange={(e) => setCopyrightSourceType(e.target.value)}
                  className="w-full rounded-md border border-gray-200 p-2.5 text-[13px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none bg-white"
                >
                  <option value="UNKNOWN">Unknown source</option>
                  <option value="OWN_ORIGINAL">My original document</option>
                  <option value="OPEN_LICENSE">Open license document</option>
                </select>
              </div>
              {copyrightSourceType === 'OWN_ORIGINAL' && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-2.5 text-[12px] text-gray-600 italic">
                  I confirm this document was authored by me.
                </div>
              )}
              {copyrightSourceType === 'OPEN_LICENSE' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Source URL</label>
                    <input type="url" value={copyrightSourceUrl} onChange={(e) => setCopyrightSourceUrl(e.target.value)} required placeholder="https://..." className="w-full rounded-md border border-gray-200 p-2.5 text-[13px] focus:border-gray-900 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">License</label>
                      <input type="text" value={copyrightLicense} onChange={(e) => setCopyrightLicense(e.target.value)} required placeholder="MIT, CC BY..." className="w-full rounded-md border border-gray-200 p-2.5 text-[13px] focus:border-gray-900 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Author</label>
                      <input type="text" value={copyrightAttribution} onChange={(e) => setCopyrightAttribution(e.target.value)} required placeholder="Name..." className="w-full rounded-md border border-gray-200 p-2.5 text-[13px] focus:border-gray-900 outline-none" />
                    </div>
                  </div>
                </>
              )}
              {copyrightSourceType === 'UNKNOWN' && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-2.5 text-[12px] text-gray-600 italic">
                  Cannot be shared publicly.
                </div>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsCopyrightModalOpen(false)} disabled={isSubmittingCopyright} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmittingCopyright} className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-black transition-colors shadow-sm disabled:opacity-50">{isSubmittingCopyright ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastNotification toasts={toasts} />
    </div>
  );
}

type ToastVariant = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; variant: ToastVariant; }
function ToastNotification({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[110] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex max-w-[320px] items-center gap-3 rounded-lg px-4 py-3 text-[13px] font-medium text-white shadow-lg transition-all duration-300 ${t.variant === 'success' ? 'bg-gray-900' : t.variant === 'error' ? 'bg-red-600' : 'bg-gray-700'}`}>
          {t.variant === 'success' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
          {t.variant === 'error' && <span className="material-symbols-outlined text-[18px]">error</span>}
          {t.variant === 'info' && <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>}
          {t.message}
        </div>
      ))}
    </div>
  );
}