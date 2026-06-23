'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState, Suspense, type MouseEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  fileUrl: string;
  previewUrl: string | null;
  fileType: string;
  fileSize: string;
  downloadCount: number;
  viewCount: number;
  quizCount: number;
  hasSummary: boolean;
  createdAt: string;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const FOLLOWED_DOCUMENT_IDS_STORAGE_KEY = 'studyhub_followed_document_ids';
const FOLLOWED_DOCUMENTS_STORAGE_KEY = 'studyhub_followed_documents';

const fetcher = async (url: string): Promise<ExploreDocument[]> => {
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
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

function getDocumentUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }

  return `${API_BASE_URL}${fileUrl}`;
}

const MOCK_DOCUMENTS: ExploreDocument[] = [
  {
    id: 'mock-1',
    title: 'Introduction to Data Structures & Algorithms - Midterm Notes',
    description:
      'A comprehensive study guide covering linked lists, trees, graphs, and basic sorting algorithms.',
    subject: { id: 101, name: 'Stanford University', code: 'CS101' },
    fileUrl: '#',
    previewUrl: null,
    fileType: 'application/pdf',
    fileSize: '2457600',
    downloadCount: 1200,
    viewCount: 1200,
    quizCount: 3,
    hasSummary: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Macroeconomics: Full Semester Study Guide',
    description:
      'Complete notes for ECON201 containing aggregate demand, supply, monetary policies, and inflation.',
    subject: { id: 201, name: 'London School of Economics', code: 'ECON201' },
    fileUrl: '#',
    previewUrl: null,
    fileType: 'application/pdf',
    fileSize: '3584000',
    downloadCount: 3400,
    viewCount: 3400,
    quizCount: 5,
    hasSummary: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Calculus III: Vector Analysis Cheat Sheet',
    description:
      "Vector fields, line integrals, Green's theorem, Stokes' theorem, and divergence theorem equations.",
    subject: { id: 301, name: 'MIT', code: 'MATH202' },
    fileUrl: '#',
    previewUrl: null,
    fileType: 'application/pdf',
    fileSize: '1536000',
    downloadCount: 850,
    viewCount: 920,
    quizCount: 2,
    hasSummary: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-4',
    title: 'Organic Chemistry Reactions Summary',
    description:
      'Summary sheet of key organic chemistry mechanisms including nucleophilic substitutions and eliminations.',
    subject: { id: 401, name: 'Harvard University', code: 'CHEM101' },
    fileUrl: '#',
    previewUrl: null,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: '1843200',
    downloadCount: 1900,
    viewCount: 2100,
    quizCount: 4,
    hasSummary: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-5',
    title: 'Machine Learning Past Exams (2018-2023)',
    description: 'Compilation of midterm and final exams with detailed solutions for CS229.',
    subject: { id: 501, name: 'UC Berkeley', code: 'CS229' },
    fileUrl: '#',
    previewUrl: null,
    fileType: 'application/zip',
    fileSize: '12582912',
    downloadCount: 3100,
    viewCount: 3400,
    quizCount: 0,
    hasSummary: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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

function getUniversityName(doc: ExploreDocument): string {
  if (doc.id.startsWith('mock-')) {
    if (doc.id === 'mock-1') return 'Stanford University';
    if (doc.id === 'mock-2') return 'London School of Economics';
    if (doc.id === 'mock-3') return 'MIT';
    if (doc.id === 'mock-4') return 'Harvard University';
    return 'UC Berkeley';
  }

  const idNum = doc.title.charCodeAt(0) + doc.title.charCodeAt(doc.title.length - 1);
  const unis = ['Stanford University', 'MIT', 'Harvard University'];

  return unis[idNum % unis.length];
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
  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('2023 / 2024');

  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    sort: false,
    uni: false,
    type: false,
    year: false,
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
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [activeAiCacheTab, setActiveAiCacheTab] = useState<'summary' | 'quiz'>('summary');
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAuthWarning, setQuizAuthWarning] = useState<string | null>(null);

  // key = questionId, value = selected optionId
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});

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

    router.replace(`/explore?${params.toString()}`);
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

    if (activeQuery.trim() === '') {
      return MOCK_DOCUMENTS;
    }

    if (error) {
      return MOCK_DOCUMENTS.filter((doc) => {
        const query = activeQuery.toLowerCase();

        return (
          doc.title.toLowerCase().includes(query) ||
          (doc.description && doc.description.toLowerCase().includes(query)) ||
          getUniversityName(doc).toLowerCase().includes(query) ||
          doc.subject?.code.toLowerCase().includes(query)
        );
      });
    }

    return [];
  }, [documents, activeQuery, error]);

  const filteredDocuments = useMemo(() => {
    let list = [...displayDocs];

    if (selectedUnis.length > 0) {
      list = list.filter((doc) => selectedUnis.includes(getUniversityName(doc)));
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
  }, [displayDocs, selectedUnis, selectedTypes, sortBy]);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUniversityChange = (uni: string) => {
    setSelectedUnis((prev) =>
      prev.includes(uni) ? prev.filter((u) => u !== uni) : [...prev, uni],
    );
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleClearAll = () => {
    setSelectedUnis([]);
    setSelectedTypes([]);
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

  const toggleFollow = (doc: ExploreDocument, e: MouseEvent) => {
    e.stopPropagation();

    setFollowedDocumentIds((prev) => {
      const nextIds = prev.includes(doc.id)
        ? prev.filter((followedId) => followedId !== doc.id)
        : [...prev, doc.id];

      saveFollowedDocuments(nextIds, doc);

      return nextIds;
    });
  };

  const closeSelectedDocument = () => {
    setSelectedDocumentId(null);
    setSelectedOptionIds({});
    setActiveAiCacheTab('summary');
    setIsQuizSubmitted(false);
    setQuizScore(null);
    setQuizAuthWarning(null);
  };

  const handleViewFull = (fileUrl?: string | null) => {
    if (!fileUrl || fileUrl === '#') {
      alert('Document file is not available yet.');
      return;
    }

    window.open(getDocumentUrl(fileUrl), '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = async (doc: ExploreDocument) => {
    if (doc.id.startsWith('mock-')) {
      alert('This is a simulated document view.');
      return;
    }

    setSelectedOptionIds({});
    setActiveAiCacheTab('summary');
    setIsQuizSubmitted(false);
    setQuizScore(null);
    setQuizAuthWarning(null);
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

  const handleSubmitQuiz = (questions: QuizQuestion[]) => {
    if (!guardQuizAttempt()) {
      return;
    }

    if (questions.length === 0) {
      return;
    }

    const unansweredCount = questions.filter((question) => !selectedOptionIds[question.id]).length;

    if (unansweredCount > 0) {
      alert(`Please answer all questions before submitting. Missing: ${unansweredCount}`);
      return;
    }

    const score = questions.reduce((total, question) => {
      const selectedOptionId = selectedOptionIds[question.id];
      const selectedOption = question.options.find((option) => option.id === selectedOptionId);

      return total + (selectedOption?.isCorrect ? 1 : 0);
    }, 0);

    setQuizScore(score);
    setIsQuizSubmitted(true);
    setQuizAuthWarning(null);
  };

  const handleRetryQuiz = () => {
    setSelectedOptionIds({});
    setIsQuizSubmitted(false);
    setQuizScore(null);
    setQuizAuthWarning(null);
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
              ScholarHub
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
                placeholder="Search for courses, documents, or keywords..."
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
                onClick={() => alert('Notifications clicked (Simulated)')}
                className="material-symbols-outlined text-secondary hover:bg-surface-container-low cursor-pointer rounded-full p-2 transition-colors active:scale-95"
              >
                notifications
              </button>
              <button
                onClick={() => alert('Settings clicked (Simulated)')}
                className="material-symbols-outlined text-secondary hover:bg-surface-container-low cursor-pointer rounded-full p-2 transition-colors active:scale-95"
              >
                settings
              </button>
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
                title="Đăng xuất"
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
                onClick={() => toggleSection('uni')}
                className="group mb-4 flex cursor-pointer items-center justify-between"
              >
                <h3 className="font-label-md text-primary">University</h3>
                <span
                  className={`material-symbols-outlined text-secondary transition-transform ${
                    collapsedSections.uni ? 'rotate-[-90deg]' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
              {!collapsedSections.uni && (
                <div className="space-y-3">
                  {[
                    'Stanford University',
                    'London School of Economics',
                    'MIT',
                    'Harvard University',
                    'UC Berkeley',
                  ].map((uni) => (
                    <label key={uni} className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUnis.includes(uni)}
                        onChange={() => handleUniversityChange(uni)}
                        className="filter-checkbox border-outline-variant text-primary focus:ring-primary h-4 w-4 rounded"
                      />
                      <span className="text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                        {uni}
                      </span>
                    </label>
                  ))}
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
                  {['Lecture notes', 'Summaries', 'Past Exams', 'Essays'].map((type) => (
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
                onClick={() => toggleSection('year')}
                className="group mb-4 flex cursor-pointer items-center justify-between"
              >
                <h3 className="font-label-md text-primary">Academic Year</h3>
                <span
                  className={`material-symbols-outlined text-secondary transition-transform ${
                    collapsedSections.year ? 'rotate-[-90deg]' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
              {!collapsedSections.year && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-surface-container-low font-label-md text-on-surface-variant focus:ring-primary w-full rounded-lg border-none px-4 py-2.5 outline-none focus:ring-2"
                >
                  <option>2023 / 2024</option>
                  <option>2022 / 2023</option>
                  <option>2021 / 2022</option>
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
                    onClick={() => alert('Grid view clicked (Simulated)')}
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
                      Could not load database documents. Showing matching simulated documents.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredDocuments.map((doc) => {
                  const category = getDocumentCategory(doc);

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
                            <button
                              type="button"
                              onClick={(e) => toggleFollow(doc, e)}
                              className={`font-label-sm text-label-sm flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
                                followedDocumentIds.includes(doc.id)
                                  ? 'border-primary bg-primary-container/20 text-primary'
                                  : 'border-outline-variant text-secondary hover:border-primary hover:text-primary'
                              }`}
                              title={
                                followedDocumentIds.includes(doc.id)
                                  ? 'Unfollow this document'
                                  : 'Follow this document'
                              }
                            >
                              <span
                                className={`material-symbols-outlined text-[18px] ${
                                  followedDocumentIds.includes(doc.id) ? 'filled' : ''
                                }`}
                              >
                                bookmark_add
                              </span>
                              {followedDocumentIds.includes(doc.id) ? 'Following' : 'Follow'}
                            </button>
                          </div>
                          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">
                                account_balance
                              </span>
                              <span className="font-label-md text-on-surface-variant">
                                {getUniversityName(doc)}
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
                  Check your spelling, use more general keywords, or try a different subject.
                  Sometimes the most specific knowledge is yet to be shared.
                </p>
              </div>

              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => alert('Upload Document dialog initiated (Simulated)')}
                  className="bg-primary-container font-label-md text-label-md flex h-12 cursor-pointer items-center gap-2 rounded-lg px-8 text-white transition-all hover:shadow-lg active:scale-98"
                >
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  Upload Your Own Document
                </button>
                <button
                  onClick={() => alert('Opening AI Support chatbot (Simulated)')}
                  className="border-outline-variant text-primary font-label-md text-label-md hover:bg-surface-container-low flex h-12 cursor-pointer items-center gap-2 rounded-lg border bg-white px-8 transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  Ask AI Support
                </button>
              </div>

              <div className="border-outline-variant mt-16 w-full max-w-xl border-t pt-8">
                <p className="font-label-sm text-label-sm text-outline mb-6 tracking-widest uppercase">
                  Popular Disciplines
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    'Computer Science',
                    'Molecular Biology',
                    'Microeconomics',
                    'Applied Ethics',
                  ].map((discipline) => (
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
                    {aiCache.document.subject.name} • {aiCache.document.subject.code}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {aiCache && (
                  <button
                    type="button"
                    onClick={() => handleViewFull(aiCache.document.fileUrl)}
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
                <div className="bg-surface-container-low border-outline-variant flex rounded-xl border p-1">
                  <button
                    type="button"
                    onClick={() => setActiveAiCacheTab('summary')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
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
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
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
                                        const isSelected = selectedOptionId === option.id;
                                        const isCorrectAnswer = option.isCorrect;

                                        let optionClass =
                                          'border-outline-variant text-on-surface-variant hover:border-primary hover:bg-surface-container-low';

                                        if (!isQuizSubmitted && isSelected) {
                                          optionClass =
                                            'border-primary bg-primary-container/10 text-primary';
                                        }

                                        if (isQuizSubmitted && isCorrectAnswer) {
                                          optionClass =
                                            'border-primary bg-primary-container/20 text-primary';
                                        }

                                        if (isQuizSubmitted && isSelected && !isCorrectAnswer) {
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

                                            {isQuizSubmitted && isSelected && !isCorrectAnswer && (
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
                                      onClick={() => handleSubmitQuiz(quizQuestions)}
                                      disabled={!hasAllAnswers}
                                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                        hasAllAnswers
                                          ? 'bg-primary text-on-primary hover:shadow-md'
                                          : 'bg-surface-container-high text-secondary cursor-not-allowed'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        task_alt
                                      </span>
                                      Submit Quiz
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
                    onClick={() => handleViewFull(aiCache.document.fileUrl)}
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
              alert('Privacy Policy clicked (Simulated)');
            }}
          >
            Privacy Policy
          </a>
          <a
            className="font-label-sm text-label-sm hover:text-primary transition-colors"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Terms of Service clicked (Simulated)');
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
