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
      addToast('Processing request...', 'info');
      await documentsApi.requestDocumentPublic(id);
      addToast('Public review request submitted.', 'success');
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
          title: 'PDF successfully extracted',
          icon: 'check_circle',
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          detail: document.pageCount ? `Document contains ${document.pageCount} pages.` : '',
        };
      case 'FAILED':
        return {
          title: 'Failed to extract text from this document.',
          icon: 'error',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          detail: 'You can still view the original PDF.',
        };
      case 'PENDING':
        return {
          title: 'Document is being processed.',
          icon: 'hourglass_empty',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          detail: 'Please check back in a few minutes.',
        };
      default:
        return {
          title: 'No extraction info available.',
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

      {/* Moderation Warning Alert */}
      {document.status === 'UNDER_REVIEW' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-yellow-600 shrink-0 mt-0.5">warning</span>
          <div>
            <h4 className="font-bold text-yellow-900">Document Under Review</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This document has received multiple user reports and is currently being moderated.
              {document.moderationWarning && ` Detailed reason: ${document.moderationWarning}`}
            </p>
          </div>
        </div>
      )}

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
            <>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100"
              >
                <span className="material-symbols-outlined text-[18px]">report</span>
                Report
              </button>

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
            </>
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
                        View Original PDF
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

          {/* Rating Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-amber-500">star</span>
              Document Reviews
            </h3>

            {/* Average Rating Summary */}
            <div className="mb-6 flex items-center gap-3 bg-amber-50/50 rounded-xl p-4 border border-amber-100 max-w-sm">
              <div className="text-3xl font-extrabold text-amber-600">
                {document.averageRating ? document.averageRating.toFixed(1) : '0.0'}
              </div>
              <div>
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[18px] ${i < Math.round(document.averageRating || 0) ? 'filled text-amber-500' : 'text-gray-300'}`}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {document.ratingCount || 0} reviews
                </p>
              </div>
            </div>

            {/* User review form (only if not owner) */}
            {document.isOwner === false && (
              <div className="mb-6 border-b border-gray-100 pb-6">
                {myRating && !isEditingRating ? (
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 max-w-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Your review
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditingRating(true)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleDeleteRating}
                          className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="flex mb-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[16px] ${i < myRating.rating ? 'filled text-amber-500' : 'text-gray-300'}`}>
                          star
                        </span>
                      ))}
                    </div>
                    {myRating.comment ? (
                      <p className="text-sm text-gray-600 italic">"{myRating.comment}"</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No comment</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRating} className="space-y-4 max-w-xl">
                    <h4 className="text-sm font-bold text-gray-700">
                      {isEditingRating ? 'Update Review' : 'Write a new review'}
                    </h4>
                    {/* Star Picker */}
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
                            <span className={`material-symbols-outlined text-[28px] ${isHighlighted ? 'filled text-amber-500' : 'text-gray-300'}`}>
                              star
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Comment Input */}
                    <div>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Write a short review (max 500 characters)..."
                        maxLength={500}
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingRating || ratingValue === 0}
                        className="flex-1 max-w-[150px] rounded-lg bg-[#1a1c23] hover:bg-black text-white text-xs font-semibold py-2 px-3 shadow transition-colors disabled:opacity-50"
                      >
                        {isSubmittingRating ? 'Submitting...' : 'Submit review'}
                      </button>
                      {isEditingRating && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingRating(false);
                            setRatingValue(myRating?.rating || 0);
                            setRatingComment(myRating?.comment || '');
                          }}
                          className="rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 px-3 transition-colors"
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
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">
                Recent reviews ({ratings?.length || 0})
              </h4>
              {ratings && ratings.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {/* Sort by createdAt descending and take 5 most recent */}
                  {[...ratings]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((review: any) => (
                      <div key={review.id} className="text-sm border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {review.user?.avatarUrl ? (
                              <img
                                src={review.user.avatarUrl}
                                alt={review.user.fullName || 'User'}
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-[18px] text-gray-400">
                                account_circle
                              </span>
                            )}
                            <span className="font-semibold text-gray-800">
                              {review.user?.fullName || 'User'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={`material-symbols-outlined text-[14px] ${i < review.rating ? 'filled text-amber-500' : 'text-gray-300'}`}>
                              star
                            </span>
                          ))}
                        </div>
                        {review.comment ? (
                          <p className="text-gray-600 text-xs whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-gray-400 italic text-[11px]">No comment.</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-4">
                  No reviews yet for this document.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="flex flex-col gap-6">
          {/* Actions Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase">
              Document Actions
            </h3>

            <div className="flex flex-col gap-3">
              {document.deletionStatus !== 'ACTIVE' ? (
                <p className="text-sm text-gray-500">This document is no longer available for this action.</p>
              ) : document.isOwner === false ? (
                <p className="text-sm text-gray-500">You do not have permission to perform actions on this document.</p>
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

                  {document.isOwner && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      {isAnalyzing ? 'Analyzing AI...' : 'Analyze with AI'}
                    </button>
                  )}

                  {/* System Info Card */}
                  {document.isOwner && (
                    <div className="border-gray-100 pt-3">
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        Delete Document
                      </button>
                    </div>
                  )}

                  {document.visibilityStatus === 'PRIVATE' && (
                    <div className="mt-2 border-t border-gray-100 pt-3">
                      {document.extractionStatus !== 'READY' ? (
                        <div className="group relative">
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">public</span> Request Public
                          </button>
                          <p className="mt-1.5 text-xs text-red-500 text-center">PDF extraction must be successful before submitting for review.</p>
                        </div>
                      ) : !document.subject ? (
                        <div className="group relative">
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">public</span> Request Public
                          </button>
                          <p className="mt-1.5 text-xs text-gray-500 text-center">Checking subject eligibility.</p>
                        </div>
                      ) : !document.subject.isSystem ? (
                        <div className="group relative">
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">public</span> Request Public
                          </button>
                          <p className="mt-1.5 text-xs text-red-500 text-center">Only System Subjects can be submitted for public review.</p>
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
              Are you sure you want to withdraw this document from Explore? It will return to PRIVATE status.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                disabled={isWithdrawing}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawPublic}
                disabled={isWithdrawing}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isWithdrawing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal Popup */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined text-2xl">report</span>
              <h3 className="text-xl font-bold text-gray-900">Report Document</h3>
            </div>

            <p className="mb-4 text-xs text-gray-500">
              Please select the reason for reporting this document. Accurate reports help build a healthy learning community.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Reason for report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="INCORRECT_CONTENT">Incorrect content / Misinformation</option>
                  <option value="WRONG_SUBJECT">Wrong subject</option>
                  <option value="OUTDATED_SYLLABUS">Outdated syllabus</option>
                  <option value="DUPLICATED_DOCUMENT">Duplicate document</option>
                  <option value="FILE_ERROR">File error (cannot open, blurry, etc.)</option>
                  <option value="LOW_QUALITY">Low quality</option>
                  <option value="SPAM">Spam / Advertising</option>
                  <option value="COPYRIGHT_VIOLATION">Copyright violation</option>
                  <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Detailed description (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe the issue in detail (max 500 characters)..."
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportDescription('');
                  }}
                  disabled={isSubmittingReport}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingReport ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
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
