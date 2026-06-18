'use client';

import React from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';
import DeleteDocumentModal from '@/components/documents/DeleteDocumentModal';

export default function DocumentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | undefined>();

  const {
    data: response,
    error,
    isLoading,
  } = useSWR(id ? `/documents/${id}` : null, () => documentsApi.getDocumentById(id));

  const document = response?.data;

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

  const truncatedText = document.fullText
    ? document.fullText.length > 3000
      ? document.fullText.substring(0, 3000) + '...'
      : document.fullText
    : 'No text content available for this document.';

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
              className={`rounded px-2.5 py-1 text-xs font-bold uppercase ${
                document.status === 'APPROVED'
                  ? 'bg-green-100 text-green-700'
                  : document.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : document.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-200 text-gray-700'
              }`}
            >
              {document.status}
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

        <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
          <button
            onClick={() => router.push(`/dashboard/documents/${document.id}/edit`)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit
          </button>

          <a
            href={document.fileUrl || document.previewUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Original
          </a>

          <Link
            href={`/dashboard/documents/${document.id}/preview`}
            className="flex items-center gap-2 rounded-lg bg-[#1a1c23] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-black"
          >
            <span className="material-symbols-outlined text-[18px]">preview</span>
            Preview
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (Main Content) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <span className="material-symbols-outlined text-gray-400">text_snippet</span>
                Extracted Text / Description
              </h2>
            </div>

            {document.description && (
              <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-bold text-gray-700">Description</h3>
                <p className="text-sm text-gray-600">{document.description}</p>
              </div>
            )}

            <div className="prose prose-sm max-w-none leading-relaxed text-gray-600">
              <p className="whitespace-pre-wrap">{truncatedText}</p>
            </div>

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
                  {(document as any).summaries?.length || 0}
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
          {/* Tags Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase">
              Study Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {document.tags && document.tags.length > 0 ? (
                document.tags.map((t: any) => (
                  <span
                    key={t.tag.id}
                    className="inline-flex items-center rounded-full bg-[#1a1c23] px-3 py-1 text-xs font-medium text-white"
                  >
                    {t.tag.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No tags</span>
              )}
            </div>
          </div>

          {/* Action Card matching "AI Assistant" dark styling */}
          <div className="rounded-2xl bg-[#1a1c23] p-6 text-white shadow-md">
            <h3 className="mb-2 text-xl font-bold">Document Actions</h3>
            <p className="mb-6 text-sm text-gray-400">
              What would you like to do with this document today?
            </p>

            <div className="flex flex-col gap-3">
              <button className="flex items-center justify-between rounded-xl bg-[#2a2c35] px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-gray-700">
                Generate Quiz
                <span className="material-symbols-outlined text-[18px] text-gray-400">
                  chevron_right
                </span>
              </button>
              <button className="flex items-center justify-between rounded-xl bg-[#2a2c35] px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-gray-700">
                Create Flashcards
                <span className="material-symbols-outlined text-[18px] text-gray-400">
                  chevron_right
                </span>
              </button>
              <button className="flex items-center justify-between rounded-xl bg-[#2a2c35] px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-gray-700">
                Ask a Question
                <span className="material-symbols-outlined text-[18px] text-gray-400">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* System Info Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase">
              System Info
            </h3>
            <div className="flex flex-col gap-3 text-sm">
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
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Delete Document
              </button>
            </div>
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
    </div>
  );
}
