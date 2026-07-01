'use client';

import { useEffect, useMemo, useState } from 'react';
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

function calculateStorageAnalysis(documents: any[]) {
  let pdfSize = 0;
  let noSizeCount = 0;
  let pdfDocsCount = 0;

  const safeDocs = Array.isArray(documents) ? documents : [];

  safeDocs.forEach((doc) => {
    const type = (doc?.fileType || '').toLowerCase();
    const isPdf = type.includes('pdf') || type === '';
    
    if (isPdf) {
      pdfDocsCount++;
      const rawSize = doc?.fileSizeBytes !== undefined ? doc.fileSizeBytes : doc?.fileSize;
      const size = Number(rawSize);
      if (!Number.isFinite(size) || size <= 0) {
        noSizeCount++;
      } else {
        pdfSize += size;
      }
    }
  });

  return { pdfSize, noSizeCount, pdfDocsCount };
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

  // Load personal folders
  const { data: foldersResponse } = useSWR('/personal-folders', () => personalFoldersApi.getFolders());
  const folders: PersonalFolder[] = foldersResponse || [];

  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR(
    ['/documents/me', activeFolderId, activeFilter],
    () => documentsApi.getMyDocuments({
      folderId: activeFolderId || undefined,
      unfiled: activeFilter === 'unfiled' ? true : undefined,
    })
  );

  const {
    data: storageSummary,
  } = useSWR('/documents/me/storage-summary', () => documentsApi.getStorageSummary());

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
    const rawDocs = Array.isArray(response) ? response : (response?.data || []);
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

  const formatSize = (bytes: any): string => {
    const size = Number(bytes);
    if (!Number.isFinite(size) || size <= 0) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const handleUnfollowDocument = async (doc: DisplayDocument) => {
    const confirmed = confirm('Bỏ theo dõi tài liệu này?');

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
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-red-500">
        Failed to load documents.
      </div>
    );
  }

  const storageAnalysis = calculateStorageAnalysis(documents);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans">
      {/* Folder Sidebar */}
      {isSidebarOpen && (
        <aside className="w-64 border-r border-gray-200 bg-white p-5 flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto hidden md:flex">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight uppercase">My Library</h2>
          </div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { setActiveFilter('all'); setActiveFolderId(null); }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeFilter === 'all' && !activeFolderId ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">library_books</span>
              All Documents
            </button>
            <button
              onClick={() => { setActiveFilter('unfiled'); setActiveFolderId(null); }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeFilter === 'unfiled' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">inbox</span>
              Unfiled
            </button>
          </div>

          <div className="mt-4 mb-2">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight uppercase">Folders</h2>
          </div>
          
          <div className="flex flex-col gap-1">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => { setActiveFolderId(folder.id); setActiveFilter(null); }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeFolderId === folder.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="material-symbols-outlined text-[18px]">folder</span>
                {folder.name}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        {documents.length > 0 || isLoading ? (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hidden md:flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                  <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
                    Document Library
                  </h1>
                  <p className="mt-1 text-[15px] text-gray-500">
                    Manage your course materials and AI-generated notes.
                  </p>
                </div>
              </div>

            <div className="mt-4 flex items-center gap-4 sm:mt-0">
              <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'grid'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'list'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">view_list</span>
                  List
                </button>
              </div>

              <Link
                href="/dashboard/upload"
                className="flex items-center gap-2 rounded-lg bg-[#1a1c23] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black"
              >
                <span className="material-symbols-outlined text-[20px]">upload</span>
                Upload New
              </Link>
            </div>
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid grid-cols-1 gap-4'
            }
          >
            {documents.map((doc) => {
              const fileType = typeof doc.fileType === 'string' ? doc.fileType : '';
              const isPdf = fileType.toLowerCase().includes('pdf');
              const isFollowed = Boolean(doc.isFollowed || doc.isLocalFollowed);

              return (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                  className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:border-gray-400 hover:shadow-md ${doc.isAIGenerated ? 'border-gray-300 bg-gray-100' : 'border-gray-200 bg-white'
                    } ${viewMode === 'list' ? 'min-h-[160px]' : ''}`}
                >
                  <div>
                    <div className="mb-4">
                      {doc.isAIGenerated ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                          <span className="material-symbols-outlined">data_object</span>
                        </div>
                      ) : isFollowed ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-500">
                          <span className="material-symbols-outlined">
                            {isPdf ? 'picture_as_pdf' : 'description'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F3F5] text-gray-500">
                          <span className="material-symbols-outlined">
                            {isPdf ? 'picture_as_pdf' : 'description'}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="mb-1 truncate font-semibold text-gray-900" title={doc.title}>
                      {doc.title}
                    </h3>

                    <p className="mb-2 truncate text-[12px] font-medium text-[#1a1c23]">
                      {doc.subject?.name ?? `SUB-${doc.subjectId ?? 'GEN'}`}
                    </p>

                    <p className="mb-3 text-[13px] text-gray-500">
                      {doc.isAIGenerated ? 'AI Generated' : `Added ${formatDate(doc.createdAt)}`} •{' '}
                      {formatSize(doc.fileSizeBytes !== undefined ? doc.fileSizeBytes : doc.fileSize)}
                    </p>

                    {!doc.isAIGenerated && (
                      <div className="mt-auto flex flex-wrap items-center gap-1.5">
                        {doc.tags && doc.tags.length > 0 ? (
                          <>
                            {doc.tags.slice(0, 3).map((t) => (
                              <span
                                key={t.tag.id}
                                className="inline-flex max-w-[80px] items-center truncate rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                                title={t.tag.name}
                              >
                                {t.tag.name}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                                +{doc.tags.length - 3}
                              </span>
                            )}
                          </>
                        ) : isFollowed ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            Followed from Explore
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-transparent px-1 py-0.5 text-[10px] text-gray-400 italic">
                            No tags
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    {doc.isAIGenerated ? (
                      <span className="rounded bg-black px-2 py-1 text-[11px] font-bold tracking-wider text-white">
                        AI INSIGHT
                      </span>
                    ) : isFollowed ? (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold tracking-wider text-blue-700">
                        FOLLOWED
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400">DOCUMENT</span>
                    )}

                    <div className="flex items-center gap-1 text-gray-400">
                      {doc.isAIGenerated ? (
                        <>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="rounded p-1.5 transition-colors hover:bg-gray-200 hover:text-gray-700"
                          >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-800"
                          >
                            <span className="material-symbols-outlined text-[16px]">bolt</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {isFollowed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnfollowDocument(doc);
                              }}
                              className="rounded p-1.5 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Bỏ theo dõi"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                bookmark_remove
                              </span>
                            </button>
                          )}

                          <Link
                            href={`/dashboard/documents/${doc.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              href="/dashboard/upload"
              className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-transparent transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors group-hover:bg-gray-200 group-hover:text-gray-700">
                <span className="material-symbols-outlined text-2xl">add</span>
              </div>
              <p className="mt-3 font-medium text-gray-600">Upload more</p>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Storage Overview</h3>
                <span className="text-sm font-medium text-gray-500">
                  {storageSummary ? `${formatSize(storageSummary.usedBytes)} used` : 'Loading...'}
                </span>
              </div>

              {storageSummary ? (
                <div className="flex flex-col gap-4 text-sm">
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
                    <div
                      className="h-full bg-[#1a1c23] transition-all"
                      style={{ width: `${storageSummary.usedPercent}%` }}
                    ></div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#1a1c23]"></span>
                      <span className="text-gray-700 font-medium">Used: {formatSize(storageSummary.usedBytes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-gray-300"></span>
                      <span className="text-gray-700 font-medium">Available: {formatSize(storageSummary.availableBytes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                      <span className="text-gray-700 font-medium">Reserved: {formatSize(storageSummary.reservedBytes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-400"></span>
                      <span className="text-gray-700 font-medium">Trash: {formatSize(storageSummary.trashBytes)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-gray-500 text-xs italic">
                    Note: Files in trash do not consume your personal quota.
                  </div>
                </div>
              ) : (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-3 w-full bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
              )}
            </div>

            <div className="relative col-span-1 flex flex-col justify-center overflow-hidden rounded-2xl bg-[#1a1c23] p-8 text-white shadow-md">
              <h3 className="mb-3 text-[22px] font-bold">AI Summarizer</h3>
              <p className="mb-8 text-sm leading-relaxed text-gray-400">
                Turn your 50-page PDFs into 5-minute study guides with one click.
              </p>
              <button className="w-full rounded-xl bg-white px-4 py-3.5 text-[15px] font-bold text-[#1a1c23] transition-colors hover:bg-gray-100">
                Try Smart Summary
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <span className="material-symbols-outlined text-3xl">description</span>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">No documents found</h2>
          <p className="mb-6 max-w-md text-gray-500">
            {activeFolderId || activeFilter !== 'all' 
              ? "You haven't uploaded any documents matching this filter yet." 
              : "Upload your course materials to get AI-generated flashcards, summaries, and quizzes automatically."}
          </p>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 rounded-lg bg-[#1a1c23] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-black"
          >
            <span className="material-symbols-outlined">upload</span>
            Upload First Document
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
