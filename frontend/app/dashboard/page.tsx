'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import { dashboardApi, ExploreDocument, Contributor } from '@/services/dashboardApi';
import useSWR from 'swr';
import axiosClient from '@/utils/axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

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
  const response = await fetch(url);

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
  const [savedDocIds, setSavedDocIds] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ExploreDocument[]>([]);
  const [publicDocuments, setPublicDocuments] = useState<ExploreDocument[]>([]);
  const [trendingDocs, setTrendingDocs] = useState<ExploreDocument[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('User');
  const [showRecentlyViewedModal, setShowRecentlyViewedModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);

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
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj) {
          if (userObj.fullName) setUserFullName(userObj.fullName);
          setEditFullName(userObj.fullName || '');
          setEditUsername(userObj.username || '');
          setEditPhoneNumber(userObj.phoneNumber || '');
        }
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
    loadDashboardData();
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
    setSavedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
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
      setUserFullName(updatedUser.fullName);
      
      setEditSuccess('Cập nhật thông tin tài khoản thành công!');
      setTimeout(() => {
        setShowEditAccountModal(false);
        setEditSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errMsg = err.response?.data?.message || 'Cập nhật tài khoản thất bại!';
      setEditError(Array.isArray(errMsg) ? errMsg[0] : errMsg);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex font-sans">
      {/* Sidebar Nav */}
      <nav
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex fixed left-0 top-0 h-full flex-col p-4 border-r border-outline-variant bg-surface-container-lowest shadow-[0px_4px_12px_rgba(0,0,0,0.03)] w-64 z-20 transition-all`}
      >
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <div>
              <h1 className="font-headline-md text-headline-md text-primary">ScholarHub</h1>
              <p className="font-label-sm text-label-sm text-secondary">Academic Excellence</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-secondary p-1 hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-6 px-4">
          <button
            onClick={() => router.push('/explore')}
            className="w-full bg-primary-container text-on-primary py-3 px-4 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span> New Research
          </button>
        </div>

        <ul className="flex flex-col gap-2 flex-grow">
          <li>
            <a
              className="flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push('/dashboard');
              }}
            >
              <span className="material-symbols-outlined">explore</span> Discover
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('My Documents clicked (Simulated)');
              }}
            >
              <span className="material-symbols-outlined">description</span> My Documents
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push('/practice');
              }}
            >
              <span className="material-symbols-outlined">school</span> Practice Mode
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('AI Assistant clicked (Simulated)');
              }}
            >
              <span className="material-symbols-outlined">psychology</span> AI Assistant
            </a>
          </li>
        </ul>

        <ul className="flex flex-col gap-2 mt-auto border-t border-outline-variant pt-4">
          <li>
            <a
              className="flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Settings clicked (Simulated)');
              }}
            >
              <span className="material-symbols-outlined">settings</span> Settings
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Help clicked (Simulated)');
              }}
            >
              <span className="material-symbols-outlined">help</span> Help
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 text-error px-4 py-3 hover:bg-red-50 hover:text-rose-700 rounded-lg font-label-md text-label-md active:scale-95 transition-transform cursor-pointer"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem("token");
                router.replace("/");
              }}
            >
              <span className="material-symbols-outlined text-error">logout</span> Đăng xuất
            </a>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-surface shadow-[0px_4px_12px_rgba(0,0,0,0.03)] w-full">
          <div className="flex justify-between items-center w-full px-container-margin-desktop max-w-max-width mx-auto h-16">
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-primary hover:text-secondary transition-colors p-2 cursor-pointer"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <span className="font-headline-md text-headline-md text-primary">ScholarHub</span>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-body-md text-body-md outline-none"
                placeholder="Search for courses, documents, or keywords..."
                type="text"
              />
            </form>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/explore')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#212529] text-white rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity h-10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">upload</span> Upload
              </button>

              <button className="text-secondary hover:text-primary transition-colors p-2 relative cursor-pointer">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer flex items-center justify-center"
                >
                  <img
                    alt="User profile avatar"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYqSMGF3Z3oHdYhn5TKuHMKRLqgbBxxxtoRNxnakx4QY5gEAylvvaC7DqnO-6wRdWbBIdm8lN9SEhMxCbp8hakT47O6vbJLl91-97D8pkJXLj50c3nW8qB-8avFTT50YGPsF-9s6SN75_vCxKk31GsSz7WxQH4X-qlX6XGkFSqpq9alyYCX-ZxYLwHMCljNf0kwH5AertyqfjrTSYFBaxqzh-1604Hz7HFbNugFP3ndIVAs_2OpIbQSJgwvDs5Kcf11UWU6_PEEOQ"
                  />
                </button>

                {showAvatarDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowAvatarDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-2 z-40">
                      <button
                        onClick={() => {
                          setShowAvatarDropdown(false);
                          setShowEditAccountModal(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface font-label-md text-label-md transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">manage_accounts</span> Edit Account
                      </button>
                      <hr className="border-outline-variant my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-error-container/10 text-error font-label-md text-label-md transition-colors cursor-pointer flex items-center gap-2"
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
        <main className="flex-1 p-container-margin-mobile md:p-container-margin-desktop max-w-max-width mx-auto w-full">
          <section className="mb-12">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
              Welcome back, {userFullName}
            </h2>
            <p className="font-body-lg text-body-lg text-secondary">
              Here&apos;s what&apos;s happening in your academic world today.
            </p>
          </section>

          {/* Mobile Search Form */}
          <form onSubmit={handleSearchSubmit} className="md:hidden mb-6 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-body-md text-body-md outline-none"
              placeholder="Search for courses, documents, or keywords..."
              type="text"
            />
          </form>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 flex flex-col gap-8">
              {/* Recently Viewed */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Recently Viewed
                  </h3>
                  <a
                    className="font-label-md text-label-md text-primary-container hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowRecentlyViewedModal(true);
                    }}
                  >
                    View all
                  </a>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-secondary">Loading...</div>
                ) : recentlyViewed.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-dashed border-[#E9ECEF] shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col items-center">
                    <span className="material-symbols-outlined text-secondary text-4xl mb-2">find_in_page</span>
                    <p className="font-body-md text-body-md text-secondary">
                      Chưa xem, hãy khám phá tài liệu mà bạn muốn.
                    </p>
                    <button
                      onClick={() => router.push('/explore')}
                      className="mt-4 bg-[#212529] text-white py-2 px-4 rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Khám phá tài liệu
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-outline-variant snap-x snap-mandatory">
                    {recentlyViewed.slice(0, 8).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleCardClick(doc.id, doc.title)}
                        className="flex-shrink-0 w-[280px] sm:w-[320px] bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px] snap-start"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-[#E9ECEF] text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm">
                              {doc.subject?.code ?? 'GEN101'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.fileUrl, '_blank');
                              }}
                              className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary p-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </div>
                          <h4 className="font-body-lg text-body-lg font-semibold text-on-surface mb-1 line-clamp-2">
                            {doc.title}
                          </h4>
                          <p className="font-body-md text-body-md text-secondary line-clamp-1">
                            {doc.subject?.name ?? 'General'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E9ECEF] text-secondary">
                          <span className="flex items-center gap-1 font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px]">visibility</span>{' '}
                            {doc.viewCount}
                          </span>
                          <span className="flex items-center gap-1 font-label-sm text-label-sm">
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
                <div className="flex justify-between items-end mb-6">
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Public Documents
                  </h3>
                  <a
                    className="font-label-md text-label-md text-primary-container hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/explore');
                    }}
                  >
                    View all
                  </a>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-secondary">Loading...</div>
                ) : publicDocuments.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-dashed border-[#E9ECEF] shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                    <p className="font-body-md text-body-md text-secondary">
                      Chưa có tài liệu công khai nào khác từ cộng đồng.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {publicDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleCardClick(doc.id, doc.title)}
                        className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-[#E9ECEF] text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm">
                              {doc.subject?.code ?? 'GEN101'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.fileUrl, '_blank');
                              }}
                              className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary p-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </div>
                          <h4 className="font-body-lg text-body-lg font-semibold text-on-surface mb-1 line-clamp-2">
                            {doc.title}
                          </h4>
                          <p className="font-body-md text-body-md text-secondary line-clamp-1">
                            {doc.subject?.name ?? 'General'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E9ECEF] text-secondary">
                          <span className="flex items-center gap-1 font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px]">visibility</span>{' '}
                            {doc.viewCount}
                          </span>
                          <span className="flex items-center gap-1 font-label-sm text-label-sm">
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
                <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                  {loading ? (
                    <div className="text-center py-8 text-secondary">Loading...</div>
                  ) : trendingDocs.length === 0 ? (
                    <div className="p-8 text-center text-secondary">
                      Chưa có tài liệu thịnh hành.
                    </div>
                  ) : (
                    trendingDocs.map((doc) => {
                      const fileInfo = getFileTypeIconAndStyle(doc.fileType);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleCardClick(doc.id, doc.title)}
                          className="flex items-center justify-between p-4 sm:p-6 border-b border-[#E9ECEF] last:border-b-0 hover:bg-surface-container-low transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-12 h-12 rounded ${fileInfo.bgClass} flex items-center justify-center flex-shrink-0`}
                            >
                              <span className="material-symbols-outlined">{fileInfo.icon}</span>
                            </div>
                            <div>
                              <h4 className="font-body-md text-body-md font-semibold text-on-surface line-clamp-1">
                                {doc.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-secondary font-label-sm text-label-sm">
                                <span>{doc.subject?.name ?? 'General'}</span>
                                <span>•</span>
                                <span>{doc.subject?.code ?? 'GEN101'}</span>
                                <span>•</span>
                                <span className="text-[#212529] font-medium flex items-center gap-0.5 text-amber-600">
                                  <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                                  {doc.rating ? doc.rating.toFixed(1) : '0.0'} ({doc.rating ? Math.round((doc.rating / 5) * 100) + '%' : '0%'})
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
                            className={`hidden sm:block px-4 py-2 border rounded-full font-label-sm text-label-sm transition-colors cursor-pointer ${
                              savedDocIds.includes(doc.id)
                                ? 'bg-primary-container text-white border-primary-container'
                                : 'border-[#212529] text-[#212529] hover:bg-[#212529] hover:text-white'
                            }`}
                          >
                            {savedDocIds.includes(doc.id) ? 'Saved' : 'Save'}
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
              <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] h-fit">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">
                  Top Contributors
                </h3>
                <div className="flex flex-col gap-4">
                  {topContributors.length === 0 ? (
                    <p className="font-label-sm text-label-sm text-secondary text-center py-4">
                      Chưa có contributor nào.
                    </p>
                  ) : (
                    topContributors.slice(0, 3).map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            alt={`${c.fullName}'s avatar`}
                            className="w-10 h-10 rounded-full object-cover"
                            src={c.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKnnE9P8WplUJMxgDKRUPtxvrITGrpi-hIFPFfkPJz6oIZBQQwhURIyhGnsxfdGzugqzkbfErVWvEXVDQj40Z8jZPgGOqIZxv-iQyguS7fnYjLa36ZJQnXbCk_lBFV7OxsVwQ3nvdhn0hnYgs75Q3OEbKjYauRURKkxAFUml8OZhtI9RB61neoZvyycGXvBcD6FfN7pEdKb-2n0h7XV1Hm6YScxugLFyu6R1-OspAxktJA0roF_6UUt98S76BVyaYvqEqcy1khE"}
                          />
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">{c.fullName}</p>
                            <p className="font-label-sm text-label-sm text-secondary">
                              {c.uploadedCount} docs uploaded
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          idx === 0
                            ? 'bg-primary-fixed-dim text-on-primary-fixed'
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          #{idx + 1}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowLeaderboardModal(true)}
                  className="w-full mt-6 py-2 border border-[#E9ECEF] text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  View Leaderboard
                </button>
              </section>

              
            </div>
          </div>
        </main>

        {/* Recently Viewed Modal */}
        {showRecentlyViewedModal && (
          <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-surface-container-lowest rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span> Recently Viewed
                </h3>
                <button 
                  onClick={() => setShowRecentlyViewedModal(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors cursor-pointer text-secondary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentlyViewed.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setShowRecentlyViewedModal(false);
                        handleCardClick(doc.id, doc.title);
                      }}
                      className="bg-surface-container-low rounded-xl p-5 hover:bg-surface-container-high transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] border border-outline-variant"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-[#E9ECEF] text-on-secondary-container px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold">
                            {doc.subject?.code ?? 'GEN101'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.fileUrl, '_blank');
                            }}
                            className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary p-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined">download</span>
                          </button>
                        </div>
                        <h4 className="font-body-md text-body-md font-semibold text-on-surface mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {doc.title}
                        </h4>
                        <p className="font-label-sm text-label-sm text-secondary line-clamp-1">
                          {doc.subject?.name ?? 'General'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant text-secondary">
                        <span className="flex items-center gap-1 font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>{' '}
                          {doc.viewCount}
                        </span>
                        <span className="flex items-center gap-1 font-label-sm text-label-sm">
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
          <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FFD700]">workspace_premium</span> Leaderboard
                </h3>
                <button 
                  onClick={() => setShowLeaderboardModal(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors cursor-pointer text-secondary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
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
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        rankColor ? `${rankColor} border-opacity-50` : 'border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            alt={`${c.fullName}'s avatar`}
                            className="w-11 h-11 rounded-full object-cover border border-outline-variant"
                            src={c.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKnnE9P8WplUJMxgDKRUPtxvrITGrpi-hIFPFfkPJz6oIZBQQwhURIyhGnsxfdGzugqzkbfErVWvEXVDQj40Z8jZPgGOqIZxv-iQyguS7fnYjLa36ZJQnXbCk_lBFV7OxsVwQ3nvdhn0hnYgs75Q3OEbKjYauRURKkxAFUml8OZhtI9RB61neoZvyycGXvBcD6FfN7pEdKb-2n0h7XV1Hm6YScxugLFyu6R1-OspAxktJA0roF_6UUt98S76BVyaYvqEqcy1khE"}
                          />
                          {idx < 3 && (
                            <span className="absolute -top-1 -right-1 text-xs">
                              {idx === 0 ? '👑' : idx === 1 ? '⭐' : '✨'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface font-semibold">{c.fullName}</p>
                          <p className="font-label-sm text-label-sm text-secondary">
                            {c.uploadedCount} docs uploaded
                          </p>
                        </div>
                      </div>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${rankBadgeClass}`}>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00000080] backdrop-blur-sm px-4"
            onClick={() => setSelectedDocumentId(null)}
          >
            <div
              className="bg-surface border-outline-variant max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-label-sm text-secondary mb-2 tracking-widest uppercase font-semibold">
                    AI Cache Preview
                  </p>
                  <h2 className="text-headline-md text-primary font-bold">
                    {aiCache?.document.title ?? 'Loading document...'}
                  </h2>
                  {aiCache?.document.subject && (
                    <p className="text-secondary mt-1">
                      {aiCache.document.subject.name} • {aiCache.document.subject.code}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedDocumentId(null)}
                  className="material-symbols-outlined text-secondary hover:text-primary hover:bg-surface-container-low rounded-full p-2 transition-colors cursor-pointer"
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
                                  optionClass = 'border-primary bg-primary-container/20 text-primary';
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
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${optionClass} ${
                                      hasAnswered ? 'cursor-default' : 'cursor-pointer'
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
                      className="border-outline-variant text-primary hover:bg-surface-container-low rounded-lg border px-5 py-2 transition-colors cursor-pointer"
                    >
                      Close
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          getDocumentUrl(aiCache.document.fileUrl),
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }
                      className="bg-primary text-on-primary rounded-lg px-5 py-2 transition-all hover:shadow-md cursor-pointer"
                    >
                      Open File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditAccountModal && (
          <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl border border-outline-variant overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">manage_accounts</span> Edit Account
                </h3>
                <button 
                  onClick={() => setShowEditAccountModal(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors cursor-pointer text-secondary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-4">
                {editError && (
                  <div className="bg-error-container text-on-error-container text-sm rounded-lg p-3">
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="bg-green-100 text-green-800 border border-green-200 text-sm rounded-lg p-3">
                    {editSuccess}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="font-label-md text-label-md text-on-surface font-semibold">
                    Full Name (Họ và Tên)
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary font-body-md text-body-md"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="username" className="font-label-md text-label-md text-on-surface font-semibold">
                    Username (Tên Đăng Nhập)
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary font-body-md text-body-md"
                    placeholder="Enter a username"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phoneNumber" className="font-label-md text-label-md text-on-surface font-semibold">
                    Phone Number (Số Điện Thoại)
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary font-body-md text-body-md"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditAccountModal(false)}
                    className="border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-lg px-4 py-2 transition-colors font-label-md text-label-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="bg-primary text-on-primary hover:opacity-90 rounded-lg px-5 py-2 transition-all font-label-md text-label-md cursor-pointer flex items-center justify-center min-w-[80px]"
                  >
                    {editLoading ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="bg-background text-on-background min-h-screen flex font-sans animate-pulse w-full">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col p-4 border-r border-outline-variant bg-surface-container-lowest w-64 h-screen">
        <div className="h-8 bg-surface-container-high rounded mb-8 w-3/4"></div>
        <div className="h-10 bg-surface-container-high rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-6 bg-surface-container-low rounded w-1/2"></div>
          <div className="h-6 bg-surface-container-low rounded w-2/3"></div>
          <div className="h-6 bg-surface-container-low rounded w-1/3"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-grow flex flex-col h-screen">
        {/* Header Skeleton */}
        <div className="h-16 bg-surface-container-lowest border-b border-outline-variant px-6 flex items-center justify-between">
          <div className="h-8 bg-surface-container-high rounded w-96 animate-pulse"></div>
          <div className="h-8 bg-surface-container-high rounded-full w-8 animate-pulse"></div>
        </div>
        
        {/* Body Skeleton */}
        <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
          <div className="h-12 bg-surface-container-high rounded w-1/2 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-surface-container-low rounded-xl col-span-2 animate-pulse"></div>
            <div className="h-32 bg-surface-container-low rounded-xl animate-pulse"></div>
          </div>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-surface-container-high rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-40 bg-surface-container-lowest border border-outline-variant rounded-xl"></div>
              <div className="h-40 bg-surface-container-lowest border border-outline-variant rounded-xl"></div>
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
    const token = localStorage.getItem("token");
    if (!token) {
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
