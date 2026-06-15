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

export default function DoTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId');

  // Điều hướng câu hỏi
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // States quản lý câu trả lời
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Bộ đếm thời gian: 20 phút (1200 giây)
  const [timeLeft, setTimeLeft] = useState(1200);

  // Fetch dữ liệu câu hỏi từ AI Cache của tài liệu
  const { data: aiCache, error } = useSWR(
    documentId ? `${API_BASE_URL}/api/explore/${documentId}/ai-cache` : null,
    aiCacheFetcher
  );

  const questions = useMemo(() => {
    if (aiCache?.quizzes && aiCache.quizzes.length > 0) {
      return aiCache.quizzes[0].questions;
    }
    return [];
  }, [aiCache]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (isSubmitted || questions.length === 0) return;

    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, questions]);

  // Định dạng thời gian MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Tự động nộp bài khi hết giờ
  const handleAutoSubmit = () => {
    alert('Hết thời gian làm bài! Hệ thống đang tự động nộp bài làm của bạn.');
    handleSubmitQuiz();
  };

  // Xử lý chọn đáp án
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Nộp bài và tính điểm
  const handleSubmitQuiz = () => {
    if (isSubmitted || questions.length === 0) return;

    let correctCount = 0;
    questions.forEach((q) => {
      const chosenOptId = selectedAnswers[q.id];
      const correctOpt = q.options.find((opt) => opt.isCorrect);
      if (chosenOptId && correctOpt && chosenOptId === correctOpt.id) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);
    setMobileSidebarOpen(false);
  };

  // Làm lại bài test
  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setTimeLeft(1200);
    setCurrentIdx(0);
  };

  // Thoát khỏi chế độ làm bài test, quay lại mục ôn tập tài liệu
  const handleExitQuiz = () => {
    if (!isSubmitted) {
      const confirmExit = window.confirm(
        'Bạn có chắc chắn muốn thoát? Kết quả bài làm hiện tại sẽ không được lưu.'
      );
      if (!confirmExit) return;
    }
    router.push(`/practice?documentId=${documentId}`);
  };

  // Tiến trình hoàn thành (%)
  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    const answeredCount = Object.keys(selectedAnswers).length;
    return Math.round((answeredCount / questions.length) * 100);
  }, [selectedAnswers, questions]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 max-w-md text-center shadow">
          <span className="material-symbols-outlined text-4xl text-error mb-3">error</span>
          <h2 className="text-lg font-bold text-primary mb-2">Đã xảy ra lỗi</h2>
          <p className="text-secondary text-sm mb-4">Không thể tải nội dung câu hỏi ôn tập cho tài liệu này.</p>
          <button
            onClick={() => router.push('/practice')}
            className="w-full bg-primary text-on-primary py-2 px-4 rounded-lg font-semibold"
          >
            Quay lại mục ôn tập
          </button>
        </div>
      </div>
    );
  }

  if (!aiCache) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-3xl text-secondary">sync</span>
          <p className="text-secondary text-sm font-semibold">Đang chuẩn bị đề thi trắc nghiệm...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
        <div className="flex justify-between items-center h-16 px-6 max-w-5xl mx-auto">
          <div className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">school</span>
            MindStitch Test
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="font-label-md text-xs font-semibold text-secondary">
                Tiến độ: {progressPercent}%
              </span>
            </div>

            <button
              onClick={handleExitQuiz}
              className="font-label-lg text-sm text-secondary hover:text-primary transition-colors cursor-pointer px-4 py-1.5 border border-outline-variant rounded-lg font-semibold bg-surface-container-lowest hover:bg-surface-container-low"
            >
              Thoát kiểm tra
            </button>

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center justify-center p-2 hover:bg-surface-container-low rounded-full transition-colors md:hidden text-secondary cursor-pointer"
            >
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-row mt-16">
        
        {/* Left Canvas (Khu vực câu hỏi) */}
        <main className="flex-1 p-6 md:p-8 md:mr-72 transition-all duration-300 flex flex-col justify-between">
          <div className="max-w-3xl w-full mx-auto my-auto py-6">
            
            {/* Thẻ chứa Câu hỏi */}
            {currentQuestion ? (
              <div>
                <section className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest rounded-md mb-4 border border-outline-variant/40">
                    <span className="material-symbols-outlined text-[18px] filled text-primary">psychology</span>
                    <span className="font-label-md text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Câu hỏi {currentIdx + 1} / {questions.length}
                    </span>
                  </div>
                  <h1 className="text-lg md:text-xl font-bold leading-relaxed text-on-surface">
                    {currentQuestion.questionText}
                  </h1>
                </section>

                {/* 2x2 Answer Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {currentQuestion.options.map((option, oIdx) => {
                    const label = ['A', 'B', 'C', 'D'][oIdx] || 'A';
                    const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                    const isCorrectAnswer = option.isCorrect;

                    let optStyle = 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:bg-surface-container-low';

                    if (isSelected && !isSubmitted) {
                      optStyle = 'border-primary bg-primary text-white';
                    }

                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold';
                      } else if (isSelected) {
                        optStyle = 'border-rose-500 bg-rose-50 text-rose-800';
                      } else {
                        optStyle = 'border-outline-variant bg-surface-container-lowest text-on-surface-variant opacity-60';
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                        className={`group flex items-start gap-4 p-4 border rounded-xl text-left transition-all ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
                        } ${optStyle}`}
                      >
                        <div
                          className={`flex-shrink-0 w-7 h-7 rounded bg-surface flex items-center justify-center font-extrabold text-sm border ${
                            isSelected && !isSubmitted
                              ? 'bg-primary-container text-white border-transparent'
                              : 'text-primary border-outline-variant/60 bg-surface-container-lowest'
                          }`}
                        >
                          {label}
                        </div>
                        <div className="flex-1 text-sm md:text-base font-medium">
                          {option.optionText}
                        </div>
                      </button>
                    );
                  })}
                </section>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => prev - 1)}
                    className="flex-1 py-3 border border-outline-variant text-primary rounded-lg font-bold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Quay lại
                  </button>
                  {currentIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((prev) => prev + 1)}
                      className="flex-1 py-3 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Tiếp theo
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  ) : (
                    !isSubmitted && (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length === 0}
                        className="flex-1 py-3 bg-emerald-600 text-on-primary rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      >
                        Nộp bài thi
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">Tài liệu không có câu hỏi nào.</div>
            )}
          </div>
        </main>

        {/* Right Sidebar (Bảng tiến độ & Hàng đợi làm bài) */}
        <aside
          className={`${
            mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } md:translate-x-0 fixed right-0 top-0 h-full w-72 z-40 bg-surface-container-low shadow-md transition-transform duration-300 border-l border-outline-variant flex flex-col`}
        >
          {/* Header Sidebar */}
          <div className="p-5 border-b border-outline-variant/60 flex justify-between items-center mt-16">
            <div>
              <h3 className="font-headline-sm text-base font-bold text-primary">Thông tin bài thi</h3>
              <p className="text-xs text-on-surface-variant font-medium">Tài liệu học tập ScholarHub</p>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-secondary p-1 hover:text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Hàng đợi các câu hỏi (Review Queue Grid) */}
          <div className="flex-grow p-5 overflow-y-auto">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-4">
              Danh sách câu hỏi
            </span>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, index) => {
                const isAnswered = Boolean(selectedAnswers[q.id]);
                const isActive = index === currentIdx;

                let blockStyle = 'border-outline-variant text-on-surface-variant bg-surface-container-lowest';
                if (isAnswered) {
                  blockStyle = 'bg-primary-container text-white border-transparent';
                }
                if (isActive) {
                  blockStyle += ' ring-2 ring-primary';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(index);
                      setMobileSidebarOpen(false);
                    }}
                    className={`aspect-square flex items-center justify-center rounded-lg border text-sm font-bold transition-all cursor-pointer hover:border-primary ${blockStyle}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Khối hiển thị kết quả sau khi nộp bài */}
            {isSubmitted && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-emerald-800 text-sm font-bold block mb-1">Kết quả bài thi</span>
                <span className="text-2xl font-black text-emerald-600 block">
                  {score}/{questions.length} đúng
                </span>
                <span className="text-xs text-emerald-800 font-semibold">
                  Tỷ lệ: {Math.round((score / questions.length) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Footer Sidebar (Thời gian & Nút Submit) */}
          <div className="p-5 border-t border-outline-variant/60 bg-surface-container-low/50">
            {!isSubmitted ? (
              <>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                >
                  Nộp bài & kết thúc
                </button>
                <div className="flex items-center justify-center gap-1.5 text-secondary mt-3 text-sm font-semibold">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  <span>Thời gian: {formatTime(timeLeft)}</span>
                </div>
              </>
            ) : (
              <button
                onClick={handleResetQuiz}
                className="w-full bg-primary-container text-on-primary py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Làm lại bài thi
              </button>
            )}
          </div>
        </aside>

        {/* Overlay cho Mobile Sidebar */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm md:hidden"
          ></div>
        )}
      </div>
    </div>
  );
}
