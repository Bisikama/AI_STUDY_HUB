'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState, Suspense, type MouseEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axiosClient from '@/utils/axios';
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
  downloadCount: number;
  viewCount: number;
  quizCount: number;
  hasSummary: boolean;
  uploader: {
    id: string;
    fullName: string;
    role: string;
    isTeacher: boolean;
  };
  createdAt: string;
  copyrightSourceType?: string | null;
  copyrightAuthorName?: string | null;
  copyrightSourceUrl?: string | null;
  copyrightLicense?: string | null;
  copyrightAttribution?: string | null;
};

type ApiResponse<T> =
  | T
  | {
      statusCode: number;
      message: string;
      data: T;
    };

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

type QuizAnswerCheckResult = {
  quizId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string;
};

type AiCacheTab = 'summary' | 'quiz' | 'feedback';

type ReportReason =
  | 'INCORRECT_CONTENT'
  | 'WRONG_SUBJECT'
  | 'OUTDATED_SYLLABUS'
  | 'DUPLICATED_DOCUMENT'
  | 'FILE_ERROR'
  | 'LOW_QUALITY'
  | 'SPAM'
  | 'COPYRIGHT_VIOLATION'
  | 'INAPPROPRIATE_CONTENT'
  | 'OTHER';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const FOLLOWED_DOCUMENT_IDS_STORAGE_KEY = 'studyhub_followed_document_ids';
const FOLLOWED_DOCUMENTS_STORAGE_KEY = 'studyhub_followed_documents';

const DOCUMENT_TYPES = ['Lecture notes', 'Summaries', 'Past Exams', 'Essays'];

const POPULAR_FPT_SEARCHES = [
  'SDN302',
  'SWR302',
  'PRN212',
  'EXE101',
  'Software Engineering',
  'Artificial Intelligence',
];

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'INCORRECT_CONTENT', label: 'Incorrect content' },
  { value: 'WRONG_SUBJECT', label: 'Wrong subject' },
  { value: 'OUTDATED_SYLLABUS', label: 'Outdated syllabus' },
  { value: 'DUPLICATED_DOCUMENT', label: 'Duplicated document' },
  { value: 'FILE_ERROR', label: 'File error' },
  { value: 'LOW_QUALITY', label: 'Low quality' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'COPYRIGHT_VIOLATION', label: 'Copyright violation' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'OTHER', label: 'Other' },
];

const fetcher = async (url: string): Promise<ExploreDocument[]> => {
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') window.location.href = '/login';
    }

    throw new Error('Failed to fetch explore documents');
  }

  const result = (await response.json()) as ApiResponse<ExploreDocument[]>;

  if (Array.isArray(result)) {
    return result;
  }

  return result.data;
};

const aiCacheFetcher = async (url: string): Promise<ExploreAiCache> => {
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') window.location.href = '/login';
    }

    throw new Error('Failed to fetch AI cache');
  }

  const result = (await response.json()) as ApiResponse<ExploreAiCache>;

  if ('data' in result) {
    return result.data;
  }

  return result;
};

