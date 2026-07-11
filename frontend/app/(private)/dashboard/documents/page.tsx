'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { documentsApi, Document, StorageSummary } from '@/services/documentsApi';
import { personalFoldersApi, PersonalFolder } from '@/services/personalFoldersApi';

const FOLLOWED_DOCUMENT_IDS_STORAGE_KEY = 'studyhub_followed_document_ids';
const FOLLOWED_DOCUMENTS_STORAGE_KEY = 'studyhub_followed_documents';

type FollowedExploreDocument = {
  id: string;
  title: string;
  description: string | null;
  subject: {
    id: number;
    name: string;
    code: string;
  } | null;
  fileType: string;
  fileSize: string;
  downloadCount: number;
  viewCount: number;
  quizCount: number;
  hasSummary: boolean;
  createdAt: string;
};

type DisplayDocument = Omit<Partial<Document>, 'subjectId' | 'subject'> & {
  id: string;
  title: string;
  fileSize: number;
  fileSizeBytes?: number | null;
  fileType: string;
  createdAt: string;
  subjectId?: number | string | null;
  subject?: {
    id?: number | string;
    name?: string;
    code?: string;
  } | null;
  tags?: Array<{
    tag: {
      id: string | number;
      name: string;
    };
  }>;
  isAIGenerated?: boolean;
  isFollowed?: boolean;
  isLocalFollowed?: boolean;
};

function readFollowedDocumentsFromStorage(): DisplayDocument[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedDocs = window.localStorage.getItem(FOLLOWED_DOCUMENTS_STORAGE_KEY);
    const parsedDocs = storedDocs ? (JSON.parse(storedDocs) as FollowedExploreDocument[]) : [];

    if (!Array.isArray(parsedDocs)) {
      return [];
    }

    return parsedDocs.map((doc) => {
      const fileSizeNumber = Number(doc.fileSize);

      return {
        id: doc.id,
        title: doc.title,
        fileSize: Number.isNaN(fileSizeNumber) ? 0 : fileSizeNumber,
        fileSizeBytes: Number.isNaN(fileSizeNumber) ? 0 : fileSizeNumber,
        fileType: doc.fileType || 'application/pdf',
        createdAt: doc.createdAt,
        subject: doc.subject
          ? {
              id: doc.subject.id,
              name: doc.subject.name,
              code: doc.subject.code,
            }
          : null,
        subjectId: doc.subject?.id ?? null,
        isAIGenerated: false,
        isFollowed: true,
        isLocalFollowed: true,
        tags: [],
      };
    });
  } catch (err) {
    console.error('Failed to read followed documents:', err);
    return [];
  }
}

function removeFollowedDocumentFromStorage(documentId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storedIds = window.localStorage.getItem(FOLLOWED_DOCUMENT_IDS_STORAGE_KEY);
    const parsedIds = storedIds ? (JSON.parse(storedIds) as string[]) : [];
    const safeIds = Array.isArray(parsedIds) ? parsedIds : [];
    const nextIds = safeIds.filter((id) => id !== documentId);

    const storedDocs = window.localStorage.getItem(FOLLOWED_DOCUMENTS_STORAGE_KEY);
    const parsedDocs = storedDocs ? (JSON.parse(storedDocs) as FollowedExploreDocument[]) : [];
    const safeDocs = Array.isArray(parsedDocs) ? parsedDocs : [];
    const nextDocs = safeDocs.filter((doc) => doc.id !== documentId);

    window.localStorage.setItem(FOLLOWED_DOCUMENT_IDS_STORAGE_KEY, JSON.stringify(nextIds));
    window.localStorage.setItem(FOLLOWED_DOCUMENTS_STORAGE_KEY, JSON.stringify(nextDocs));

    window.dispatchEvent(
      new CustomEvent('studyhub-followed-documents-change', {
        detail: {
          followedDocumentIds: nextIds,
          followedDocuments: nextDocs,
        },
      }),
    );
  } catch (err) {
    console.error('Failed to remove followed document:', err);
  }
}

