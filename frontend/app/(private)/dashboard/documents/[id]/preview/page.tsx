'use client';

import React from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';
import { getVisibilityPresentation } from '@/utils/visibility-status';

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
      alert(`Could not open original file: ${err.response?.data?.message || err.message}`);
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
    } catch (err: any) {
      alert(`Could not download file: ${err.response?.data?.message || err.message}`);
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
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
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
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mb-6 text-gray-500">{message}</p>
        <Link
          href="/dashboard/documents"
          className="rounded-lg bg-[#1a1c23] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-black"
        >
          Back to My Documents
        </Link>
      </div>
    );
  }

  const iframeSrc = previewData?.url;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F8F9FA] font-sans lg:flex-row">
      {/* Left Column (Preview Area) */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-white">
        {/* Header inside Preview */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/dashboard/documents/${document.id}`)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1
                className="max-w-sm truncate font-semibold text-gray-900 sm:max-w-md lg:max-w-lg"
                title={document.title}
              >
                {document.title}
              </h1>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                <span>{document.fileType.split('/')[1] || document.fileType}</span>
                <span>•</span>
                <span>{formatSize(document.fileSize)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenOriginal}
              className="hidden items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:flex"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Open Original
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="hidden items-center gap-2 rounded-lg bg-[#1a1c23] px-4 py-2 font-medium text-white transition-colors hover:bg-black disabled:opacity-50 sm:flex"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="relative flex-1 overflow-hidden bg-gray-100 p-4 lg:p-8">
          {iframeSrc ? (
            <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <iframe
                src={iframeSrc}
                className="h-full w-full border-none"
                title={`Preview of ${document.title}`}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <span className="material-symbols-outlined text-3xl">visibility_off</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">No Preview Available</h3>
              <p className="mb-6 max-w-sm text-sm text-gray-500">
                This file type cannot be previewed directly in the browser, or the preview URL is
                missing.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleOpenOriginal}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Open Original
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-primary flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  {isDownloading ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Metadata / Assistant) */}
      <div className="flex w-full flex-col overflow-y-auto bg-white lg:w-[350px] xl:w-[400px]">
        <div className="flex border-b border-gray-200">
          <button className="flex flex-1 items-center justify-center gap-2 border-b-2 border-gray-900 py-4 text-sm font-semibold text-gray-900">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Metadata
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Metadata Card */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <h3 className="mb-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
              Document Info
            </h3>
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="mb-1 text-gray-500">Status</p>
                <span
                  className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase ${getVisibilityPresentation(document.visibilityStatus).className}`}
                >
                  {getVisibilityPresentation(document.visibilityStatus).label}
                </span>
              </div>

              <div>
                <p className="mb-1 text-gray-500">File Type</p>
                <p className="font-medium text-gray-900">{document.fileType}</p>
              </div>

              <div>
                <p className="mb-1 text-gray-500">Size</p>
                <p className="font-medium text-gray-900">{formatSize(document.fileSize)}</p>
              </div>

              <div>
                <p className="mb-1 text-gray-500">Uploaded At</p>
                <p className="font-medium text-gray-900">{formatDate(document.createdAt)}</p>
              </div>

              {document.description && (
                <div>
                  <p className="mb-1 text-gray-500">Description</p>
                  <p className="font-medium text-gray-900">{document.description}</p>
                </div>
              )}

              <div>
                <p className="mb-1 text-gray-500">AI Status</p>
                <p className="font-medium text-gray-900">{document.aiStatus || '—'}</p>
              </div>

              <div>
                <p className="mb-1 text-gray-500">Extraction</p>
                <p className="font-medium text-gray-900">{document.extractionStatus || '—'}</p>
              </div>

              <div>
                <p className="mb-1 text-gray-500">Pages</p>
                <p className="font-medium text-gray-900">{document.pageCount || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
