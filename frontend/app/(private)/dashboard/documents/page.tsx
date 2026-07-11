'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
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

// -----------------------------------------------------------
// COMPONENT MỚI: Xử lý hiệu ứng 3D Hover cho Card
// -----------------------------------------------------------
function Interactive3DCard({ children, className, onClick }: { children: React.ReactNode, className: string, onClick?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    // Tính toán tọa độ chuột so với phần tử
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Tìm tâm của phần tử
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Tính toán độ nghiêng (Tối đa nghiêng 5 độ để nhìn mượt và không bị lố)
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 }); // Reset về 0 khi chuột rời đi
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'none' : 'transform 0.5s ease-out', // Chỉ transition khi chuột rời đi để hiệu ứng lướt mượt
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* Container bên trong để tạo hiệu ứng Depth (Chiều sâu 3D) */}
      <div
        style={{
          transform: isHovered ? 'translateZ(20px)' : 'translateZ(0px)',
          transition: 'transform 0.3s ease-out'
        }}
        className="w-full h-full flex flex-col sm:flex-row flex-1"
      >
        {children}
      </div>
    </div>
  );
}
// -----------------------------------------------------------

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
          <span className="material-symbols-outlined text-gray-800 animate-spin text-5xl">sync</span>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 bg-gray-50">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
          <span className="material-symbols-outlined text-2xl">error</span>
          <span className="font-medium">Failed to load documents. Please try refreshing.</span>
        </div>
      </div>
    );
  }

  const storageAnalysis = calculateStorageAnalysis(documents);

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans">
      {/* Folder Sidebar */}
      {isSidebarOpen && (
        <aside className="w-64 border-r border-gray-200 bg-white p-5 flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto hidden md:flex shrink-0">
          <div>
            <h2 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 px-2">Library</h2>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setActiveFilter('all'); setActiveFolderId(null); }}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${activeFilter === 'all' && !activeFolderId ? 'bg-gray-100/80 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <span className="material-symbols-outlined text-[20px]">library_books</span>
                All Documents
              </button>
              <button
                onClick={() => { setActiveFilter('unfiled'); setActiveFolderId(null); }}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${activeFilter === 'unfiled' ? 'bg-gray-100/80 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <span className="material-symbols-outlined text-[20px]">inbox</span>
                Unfiled
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 px-2">Folders</h2>
            <div className="flex flex-col gap-1">
              {folders.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 italic">No folders created yet.</p>
              ) : (
                folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => { setActiveFolderId(folder.id); setActiveFilter(null); }}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${activeFolderId === folder.id ? 'bg-gray-100/80 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">folder</span>
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 xl:px-12 max-w-7xl mx-auto w-full">
        {documents.length > 0 || isLoading ? (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hidden md:flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                  title="Toggle Sidebar"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isSidebarOpen ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
                  </span>
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                    Document Library
                  </h1>
                  <p className="mt-1.5 text-sm text-gray-500 font-medium">
                    Manage your course materials and AI-generated notes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl bg-gray-200/60 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center justify-center h-8 w-10 rounded-lg transition-all ${viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    title="Grid View"
                  >
                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center justify-center h-8 w-10 rounded-lg transition-all ${viewMode === 'list'
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

                return (
                  <Interactive3DCard
                    key={doc.id}
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                    className={`group relative flex cursor-pointer rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-xl hover:border-gray-400 bg-white ${viewMode === 'list'
                      ? 'p-4 gap-5'
                      : 'p-5 min-h-[240px]'
                      }`}
                  >
                    {/* Content Wrapper for List/Grid Switch */}
                    <div className={`w-full flex ${viewMode === 'list' ? 'flex-row items-center gap-5' : 'flex-col justify-between h-full'}`}>

                      {/* Top Right Badge (Absolute in Grid, Inline in List) */}
                      <div className={`${viewMode === 'list' ? 'hidden' : 'absolute top-4 right-4'}`}>
                        {doc.isAIGenerated ? (
                          <span className="flex items-center gap-1 rounded-md bg-gray-900 px-2 py-1 text-[10px] font-bold tracking-wider text-white shadow-sm">
                            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                            AI
                          </span>
                        ) : isFollowed ? (
                          <span className="rounded-md bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 text-[10px] font-bold tracking-wider shadow-sm">
                            FOLLOWED
                          </span>
                        ) : null}
                      </div>

                      {/* Icon & Primary Info */}
                      <div className={`flex ${viewMode === 'list' ? 'items-center gap-4 flex-1 min-w-0' : 'flex-col'}`}>
                        <div className={`${viewMode === 'grid' ? 'mb-4' : ''} shrink-0`}>
                          {doc.isAIGenerated ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
                              <span className="material-symbols-outlined">data_object</span>
                            </div>
                          ) : isFollowed ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
                              <span className="material-symbols-outlined">
                                {isPdf ? 'picture_as_pdf' : 'description'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 border border-gray-200 shadow-sm">
                              <span className="material-symbols-outlined">
                                {isPdf ? 'picture_as_pdf' : 'description'}
                              </span>
                            </div>
                          )}
                        </div>

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
                            {viewMode === 'list' && (doc.isAIGenerated || isFollowed) && (
                              <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md ${doc.isAIGenerated ? 'bg-gray-900 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                {doc.isAIGenerated ? 'AI' : 'FOLLOWED'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metadata & Actions */}
                      <div className={`flex ${viewMode === 'list' ? 'items-center gap-6 shrink-0' : 'flex-col mt-4'}`}>
                        <div className={`${viewMode === 'grid' ? 'mb-4' : 'hidden sm:block text-right'}`}>
                          <p className="text-[13px] text-gray-500 font-medium">
                            {doc.isAIGenerated ? 'Generated' : 'Uploaded'} {formatDate(doc.createdAt)}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            {formatSize(doc.fileSizeBytes !== undefined ? doc.fileSizeBytes : doc.fileSize)}
                          </p>
                        </div>

                        {/* Tags (Only visible in Grid mode) */}
                        {!doc.isAIGenerated && viewMode === 'grid' && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-auto pb-4">
                            {doc.tags && doc.tags.length > 0 ? (
                              <>
                                {doc.tags.slice(0, 3).map((t) => (
                                  <span
                                    key={t.tag.id}
                                    className="inline-flex max-w-[80px] items-center truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600"
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

                        {/* Actions Footer */}
                        <div className={`flex items-center justify-end gap-1 relative z-10 ${viewMode === 'grid' ? 'border-t border-gray-100 pt-3' : ''}`}>
                          {doc.isAIGenerated ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900"
                              >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-black shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[18px]">bolt</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {isFollowed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleUnfollowDocument(doc);
                                  }}
                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <span className="material-symbols-outlined text-[18px]">bookmark_remove</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.preventDefault(); }}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                              >
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Interactive3DCard>
                );
              })}

              {/* Upload Card - Bỏ hiệu ứng 3D cho nút Upload vì nút upload thường thiết kế phẳng */}
              <Link
                href="/dashboard/upload"
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-transparent transition-all duration-300 hover:border-gray-900 hover:bg-gray-50/50 ${viewMode === 'list' ? 'py-8' : 'min-h-[240px]'}`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-300 group-hover:bg-gray-900 group-hover:text-white group-hover:scale-110 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="mt-4 font-semibold text-gray-600 group-hover:text-gray-900">Upload more</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX up to 10MB</p>
              </Link>
            </div>

            {/* Bottom Widgets Row */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="col-span-1 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm lg:col-span-2 flex flex-col justify-between">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Storage Capacity</h3>
                    <p className="text-sm text-gray-500 mt-1">Monitor your available space</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm font-bold shadow-inner">
                    {storageSummary ? `${formatSize(storageSummary.usedBytes)} Used` : 'Calculating...'}
                  </span>
                </div>

                {storageSummary ? (
                  <div className="flex flex-col gap-5">
                    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-gray-900 transition-all duration-1000 ease-out"
                        style={{ width: `${Math.max(storageSummary.usedPercent, 2)}%` }}
                      ></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-1">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-gray-900 shadow-sm"></span>
                        <span className="text-gray-600 text-sm font-medium">Used <span className="text-gray-900 font-bold ml-1">{formatSize(storageSummary.usedBytes)}</span></span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-gray-200 shadow-sm"></span>
                        <span className="text-gray-600 text-sm font-medium">Available <span className="text-gray-900 font-bold ml-1">{formatSize(storageSummary.availableBytes)}</span></span>
                      </div>
                      {Number(storageSummary.reservedBytes) > 0 && (
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm"></span>
                          <span className="text-gray-600 text-sm font-medium">Reserved <span className="text-gray-900 font-bold ml-1">{formatSize(storageSummary.reservedBytes)}</span></span>
                        </div>
                      )}
                      {Number(storageSummary.trashBytes) > 0 && (
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full bg-red-400 shadow-sm"></span>
                          <span className="text-gray-600 text-sm font-medium">Trash <span className="text-gray-900 font-bold ml-1">{formatSize(storageSummary.trashBytes)}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse flex flex-col gap-5">
                    <div className="h-2.5 w-full bg-gray-200 rounded-full"></div>
                    <div className="flex gap-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative col-span-1 flex flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white shadow-lg group">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl transition-all group-hover:bg-blue-500/30"></div>
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl transition-all group-hover:bg-purple-500/30"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-yellow-400">auto_awesome</span>
                    <h3 className="text-xl font-bold tracking-tight">AI Summarizer</h3>
                  </div>
                  <p className="mb-8 text-sm leading-relaxed text-gray-300 font-medium">
                    Turn 50-page PDFs into 5-minute study guides with one click.
                  </p>
                  <button className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-white hover:text-gray-900 shadow-sm">
                    Try Smart Summary
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[70vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400 shadow-inner">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 tracking-tight">Your library is empty</h2>
            <p className="mb-8 max-w-md text-gray-500 text-sm leading-relaxed">
              {activeFolderId || activeFilter !== 'all'
                ? "No documents match your current filter. Try selecting a different folder or clear filters."
                : "Upload your course materials to automatically generate smart flashcards, summaries, and quizzes."}
            </p>
            <Link
              href="/dashboard/upload"
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition-all hover:bg-black hover:shadow-md hover:-translate-y-0.5 active:scale-95"
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