function formatFileSize(fileSize: string): string {
  const size = Number(fileSize);

  if (Number.isNaN(size)) {
    return 'Unknown size';
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentCategory(doc: ExploreDocument): string {
  const title = doc.title.toLowerCase();

  if (title.includes('note') || title.includes('guide')) {
    return 'Lecture notes';
  }

  if (title.includes('summary') || title.includes('principles') || title.includes('analysis')) {
    return 'Summaries';
  }

  if (title.includes('exam') || title.includes('midterm') || title.includes('quiz')) {
    return 'Past Exams';
  }

  return 'Essays';
}

function getSubjectDisplayName(doc: ExploreDocument): string {
  if (doc.subject?.code && doc.subject?.name) {
    return `${doc.subject.code} - ${doc.subject.name}`;
  }

  if (doc.subject?.name) {
    return doc.subject.name;
  }

  if (doc.subject?.code) {
    return doc.subject.code;
  }

  return 'Unmapped subject';
}

function getSubjectFilterOptions(documents: ExploreDocument[]): string[] {
  return Array.from(new Set(documents.map(getSubjectDisplayName))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Lecture notes':
      return 'menu_book';
    case 'Summaries':
      return 'history_edu';
    case 'Past Exams':
      return 'quiz';
    default:
      return 'article';
  }
}

function SearchExplore() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get('search') ?? '';
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [search, setSearch] = useState(urlQuery);
  const [activeQuery, setActiveQuery] = useState(urlQuery);

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearch(urlQuery);
    setActiveQuery(urlQuery);
  }

  const [sortBy, setSortBy] = useState<'recent' | 'viewed'>('recent');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('All semesters');

  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    sort: false,
    subject: false,
    type: false,
    semester: false,
  });

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

  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [activeAiCacheTab, setActiveAiCacheTab] = useState<AiCacheTab>('summary');
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAuthWarning, setQuizAuthWarning] = useState<string | null>(null);
  const [quizAnswerResults, setQuizAnswerResults] = useState<Record<string, QuizAnswerCheckResult>>(
    {},
  );
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});

  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  const [reportReason, setReportReason] = useState<ReportReason>('INCORRECT_CONTENT');
  const [reportDescription, setReportDescription] = useState('');
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);

  const aiCacheUrl = selectedDocumentId
    ? `${API_BASE_URL}/api/explore/${selectedDocumentId}/ai-cache`
    : null;

  const {
    data: aiCache,
    error: aiCacheError,
    isLoading: isAiCacheLoading,
  } = useSWR(aiCacheUrl, aiCacheFetcher);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (activeQuery.trim()) {
      params.set('search', activeQuery.trim());
    } else {
      params.delete('search');
    }

    const queryString = params.toString();
    router.replace(queryString ? `/explore?${queryString}` : '/explore');
  }, [activeQuery, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveQuery(search.trim());
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const handleSearchSubmit = () => {
    setActiveQuery(search.trim());
  };

  const exploreUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (activeQuery.trim()) {
      params.set('search', activeQuery.trim());
    }

    const queryString = params.toString();

    return `${API_BASE_URL}/api/explore${queryString ? `?${queryString}` : ''}`;
  }, [activeQuery]);

  const { data: documents = [], error, isLoading } = useSWR(exploreUrl, fetcher);

  const displayDocs = useMemo(() => {
    if (documents.length > 0) {
      return documents;
    }

    return [];
  }, [documents]);

  const subjectFilterOptions = useMemo(() => {
    return getSubjectFilterOptions(displayDocs);
  }, [displayDocs]);

  const filteredDocuments = useMemo(() => {
    let list = [...displayDocs];

    if (selectedSubjects.length > 0) {
      list = list.filter((doc) => selectedSubjects.includes(getSubjectDisplayName(doc)));
    }

    if (selectedTypes.length > 0) {
      list = list.filter((doc) => selectedTypes.includes(getDocumentCategory(doc)));
    }

    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'viewed') {
      list.sort((a, b) => b.viewCount - a.viewCount);
    }

    return list;
  }, [displayDocs, selectedSubjects, selectedTypes, sortBy]);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject],
    );
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleClearAll = () => {
    setSelectedSubjects([]);
    setSelectedTypes([]);
    setSelectedSemester('All semesters');
    setSortBy('recent');
  };

  const saveFollowedDocuments = (nextIds: string[], currentDoc: ExploreDocument) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedDocs = window.localStorage.getItem(FOLLOWED_DOCUMENTS_STORAGE_KEY);
      const parsedDocs = storedDocs ? (JSON.parse(storedDocs) as ExploreDocument[]) : [];
      const safeDocs = Array.isArray(parsedDocs) ? parsedDocs : [];
      const nextDocs = nextIds.includes(currentDoc.id)
        ? [...safeDocs.filter((doc) => doc.id !== currentDoc.id), currentDoc]
        : safeDocs.filter((doc) => doc.id !== currentDoc.id);

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

  const toggleFollow = async (doc: ExploreDocument, e: MouseEvent) => {
    e.stopPropagation();

    if (followLoadingId === doc.id) {
      return;
    }

    const isCurrentlyFollowed = followedDocumentIds.includes(doc.id);
    const endpoint = isCurrentlyFollowed
      ? `/documents/${doc.id}/unfollow`
      : `/documents/${doc.id}/follow`;

    setFollowLoadingId(doc.id);

    try {
      await axiosClient.post(endpoint);

      setFollowedDocumentIds((prev) => {
        const nextIds = isCurrentlyFollowed
          ? prev.filter((followedId) => followedId !== doc.id)
          : Array.from(new Set([...prev, doc.id]));

        saveFollowedDocuments(nextIds, doc);
        return nextIds;
      });

      toast.success(isCurrentlyFollowed ? 'Document unfollowed.' : 'Document followed.');
    } catch (err) {
      console.error('Failed to update follow status:', err);
      toast.error('Could not update follow status. Please try again.');
    } finally {
      setFollowLoadingId(null);
    }
  };

  const resetFeedbackForm = () => {
    setSelectedRating(0);
    setRatingComment('');
    setReportReason('INCORRECT_CONTENT');
    setReportDescription('');
    setIsRatingSubmitting(false);
    setIsReportSubmitting(false);
  };

  const closeSelectedDocument = () => {
    setSelectedDocumentId(null);
    setSelectedOptionIds({});
    setActiveAiCacheTab('summary');
    setIsQuizSubmitted(false);
    setQuizScore(null);
    setQuizAuthWarning(null);
    setQuizAnswerResults({});
    setIsQuizSubmitting(false);
    resetFeedbackForm();
  };

  const handleViewFull = (documentId?: string | null) => {
    if (!documentId || documentId.startsWith('mock-')) {
      toast.warning('Document file is not available yet.');
      return;
    }

    window.open(`/dashboard/documents/${documentId}/preview`, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = async (doc: ExploreDocument) => {
    if (doc.id.startsWith('mock-')) {
      toast.info('This is a simulated document view.');
      return;
    }

    setSelectedOptionIds({});
    setActiveAiCacheTab('summary');
    setIsQuizSubmitted(false);
    setQuizScore(null);
    setQuizAuthWarning(null);
    setQuizAnswerResults({});
    setIsQuizSubmitting(false);
    resetFeedbackForm();
    setSelectedDocumentId(doc.id);

    try {
      await axiosClient.post(`/documents/${doc.id}/view`);
    } catch (err) {
      console.error('Failed to record document view:', err);
    }
  };

  const isGuestAttempt = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.localStorage.getItem('studyhub_guest') === 'true' ||
      window.localStorage.getItem('guestMode') === 'true' ||
      window.localStorage.getItem('isGuest') === 'true'
    );
  };

  const guardQuizAttempt = () => {
    if (!isGuestAttempt()) {
      return true;
    }

    setQuizAuthWarning('Please log in to take the quiz and save your result.');
    return false;
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isQuizSubmitted) {
      return;
    }

    if (!guardQuizAttempt()) {
      return;
    }

    setQuizAuthWarning(null);
    setSelectedOptionIds((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitQuiz = async (questions: QuizQuestion[]) => {
    if (!selectedDocumentId) {
      return;
    }

    if (!guardQuizAttempt()) {
      return;
    }

    if (questions.length === 0) {
      return;
    }

    const unansweredCount = questions.filter((question) => !selectedOptionIds[question.id]).length;

    if (unansweredCount > 0) {
      toast.warning(`Please answer all questions before submitting. Missing: ${unansweredCount}`);
      return;
    }

    setIsQuizSubmitting(true);
    setQuizAuthWarning(null);

    try {
      const results = await Promise.all(
        questions.map(async (question) => {
          const selectedOptionId = selectedOptionIds[question.id];

          if (!selectedOptionId) {
            throw new Error('Missing selected option');
          }

          const response = await axiosClient.post<ApiResponse<QuizAnswerCheckResult>>(
            `/explore/${selectedDocumentId}/quiz/check`,
            {
              quizId: question.quizId,
              selectedOptionId,
            },
          );

          const result = response.data;

          return 'data' in result ? result.data : result;
        }),
      );

      const resultMap = results.reduce<Record<string, QuizAnswerCheckResult>>((acc, result) => {
        acc[result.questionId] = result;
        return acc;
      }, {});

      setQuizAnswerResults(resultMap);
      setQuizScore(results.filter((result) => result.isCorrect).length);
      setIsQuizSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setQuizAuthWarning('Could not submit quiz. Please log in again and try later.');
    } finally {
      setIsQuizSubmitting(false);
    }
  };

  const handleRetryQuiz = () => {
    setSelectedOptionIds({});
    setIsQuizSubmitted(false);
    setQuizScore(null);
    setQuizAuthWarning(null);
    setQuizAnswerResults({});
    setIsQuizSubmitting(false);
  };

  const handleSubmitRating = async () => {
    if (!selectedDocumentId) {
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      toast.warning('Please choose a rating from 1 to 5 stars.');
      return;
    }

    setIsRatingSubmitting(true);

    try {
      await axiosClient.post(`/documents/${selectedDocumentId}/ratings`, {
        rating: selectedRating,
        comment: ratingComment.trim() || undefined,
      });

      toast.success('Rating submitted successfully.');
      setRatingComment('');
    } catch (err) {
      console.error('Failed to submit rating:', err);
      toast.error('Could not submit rating. You may not be allowed to rate your own document.');
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedDocumentId) {
      return;
    }

    setIsReportSubmitting(true);

    try {
      await axiosClient.post(`/documents/${selectedDocumentId}/reports`, {
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      });

      toast.success('Report submitted successfully. Admin will review this document.');
      setReportReason('INCORRECT_CONTENT');
      setReportDescription('');
    } catch (err) {
      console.error('Failed to submit report:', err);
      toast.error('Could not submit report. You may have already reported this document.');
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const handleSuggestionClick = (discipline: string) => {
    setSearch(discipline);
    setActiveQuery(discipline);
  };

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-fixed-dim flex min-h-screen flex-col font-sans">
      <header className="bg-surface sticky top-0 z-50 w-full shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div className="px-container-margin-desktop flex w-full items-center justify-between gap-8 py-4">
          <div className="flex flex-1 items-center gap-8">
            <a
              className="text-headline-md font-headline-md text-primary shrink-0 font-bold"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push('/');
              }}
            >
              AI STUDY HUB
            </a>

            <div className="relative w-full max-w-xl">
              <span
                onClick={handleSearchSubmit}
                className="material-symbols-outlined text-secondary hover:text-primary absolute top-1/2 left-4 -translate-y-1/2 cursor-pointer transition-colors"
              >
                search
              </span>
              <input
                className="bg-surface-container-low font-body-md text-primary focus:ring-primary focus:bg-surface-container-lowest h-12 w-full rounded-lg border-none pr-4 pl-12 transition-all outline-none focus:ring-2"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search by subject code, course name, document, or keyword..."
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-8 md:flex">
              <a
                className="text-primary border-primary border-b-2 py-1 font-bold transition-colors"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/explore');
                }}
              >
                Discover
              </a>
              <a
                className="text-secondary font-label-md hover:text-primary transition-colors"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/');
                }}
              >
                My Documents
              </a>
              <a
                className="text-secondary font-label-md hover:text-primary transition-colors"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/practice');
                }}
              >
                Practice Mode
              </a>
            </nav>

            <div className="border-outline-variant flex items-center gap-4 border-l pl-6">
              <button
                onClick={async () => {
                  try {
                    await axiosClient.post('/auth/logout');
                  } catch (e) {
                    console.error(e);
                  } finally {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }
                }}
                className="material-symbols-outlined text-error cursor-pointer rounded-full p-2 transition-colors hover:bg-red-50 active:scale-95"
                title="Log out"
              >
                logout
              </button>
              <div className="border-outline-variant bg-surface-container-high h-10 w-10 overflow-hidden rounded-full border">
                <img
                  alt="User Profile"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmRIQIc6LO9lV5rVtojZ7Vh-4aAm0za_O0i5ayKA2xj5hmmtTyNfQvFCZNPhEfrXG_1djLfBLkYl-oRMknt4VMjwDxAHTLWyqk3U8mvXoulTPKmZi_lPoDe5yP9DJa1_HnZhUWZF8pI3XxjStB2JqRcoeuyOfo7DSOd9-q8HaWShAn_Rqgu1w26jKT2gX7DqpcPd3kC4Uam3KP7ywqZsOefPY_o9YIMdPmCJHLvDhiQBVe4ou63D8uVWKJY3uShYdVn9kYtYeSsJg"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-80px)] w-full flex-1 flex-col md:flex-row">
        <aside className="bg-surface border-outline-variant p-container-margin-desktop custom-scrollbar w-full overflow-y-auto border-r md:sticky md:top-[80px] md:h-[calc(100vh-80px)] md:w-[25%]">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-headline-md text-label-md text-primary tracking-widest uppercase">
              Filters
            </h2>
            <button
              onClick={handleClearAll}
              className="text-label-sm text-secondary hover:text-primary cursor-pointer transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-8">
            <section>
              <div
                onClick={() => toggleSection('sort')}
                className="group mb-4 flex cursor-pointer items-center justify-between"
              >
                <h3 className="font-label-md text-primary">Sort By</h3>
                <span
                  className={`material-symbols-outlined text-secondary transition-transform ${
                    collapsedSections.sort ? 'rotate-[-90deg]' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
              {!collapsedSections.sort && (
                <div className="space-y-3">
                  <label className="group flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === 'recent'}
                      onChange={() => setSortBy('recent')}
                      className="border-outline-variant text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                      Most Recent
                    </span>
                  </label>
                  <label className="group flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === 'viewed'}
                      onChange={() => setSortBy('viewed')}
                      className="border-outline-variant text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                      Most Viewed
                    </span>
                  </label>
                </div>
              )}
            </section>

            <hr className="border-outline-variant" />

            <section>
              <div
                onClick={() => toggleSection('subject')}
                className="group mb-4 flex cursor-pointer items-center justify-between"
              >
                <h3 className="font-label-md text-primary">FPT Subject</h3>
                <span
                  className={`material-symbols-outlined text-secondary transition-transform ${
                    collapsedSections.subject ? 'rotate-[-90deg]' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
              {!collapsedSections.subject && (
                <div className="space-y-3">
                  {subjectFilterOptions.length > 0 ? (
                    subjectFilterOptions.map((subject) => (
                      <label key={subject} className="group flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject)}
                          onChange={() => handleSubjectChange(subject)}
                          className="filter-checkbox border-outline-variant text-primary focus:ring-primary h-4 w-4 rounded"
                        />
                        <span className="text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                          {subject}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-secondary text-sm">No subjects available yet.</p>
                  )}
                </div>
              )}
            </section>

            <hr className="border-outline-variant" />

            <section>
              <div
                onClick={() => toggleSection('type')}
                className="group mb-4 flex cursor-pointer items-center justify-between"
              >
                <h3 className="font-label-md text-primary">Document Type</h3>
                <span
                  className={`material-symbols-outlined text-secondary transition-transform ${
                    collapsedSections.type ? 'rotate-[-90deg]' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
              {!collapsedSections.type && (
                <div className="space-y-3">
                  {DOCUMENT_TYPES.map((type) => (
                    <label key={type} className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeChange(type)}
                        className="filter-checkbox border-outline-variant text-primary focus:ring-primary h-4 w-4 rounded"
                      />
                      <span className="text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <hr className="border-outline-variant" />

            <section>
              <div
                onClick={() => toggleSection('semester')}
                className="group mb-4 flex cursor-pointer items-center justify-between"
              >
                <h3 className="font-label-md text-primary">Semester</h3>
                <span
                  className={`material-symbols-outlined text-secondary transition-transform ${
                    collapsedSections.semester ? 'rotate-[-90deg]' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
              {!collapsedSections.semester && (
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-surface-container-low font-label-md text-on-surface-variant focus:ring-primary w-full rounded-lg border-none px-4 py-2.5 outline-none focus:ring-2"
                >
                  <option>All semesters</option>
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Semester 3</option>
                  <option>Semester 4</option>
                  <option>Semester 5</option>
                  <option>Semester 6</option>
                  <option>Semester 7</option>
                  <option>Semester 8</option>
                  <option>Semester 9</option>
                </select>
              )}
            </section>
          </div>
        </aside>

        <div className="bg-surface-container-lowest p-container-margin-desktop flex w-full flex-col md:w-[75%]">
          {isLoading && (
            <div className="text-secondary mx-auto mb-4 flex w-full max-w-4xl items-center gap-2">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Loading documents...
            </div>
          )}

          {filteredDocuments.length > 0 ? (
            <div className="mx-auto w-full max-w-4xl">
              <div className="border-outline-variant mb-8 flex items-end justify-between border-b pb-4">
                <div>
                  <h1 className="font-headline-lg text-primary mb-1">Search Results</h1>
                  <p className="font-body-md text-on-surface-variant">
                    Showing{' '}
                    <span className="text-primary font-bold">{filteredDocuments.length}</span>{' '}
                    results for &quot;
                    <span className="italic">{activeQuery || 'All Documents'}</span>&quot;
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.info('Grid view clicked (Simulated)')}
                    className="bg-surface-container-low text-label-md text-primary hover:bg-surface-container-high flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                  </button>
                  <button className="bg-primary text-on-primary text-label-md flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 shadow-sm transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[20px]">
                      format_list_bulleted
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-error-container text-on-error-container border-error/10 mb-6 flex items-center gap-3 rounded-xl border p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                  <div>
                    <p className="font-label-md text-label-md font-semibold">Backend offline</p>
                    <p className="text-xs opacity-80">
                      Could not load database documents. Please check backend server.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredDocuments.map((doc) => {
                  const category = getDocumentCategory(doc);
                  const isFollowed = followedDocumentIds.includes(doc.id);
                  const isFollowLoading = followLoadingId === doc.id;

                  return (
                    <article
                      key={doc.id}
                      onClick={() => handleCardClick(doc)}
                      className="group bg-surface-container-lowest border-outline-variant relative cursor-pointer rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex items-start gap-6">
                        <div className="bg-surface-container-low border-outline-variant group-hover:border-primary flex h-20 w-16 shrink-0 items-center justify-center rounded-lg border transition-colors">
                          <span className="material-symbols-outlined text-secondary group-hover:text-primary text-[32px] transition-colors">
                            {getCategoryIcon(category)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="mb-2 flex items-start justify-between">
                            <h3 className="font-headline-md text-primary group-hover:text-primary-container leading-tight">
                              {doc.title}
                            </h3>
                            {doc.uploader && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {doc.uploader.fullName}
                                </span>
                                {doc.uploader.isTeacher && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                    <span className="material-symbols-outlined text-[14px]">
                                      verified
                                    </span>
                                    Verified teacher
                                  </span>
                                )}
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={isFollowLoading}
                              onClick={(e) => void toggleFollow(doc, e)}
                              className={`font-label-sm text-label-sm flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                isFollowed
                                  ? 'border-primary bg-primary-container/20 text-primary'
                                  : 'border-outline-variant text-secondary hover:border-primary hover:text-primary'
                              }`}
                              title={isFollowed ? 'Unfollow this document' : 'Follow this document'}
                            >
                              <span
                                className={`material-symbols-outlined text-[18px] ${
                                  isFollowed ? 'filled' : ''
                                }`}
                              >
                                {isFollowLoading ? 'sync' : 'bookmark_add'}
                              </span>
                              {isFollowLoading ? 'Saving...' : isFollowed ? 'Following' : 'Follow'}
                            </button>
                          </div>

                          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">
                                school
                              </span>
                              <span className="font-label-md text-on-surface-variant">
                                {getSubjectDisplayName(doc)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">
                                code
                              </span>
                              <span className="font-label-md text-on-surface-variant">
                                {doc.subject?.code ?? 'GEN101'}
                              </span>
                            </div>
                            <div className="bg-surface-container-high text-label-sm text-secondary rounded-full px-2.5 py-0.5 tracking-wider uppercase">
                              {category}
                            </div>
                          </div>

                          <div className="text-label-sm text-secondary border-outline-variant flex items-center gap-6 border-t pt-4">
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">
                                description
                              </span>{' '}
                              {formatFileSize(doc.fileSize)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">
                                visibility
                              </span>{' '}
                              {doc.viewCount >= 1000
                                ? `${(doc.viewCount / 1000).toFixed(1)}k`
                                : doc.viewCount}{' '}
                              Views
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">
                                calendar_today
                              </span>{' '}
                              {new Date(doc.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-grow flex-col items-center justify-center px-4 py-12 text-center md:py-24">
              {error && (
                <div className="bg-error-container text-on-error-container border-error/10 mb-8 flex w-full max-w-xl items-center gap-3 rounded-xl border p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                  <div className="text-left">
                    <p className="font-label-md text-label-md font-semibold">
                      Backend server offline
                    </p>
                    <p className="text-xs opacity-80">
                      Failed to query backend database. Try starting port 3000.
                    </p>
                  </div>
                </div>
              )}

              <div className="animate-fade-in relative mb-12 w-full max-w-lg">
                <img
                  alt="Search Not Found Illustration"
                  className="h-auto w-full"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjq4iiNttHXdhtTrh_gAe3aSgH5Meq3lX3cu9VbuzXrlfBB9bxx7BKYDh05hLAXQnUox7kJcaR2IC_cWCxbsfGKbeRIrXvS7iA-7G3GMPIt3w2KsuF1oBrFWS2X_4YS1mV8UPLDSNXD0OmQ4nIfZuaa97IwApBLlrdvRkIJ1-XqvUHIb2T1jZUx-keKNdiEduQ_LsvdQxjTt2cs4s9FcnXdRffee4vp4mzk3CgJ7UlmUAT_G5yArIk_d0QEHgY2S7l4NOEjKa_19w"
                />
              </div>

              <div className="max-w-2xl space-y-6">
                <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">
                  We couldn&apos;t find any documents matching your search
                </h1>
                <p className="font-body-lg text-body-lg text-secondary">
                  No public documents are available yet. Documents will appear here when they pass
                  the public lifecycle requirements.
                </p>
              </div>

              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => toast.info('Upload Document dialog initiated (Simulated)')}
                  className="bg-primary-container font-label-md text-label-md flex h-12 cursor-pointer items-center gap-2 rounded-lg px-8 text-white transition-all hover:shadow-lg active:scale-98"
                >
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  Upload Your Own Document
                </button>
                <button
                  onClick={() => toast.info('Opening AI Support chatbot (Simulated)')}
                  className="border-outline-variant text-primary font-label-md text-label-md hover:bg-surface-container-low flex h-12 cursor-pointer items-center gap-2 rounded-lg border bg-white px-8 transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  Ask AI Support
                </button>
              </div>

              <div className="border-outline-variant mt-16 w-full max-w-xl border-t pt-8">
                <p className="font-label-sm text-label-sm text-outline mb-6 tracking-widest uppercase">
                  Popular FPT Searches
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {POPULAR_FPT_SEARCHES.map((discipline) => (
                    <button
                      key={discipline}
                      onClick={() => handleSuggestionClick(discipline)}
                      className="bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:bg-outline-variant cursor-pointer rounded-full px-4 py-2 transition-colors"
                    >
                      {discipline}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedDocumentId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
          onClick={closeSelectedDocument}
        >
          <div
            className="bg-surface border-outline-variant max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-label-sm text-secondary mb-2 tracking-widest uppercase">
                  AI Cache Preview
                </p>
                <h2 className="text-headline-md text-primary font-bold">
                  {aiCache?.document.title ?? 'Loading document...'}
                </h2>
                {aiCache?.document.subject && (
                  <p className="text-secondary mt-1">
                    {aiCache.document.subject.code} • {aiCache.document.subject.name}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {aiCache && (
                  <button
                    type="button"
                    onClick={() => handleViewFull(aiCache.document.id)}
                    className="bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    View Full
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeSelectedDocument}
                  className="border-outline-variant text-primary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  Close
                </button>
              </div>
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
                <div className="bg-surface-container-low border-outline-variant grid rounded-xl border p-1 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setActiveAiCacheTab('summary')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      activeAiCacheTab === 'summary'
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">summarize</span>
                    Summary
                    <span className="bg-surface-container-high text-secondary rounded-full px-2 py-0.5 text-[11px]">
                      {aiCache.summaries.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAiCacheTab('quiz')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      activeAiCacheTab === 'quiz'
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                    Quiz
                    <span className="bg-surface-container-high text-secondary rounded-full px-2 py-0.5 text-[11px]">
                      {aiCache.quizzes[0]?.questions.length ?? 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAiCacheTab('feedback')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      activeAiCacheTab === 'feedback'
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">reviews</span>
                    Feedback
                  </button>
                </div>

                {activeAiCacheTab === 'summary' && (
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
                )}

                {activeAiCacheTab === 'quiz' && (
                  <section className="bg-surface-container-lowest border-outline-variant rounded-xl border p-5">
                    {(() => {
                      const quizQuestions = aiCache.quizzes[0]?.questions ?? [];
                      const answeredCount = quizQuestions.filter(
                        (question) => selectedOptionIds[question.id],
                      ).length;
                      const totalQuestions = quizQuestions.length;
                      const hasAllAnswers = totalQuestions > 0 && answeredCount === totalQuestions;

                      return (
                        <div className="space-y-5">
                          <div className="border-outline-variant flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-primary text-lg font-bold">
                                Quiz Questions ({totalQuestions})
                              </h3>
                              <p className="text-secondary mt-1 text-sm">
                                Choose one answer for each question, then submit to see your score.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-surface-container-high text-secondary rounded-full px-3 py-1 text-xs font-semibold">
                                Answered {answeredCount}/{totalQuestions}
                              </span>

                              {isQuizSubmitted && quizScore !== null && (
                                <span className="bg-primary-container/20 text-primary rounded-full px-3 py-1 text-xs font-bold">
                                  Score {quizScore}/{totalQuestions}
                                </span>
                              )}
                            </div>
                          </div>

                          {quizAuthWarning && (
                            <div className="bg-error-container text-on-error-container flex items-start gap-3 rounded-xl p-4 text-sm">
                              <span className="material-symbols-outlined text-[20px]">lock</span>
                              <div>
                                <p className="font-semibold">Login required</p>
                                <p>{quizAuthWarning}</p>
                              </div>
                            </div>
                          )}

                          {quizQuestions.length > 0 ? (
                            <>
                              <div className="space-y-5">
                                {quizQuestions.map((question, questionIndex) => (
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
                                        const answerResult = quizAnswerResults[question.id];
                                        const isSelected = selectedOptionId === option.id;
                                        const isCorrectAnswer =
                                          isQuizSubmitted &&
                                          answerResult?.correctOptionId === option.id;
                                        const isWrongSelected =
                                          isQuizSubmitted &&
                                          Boolean(answerResult) &&
                                          isSelected &&
                                          !answerResult?.isCorrect;

                                        let optionClass =
                                          'border-outline-variant text-on-surface-variant hover:border-primary hover:bg-surface-container-low';

                                        if (!isQuizSubmitted && isSelected) {
                                          optionClass =
                                            'border-primary bg-primary-container/10 text-primary';
                                        }

                                        if (isCorrectAnswer) {
                                          optionClass =
                                            'border-primary bg-primary-container/20 text-primary';
                                        }

                                        if (isWrongSelected) {
                                          optionClass =
                                            'border-error bg-error-container text-on-error-container';
                                        }

                                        return (
                                          <button
                                            key={option.id}
                                            type="button"
                                            disabled={isQuizSubmitted}
                                            onClick={() =>
                                              handleSelectOption(question.id, option.id)
                                            }
                                            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${optionClass} ${
                                              isQuizSubmitted ? 'cursor-default' : 'cursor-pointer'
                                            }`}
                                          >
                                            <span
                                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                isSelected
                                                  ? 'border-primary bg-primary text-on-primary'
                                                  : 'border-outline-variant bg-surface'
                                              }`}
                                            >
                                              {isSelected && (
                                                <span className="material-symbols-outlined text-[14px]">
                                                  check
                                                </span>
                                              )}
                                            </span>

                                            <span className="flex-1">{option.optionText}</span>

                                            {isQuizSubmitted && isCorrectAnswer && (
                                              <span className="text-xs font-bold">Correct</span>
                                            )}

                                            {isWrongSelected && (
                                              <span className="text-xs font-bold">Your answer</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="border-outline-variant flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                                <p className="text-secondary text-sm">
                                  {isQuizSubmitted
                                    ? 'Quiz submitted. You can review the correct answers or retry.'
                                    : hasAllAnswers
                                      ? 'All questions answered. You can submit now.'
                                      : 'Answer all questions before submitting.'}
                                </p>

                                <div className="flex gap-3">
                                  {isQuizSubmitted ? (
                                    <button
                                      type="button"
                                      onClick={handleRetryQuiz}
                                      className="border-outline-variant text-primary hover:bg-surface-container-low flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        replay
                                      </span>
                                      Retry Quiz
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => void handleSubmitQuiz(quizQuestions)}
                                      disabled={!hasAllAnswers || isQuizSubmitting}
                                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                        hasAllAnswers && !isQuizSubmitting
                                          ? 'bg-primary text-on-primary hover:shadow-md'
                                          : 'bg-surface-container-high text-secondary cursor-not-allowed'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        task_alt
                                      </span>
                                      {isQuizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-secondary">No quiz available for this document.</p>
                          )}
                        </div>
                      );
                    })()}
                  </section>
                )}

                {activeAiCacheTab === 'feedback' && (
                  <section className="grid gap-4 md:grid-cols-2">
                    <div className="bg-surface-container-lowest border-outline-variant rounded-xl border p-5">
                      <div className="mb-4">
                        <h3 className="text-primary text-lg font-bold">Rate this document</h3>
                        <p className="text-secondary mt-1 text-sm">
                          Give feedback to help other students find useful materials.
                        </p>
                      </div>

                      <div className="mb-4 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSelectedRating(star)}
                            className={`material-symbols-outlined cursor-pointer rounded-full p-1 text-3xl transition-colors ${
                              selectedRating >= star
                                ? 'text-primary'
                                : 'text-outline hover:text-primary'
                            }`}
                            title={`${star} star${star > 1 ? 's' : ''}`}
                          >
                            star
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        maxLength={500}
                        rows={5}
                        className="border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-primary/30 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors outline-none focus:ring-2"
                        placeholder="Optional comment, max 500 characters..."
                      />

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-secondary text-xs">{ratingComment.length}/500</p>
                        <button
                          type="button"
                          onClick={() => void handleSubmitRating()}
                          disabled={isRatingSubmitting}
                          className="bg-primary text-on-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-[18px]">star</span>
                          {isRatingSubmitting ? 'Submitting...' : 'Submit Rating'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest border-outline-variant rounded-xl border p-5">
                      <div className="mb-4">
                        <h3 className="text-primary text-lg font-bold">Report this document</h3>
                        <p className="text-secondary mt-1 text-sm">
                          Report issues so admins can review this public material.
                        </p>
                      </div>

                      <label className="text-primary mb-2 block text-sm font-semibold">
                        Reason
                      </label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value as ReportReason)}
                        className="border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-primary/30 mb-4 w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none focus:ring-2"
                      >
                        {REPORT_REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>

                      <label className="text-primary mb-2 block text-sm font-semibold">
                        Description
                      </label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        maxLength={500}
                        rows={5}
                        className="border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-primary/30 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors outline-none focus:ring-2"
                        placeholder="Optional details for admin review, max 500 characters..."
                      />

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-secondary text-xs">{reportDescription.length}/500</p>
                        <button
                          type="button"
                          onClick={() => void handleSubmitReport()}
                          disabled={isReportSubmitting}
                          className="bg-error text-on-error flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-[18px]">flag</span>
                          {isReportSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeSelectedDocument}
                    className="border-outline-variant text-primary hover:bg-surface-container-low flex items-center gap-2 rounded-lg border px-5 py-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewFull(aiCache.document.id)}
                    className="bg-primary text-on-primary flex items-center gap-2 rounded-lg px-5 py-2 transition-all hover:shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    View Full
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="px-container-margin-desktop border-outline-variant text-outline text-secondary bg-surface z-10 flex w-full items-center justify-between border-t py-8">
        <p className="font-label-sm text-label-sm">
          © 2024 Academic Precision. All intellectual property reserved.
        </p>
        <div className="flex gap-6">
          <a
            className="font-label-sm text-label-sm hover:text-primary transition-colors"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast.info('Privacy Policy clicked (Simulated)');
            }}
          >
            Privacy Policy
          </a>
          <a
            className="font-label-sm text-label-sm hover:text-primary transition-colors"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast.info('Terms of Service clicked (Simulated)');
            }}
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface flex min-h-screen items-center justify-center">
          <span className="material-symbols-outlined text-secondary animate-spin text-3xl">
            sync
          </span>
        </div>
      }
    >
      <SearchExplore />
    </Suspense>
  );
}
