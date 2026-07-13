'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';
import axiosClient from '@/utils/axios';

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
  fileSize: number;
  fileType: string;
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

const aiCacheFetcher = async (url: string): Promise<ExploreAiCache> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { credentials: 'include', headers });
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
    aiCacheFetcher,
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
  function handleAutoSubmit() {
    toast.warning('Hết thời gian làm bài! Hệ thống đang tự động nộp bài làm của bạn.', {
      duration: 5000,
    });
    handleSubmitQuiz();
  }

  // Xử lý chọn đáp án
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Nộp bài và tính điểm
  async function handleSubmitQuiz() {
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

    // Save attempt to backend database
    if (documentId && questions[0]?.quizId) {
      try {
        const normalizedScore = Math.round((correctCount / questions.length) * 10);
        await axiosClient.post(`/explore/${documentId}/quiz/submit`, {
          quizId: questions[0].quizId,
          score: normalizedScore,
        });
      } catch (submitErr) {
        console.error('Failed to submit quiz attempt to database:', submitErr);
      }
    }
  }

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
        'Bạn có chắc chắn muốn thoát? Kết quả bài làm hiện tại sẽ không được lưu.',
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
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <div className="bg-surface-container-lowest border-outline-variant max-w-md rounded-xl border p-8 text-center shadow">
          <span className="material-symbols-outlined text-error mb-3 text-4xl">error</span>
          <h2 className="text-primary mb-2 text-lg font-bold">An error occurred</h2>
          <p className="text-secondary mb-4 text-sm">
           Unable to load the review questions for this document.
          </p>
          <button
            onClick={() => router.push('/practice')}
            className="bg-primary text-on-primary w-full rounded-lg px-4 py-2 font-semibold"
          >
            Return to the review section
          </button>
        </div>
      </div>
    );
  }

  if (!aiCache) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-secondary animate-spin text-3xl">
            sync
          </span>
          <p className="text-secondary text-sm font-semibold">
           Preparing the multiple-choice test...
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="bg-surface text-on-surface flex min-h-screen flex-col overflow-x-hidden antialiased">
      {/* TopAppBar */}
      <header className="bg-surface-container-lowest border-outline-variant fixed top-0 z-50 w-full border-b shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="font-headline-md text-headline-md text-primary flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-primary text-2xl">school</span>
            MindStitch Test
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 md:flex">
              <div className="bg-surface-container-highest h-2 w-32 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="font-label-md text-secondary text-xs font-semibold">
                Progress: {progressPercent}%
              </span>
            </div>

            <button
              onClick={handleExitQuiz}
              className="font-label-lg text-secondary hover:text-primary border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low cursor-pointer rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              Exit Test
            </button>

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="hover:bg-surface-container-low text-secondary flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors md:hidden"
            >
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mt-16 flex flex-1 flex-row">
        {/* Left Canvas (Khu vực câu hỏi) */}
        <main className="flex flex-1 flex-col justify-between p-6 transition-all duration-300 md:mr-72 md:p-8">
          <div className="mx-auto my-auto w-full max-w-3xl py-6">
            {/* Thẻ chứa Câu hỏi */}
            {currentQuestion ? (
              <div>
                <section className="mb-6">
                  <div className="bg-surface-container-highest border-outline-variant/40 mb-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1">
                    <span className="material-symbols-outlined filled text-primary text-[18px]">
                      psychology
                    </span>
                    <span className="font-label-md text-on-surface-variant text-xs font-bold tracking-wider uppercase">
                      Question {currentIdx + 1} / {questions.length}
                    </span>
                  </div>
                  <h1 className="text-on-surface text-lg leading-relaxed font-bold md:text-xl">
                    {currentQuestion.questionText}
                  </h1>
                </section>

                {/* 2x2 Answer Grid */}
                <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {currentQuestion.options.map((option, oIdx) => {
                    const label = ['A', 'B', 'C', 'D'][oIdx] || 'A';
                    const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                    const isCorrectAnswer = option.isCorrect;

                    let optStyle =
                      'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:bg-surface-container-low';

                    if (isSelected && !isSubmitted) {
                      optStyle = 'border-primary bg-primary text-white';
                    }

                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optStyle =
                          'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold';
                      } else if (isSelected) {
                        optStyle = 'border-rose-500 bg-rose-50 text-rose-800';
                      } else {
                        optStyle =
                          'border-outline-variant bg-surface-container-lowest text-on-surface-variant opacity-60';
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                        className={`group flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
                        } ${optStyle}`}
                      >
                        <div
                          className={`bg-surface flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border text-sm font-extrabold ${
                            isSelected && !isSubmitted
                              ? 'bg-primary-container border-transparent text-white'
                              : 'text-primary border-outline-variant/60 bg-surface-container-lowest'
                          }`}
                        >
                          {label}
                        </div>
                        <div className="flex-1 text-sm font-medium md:text-base">
                          {option.optionText}
                        </div>
                      </button>
                    );
                  })}
                </section>

                {/* Navigation Buttons */}
                <div className="mx-auto flex max-w-md items-center justify-center gap-4">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => prev - 1)}
                    className="border-outline-variant text-primary hover:bg-surface-container-low flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-3 font-bold transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    BACK
                  </button>
                  {currentIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((prev) => prev + 1)}
                      className="bg-primary text-on-primary flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-3 font-bold transition-opacity hover:opacity-90"
                    >
                      NEXT
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  ) : (
                    !isSubmitted && (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length === 0}
                        className="text-on-primary flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-3 font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        SUBMIT TEST
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">The document has no questions available.</div>
            )}
          </div>
        </main>

        {/* Right Sidebar (Bảng tiến độ & Hàng đợi làm bài) */}
        <aside
          className={`${
            mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } bg-surface-container-low border-outline-variant fixed top-0 right-0 z-40 flex h-full w-72 flex-col border-l shadow-md transition-transform duration-300 md:translate-x-0`}
        >
          {/* Header Sidebar */}
          <div className="border-outline-variant/60 mt-16 flex items-center justify-between border-b p-5">
            <div>
              <h3 className="font-headline-sm text-primary text-base font-bold">
                Information
              </h3>
              <p className="text-on-surface-variant text-xs font-medium">
                Study materials AI STUDY HUB
              </p>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="text-secondary hover:text-primary cursor-pointer p-1 md:hidden"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Hàng đợi các câu hỏi (Review Queue Grid) */}
          <div className="flex-grow overflow-y-auto p-5">
            <span className="text-on-surface-variant mb-4 block text-xs font-bold tracking-wider uppercase">
              Question List
            </span>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, index) => {
                const isAnswered = Boolean(selectedAnswers[q.id]);
                const isActive = index === currentIdx;

                let blockStyle =
                  'border-outline-variant text-on-surface-variant bg-surface-container-lowest';
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
                    className={`hover:border-primary flex aspect-square cursor-pointer items-center justify-center rounded-lg border text-sm font-bold transition-all ${blockStyle}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Khối hiển thị kết quả sau khi nộp bài */}
            {isSubmitted && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <span className="mb-1 block text-sm font-bold text-emerald-800">
                  Test Results
                </span>
                <span className="block text-2xl font-black text-emerald-600">
                  {score}/{questions.length} correct
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  Tỷ lệ: {Math.round((score / questions.length) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Footer Sidebar (Thời gian & Nút Submit) */}
          <div className="border-outline-variant/60 bg-surface-container-low/50 border-t p-5">
            {!isSubmitted ? (
              <>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="bg-primary text-on-primary w-full cursor-pointer rounded-lg py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Submit Test
                </button>
                <div className="text-secondary mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  <span>Time Remaining: {formatTime(timeLeft)}</span>
                </div>
              </>
            ) : (
              <button
                onClick={handleResetQuiz}
                className="bg-primary-container text-on-primary w-full cursor-pointer rounded-lg py-3 text-sm font-bold transition-opacity hover:opacity-90"
              >
                Retry Test
              </button>
            )}
          </div>
        </aside>

        {/* Overlay cho Mobile Sidebar */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          ></div>
        )}
      </div>
    </div>
  );
}
