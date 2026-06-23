'use client';

import React from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';

export default function DocumentPreviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data: response, error, isLoading } = useSWR(
    id ? `/documents/${id}` : null,
    () => documentsApi.getDocumentById(id)
  );

  const document = response;

  const formatSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Access Denied / Not Found</h2>
        <p className="mb-6 text-gray-500">You do not have permission to view this document or it does not exist.</p>
        <Link
          href="/dashboard/documents"
          className="rounded-lg bg-[#1a1c23] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-black"
        >
          Back to My Documents
        </Link>
      </div>
    );
  }

  const iframeSrc = document.previewUrl || document.fileUrl;

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row bg-[#F8F9FA] overflow-hidden font-sans">
      
      {/* Left Column (Preview Area) */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-white">
        
        {/* Header inside Preview */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(`/dashboard/documents/${document.id}`)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="font-semibold text-gray-900 truncate max-w-sm sm:max-w-md lg:max-w-lg" title={document.title}>
                {document.title}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>{document.fileType.split('/')[1] || document.fileType}</span>
                <span>•</span>
                <span>{formatSize(document.fileSize)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={iframeSrc || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Open Original
            </a>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 bg-gray-100 relative p-4 lg:p-8 overflow-hidden">
          {iframeSrc ? (
            <div className="h-full w-full rounded-lg shadow-sm border border-gray-200 bg-white overflow-hidden">
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
              <p className="mb-6 text-sm text-gray-500 max-w-sm">
                This file type cannot be previewed directly in the browser, or the preview URL is missing.
              </p>
              <a
                href={document.fileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download / Open Original
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Metadata / Assistant) */}
      <div className="flex w-full lg:w-[350px] xl:w-[400px] flex-col overflow-y-auto bg-white">
        <div className="flex border-b border-gray-200">
          <button className="flex-1 border-b-2 border-gray-900 py-4 text-sm font-semibold text-gray-900 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Metadata
          </button>
         
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Metadata Card */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Document Info</h3>
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Status</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded uppercase ${
                  document.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  document.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  document.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {document.status}
                </span>
              </div>
              
              <div>
                <p className="text-gray-500 mb-1">File Type</p>
                <p className="font-medium text-gray-900">{document.fileType}</p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Size</p>
                <p className="font-medium text-gray-900">{formatSize(document.fileSize)}</p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Uploaded At</p>
                <p className="font-medium text-gray-900">{formatDate(document.createdAt)}</p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">AI Generated</p>
                <p className="font-medium text-gray-900">{document.isAIGenerated ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

         

        </div>
      </div>
    </div>
  );
}