function calculateStorageAnalysis(documents: DisplayDocument[]) {
  let pdfSize = 0;
  let noSizeCount = 0;
  let pdfDocsCount = 0;

  documents.forEach((doc) => {
    const type = (doc.fileType || '').toLowerCase();
    const isPdf = type.includes('pdf') || type === '';

    if (isPdf) {
      pdfDocsCount += 1;
      const rawSize = doc.fileSizeBytes !== undefined ? doc.fileSizeBytes : doc.fileSize;
      const size = Number(rawSize);

      if (!Number.isFinite(size) || size <= 0) {
        noSizeCount += 1;
      } else {
        pdfSize += size;
      }
    }
  });

  return { pdfSize, noSizeCount, pdfDocsCount };
}

function formatSize(bytes: unknown): string {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function getDocumentSize(doc: DisplayDocument) {
  return doc.fileSizeBytes !== undefined && doc.fileSizeBytes !== null
    ? doc.fileSizeBytes
    : doc.fileSize;
}

function getSubjectLabel(doc: DisplayDocument) {
  if (doc.subject?.code && doc.subject?.name) {
    return `${doc.subject.code} - ${doc.subject.name}`;
  }

  if (doc.subject?.name) {
    return doc.subject.name;
  }

  return `SUB-${doc.subjectId ?? 'GEN'}`;
}

function Interactive3DCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className: string;
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}

