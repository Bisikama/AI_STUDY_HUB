'use client';

import React from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';
import { getCleanFileType } from '@/utils/fileUtils';
import { getVisibilityPresentation } from '@/utils/visibility-status';
import { toast } from 'sonner';

export default function DocumentPreviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    data: response,
    error: docError,
    isLoading: isDocLoading,
  } = useSWR(id ? `/documents/${id}` : null, () => documentsApi.getDocumentById(id));

  const document = response;

  const [previewData, setPreviewData] = React.useState<{ url: string; disposition: string } | null>(
    null,
  );
  const [previewError, setPreviewError] = React.useState<{
    status: number;
    message: string;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    if (id) {
      setIsPreviewLoading(true);
      documentsApi
        .getPreviewSignedUrl(id)
        .then((data) => {
          if (isMounted) {
            setPreviewData(data);
            setIsPreviewLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setPreviewError({
              status: err.response?.status || 500,
              message: err.response?.data?.message || 'Failed to load preview',
            });
            setIsPreviewLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleOpenOriginal = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const data = await documentsApi.getPreviewSignedUrl(id);
      window.open(data.url, '_blank', 'noopener,noreferrer');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(`Could not open original file: ${err.response?.data?.message || err.message}`);
    }
  };

  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDownloading(true);
    try {
      const data = await documentsApi.getDownloadSignedUrl(id);
      const a = window.document.createElement('a');
      a.href = data.url;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(`Could not download file: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isDocLoading || isPreviewLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAFAFA]">
        <span className="material-symbols-outlined animate-spin text-3xl text-gray-400 mb-3">sync</span>
        <p className="text-[13px] font-medium text-gray-500 animate-pulse">Preparing document...</p>
      </div>
    );
  }

  if (docError || !document || previewError) {
    const status = previewError?.status;
    let title = 'Document Not Available';
    let message = 'This document cannot be previewed at this time.';

    if (status === 401) {
      title = 'Login Required';
      message = 'You must be logged in to preview this document.';
    } else if (status === 403) {
      title = 'Access Denied';
      message = 'You do not have permission to view this document.';
    } else if (status === 404) {
      title = 'Not Found';
      message = 'This document does not exist.';
    } else if (status === 409) {
      title = 'Document Not Active';
      message = 'This document is currently inactive, soft-deleted, or unavailable for preview.';
    } else if (status === 502) {
      title = 'Preview Generation Failed';
      message =
        'We could not generate a temporary preview URL at this time. Please try again later.';
    }

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAFAFA] p-8 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{title}</h2>
        <p className="mb-6 text-[13px] text-gray-500 max-w-sm leading-relaxed">{message}</p>
        <Link
          href="/dashboard/documents"
          className="rounded-md bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  const iframeSrc = previewData?.url;

  const isNativePreviewSupported = (fileType: string) => {
    if (!fileType) return false;
    const type = fileType.toLowerCase();
    return (
      type === 'application/pdf' ||
      type === 'text/plain' ||
      type.startsWith('image/') ||
      type.startsWith('audio/') ||
      type.startsWith('video/')
    );
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#FAFAFA] font-sans lg:flex-row text-gray-900">
      {/* Left Column (Preview Area) */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200/80 bg-white shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">

        {/* Minimal Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 px-4 py-3 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dashboard/documents/${document.id}`)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Go Back"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1
                className="max-w-[200px] truncate text-[14px] font-semibold tracking-tight text-gray-900 sm:max-w-md lg:max-w-lg"
                title={document.title}
              >
                {document.title}
              </h1>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                <span>{getCleanFileType(document.fileType)}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-gray-400"></span>
                <span>{formatSize(document.fileSize)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenOriginal}
              className="hidden items-center gap-1.5 rounded-md border border-gray-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 sm:flex"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Open Original
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="hidden items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-black disabled:opacity-50 sm:flex"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              {isDownloading ? '...' : 'Download'}
            </button>
          </div>
        </div>

        {/* Iframe Container - Floating Paper Effect */}
        <div className="relative flex-1 overflow-hidden bg-[#F4F5F7] p-4 lg:p-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] flex flex-col items-center">
          {iframeSrc && isNativePreviewSupported(document.fileType) ? (
            <div className="h-full w-full max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all">
              <iframe
                src={iframeSrc}
                className="h-full w-full border-none"
                title={`Preview of ${document.title}`}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-full w-full max-w-2xl flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-100">
                <span className="material-symbols-outlined text-[24px]">visibility_off</span>
              </div>
              <h3 className="mb-1 text-[15px] font-semibold text-gray-900 tracking-tight">Preview Not Available</h3>
              <p className="mb-6 max-w-sm text-[13px] text-gray-500 leading-relaxed">
                This file format cannot be previewed natively in the browser. Please download it to view the contents.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleOpenOriginal}
                  className="flex items-center gap-1.5 rounded-md border border-gray-200/80 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  External View
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-black disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  {isDownloading ? 'Downloading...' : 'Download File'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Properties Panel) */}
      <div className="flex w-full flex-col overflow-y-auto bg-[#FAFAFA] lg:w-[320px] xl:w-[360px]">

        {/* Properties Header */}
        <div className="flex border-b border-gray-200/80 bg-white px-5 pt-4">
          <div className="border-b-2 border-gray-900 pb-3 text-[13px] font-semibold text-gray-900 tracking-tight flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Properties
          </div>
        </div>

        {/* Property List (Key-Value Pairs like Notion) */}
        <div className="flex flex-col p-5">
          {/* Tối ưu UI: Metadata Card */}
          <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden mb-5">

            {/* Tiêu đề Block */}
            <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200/80">
              <h3 className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
                Document Metadata
              </h3>
            </div>

            {/* Danh sách thuộc tính */}
            <div className="flex flex-col px-4 py-1">

              {/* Status */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
                <span className="text-[12.5px] text-gray-500 font-medium shrink-0">Visibility</span>
                <span className={`inline-flex rounded text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0 ${getVisibilityPresentation(document.visibilityStatus).className}`}>
                  {getVisibilityPresentation(document.visibilityStatus).label}
                </span>
              </div>

              {/* File Type (Đã fix lỗi string dài) */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
                <span className="text-[12.5px] text-gray-500 font-medium shrink-0">Format</span>
                <span
                  className="text-[11px] font-mono font-semibold tracking-wide text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 truncate max-w-[140px] text-right"
                  title={document.fileType} // Hover vào sẽ thấy tên đầy đủ
                >
                  {getCleanFileType(document.fileType)}
                </span>
              </div>

              {/* Size */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
                <span className="text-[12.5px] text-gray-500 font-medium shrink-0">Size</span>
                <span className="text-[12.5px] font-semibold text-gray-900 truncate">
                  {formatSize(document.fileSize)}
                </span>
              </div>

              {/* Pages */}
              {document.pageCount && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
                  <span className="text-[12.5px] text-gray-500 font-medium shrink-0">Pages</span>
                  <span className="text-[12.5px] font-semibold text-gray-900 truncate">
                    {document.pageCount}
                  </span>
                </div>
              )}

              {/* Upload Date (Đã fix lỗi rớt dòng, căn ngang hàng) */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
                <span className="text-[12.5px] text-gray-500 font-medium shrink-0">Uploaded At</span>
                <span className="text-[12.5px] font-semibold text-gray-900 truncate text-right">
                  {formatDate(document.createdAt)}
                </span>
              </div>

              {/* AI Status */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
                <span className="text-[12.5px] text-gray-500 font-medium shrink-0">AI Processing</span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-900 shrink-0 truncate">
                  {document.aiStatus === 'READY' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></span>
                  ) : document.aiStatus === 'FAILED' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]"></span>
                  )}
                  {document.aiStatus || 'NOT_REQUESTED'}
                </span>
              </div>

              {/* Extraction Status */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
                <span className="text-[12.5px] text-gray-500 font-medium shrink-0">Text Extraction</span>
                <span className="text-[12.5px] font-semibold text-gray-900 truncate text-right">
                  {document.extractionStatus || '—'}
                </span>
              </div>

            </div>
          </div>

          {/* Optional Description Card */}
          {document.description && (
            <div className="mt-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Notes / Description
              </h3>
              <p className="text-[13px] leading-relaxed text-gray-700">
                {document.description}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}