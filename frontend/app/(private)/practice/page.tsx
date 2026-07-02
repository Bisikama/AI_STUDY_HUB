'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';

type Subject = {
  id: number;
  name: string;
  code: string;
};

type ExploreDocument = {
  id: string;
  title: string;
  description: string | null;
  subject: Subject | null;
  fileType: string;
  fileSize: string;
  quizCount: number;
  hasSummary: boolean;
  createdAt: string;
  copyrightSourceType?: string | null;
  copyrightAuthorName?: string | null;
  copyrightSourceUrl?: string | null;
  copyrightLicense?: string | null;
  copyrightAttribution?: string | null;
};

type DocumentSummary = {
  id: string;
  summaryText: string;
  keyPoints: string | null;
};

type QuizOption = {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  id: string;
  quizId: string;
  questionText: string;
  options: QuizOption[];
};

type Quiz = {
  id: string;
  documentId: string;
  title: string;
  questions: QuizQuestion[];
};

type ExploreAiCache = {
  document: Omit<ExploreDocument, 'quizCount' | 'hasSummary'>;
  summaries: DocumentSummary[];
  quizzes: Quiz[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const fetcher = async (url: string): Promise<ExploreDocument[]> => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to fetch explore documents');
  }
  const result = await response.json();
  return result.data || result;
};

const aiCacheFetcher = async (url: string): Promise<ExploreAiCache> => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to fetch AI Cache');
  }
  const result = await response.json();
  return result.data || result;
};

