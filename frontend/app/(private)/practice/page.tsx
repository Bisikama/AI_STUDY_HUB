'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

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
  fileUrl: string;
  fileType: string;
  fileSize: string;
  quizCount: number;
  hasSummary: boolean;
  createdAt: string;
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch explore documents');
  }
  const result = await response.json();
  return result.data || result;
};

const aiCacheFetcher = async (url: string): Promise<ExploreAiCache> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch AI Cache');
  }
  const result = await response.json();
  return result.data || result;
};

function PracticeSkeleton() {
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
          {/* Header Title Skeleton */}
          <div className="space-y-2">
            <div className="h-10 bg-surface-container-high rounded w-1/2 animate-pulse"></div>
            <div className="h-6 bg-surface-container-low rounded w-3/4 animate-pulse"></div>
          </div>
          
          {/* Documents Grid Skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-surface-container-high rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4 animate-pulse">
                  <div className="h-6 bg-surface-container-high rounded w-1/3"></div>
                  <div className="h-8 bg-surface-container-low rounded w-3/4"></div>
                  <div className="h-6 bg-surface-container-high rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-surface-container-low rounded-xl col-span-2"></div>
            <div className="h-32 bg-surface-container-low rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashcardSkeleton() {
  return (
    <div className="flex flex-col items-center w-full max-w-[700px] animate-pulse mx-auto">
      {/* Flashcard Box Skeleton */}
      <div className="w-full h-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col items-center justify-between">
        <div className="h-6 bg-surface-container-high rounded w-1/4 self-start"></div>
        <div className="h-8 bg-surface-container-low rounded w-3/4 my-auto"></div>
        <div className="w-full max-w-md space-y-2.5 my-auto">
          <div className="h-8 bg-surface-container-low rounded w-full"></div>
          <div className="h-8 bg-surface-container-low rounded w-full"></div>
          <div className="h-8 bg-surface-container-low rounded w-full"></div>
        </div>
        <div className="h-6 bg-surface-container-high rounded w-1/2"></div>
      </div>
      {/* Nav Controls Skeleton */}
      <div className="mt-6 flex flex-col items-center gap-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="h-10 w-10 bg-surface-container-high rounded-full"></div>
          <div className="h-6 bg-surface-container-high rounded w-20"></div>
          <div className="h-10 w-10 bg-surface-container-high rounded-full"></div>
        </div>
        <div className="h-12 bg-surface-container-high rounded-lg w-full"></div>
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
    aiCacheFetcher
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

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1));
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev < questions.length - 1 ? prev + 1 : 0));
  };

  // Gọi API kích hoạt AI tạo summary và quiz
  const handleGenerateQuiz = async () => {
    if (!selectedDocId) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}/api/documents/analyze/${selectedDocId}`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
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
    return documents.filter((doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.subject?.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.subject?.code.toLowerCase().includes(search.toLowerCase())
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
              <h1 className="font-headline-md text-headline-md text-primary font-bold">ScholarHub</h1>
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
            className="w-full bg-primary-container text-on-primary py-3 px-4 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer font-semibold"
          >
            <span className="material-symbols-outlined">add</span> New Research
          </button>
        </div>

        <ul className="flex flex-col gap-2 flex-grow">
          <li>
            <button
              className="w-full flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform text-left cursor-pointer"
              onClick={() => router.push('/explore')}
            >
              <span className="material-symbols-outlined">explore</span> Discover
            </button>
          </li>
          <li>
            <button
              className="w-full flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform text-left cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
              <span className="material-symbols-outlined">description</span> My Documents
            </button>
          </li>
          <li>
            <button
              className="w-full flex items-center gap-3 text-primary bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg font-label-md text-label-md active:scale-95 transition-transform text-left font-semibold"
              onClick={() => {
                setSelectedDocId(null);
                router.push('/practice');
              }}
            >
              <span className="material-symbols-outlined filled">school</span> Practice Mode
            </button>
          </li>
          <li>
            <button
              className="w-full flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform text-left cursor-pointer"
              onClick={() => alert('AI Assistant clicked (Simulated)')}
            >
              <span className="material-symbols-outlined">psychology</span> AI Assistant
            </button>
          </li>
        </ul>

        <ul className="flex flex-col gap-2 mt-auto border-t border-outline-variant pt-4">
          <li>
            <button
              className="w-full flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform text-left cursor-pointer"
              onClick={() => alert('Settings clicked (Simulated)')}
            >
              <span className="material-symbols-outlined">settings</span> Settings
            </button>
          </li>
          <li>
            <button
              className="w-full flex items-center gap-3 text-secondary px-4 py-3 hover:bg-surface-container-low rounded-lg font-label-md text-label-md active:scale-95 transition-transform text-left cursor-pointer"
              onClick={() => alert('Help clicked (Simulated)')}
            >
              <span className="material-symbols-outlined">help</span> Help
            </button>
          </li>
          <li>
            <button
              className="w-full flex items-center gap-3 text-error hover:bg-red-50 hover:text-rose-700 px-4 py-3 rounded-lg font-label-md text-label-md active:scale-95 transition-transform text-left cursor-pointer font-semibold"
              onClick={() => {
                localStorage.removeItem('token');
                router.replace('/');
              }}
            >
              <span className="material-symbols-outlined text-error">logout</span> Đăng xuất
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="flex justify-between items-center w-full px-6 h-16 bg-surface-container-lowest shadow-sm border-b border-outline-variant">
          <div className="flex items-center gap-4 flex-grow max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-secondary p-1 hover:text-primary"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 focus:ring-1 focus:ring-primary text-body-md"
                placeholder="Tìm kiếm tài liệu học tập..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined cursor-pointer hover:bg-surface-container rounded-full p-2 transition-colors">notifications</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline bg-surface-variant">
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmRIQIc6LO9lV5rVtojZ7Vh-4aAm0za_O0i5ayKA2xj5hmmtTyNfQvFCZNPhEfrXG_1djLfBLkYl-oRMknt4VMjwDxAHTLWyqk3U8mvXoulTPKmZi_lPoDe5yP9DJa1_HnZhUWZF8pI3XxjStB2JqRcoeuyOfo7DSOd9-q8HaWShAn_Rqgu1w26jKT2gX7DqpcPd3kC4Uam3KP7ywqZsOefPY_o9YIMdPmCJHLvDhiQBVe4ou63D8uVWKJY3uShYdVn9kYtYeSsJg"
              />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-6 md:p-8 max-w-5xl w-full mx-auto">
          {!selectedDocId ? (
            /* =======================================================
               DS TÀI LIỆU CẦN ÔN TẬP
               ======================================================= */
            <>
              <section className="mb-8">
                <h2 className="text-headline-md font-headline-md text-primary font-bold tracking-tight mb-2 animate-fadeIn">
                  Hệ thống Ôn tập & Kiểm tra
                </h2>
                <p className="text-on-surface-variant text-body-md">
                  Lật thẻ ghi nhớ để học nhanh lý thuyết và kiểm tra ngay năng lực học tập bằng trắc nghiệm do AI tạo.
                </p>
              </section>

              <section className="mb-10">
                <h3 className="text-lg font-bold text-primary mb-4">Tài liệu của bạn</h3>
                {filteredDocuments.length === 0 ? (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-secondary mb-2">library_books</span>
                    <p className="text-secondary font-body-md">Không tìm thấy tài liệu phù hợp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col gap-4 group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded">
                            {doc.subject?.code || 'Chung'} - {doc.subject?.name || 'Tài liệu học tập'}
                          </span>
                          <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </div>
                        <h4 className="text-base font-bold text-primary group-hover:text-black transition-colors line-clamp-2">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-auto pt-2 border-t border-outline-variant/30">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">quiz</span>
                            {doc.quizCount > 0 ? `${doc.quizCount} câu hỏi` : 'Chưa có câu hỏi'}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
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
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="col-span-1 md:col-span-2 bg-primary text-on-primary p-6 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-headline-md text-lg font-bold mb-1">Chuỗi ôn tập: 12 ngày</h5>
                    <p className="font-body-md text-sm opacity-80">Bạn đang nằm trong top 5% học viên tích cực tuần này. Hãy tiếp tục nhé!</p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-full border-4 border-on-primary/20 bg-on-primary/10">
                    <span className="material-symbols-outlined text-3xl filled text-on-primary">local_fire_department</span>
                  </div>
                </div>
                <div className="bg-surface-container-highest p-6 rounded-xl border border-outline-variant flex flex-col justify-between">
                  <h5 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thời gian học hôm nay</h5>
                  <span className="text-3xl font-bold text-primary">42 phút</span>
                  <p className="text-xs text-on-surface-variant">Còn 18 phút nữa để đạt mục tiêu ngày</p>
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
                className="flex items-center gap-1.5 text-secondary hover:text-primary mb-6 text-sm font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Quay lại danh sách tài liệu
              </button>

              {/* Header Info */}
              <div className="mb-6">
                <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded mb-2 inline-block">
                  {currentDoc?.subject?.code || 'Chung'} - {currentDoc?.subject?.name || 'Tài liệu học tập'}
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-primary leading-tight">
                  {currentDoc?.title || 'Đang tải tài liệu...'}
                </h1>
              </div>

              {cacheError && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 mb-6 text-sm">
                  Không thể tải nội dung câu hỏi. Vui lòng kiểm tra lại.
                </div>
              )}

              {/* Render Skeletons or Contents dynamically */}
              {!aiCache && !cacheError ? (
                /* Flashcard loading skeleton instead of raw spinner */
                <FlashcardSkeleton />
              ) : questions.length === 0 ? (
                /* Tài liệu chưa phân tích AI (Chưa có quiz) */
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-5xl text-secondary">psychology</span>
                  <h3 className="text-lg font-bold text-primary">Chưa có câu hỏi ôn tập</h3>
                  <p className="text-on-surface-variant text-sm max-w-md">
                    Tài liệu này chưa được phân tích nội dung để tạo câu hỏi trắc nghiệm & thẻ ghi nhớ. Bạn có muốn kích hoạt AI xử lý ngay không? (Mất khoảng 15-30 giây)
                  </p>
                  {analyzeError && (
                    <p className="text-error text-xs bg-error-container p-2 rounded max-w-md border border-error/10">
                      Lỗi: {analyzeError}
                    </p>
                  )}
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isAnalyzing}
                    className="bg-primary text-on-primary font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
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
                    className={`relative w-full max-w-[700px] h-[480px] cursor-pointer group perspective-1000 ${
                      isFlipped ? 'flashcard-flipped' : ''
                    }`}
                  >
                    <div className="flashcard-inner relative w-full h-full text-center shadow-[0px_4px_16px_rgba(0,0,0,0.06)] rounded-xl border border-outline-variant">
                      {/* Mặt Trước (Front Side): Câu hỏi + 4 đáp án A, B, C, D */}
                      <div className="flashcard-front absolute inset-0 bg-surface-container-lowest flex flex-col items-center justify-center p-6 md:p-8 rounded-xl overflow-y-auto">
                        <span className="absolute top-4 left-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                          Câu hỏi ôn tập ({currentCardIndex + 1}/{questions.length})
                        </span>
                        
                        <h2 className="text-base md:text-lg font-bold text-primary text-center max-w-xl leading-relaxed mb-6 mt-4">
                          {questions[currentCardIndex].questionText}
                        </h2>

                        {/* Danh sách 4 lựa chọn phía dưới câu hỏi */}
                        <div className="w-full max-w-lg space-y-2.5">
                          {questions[currentCardIndex].options.map((opt, oIndex) => {
                            const label = ['A', 'B', 'C', 'D'][oIndex] || 'A';
                            return (
                              <div
                                key={opt.id}
                                className="text-left w-full text-xs md:text-sm border border-outline-variant bg-surface-container-low px-4 py-2.5 rounded-lg text-on-surface-variant flex items-center gap-3"
                              >
                                <span className="font-extrabold text-primary min-w-[1.5rem] h-6 w-6 rounded bg-surface flex items-center justify-center border border-outline-variant/60">
                                  {label}
                                </span>
                                <span className="flex-1">{opt.optionText}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-6 flex items-center gap-1.5 text-xs text-on-surface-variant animate-pulse">
                          <span className="material-symbols-outlined text-sm">touch_app</span>
                          Nhấn để lật thẻ xem đáp án đúng (hoặc phím cách Space)
                        </div>
                      </div>

                      {/* Mặt Sau (Back Side): Chỉ hiển thị đáp án đúng kèm nhãn A, B, C, D */}
                      <div className="flashcard-back absolute inset-0 bg-surface-container flex flex-col items-center justify-center p-8 rounded-xl">
                        <span className="absolute top-4 left-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                          Đáp án đúng của thẻ ghi nhớ
                        </span>
                        
                        <div className="text-center max-w-xl">
                          {(() => {
                            const correctIndex = questions[currentCardIndex].options.findIndex((opt) => opt.isCorrect);
                            const correctLabel = ['A', 'B', 'C', 'D'][correctIndex] || 'A';
                            const correctOpt = questions[currentCardIndex].options[correctIndex];

                            return (
                              <div className="flex flex-col items-center gap-4">
                                <span className="text-4xl font-extrabold text-emerald-600 bg-emerald-100/50 border border-emerald-200 h-16 w-16 rounded-full flex items-center justify-center shadow-inner">
                                  {correctLabel}
                                </span>
                                <h3 className="text-lg md:text-xl font-extrabold text-primary leading-snug">
                                  {correctOpt?.optionText || 'Không có đáp án'}
                                </h3>
                              </div>
                            );
                          })()}

                          <div className="mt-6 inline-block px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                            Đáp án chuẩn xác từ hệ thống
                          </div>
                        </div>

                        <div className="absolute bottom-6 flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">touch_app</span>
                          Nhấn để lật lại mặt trước câu hỏi
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Navigations & Action Button */}
                  <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-[700px]">
                    <div className="flex items-center justify-between w-full">
                      <button
                        onClick={handlePrevCard}
                        className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors border border-outline-variant cursor-pointer"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <span className="font-semibold text-sm tracking-wider text-on-surface-variant">
                        {String(currentCardIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                      </span>
                      <button
                        onClick={handleNextCard}
                        className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors border border-outline-variant cursor-pointer"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/practice/doTest?documentId=${selectedDocId}`)}
                      className="w-full bg-primary-container text-on-primary font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.99] cursor-pointer"
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