export default function MyDocumentsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localFollowedDocuments, setLocalFollowedDocuments] = useState<DisplayDocument[]>(() =>
    readFollowedDocumentsFromStorage(),
  );
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unfiled' | null>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data: foldersResponse } = useSWR('/personal-folders', () =>
    personalFoldersApi.getFolders(),
  );
  const folders: PersonalFolder[] = Array.isArray(foldersResponse) ? foldersResponse : [];

  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR(['/documents/me', activeFolderId, activeFilter], () =>
    documentsApi.getMyDocuments({
      folderId: activeFolderId || undefined,
      unfiled: activeFilter === 'unfiled' ? true : undefined,
    }),
  );

  const { data: storageSummary } = useSWR<StorageSummary>('/documents/me/storage-summary', () =>
    documentsApi.getStorageSummary(),
  );

  useEffect(() => {
    const syncFollowedDocuments = () => {
      setLocalFollowedDocuments(readFollowedDocumentsFromStorage());
    };

    syncFollowedDocuments();

    window.addEventListener('storage', syncFollowedDocuments);
    window.addEventListener('studyhub-followed-documents-change', syncFollowedDocuments);

    return () => {
      window.removeEventListener('storage', syncFollowedDocuments);
      window.removeEventListener('studyhub-followed-documents-change', syncFollowedDocuments);
    };
  }, []);

  const documents = useMemo<DisplayDocument[]>(() => {
    const rawDocs = Array.isArray(response) ? response : response?.data || [];
    const ownedDocuments = (rawDocs as DisplayDocument[]).map((doc) => ({
      ...doc,
      isLocalFollowed: false,
    }));

    const ownedDocumentIds = new Set(ownedDocuments.map((doc) => doc.id));

    const followedDocumentsNotInOwnedList = localFollowedDocuments.filter(
      (doc) => !ownedDocumentIds.has(doc.id),
    );

    return [...ownedDocuments, ...followedDocumentsNotInOwnedList];
  }, [response, localFollowedDocuments]);

  const storageAnalysis = useMemo(() => calculateStorageAnalysis(documents), [documents]);

  const handleUnfollowDocument = async (doc: DisplayDocument) => {
    const confirmed = confirm('Unfollow this document?');

    if (!confirmed) {
      return;
    }

    try {
      removeFollowedDocumentFromStorage(doc.id);
      setLocalFollowedDocuments(readFollowedDocumentsFromStorage());

      if (!doc.isLocalFollowed) {
        await documentsApi.unfollowDocument(doc.id);
        mutate();
      }
    } catch (err) {
      console.error('Failed to unfollow:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-5xl text-gray-800">
            sync
          </span>
          <p className="animate-pulse text-sm font-medium text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 p-8">
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-6 py-4 text-red-600 shadow-sm">
          <span className="material-symbols-outlined text-2xl">error</span>
          <span className="font-medium">Failed to load documents. Please try refreshing.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans">
      {isSidebarOpen && (
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-white p-5 md:flex">
          <div>
            <h2 className="mb-3 px-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Library
            </h2>

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setActiveFolderId(null);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  activeFilter === 'all' && !activeFolderId
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">folder_open</span>
                All Documents
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter('unfiled');
                  setActiveFolderId(null);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  activeFilter === 'unfiled'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">draft</span>
                Unfiled
              </button>
            </div>
          </div>

          {folders.length > 0 && (
            <div>
              <h2 className="mb-3 px-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                Personal Folders
              </h2>

              <div className="flex flex-col gap-1">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      setActiveFolderId(folder.id);
                      setActiveFilter(null);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      activeFolderId === folder.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={folder.name}
                  >
                    <span className="material-symbols-outlined text-[20px]">folder</span>
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">PDF Analysis</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{storageAnalysis.pdfDocsCount}</p>
            <p className="text-sm text-gray-500">PDF-like files detected</p>
            <p className="mt-2 text-xs text-gray-400">
              {formatSize(storageAnalysis.pdfSize)} scanned • {storageAnalysis.noSizeCount} missing
              size
            </p>
          </div>
        </aside>
      )}

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                title="Toggle folders"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isSidebarOpen ? 'left_panel_close' : 'left_panel_open'}
                </span>
              </button>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-950">My Documents</h1>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Manage uploaded documents and followed public documents.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-10 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid View"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-8 w-10 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List View"
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
              </button>
            </div>

            <Link
              href="/dashboard/upload"
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-black hover:shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              Upload
            </Link>
          </div>
        </div>

        {documents.length > 0 ? (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'flex flex-col gap-3'
              }
            >
              {documents.map((doc) => {
                const fileType = typeof doc.fileType === 'string' ? doc.fileType : '';
                const isPdf = fileType.toLowerCase().includes('pdf');
                const isFollowed = Boolean(doc.isFollowed || doc.isLocalFollowed);
                const isGrid = viewMode === 'grid';

                return (
                  <Interactive3DCard
                    key={doc.id}
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                    className={`group cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-xl ${
                      isGrid ? 'flex min-h-[240px] flex-col p-5' : 'flex items-center gap-5 p-4'
                    }`}
                  >
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-500 shadow-sm ${
                        isGrid ? 'mb-4 h-14 w-14' : 'h-12 w-12'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {isPdf ? 'picture_as_pdf' : 'description'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3
                          className="truncate text-base font-bold text-gray-900 transition-colors group-hover:text-blue-600"
                          title={doc.title}
                        >
                          {doc.title}
                        </h3>

                        <div className="flex shrink-0 gap-1">
                          {doc.isAIGenerated && (
                            <span className="rounded-md bg-gray-900 px-2 py-1 text-[10px] font-bold tracking-wider text-white">
                              AI
                            </span>
                          )}

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors flex items-center gap-1.5" title={doc.title}>
                            <span className="truncate">{doc.title}</span>
                            {doc.visibilityStatus === 'PRIVATE' && doc.rejectReason && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" title="Yêu cầu chia sẻ công khai bị từ chối" />
                            )}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="truncate text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                              {doc.subject?.name ?? `SUB-${doc.subjectId ?? 'GEN'}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="truncate text-xs font-semibold text-gray-700">
                        {getSubjectLabel(doc)}
                      </p>

                      <p className="mt-2 text-[13px] text-gray-500">
                        {doc.isAIGenerated ? 'AI Generated' : `Added ${formatDate(doc.createdAt)}`}{' '}
                        • {formatSize(getDocumentSize(doc))}
                      </p>

                      {isGrid && (
                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                          {doc.tags && doc.tags.length > 0 ? (
                            <>
                              {doc.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t.tag.id}
                                  className="inline-flex max-w-[90px] items-center truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600"
                                  title={t.tag.name}
                                >
                                  {t.tag.name}
                                </span>
                              ))}

                              {doc.tags.length > 3 && (
                                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
                                  +{doc.tags.length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center rounded-md px-1 py-1 text-[11px] text-gray-400 italic">
                              No tags
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className={`relative z-10 flex items-center justify-end gap-1 ${
                        isGrid ? 'mt-auto border-t border-gray-100 pt-3' : 'shrink-0'
                      }`}
                    >
                      {isFollowed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleUnfollowDocument(doc);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Unfollow"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            bookmark_remove
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          router.push(`/dashboard/documents/${doc.id}`);
                        }}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        title="Open"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </Interactive3DCard>
                );
              })}

              <Link
                href="/dashboard/upload"
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-transparent transition-all duration-300 hover:border-gray-900 hover:bg-gray-50/50 ${
                  viewMode === 'list' ? 'py-8' : 'min-h-[240px]'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-gray-900 group-hover:text-white">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="mt-4 font-semibold text-gray-600 group-hover:text-gray-900">
                  Upload more
                </p>
                <p className="mt-1 text-xs text-gray-400">PDF, DOCX, PPTX up to 10MB</p>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="col-span-1 flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-7 shadow-sm lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Storage Capacity</h3>
                    <p className="mt-1 text-sm text-gray-500">Monitor your available space</p>
                  </div>

                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-bold text-gray-800 shadow-inner">
                    {storageSummary
                      ? `${formatSize(storageSummary.usedBytes)} Used`
                      : 'Calculating...'}
                  </span>
                </div>

                {storageSummary ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
                      <div
                        className="h-full bg-gray-900 transition-all duration-1000 ease-out"
                        style={{ width: `${Math.max(storageSummary.usedPercent, 2)}%` }}
                      />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-gray-900 shadow-sm" />
                        <span className="text-sm font-medium text-gray-600">
                          Used{' '}
                          <span className="ml-1 font-bold text-gray-900">
                            {formatSize(storageSummary.usedBytes)}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-gray-200 shadow-sm" />
                        <span className="text-sm font-medium text-gray-600">
                          Available{' '}
                          <span className="ml-1 font-bold text-gray-900">
                            {formatSize(storageSummary.availableBytes)}
                          </span>
                        </span>
                      </div>

                      {Number(storageSummary.reservedBytes) > 0 && (
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" />
                          <span className="text-sm font-medium text-gray-600">
                            Reserved{' '}
                            <span className="ml-1 font-bold text-gray-900">
                              {formatSize(storageSummary.reservedBytes)}
                            </span>
                          </span>
                        </div>
                      )}

                      {Number(storageSummary.trashBytes) > 0 && (
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full bg-red-400 shadow-sm" />
                          <span className="text-sm font-medium text-gray-600">
                            Trash{' '}
                            <span className="ml-1 font-bold text-gray-900">
                              {formatSize(storageSummary.trashBytes)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex animate-pulse flex-col gap-5">
                    <div className="h-2.5 w-full rounded-full bg-gray-200" />
                    <div className="flex gap-4">
                      <div className="h-4 w-24 rounded bg-gray-200" />
                      <div className="h-4 w-24 rounded bg-gray-200" />
                    </div>
                  </div>
                )}
              </div>

              <div className="group relative col-span-1 flex flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white shadow-lg">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl transition-all group-hover:bg-blue-500/30" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl transition-all group-hover:bg-purple-500/30" />

                <div className="relative z-10">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400">auto_awesome</span>
                    <h3 className="text-xl font-bold tracking-tight">AI Summarizer</h3>
                  </div>

                  <p className="mb-8 text-sm leading-relaxed font-medium text-gray-300">
                    Turn long PDFs into quick study guides with one click.
                  </p>

                  <Link
                    href="/dashboard/upload"
                    className="block w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-center text-[14px] font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-gray-900"
                  >
                    Try Smart Summary
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[70vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400 shadow-inner">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
            </div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
              Your library is empty
            </h2>

            <p className="mb-8 max-w-md text-sm leading-relaxed text-gray-500">
              {activeFolderId || activeFilter !== 'all'
                ? 'No documents match your current filter. Try selecting a different folder or clear filters.'
                : 'Upload your course materials to automatically generate smart flashcards, summaries, and quizzes.'}
            </p>

            <Link
              href="/dashboard/upload"
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">upload</span>
              Upload First Document
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
