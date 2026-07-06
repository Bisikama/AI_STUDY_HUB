'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/hooks/useAuth';
import { dashboardApi, ExploreDocument, Contributor } from '@/services/dashboardApi';
import { documentsApi } from '@/services/documentsApi';
import useSWR from 'swr';
import axiosClient from '@/utils/axios';
import Link from 'next/link';
import TeacherVerificationModal from '@/components/TeacherVerificationModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const FOLLOWED_DOCUMENT_IDS_STORAGE_KEY = 'studyhub_followed_document_ids';
const FOLLOWED_DOCUMENTS_STORAGE_KEY = 'studyhub_followed_documents';

type DocumentSummary = {
  id: string;
  documentId: string;
  summaryText: string;
  keyPoints: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type QuizOption = {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  createdAt: string;
};

type QuizQuestion = {
  id: string;
  quizId: string;
  questionText: string;
  createdAt: string;
  options: QuizOption[];
};

type Quiz = {
  id: string;
  documentId: string;
  createdBy: string | null;
  title: string;
  createdAt: string;
  questions: QuizQuestion[];
};

type ExploreAiCache = {
  document: Omit<ExploreDocument, 'quizCount' | 'hasSummary'>;
  summaries: DocumentSummary[];
  quizzes: Quiz[];
};

type ApiResponse<T> =
  | T
  | {
    statusCode: number;
    message: string;
    data: T;
  };

const aiCacheFetcher = async (url: string): Promise<ExploreAiCache> => {
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    throw new Error('Failed to fetch AI cache');
  }

  const result = (await response.json()) as ApiResponse<ExploreAiCache>;

  if ('data' in result) {
    return result.data;
  }

  return result;
};

function getDocumentUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }

  return `${API_BASE_URL}${fileUrl}`;
}

function getFileTypeIconAndStyle(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) {
    return {
      icon: 'picture_as_pdf',
      bgClass: 'bg-error-container text-on-error-container',
    };
  } else if (
    type.includes('word') ||
    type.includes('document') ||
    type.includes('docx') ||
    type.includes('msword')
  ) {
    return {
      icon: 'description',
      bgClass: 'bg-primary-fixed text-on-primary-fixed-variant',
    };
  } else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
    return {
      icon: 'folder_zip',
      bgClass: 'bg-surface-dim text-on-surface',
    };
  } else {
    return {
      icon: 'description',
      bgClass: 'bg-surface-container-high text-secondary',
    };
  }
}

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
}

function DashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [followedDocumentIds, setFollowedDocumentIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const storedIds = window.localStorage.getItem(FOLLOWED_DOCUMENT_IDS_STORAGE_KEY);
      const parsedIds = storedIds ? (JSON.parse(storedIds) as string[]) : [];
      return Array.isArray(parsedIds) ? parsedIds : [];
    } catch {
      return [];
    }
  });
  const [recentlyViewed, setRecentlyViewed] = useState<ExploreDocument[]>([]);
  const [publicDocuments, setPublicDocuments] = useState<ExploreDocument[]>([]);
  const [trendingDocs, setTrendingDocs] = useState<ExploreDocument[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const userObj = JSON.parse(userStr);
          return userObj?.fullName || 'User';
        } catch {
          // Ignore
        }
      }
    }
    return 'User';
  });
  const [showRecentlyViewedModal, setShowRecentlyViewedModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editFullName, setEditFullName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const userObj = JSON.parse(userStr);
          return userObj?.fullName || '';
        } catch {
          // Ignore
        }
      }
    }
    return '';
  });
  const [editUsername, setEditUsername] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const userObj = JSON.parse(userStr);
          return userObj?.username || '';
        } catch {
          // Ignore
        }
      }
    }
    return '';
  });
  const [editPhoneNumber, setEditPhoneNumber] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const userObj = JSON.parse(userStr);
          return userObj?.phoneNumber || '';
        } catch {
          // Ignore
        }
      }
    }
    return '';
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          // Ignore
        }
      }
    }
    return null;
  });
  const { getProfile, logout } = useAuth();

  useEffect(() => {
    const handleSync = () => {
      try {
        const storedIds = window.localStorage.getItem(FOLLOWED_DOCUMENT_IDS_STORAGE_KEY);
        const parsedIds = storedIds ? (JSON.parse(storedIds) as string[]) : [];
        if (Array.isArray(parsedIds)) {
          setFollowedDocumentIds(parsedIds);
        }
      } catch (err) {
        // Ignore
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('studyhub-followed-documents-change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('studyhub-followed-documents-change', handleSync);
    };
  }, []);

  const { data: myDocumentsResponse, mutate: mutateMyDocuments } = useSWR('/documents/me', () =>
    documentsApi.getMyDocuments(),
  );

  const myDocumentItems = myDocumentsResponse?.data ?? [];

  const isDocumentOwner = myDocumentItems.some(
    (d: { id: string; isOwner?: boolean }) => d.id === selectedDocumentId && d.isOwner,
  );
  const isDocumentFollowed = selectedDocumentId
    ? followedDocumentIds.includes(selectedDocumentId)
    : false;

  const findDocumentById = (id: string): ExploreDocument | undefined => {
    return (
      publicDocuments.find((d) => d.id === id) ||
      trendingDocs.find((d) => d.id === id) ||
      recentlyViewed.find((d) => d.id === id)
    );
  };

  const saveFollowedDocuments = (nextIds: string[], currentDoc: ExploreDocument) => {
    try {
      const storedDocs = window.localStorage.getItem(FOLLOWED_DOCUMENTS_STORAGE_KEY);
      const parsedDocs = storedDocs ? (JSON.parse(storedDocs) as ExploreDocument[]) : [];
      const safeDocs = Array.isArray(parsedDocs) ? parsedDocs : [];

      let nextDocs: ExploreDocument[];
      if (nextIds.includes(currentDoc.id)) {
        if (currentDoc.title) {
          nextDocs = [...safeDocs.filter((d) => d.id !== currentDoc.id), currentDoc];
        } else {
          nextDocs = safeDocs;
        }
      } else {
        nextDocs = safeDocs.filter((d) => d.id !== currentDoc.id);
      }

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
      console.error('Failed to save followed documents:', err);
    }
  };

  const handleFollowDocument = async (docId: string, docObj?: ExploreDocument) => {
    try {
      await documentsApi.followDocument(docId);
      const documentToSave =
        docObj ||
        findDocumentById(docId) ||
        (aiCache?.document
          ? ({
            ...aiCache.document,
            quizCount: aiCache.quizzes?.length || 0,
            hasSummary: (aiCache.summaries?.length || 0) > 0,
          } as ExploreDocument)
          : undefined);

      if (documentToSave) {
        setFollowedDocumentIds((prev) => {
          const nextIds = prev.includes(docId) ? prev : [...prev, docId];
          saveFollowedDocuments(nextIds, documentToSave);
          return nextIds;
        });
      }
    } catch (err) {
      console.error('Failed to follow document:', err);
    }
  };

  const handleUnfollowDocument = async (docId: string) => {
    try {
      await documentsApi.unfollowDocument(docId);
      setFollowedDocumentIds((prev) => {
        const nextIds = prev.filter((id) => id !== docId);
        saveFollowedDocuments(nextIds, { id: docId } as ExploreDocument);
        return nextIds;
      });
    } catch (err) {
      console.error('Failed to unfollow document:', err);
    }
  };

  const aiCacheUrl = selectedDocumentId
    ? `${API_BASE_URL}/api/explore/${selectedDocumentId}/ai-cache`
    : null;

  const {
    data: aiCache,
    error: aiCacheError,
    isLoading: isAiCacheLoading,
  } = useSWR(aiCacheUrl, aiCacheFetcher);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedOptionIds((prev) => {
      if (prev[questionId]) {
        return prev;
      }
      return {
        ...prev,
        [questionId]: optionId,
      };
    });
  };

  const loadDashboardData = async () => {
    try {
      const data = await dashboardApi.getDashboardData();
      setRecentlyViewed(data.recentlyViewed || []);
      setPublicDocuments(data.publicDocuments || []);
      setTrendingDocs(data.trending || []);
      setTopContributors(data.topContributors || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Fetch từ API để đồng bộ dữ liệu mới nhất từ database
    getProfile()
      .then((updatedUser) => {
        if (updatedUser) {
          setUser(updatedUser);
          setUserFullName(updatedUser.fullName || 'User');
          setEditFullName(updatedUser.fullName || '');
          setEditUsername(updatedUser.username || '');
          setEditPhoneNumber(updatedUser.phoneNumber || '');
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to sync profile:', err);
        logout();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleCardClick = async (docId: string, docTitle: string) => {
    setSelectedOptionIds({});
    setSelectedDocumentId(docId);
    try {
      await dashboardApi.recordView(docId);
      const data = await dashboardApi.getDashboardData();
      setRecentlyViewed(data.recentlyViewed || []);
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  };

  const toggleSaveDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (followedDocumentIds.includes(id)) {
      handleUnfollowDocument(id);
    } else {
      handleFollowDocument(id);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setEditLoading(true);

    try {
      const response = await axiosClient.put('/auth/profile', {
        fullName: editFullName,
        username: editUsername || undefined,
        phoneNumber: editPhoneNumber || undefined,
      });

      const updatedUser = response.data.data?.user || response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setUserFullName(updatedUser.fullName);

      setEditSuccess('Cập nhật thông tin tài khoản thành công!');
      setTimeout(() => {
        setShowEditAccountModal(false);
        setEditSuccess('');
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosError.response?.data?.message || 'Cập nhật tài khoản thất bại!';
      setEditError(Array.isArray(errMsg) ? errMsg[0] : errMsg);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background flex min-h-screen font-sans">
      {/* Sidebar Nav */}
      <nav
        className={`${mobileMenuOpen ? 'flex' : 'hidden'
          } border-outline-variant bg-surface-container-lowest fixed top-0 left-0 z-20 h-full w-64 flex-col border-r p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all md:flex`}
      >
        <div className="mt-2 mb-8 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <div>
              <h1 className="font-headline-md text-headline-md text-primary font-bold">
                AI STUDY HUB
              </h1>
              <p className="font-label-sm text-label-sm text-secondary text-[10px] tracking-wider uppercase">
                Academic Excellence
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-secondary hover:text-primary p-1 md:hidden"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-6 px-4">
          <Link
            href="/explore"
            className="font-label-md text-label-md flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a1c23] px-4 py-3 text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined">add</span> New Research
          </Link>
        </div>

        <ul className="flex flex-grow flex-col gap-2">
          <li>
            <Link
              href="/dashboard"
              className="bg-surface-container-low text-primary font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 font-semibold transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">search</span> Discover
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/documents"
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">description</span> My Documents
            </Link>
          </li>
          <li>
            <Link
              href="/practice"
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">lightbulb</span> Practice Mode
            </Link>
          </li>
          {user?.role === 'ADMIN' && (
            <li>
              <a
                className="font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-red-600 transition-transform hover:bg-rose-50 active:scale-95"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/admin');
                }}
              >
                <span className="material-symbols-outlined text-red-600">admin_panel_settings</span>{' '}
                Admin Panel
              </a>
            </li>
          )}
        </ul>

        <ul className="border-outline-variant mt-auto flex flex-col gap-2 border-t pt-4">


          <li>
            <a
              className="text-error font-label-md text-label-md flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-transform hover:bg-red-50 hover:text-rose-700 active:scale-95"
              href="#"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined text-error">logout</span> Log out
            </a>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        {/* Top Header */}
        <header className="bg-surface sticky top-0 z-10 w-full shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
          <div className="px-container-margin-desktop max-w-max-width mx-auto flex h-16 w-full items-center justify-between">
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-primary hover:text-secondary cursor-pointer p-2 transition-colors"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <span className="font-headline-md text-headline-md text-primary">AI STUDY HUB</span>
            </div>

            {/* Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative mx-8 hidden max-w-2xl flex-1 md:flex"
            >
              <span className="material-symbols-outlined text-secondary absolute top-1/2 left-4 -translate-y-1/2">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-container-low text-on-surface focus:ring-primary focus:bg-surface-container-lowest font-body-md text-body-md w-full rounded-full border-none py-2.5 pr-4 pl-12 transition-all outline-none focus:ring-2"
                placeholder="Search for courses, documents, or keywords..."
                type="text"
              />
            </form>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/upload')}
                className="font-label-md text-label-md hidden h-10 cursor-pointer items-center gap-2 rounded-full bg-[#212529] px-4 py-2 text-white transition-opacity hover:opacity-90 md:flex"
              >
                <span className="material-symbols-outlined text-[20px]">upload</span> Upload
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                  className="border-outline-variant hover:border-primary focus:ring-primary flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border transition-colors focus:ring-2 focus:ring-offset-2"
                >
                  <img
                    alt="User profile avatar"
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYqSMGF3Z3oHdYhn5TKuHMKRLqgbBxxxtoRNxnakx4QY5gEAylvvaC7DqnO-6wRdWbBIdm8lN9SEhMxCbp8hakT47O6vbJLl91-97D8pkJXLj50c3nW8qB-8avFTT50YGPsF-9s6SN75_vCxKk31GsSz7WxQH4X-qlX6XGkFSqpq9alyYCX-ZxYLwHMCljNf0kwH5AertyqfjrTSYFBaxqzh-1604Hz7HFbNugFP3ndIVAs_2OpIbQSJgwvDs5Kcf11UWU6_PEEOQ"
                  />
                </button>

                {showAvatarDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowAvatarDropdown(false)}
                    />
                    <div className="bg-surface-container-lowest border-outline-variant absolute right-0 z-40 mt-2 w-48 rounded-xl border py-2 shadow-lg">
                      <button
                        onClick={() => {
                          setShowAvatarDropdown(false);
                          setShowEditAccountModal(true);
                        }}
                        className="hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          manage_accounts
                        </span>{' '}
                        Edit Account
                      </button>
                      <button
                        onClick={() => {
                          setShowAvatarDropdown(false);
                          setShowVerificationModal(true);
                        }}
                        className="hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>{' '}
                        Xác thực Giảng viên
                      </button>
                      <hr className="border-outline-variant my-1" />
                      <button
                        onClick={handleLogout}
                        className="hover:bg-error-container/10 text-error font-label-md text-label-md flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="p-container-margin-mobile md:p-container-margin-desktop max-w-max-width mx-auto w-full flex-1">
          <section className="mb-12">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
              Welcome back, {userFullName}
            </h2>
            <p className="font-body-lg text-body-lg text-secondary">
              Here&apos;s what&apos;s happening in your academic world today.
            </p>
          </section>

          {/* Mobile Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative mb-6 md:hidden">
            <span className="material-symbols-outlined text-secondary absolute top-1/2 left-4 -translate-y-1/2">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-container-low text-on-surface focus:ring-primary focus:bg-surface-container-lowest font-body-md text-body-md w-full rounded-full border-none py-2.5 pr-4 pl-12 transition-all outline-none focus:ring-2"
              placeholder="Search for courses, documents, or keywords..."
              type="text"
            />
          </form>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div className="flex flex-col gap-8 xl:col-span-2">
              {/* Recently Viewed */}
              <section>
                <div className="mb-6 flex items-end justify-between">
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Recently Viewed
                  </h3>
                  <a
                    className="font-label-md text-label-md text-primary-container cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowRecentlyViewedModal(true);
                    }}
                  >
                    View all
                  </a>
                </div>

                {loading ? (
                  <div className="text-secondary py-8 text-center">Loading...</div>
                ) : recentlyViewed.length === 0 ? (
                  <div className="bg-surface-container-lowest flex flex-col items-center rounded-xl border border-dashed border-[#E9ECEF] p-8 text-center shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                    <span className="material-symbols-outlined text-secondary mb-2 text-4xl">
                      find_in_page
                    </span>
                    <p className="font-body-md text-body-md text-secondary">
                      Chưa xem, hãy khám phá tài liệu mà bạn muốn.
                    </p>
                    <button
                      onClick={() => router.push('/explore')}
                      className="font-label-sm text-label-sm mt-4 cursor-pointer rounded-full bg-[#212529] px-4 py-2 text-white transition-opacity hover:opacity-90"
                    >
                      Khám phá tài liệu
                    </button>
                  </div>
                ) : (
                  <div className="scrollbar-thumb-rounded scrollbar-thumb-outline-variant -mx-4 flex snap-x snap-mandatory scrollbar-thin gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
                    {recentlyViewed.slice(0, 8).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleCardClick(doc.id, doc.title)}
                        className="bg-surface-container-lowest group flex min-h-[160px] w-[280px] flex-shrink-0 cursor-pointer snap-start flex-col justify-between rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)] sm:w-[320px]"
                      >
                        <div>
                          <div className="mb-2 flex items-start justify-between">
                            <span className="text-on-secondary-container font-label-sm text-label-sm rounded-full bg-[#E9ECEF] px-3 py-1">
                              {doc.subject?.code ?? 'GEN101'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/documents/${doc.id}/preview`);
                              }}
                              className="text-secondary hover:text-primary cursor-pointer p-1 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </div>
                          <h4 className="font-body-lg text-body-lg text-on-surface mb-1 line-clamp-2 font-semibold">
                            {doc.title}
                          </h4>
                          <p className="font-body-md text-body-md text-secondary line-clamp-1">
                            {doc.subject?.name ?? 'General'}
                          </p>
                        </div>
                        <div className="text-secondary mt-4 flex items-center gap-4 border-t border-[#E9ECEF] pt-4">
                          <span className="font-label-sm text-label-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">
                              visibility
                            </span>{' '}
                            {doc.viewCount}
                          </span>
                          <span className="font-label-sm text-label-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">thumb_up</span>{' '}
                            {doc.rating ? Math.round((doc.rating / 5) * 100) + '%' : '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Public Documents (Uploaded by other users) */}
              <section>
                <div className="mb-6 flex items-end justify-between">
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Public Documents
                  </h3>
                  <a
                    className="font-label-md text-label-md text-primary-container cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/explore');
                    }}
                  >
                    View all
                  </a>
                </div>

                {loading ? (
                  <div className="text-secondary py-8 text-center">Loading...</div>
                ) : publicDocuments.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl border border-dashed border-[#E9ECEF] p-8 text-center shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                    <p className="font-body-md text-body-md text-secondary">
                      Chưa có tài liệu công khai nào khác từ cộng đồng.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {publicDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleCardClick(doc.id, doc.title)}
                        className="bg-surface-container-lowest group flex min-h-[160px] cursor-pointer flex-col justify-between rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)]"
                      >
                        <div>
                          <div className="mb-2 flex items-start justify-between">
                            <span className="text-on-secondary-container font-label-sm text-label-sm rounded-full bg-[#E9ECEF] px-3 py-1">
                              {doc.subject?.code ?? 'GEN101'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/documents/${doc.id}/preview`);
                              }}
                              className="text-secondary hover:text-primary cursor-pointer p-1 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </div>
                          <h4 className="font-body-lg text-body-lg text-on-surface mb-1 line-clamp-2 font-semibold">
                            {doc.title}
                          </h4>
                          <p className="font-body-md text-body-md text-secondary line-clamp-1">
                            {doc.subject?.name ?? 'General'}
                          </p>
                        </div>
                        <div className="text-secondary mt-4 flex items-center gap-4 border-t border-[#E9ECEF] pt-4">
                          <span className="font-label-sm text-label-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">
                              visibility
                            </span>{' '}
                            {doc.viewCount}
                          </span>
                          <span className="font-label-sm text-label-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">thumb_up</span>{' '}
                            {doc.rating ? Math.round((doc.rating / 5) * 100) + '%' : '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Trending */}
              <section>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">
                  Trending in your network
                </h3>
                <div className="bg-surface-container-lowest overflow-hidden rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                  {loading ? (
                    <div className="text-secondary py-8 text-center">Loading...</div>
                  ) : trendingDocs.length === 0 ? (
                    <div className="text-secondary p-8 text-center">
                      Chưa có tài liệu thịnh hành.
                    </div>
                  ) : (
                    trendingDocs.map((doc) => {
                      const fileInfo = getFileTypeIconAndStyle(doc.fileType);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleCardClick(doc.id, doc.title)}
                          className="hover:bg-surface-container-low group flex cursor-pointer items-center justify-between border-b border-[#E9ECEF] p-4 transition-colors last:border-b-0 sm:p-6"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`h-12 w-12 rounded ${fileInfo.bgClass} flex flex-shrink-0 items-center justify-center`}
                            >
                              <span className="material-symbols-outlined">{fileInfo.icon}</span>
                            </div>
                            <div>
                              <h4 className="font-body-md text-body-md text-on-surface line-clamp-1 font-semibold">
                                {doc.title}
                              </h4>
                              <div className="text-secondary font-label-sm text-label-sm mt-1 flex flex-wrap items-center gap-2">
                                <span>{doc.subject?.name ?? 'General'}</span>
                                <span>•</span>
                                <span>{doc.subject?.code ?? 'GEN101'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 font-medium text-[#212529] text-amber-600">
                                  <span className="material-symbols-outlined fill-current text-[14px]">
                                    star
                                  </span>
                                  {doc.rating ? doc.rating.toFixed(1) : '0.0'} (
                                  {doc.rating ? Math.round((doc.rating / 5) * 100) + '%' : '0%'})
                                </span>
                                <span>•</span>
                                <span className="text-[#212529]">
                                  Added {formatCreatedAt(doc.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => toggleSaveDoc(doc.id, e)}
                            className={`font-label-sm text-label-sm hidden cursor-pointer rounded-full border px-4 py-2 transition-colors sm:block ${followedDocumentIds.includes(doc.id)
                              ? 'bg-primary-container border-primary-container text-white'
                              : 'border-[#212529] text-[#212529] hover:bg-[#212529] hover:text-white'
                              }`}
                          >
                            {followedDocumentIds.includes(doc.id) ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-8">
              <section className="bg-surface-container-lowest h-fit rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">
                  Top Contributors
                </h3>
                <div className="flex flex-col gap-4">
                  {topContributors.length === 0 ? (
                    <p className="font-label-sm text-label-sm text-secondary py-4 text-center">
                      Chưa có contributor nào.
                    </p>
                  ) : (
                    topContributors.slice(0, 3).map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            alt={`${c.fullName}'s avatar`}
                            className="h-10 w-10 rounded-full object-cover"
                            src={
                              c.avatarUrl ||
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKnnE9P8WplUJMxgDKRUPtxvrITGrpi-hIFPFfkPJz6oIZBQQwhURIyhGnsxfdGzugqzkbfErVWvEXVDQj40Z8jZPgGOqIZxv-iQyguS7fnYjLa36ZJQnXbCk_lBFV7OxsVwQ3nvdhn0hnYgs75Q3OEbKjYauRURKkxAFUml8OZhtI9RB61neoZvyycGXvBcD6FfN7pEdKb-2n0h7XV1Hm6YScxugLFyu6R1-OspAxktJA0roF_6UUt98S76BVyaYvqEqcy1khE'
                            }
                          />
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">
                              {c.fullName}
                            </p>
                            <p className="font-label-sm text-label-sm text-secondary">
                              {c.uploadedCount} docs uploaded
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold ${idx === 0
                            ? 'bg-primary-fixed-dim text-on-primary-fixed'
                            : 'bg-surface-variant text-on-surface-variant'
                            }`}
                        >
                          #{idx + 1}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowLeaderboardModal(true)}
                  className="text-on-surface font-label-md text-label-md hover:bg-surface-container-low mt-6 w-full cursor-pointer rounded-lg border border-[#E9ECEF] py-2 transition-colors"
                >
                  View Leaderboard
                </button>
              </section>
            </div>
          </div>
        </main>

        {/* Recently Viewed Modal */}
        {showRecentlyViewedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] p-4 backdrop-blur-sm transition-all">
            <div className="bg-surface-container-lowest border-outline-variant flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
              {/* Header */}
              <div className="border-outline-variant flex items-center justify-between border-b p-6">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-primary">history</span> Recently
                  Viewed
                </h3>
                <button
                  onClick={() => setShowRecentlyViewedModal(false)}
                  className="hover:bg-surface-container-low text-secondary flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {recentlyViewed.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setShowRecentlyViewedModal(false);
                        handleCardClick(doc.id, doc.title);
                      }}
                      className="bg-surface-container-low hover:bg-surface-container-high group border-outline-variant flex min-h-[140px] cursor-pointer flex-col justify-between rounded-xl border p-5 transition-all"
                    >
                      <div>
                        <div className="mb-2 flex items-start justify-between">
                          <span className="text-on-secondary-container font-label-sm text-label-sm rounded-full bg-[#E9ECEF] px-2.5 py-0.5 font-semibold">
                            {doc.subject?.code ?? 'GEN101'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/documents/${doc.id}/preview`);
                            }}
                            className="text-secondary hover:text-primary cursor-pointer p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined">download</span>
                          </button>
                        </div>
                        <h4 className="font-body-md text-body-md text-on-surface group-hover:text-primary mb-1 line-clamp-2 font-semibold transition-colors">
                          {doc.title}
                        </h4>
                        <p className="font-label-sm text-label-sm text-secondary line-clamp-1">
                          {doc.subject?.name ?? 'General'}
                        </p>
                      </div>
                      <div className="border-outline-variant text-secondary mt-3 flex items-center gap-4 border-t pt-3">
                        <span className="font-label-sm text-label-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>{' '}
                          {doc.viewCount}
                        </span>
                        <span className="font-label-sm text-label-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">thumb_up</span>{' '}
                          {doc.rating ? Math.round((doc.rating / 5) * 100) + '%' : '0%'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] p-4 backdrop-blur-sm transition-all">
            <div className="bg-surface-container-lowest border-outline-variant flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl">
              {/* Header */}
              <div className="border-outline-variant flex items-center justify-between border-b p-6">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-[#FFD700]">
                    workspace_premium
                  </span>{' '}
                  Leaderboard
                </h3>
                <button
                  onClick={() => setShowLeaderboardModal(false)}
                  className="hover:bg-surface-container-low text-secondary flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                {topContributors.map((c, idx) => {
                  let rankBadgeClass = 'bg-surface-variant text-on-surface-variant';
                  let rankColor = '';
                  if (idx === 0) {
                    rankBadgeClass = 'bg-[#FFD700] text-black font-bold';
                    rankColor = 'border-[#FFD700] bg-[#FFD700]/5';
                  } else if (idx === 1) {
                    rankBadgeClass = 'bg-[#C0C0C0] text-black font-bold';
                    rankColor = 'border-[#C0C0C0] bg-[#C0C0C0]/5';
                  } else if (idx === 2) {
                    rankBadgeClass = 'bg-[#CD7F32] text-white font-bold';
                    rankColor = 'border-[#CD7F32] bg-[#CD7F32]/5';
                  }

                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${rankColor ? `${rankColor} border-opacity-50` : 'border-outline-variant'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            alt={`${c.fullName}'s avatar`}
                            className="border-outline-variant h-11 w-11 rounded-full border object-cover"
                            src={
                              c.avatarUrl ||
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKnnE9P8WplUJMxgDKRUPtxvrITGrpi-hIFPFfkPJz6oIZBQQwhURIyhGnsxfdGzugqzkbfErVWvEXVDQj40Z8jZPgGOqIZxv-iQyguS7fnYjLa36ZJQnXbCk_lBFV7OxsVwQ3nvdhn0hnYgs75Q3OEbKjYauRURKkxAFUml8OZhtI9RB61neoZvyycGXvBcD6FfN7pEdKb-2n0h7XV1Hm6YScxugLFyu6R1-OspAxktJA0roF_6UUt98S76BVyaYvqEqcy1khE'
                            }
                          />
                          {idx < 3 && (
                            <span className="absolute -top-1 -right-1 text-xs">
                              {idx === 0 ? '👑' : idx === 1 ? '⭐' : '✨'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface font-semibold">
                            {c.fullName}
                          </p>
                          <p className="font-label-sm text-label-sm text-secondary">
                            {c.uploadedCount} docs uploaded
                          </p>
                        </div>
                      </div>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${rankBadgeClass}`}
                      >
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AI Cache Preview Modal */}
        {selectedDocumentId && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00000080] px-4 backdrop-blur-sm"
            onClick={() => setSelectedDocumentId(null)}
          >
            <div
              className="bg-surface border-outline-variant max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-label-sm text-secondary mb-2 font-semibold tracking-widest uppercase">
                    AI Cache Preview
                  </p>
                  <h2 className="text-headline-md text-primary font-bold">
                    {aiCache?.document.title ?? 'Loading document...'}
                  </h2>
                  {aiCache?.document.subject && (
                    <p className="text-secondary mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span>
                        {aiCache.document.subject.name} • {aiCache.document.subject.code}
                      </span>
                      {aiCache.document.copyrightSourceType && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            <span className="material-symbols-outlined text-[14px]">copyright</span>
                            {aiCache.document.copyrightSourceType === 'OWN_ORIGINAL' &&
                              'Tự biên soạn'}
                            {aiCache.document.copyrightSourceType === 'OPEN_LICENSE' && 'Nguồn mở'}
                          </span>
                          {aiCache.document.copyrightLicense && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              License: {aiCache.document.copyrightLicense}
                            </span>
                          )}
                          {aiCache.document.copyrightSourceUrl && (
                            <a
                              href={aiCache.document.copyrightSourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-xs text-blue-500 hover:underline"
                            >
                              Nguồn{' '}
                              <span className="material-symbols-outlined text-[12px]">
                                open_in_new
                              </span>
                            </a>
                          )}
                          {aiCache.document.copyrightAttribution && (
                            <span className="text-xs text-gray-500 italic">
                              By: {aiCache.document.copyrightAttribution}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedDocumentId(null)}
                  className="material-symbols-outlined text-secondary hover:text-primary hover:bg-surface-container-low cursor-pointer rounded-full p-2 transition-colors"
                >
                  close
                </button>
              </div>

              {isAiCacheLoading && (
                <div className="text-secondary flex items-center gap-3 py-8">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Loading summary and quizzes...
                </div>
              )}

              {aiCacheError && (
                <div className="bg-error-container text-on-error-container mb-4 rounded-xl p-4">
                  Failed to load AI cache. Please make sure the backend is running.
                </div>
              )}

              {aiCache && (
                <div className="space-y-6">
                  {/* AI Summary Section */}
                  <section className="bg-surface-container-lowest border-outline-variant rounded-xl border p-5">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <h3 className="text-primary text-lg font-bold">AI Summary</h3>
                      <span className="bg-surface-container-high text-secondary rounded-full px-3 py-1 text-xs">
                        {aiCache.summaries[0]?.status ?? 'NO SUMMARY'}
                      </span>
                    </div>

                    {aiCache.summaries.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-on-surface-variant leading-relaxed">
                          {aiCache.summaries[0].summaryText}
                        </p>

                        {aiCache.summaries[0].keyPoints && (
                          <div>
                            <h4 className="text-primary mb-2 font-semibold">Key Points</h4>
                            <ul className="text-on-surface-variant space-y-2">
                              {aiCache.summaries[0].keyPoints
                                .split('\n')
                                .filter(Boolean)
                                .map((point) => (
                                  <li key={point} className="flex gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{point.replace(/^•\s*/, '')}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-secondary">No summary available for this document.</p>
                    )}
                  </section>

                  {/* Quiz Section */}
                  <section className="bg-surface-container-lowest border-outline-variant rounded-xl border p-5">
                    <h3 className="text-primary mb-4 text-lg font-bold">
                      Quiz Questions ({aiCache.quizzes[0]?.questions.length ?? 0})
                    </h3>

                    {aiCache.quizzes.length > 0 ? (
                      <div className="space-y-5">
                        {aiCache.quizzes[0].questions.map((question, questionIndex) => (
                          <div
                            key={question.id}
                            className="border-outline-variant bg-surface rounded-xl border p-4"
                          >
                            <p className="text-primary mb-3 font-semibold">
                              {questionIndex + 1}. {question.questionText}
                            </p>

                            <div className="grid gap-2">
                              {question.options.map((option) => {
                                const selectedOptionId = selectedOptionIds[question.id];
                                const hasAnswered = Boolean(selectedOptionId);
                                const isSelected = selectedOptionId === option.id;
                                const isCorrectAnswer = option.isCorrect;

                                let optionClass =
                                  'border-outline-variant text-on-surface-variant hover:border-primary hover:bg-surface-container-low';

                                if (hasAnswered && isCorrectAnswer) {
                                  optionClass =
                                    'border-primary bg-primary-container/20 text-primary';
                                }

                                if (hasAnswered && isSelected && !isCorrectAnswer) {
                                  optionClass =
                                    'border-error bg-error-container text-on-error-container';
                                }

                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    disabled={hasAnswered}
                                    onClick={() => handleSelectOption(question.id, option.id)}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${optionClass} ${hasAnswered ? 'cursor-default' : 'cursor-pointer'
                                      }`}
                                  >
                                    {option.optionText}

                                    {hasAnswered && isCorrectAnswer && (
                                      <span className="ml-2 text-xs font-bold">(Correct)</span>
                                    )}

                                    {hasAnswered && isSelected && !isCorrectAnswer && (
                                      <span className="ml-2 text-xs font-bold">(Your answer)</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary">No quiz available for this document.</p>
                    )}
                  </section>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setSelectedDocumentId(null)}
                      className="border-outline-variant text-primary hover:bg-surface-container-low cursor-pointer rounded-lg border px-5 py-2 transition-colors"
                    >
                      Close
                    </button>

                    {!isDocumentOwner && (
                      <button
                        onClick={() => {
                          if (isDocumentFollowed) {
                            handleUnfollowDocument(aiCache.document.id);
                          } else {
                            handleFollowDocument(aiCache.document.id);
                          }
                        }}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-5 py-2 transition-all hover:shadow-md ${isDocumentFollowed
                          ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isDocumentFollowed ? 'bookmark_remove' : 'bookmark'}
                        </span>
                        {isDocumentFollowed ? 'Unfollow' : 'Follow'}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedDocumentId(null);
                        router.push(`/dashboard/documents/${aiCache.document.id}`);
                      }}
                      className="bg-primary text-on-primary cursor-pointer rounded-lg px-5 py-2 transition-all hover:shadow-md"
                    >
                      View Full
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] p-4 backdrop-blur-sm transition-all">
            <div className="bg-surface-container-lowest border-outline-variant flex w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl">
              {/* Header */}
              <div className="border-outline-variant flex items-center justify-between border-b p-6">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-primary">manage_accounts</span>{' '}
                  Edit Account
                </h3>
                <button
                  onClick={() => setShowEditAccountModal(false)}
                  className="hover:bg-surface-container-low text-secondary flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 p-6">
                {editError && (
                  <div className="bg-error-container text-on-error-container rounded-lg p-3 text-sm">
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-100 p-3 text-sm text-green-800">
                    {editSuccess}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="fullName"
                    className="font-label-md text-label-md text-on-surface font-semibold"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="bg-surface-container-low border-outline-variant text-on-surface focus:border-primary font-body-md text-body-md w-full rounded-lg border px-3 py-2 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="username"
                    className="font-label-md text-label-md text-on-surface font-semibold"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="bg-surface-container-low border-outline-variant text-on-surface focus:border-primary font-body-md text-body-md w-full rounded-lg border px-3 py-2 focus:outline-none"
                    placeholder="Enter a username"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="phoneNumber"
                    className="font-label-md text-label-md text-on-surface font-semibold"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="bg-surface-container-low border-outline-variant text-on-surface focus:border-primary font-body-md text-body-md w-full rounded-lg border px-3 py-2 focus:outline-none"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditAccountModal(false)}
                    className="border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md cursor-pointer rounded-lg border px-4 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="bg-primary text-on-primary font-label-md text-label-md flex min-w-[80px] cursor-pointer items-center justify-center rounded-lg px-5 py-2 transition-all hover:opacity-90"
                  >
                    {editLoading ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        sync
                      </span>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <TeacherVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="bg-background text-on-background flex min-h-screen w-full animate-pulse font-sans">
      {/* Sidebar Skeleton */}
      <div className="border-outline-variant bg-surface-container-lowest hidden h-screen w-64 flex-col border-r p-4 md:flex">
        <div className="bg-surface-container-high mb-8 h-8 w-3/4 rounded"></div>
        <div className="bg-surface-container-high mb-6 h-10 rounded"></div>
        <div className="space-y-4">
          <div className="bg-surface-container-low h-6 w-1/2 rounded"></div>
          <div className="bg-surface-container-low h-6 w-2/3 rounded"></div>
          <div className="bg-surface-container-low h-6 w-1/3 rounded"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex h-screen flex-grow flex-col">
        {/* Header Skeleton */}
        <div className="bg-surface-container-lowest border-outline-variant flex h-16 items-center justify-between border-b px-6">
          <div className="bg-surface-container-high h-8 w-96 animate-pulse rounded"></div>
          <div className="bg-surface-container-high h-8 w-8 animate-pulse rounded-full"></div>
        </div>

        {/* Body Skeleton */}
        <div className="flex-1 space-y-8 overflow-y-auto p-6 md:p-8">
          <div className="bg-surface-container-high h-12 w-1/2 animate-pulse rounded"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-surface-container-low col-span-2 h-32 animate-pulse rounded-xl"></div>
            <div className="bg-surface-container-low h-32 animate-pulse rounded-xl"></div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="bg-surface-container-high h-8 w-1/4 rounded"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="bg-surface-container-lowest border-outline-variant h-40 rounded-xl border"></div>
              <div className="bg-surface-container-lowest border-outline-variant h-40 rounded-xl border"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.replace('/login');
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  if (isLoggedIn === null || isLoggedIn === false) {
    return <DashboardSkeleton />;
  }

  return <DashboardPage />;
}