function PracticeSkeleton() {
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
          {/* Header Title Skeleton */}
          <div className="space-y-2">
            <div className="bg-surface-container-high h-10 w-1/2 animate-pulse rounded"></div>
            <div className="bg-surface-container-low h-6 w-3/4 animate-pulse rounded"></div>
          </div>

          {/* Documents Grid Skeleton */}
          <div className="space-y-4">
            <div className="bg-surface-container-high h-8 w-1/4 animate-pulse rounded"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest border-outline-variant h-40 animate-pulse space-y-4 rounded-xl border p-6"
                >
                  <div className="bg-surface-container-high h-6 w-1/3 rounded"></div>
                  <div className="bg-surface-container-low h-8 w-3/4 rounded"></div>
                  <div className="bg-surface-container-high h-6 w-1/2 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Stats Skeleton */}
          <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-surface-container-low col-span-2 h-32 rounded-xl"></div>
            <div className="bg-surface-container-low h-32 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashcardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[700px] animate-pulse flex-col items-center">
      {/* Flashcard Box Skeleton */}
      <div className="bg-surface-container-lowest border-outline-variant flex h-[480px] w-full flex-col items-center justify-between rounded-xl border p-8">
        <div className="bg-surface-container-high h-6 w-1/4 self-start rounded"></div>
        <div className="bg-surface-container-low my-auto h-8 w-3/4 rounded"></div>
        <div className="my-auto w-full max-w-md space-y-2.5">
          <div className="bg-surface-container-low h-8 w-full rounded"></div>
          <div className="bg-surface-container-low h-8 w-full rounded"></div>
          <div className="bg-surface-container-low h-8 w-full rounded"></div>
        </div>
        <div className="bg-surface-container-high h-6 w-1/2 rounded"></div>
      </div>
      {/* Nav Controls Skeleton */}
      <div className="mt-6 flex w-full flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between">
          <div className="bg-surface-container-high h-10 w-10 rounded-full"></div>
          <div className="bg-surface-container-high h-6 w-20 rounded"></div>
          <div className="bg-surface-container-high h-10 w-10 rounded-full"></div>
        </div>
        <div className="bg-surface-container-high h-12 w-full rounded-lg"></div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docParam = searchParams.get('documentId');

  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docParam);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [userFullName, setUserFullName] = useState('User');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj && userObj.fullName) {
          setUserFullName(userObj.fullName);
        }
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
  }, []);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  // States cho Flashcards
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // State kích hoạt AI phân tích tài liệu
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Fetch danh sách tài liệu
  const { data: documents = [], error: docsError } = useSWR(`${API_BASE_URL}/api/explore`, fetcher);

  // Fetch AI Cache (Summary + Quizzes) khi chọn tài liệu
  const {
    data: aiCache,
    error: cacheError,
    mutate: reloadAiCache,
  } = useSWR(
    selectedDocId ? `${API_BASE_URL}/api/explore/${selectedDocId}/ai-cache` : null,
    aiCacheFetcher,
  );

  // Đồng bộ param URL
  useEffect(() => {
    if (docParam) {
      setSelectedDocId(docParam);
    }
  }, [docParam]);

  // Trích xuất danh sách câu hỏi làm nguồn thẻ ghi nhớ
  const questions = useMemo(() => {
    if (aiCache?.quizzes && aiCache.quizzes.length > 0) {
      return aiCache.quizzes[0].questions;
    }
    return [];
  }, [aiCache]);

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1));
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev < questions.length - 1 ? prev + 1 : 0));
  };

  // Điều hướng bàn phím để lật thẻ
  useEffect(() => {
    if (questions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard();
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions, currentCardIndex]);

  // Gọi API kích hoạt AI tạo summary và quiz
  const handleGenerateQuiz = async () => {
    if (!selectedDocId) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/analyze/${selectedDocId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Yêu cầu phân tích thất bại');
      }

      await reloadAiCache();
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Lọc tài liệu theo tìm kiếm
  const filteredDocuments = useMemo(() => {
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.subject?.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.subject?.code.toLowerCase().includes(search.toLowerCase()),
    );
  }, [documents, search]);

  const currentDoc = useMemo(() => {
    return documents.find((doc) => doc.id === selectedDocId);
  }, [documents, selectedDocId]);

  // Loading state cho danh sách tài liệu
  const isLoadingDocs = documents.length === 0 && !docsError;

  if (isLoadingDocs && !selectedDocId) {
    return <PracticeSkeleton />;
  }

  return (
    <div className="bg-background text-on-background flex min-h-screen font-sans">
      {/* Sidebar Nav */}
      <nav
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
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
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
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
              className="bg-surface-container-low text-primary font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 font-semibold transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">lightbulb</span> Practice Mode
            </Link>
          </li>
        </ul>

        <ul className="border-outline-variant mt-auto flex flex-col gap-2 border-t pt-4">
          <li>
            <button
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left transition-transform active:scale-95"
              onClick={() => toast.info('Settings clicked (Simulated)')}
            >
              <span className="material-symbols-outlined">settings</span> Settings
            </button>
          </li>
          <li>
            <button
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left transition-transform active:scale-95"
              onClick={() => toast.info('Help clicked (Simulated)')}
            >
              <span className="material-symbols-outlined">help</span> Help
            </button>
          </li>
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
      <div className="flex min-h-screen flex-grow flex-col md:ml-64">
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
              onSubmit={(e) => e.preventDefault()}
              className="relative mx-8 hidden max-w-2xl flex-1 md:flex"
            >
              <span className="material-symbols-outlined text-secondary absolute top-1/2 left-4 -translate-y-1/2">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-container-low text-on-surface focus:ring-primary focus:bg-surface-container-lowest font-body-md text-body-md w-full rounded-full border-none py-2.5 pr-4 pl-12 transition-all outline-none focus:ring-2"
                placeholder="Tìm kiếm tài liệu học tập..."
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

              <button className="text-secondary hover:text-primary relative cursor-pointer p-2 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="bg-error absolute top-2 right-2 h-2 w-2 rounded-full"></span>
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
                      <div className="border-outline-variant border-b px-4 py-2">
                        <p className="font-body-md text-on-surface truncate font-semibold">
                          {userFullName}
                        </p>
                      </div>
                      <button
                        className="hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors"
                        onClick={() => {
                          setShowAvatarDropdown(false);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>{' '}
                        Profile
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

        {/* Content Body */}
        <main className="mx-auto w-full max-w-5xl flex-grow p-6 md:p-8">
          {/* Mobile Search Form */}
          <form onSubmit={(e) => e.preventDefault()} className="relative mb-6 md:hidden">
            <span className="material-symbols-outlined text-secondary absolute top-1/2 left-4 -translate-y-1/2">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-container-low text-on-surface focus:ring-primary focus:bg-surface-container-lowest font-body-md text-body-md w-full rounded-full border-none py-2.5 pr-4 pl-12 transition-all outline-none focus:ring-2"
              placeholder="Tìm kiếm tài liệu học tập..."
              type="text"
            />
          </form>
          {!selectedDocId ? (
            /* =======================================================
               DS TÀI LIỆU CẦN ÔN TẬP
               ======================================================= */
            <>
              <section className="mb-10">
                <h3 className="text-primary mb-4 text-lg font-bold">Tài liệu của bạn</h3>
                {filteredDocuments.length === 0 ? (
                  <div className="bg-surface-container-lowest border-outline-variant rounded-xl border p-8 text-center">
                    <span className="material-symbols-outlined text-secondary mb-2 text-4xl">
                      library_books
                    </span>
                    <p className="text-secondary font-body-md">Không tìm thấy tài liệu phù hợp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className="bg-surface-container-lowest border-outline-variant group flex cursor-pointer flex-col gap-4 rounded-xl border p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)]"
                      >
                        <div className="flex items-start justify-between">
                          <span className="bg-secondary-container text-on-secondary-container rounded px-2.5 py-1 text-xs font-semibold">
                            {doc.subject?.code || 'Chung'} -{' '}
                            {doc.subject?.name || 'Tài liệu học tập'}
                          </span>
                          <span className="material-symbols-outlined text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                            arrow_forward
                          </span>
                        </div>
                        <h4 className="text-primary line-clamp-2 text-base font-bold transition-colors group-hover:text-black">
                          {doc.title}
                        </h4>
                        <div className="text-on-surface-variant border-outline-variant/30 mt-auto flex items-center gap-4 border-t pt-2 text-xs">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">quiz</span>
                            {doc.quizCount > 0 ? `${doc.quizCount} câu hỏi` : 'Chưa có câu hỏi'}
                          </span>
                          <span className="bg-outline-variant h-1.5 w-1.5 rounded-full"></span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">assignment</span>
                            {doc.hasSummary ? 'Đã tóm tắt' : 'Chưa tóm tắt'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Bento Row giống giao diện mẫu */}
              <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="bg-primary text-on-primary col-span-1 flex items-center justify-between rounded-xl p-6 md:col-span-2">
                  <div>
                    <h5 className="font-headline-md mb-1 text-lg font-bold">
                      Chuỗi ôn tập: 12 ngày
                    </h5>
                    <p className="font-body-md text-sm opacity-80">
                      Bạn đang nằm trong top 5% học viên tích cực tuần này. Hãy tiếp tục nhé!
                    </p>
                  </div>
                  <div className="border-on-primary/20 bg-on-primary/10 hidden h-16 w-16 items-center justify-center rounded-full border-4 sm:flex">
                    <span className="material-symbols-outlined filled text-on-primary text-3xl">
                      local_fire_department
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container-highest border-outline-variant flex flex-col justify-between rounded-xl border p-6">
                  <h5 className="text-on-surface-variant text-xs font-semibold tracking-wider uppercase">
                    Thời gian học hôm nay
                  </h5>
                  <span className="text-primary text-3xl font-bold">42 phút</span>
                  <p className="text-on-surface-variant text-xs">
                    Còn 18 phút nữa để đạt mục tiêu ngày
                  </p>
                </div>
              </section>
            </>
          ) : (
            /* =======================================================
               CHẾ ĐỘ ÔN TẬP TÀI LIỆU CỤ THỂ (HÌNH THỨC FLASHCARD)
               ======================================================= */
            <div>
              {/* Back button */}
              <button
                onClick={() => {
                  setSelectedDocId(null);
                  router.push('/practice');
                }}
                className="text-secondary hover:text-primary mb-6 flex cursor-pointer items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Quay lại danh sách tài liệu
              </button>

              {/* Header Info */}
              <div className="mb-6">
                <span className="bg-secondary-container text-on-secondary-container mb-2 inline-block rounded px-2.5 py-1 text-xs font-semibold">
                  {currentDoc?.subject?.code || 'Chung'} -{' '}
                  {currentDoc?.subject?.name || 'Tài liệu học tập'}
                </span>
                <h1 className="text-primary text-xl leading-tight font-bold md:text-2xl">
                  {currentDoc?.title || 'Đang tải tài liệu...'}
                </h1>
              </div>

              {cacheError && (
                <div className="bg-error-container text-on-error-container border-error/20 mb-6 rounded-xl border p-4 text-sm">
                  Không thể tải nội dung câu hỏi. Vui lòng kiểm tra lại.
                </div>
              )}

              {/* Render Skeletons or Contents dynamically */}
              {!aiCache && !cacheError ? (
                /* Flashcard loading skeleton instead of raw spinner */
                <FlashcardSkeleton />
              ) : questions.length === 0 ? (
                /* Tài liệu chưa phân tích AI (Chưa có quiz) */
                <div className="bg-surface-container-lowest border-outline-variant flex flex-col items-center gap-4 rounded-xl border p-8 text-center">
                  <span className="material-symbols-outlined text-secondary text-5xl">
                    psychology
                  </span>
                  <h3 className="text-primary text-lg font-bold">Chưa có câu hỏi ôn tập</h3>
                  <p className="text-on-surface-variant max-w-md text-sm">
                    Tài liệu này chưa được phân tích nội dung để tạo câu hỏi trắc nghiệm & thẻ ghi
                    nhớ. Bạn có muốn kích hoạt AI xử lý ngay không? (Mất khoảng 15-30 giây)
                  </p>
                  {analyzeError && (
                    <p className="text-error bg-error-container border-error/10 max-w-md rounded border p-2 text-xs">
                      Lỗi: {analyzeError}
                    </p>
                  )}
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isAnalyzing}
                    className="bg-primary text-on-primary flex cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Đang phân tích tài liệu...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">auto_awesome</span>
                        Tạo câu hỏi bằng AI
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Bắt đầu ôn thẻ ghi nhớ */
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className={`group perspective-1000 relative h-[480px] w-full max-w-[700px] cursor-pointer ${
                      isFlipped ? 'flashcard-flipped' : ''
                    }`}
                  >
                    <div className="flashcard-inner border-outline-variant relative h-full w-full rounded-xl border text-center shadow-[0px_4px_16px_rgba(0,0,0,0.06)]">
                      {/* Mặt Trước (Front Side): Câu hỏi + 4 đáp án A, B, C, D */}
                      <div className="flashcard-front bg-surface-container-lowest absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-xl p-6 md:p-8">
                        <span className="text-on-surface-variant absolute top-4 left-4 text-xs font-semibold tracking-wider uppercase">
                          Câu hỏi ôn tập ({currentCardIndex + 1}/{questions.length})
                        </span>

                        <h2 className="text-primary mt-4 mb-6 max-w-xl text-center text-base leading-relaxed font-bold md:text-lg">
                          {questions[currentCardIndex].questionText}
                        </h2>

                        {/* Danh sách 4 lựa chọn phía dưới câu hỏi */}
                        <div className="w-full max-w-lg space-y-2.5">
                          {questions[currentCardIndex].options.map((opt, oIndex) => {
                            const label = ['A', 'B', 'C', 'D'][oIndex] || 'A';
                            return (
                              <div
                                key={opt.id}
                                className="border-outline-variant bg-surface-container-low text-on-surface-variant flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-xs md:text-sm"
                              >
                                <span className="text-primary bg-surface border-outline-variant/60 flex h-6 w-6 min-w-[1.5rem] items-center justify-center rounded border font-extrabold">
                                  {label}
                                </span>
                                <span className="flex-1">{opt.optionText}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-on-surface-variant mt-6 flex animate-pulse items-center gap-1.5 text-xs">
                          <span className="material-symbols-outlined text-sm">touch_app</span>
                          Nhấn để lật thẻ xem đáp án đúng (hoặc phím cách Space)
                        </div>
                      </div>

                      {/* Mặt Sau (Back Side): Chỉ hiển thị đáp án đúng kèm nhãn A, B, C, D */}
                      <div className="flashcard-back bg-surface-container absolute inset-0 flex flex-col items-center justify-center rounded-xl p-8">
                        <span className="text-on-surface-variant absolute top-4 left-4 text-xs font-semibold tracking-wider uppercase">
                          Đáp án đúng của thẻ ghi nhớ
                        </span>

                        <div className="max-w-xl text-center">
                          {(() => {
                            const correctIndex = questions[currentCardIndex].options.findIndex(
                              (opt) => opt.isCorrect,
                            );
                            const correctLabel = ['A', 'B', 'C', 'D'][correctIndex] || 'A';
                            const correctOpt = questions[currentCardIndex].options[correctIndex];

                            return (
                              <div className="flex flex-col items-center gap-4">
                                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100/50 text-4xl font-extrabold text-emerald-600 shadow-inner">
                                  {correctLabel}
                                </span>
                                <h3 className="text-primary text-lg leading-snug font-extrabold md:text-xl">
                                  {correctOpt?.optionText || 'Không có đáp án'}
                                </h3>
                              </div>
                            );
                          })()}

                          <div className="mt-6 inline-block rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                            Đáp án chuẩn xác từ hệ thống
                          </div>
                        </div>

                        <div className="text-on-surface-variant absolute bottom-6 flex items-center gap-1.5 text-xs">
                          <span className="material-symbols-outlined text-sm">touch_app</span>
                          Nhấn để lật lại mặt trước câu hỏi
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Navigations & Action Button */}
                  <div className="mt-6 flex w-full max-w-[700px] flex-col items-center gap-4">
                    <div className="flex w-full items-center justify-between">
                      <button
                        onClick={handlePrevCard}
                        className="hover:bg-surface-container-high border-outline-variant cursor-pointer rounded-full border p-2.5 transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <span className="text-on-surface-variant text-sm font-semibold tracking-wider">
                        {String(currentCardIndex + 1).padStart(2, '0')} /{' '}
                        {String(questions.length).padStart(2, '0')}
                      </span>
                      <button
                        onClick={handleNextCard}
                        className="hover:bg-surface-container-high border-outline-variant cursor-pointer rounded-full border p-2.5 transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>

                    <button
                      onClick={() => router.push(`/practice/doTest?documentId=${selectedDocId}`)}
                      className="bg-primary-container text-on-primary flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-3.5 font-bold transition-opacity hover:opacity-90 active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined">assignment_turned_in</span>
                      Bắt đầu bài kiểm tra trắc nghiệm
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
