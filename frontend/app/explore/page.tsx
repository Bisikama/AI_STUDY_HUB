'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const fetcher = async (url: string): Promise<ExploreDocument[]> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch explore documents');
  }

  const result = (await response.json()) as ApiResponse<ExploreDocument[]>;

  if (Array.isArray(result)) {
    return result;
  }

  return result.data;
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

function formatFileType(fileType: string): string {
  if (fileType.includes('pdf')) {
    return 'PDF';
  }

  if (fileType.includes('word') || fileType.includes('document')) {
    return 'DOCX';
  }

  return fileType.split('/').pop()?.toUpperCase() ?? 'FILE';
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
    description: 'A comprehensive study guide covering linked lists, trees, graphs, and basic sorting algorithms.',
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
    description: 'Complete notes for ECON201 containing aggregate demand, supply, monetary policies, and inflation.',
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
    description: 'Vector fields, line integrals, Green\'s theorem, Stokes\' theorem, and divergence theorem equations.',
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
    description: 'Summary sheet of key organic chemistry mechanisms including nucleophilic substitutions and eliminations.',
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

  // Reset activeQuery immediately when search bar is cleared
  if (search.trim() === '' && activeQuery !== '') {
    setActiveQuery('');
  }

  // Filters State
  const [sortBy, setSortBy] = useState<'recent' | 'viewed'>('recent');
  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('2023 / 2024');

  // Collapse sections
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    sort: false,
    uni: false,
    type: false,
    year: false,
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Update URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeQuery.trim()) {
      params.set('search', activeQuery.trim());
    } else {
      params.delete('search');
    }
    router.replace(`/explore?${params.toString()}`);
  }, [activeQuery, router]);

  const handleSearchSubmit = () => {
    setActiveQuery(search);
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
    // If the backend is running but returned 0 results, we don't display mock documents.
    // However, if SWR failed to connect (error), we fall back to mock documents to keep the interface testable.
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

    // Filter by University
    if (selectedUnis.length > 0) {
      list = list.filter((doc) => selectedUnis.includes(getUniversityName(doc)));
    }

    // Filter by Document Type
    if (selectedTypes.length > 0) {
      list = list.filter((doc) => selectedTypes.includes(getDocumentCategory(doc)));
    }

    // Sorting
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
      prev.includes(uni) ? prev.filter((u) => u !== uni) : [...prev, uni]
    );
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearAll = () => {
    setSelectedUnis([]);
    setSelectedTypes([]);
    setSortBy('recent');
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  const handleCardClick = (fileUrl: string) => {
    if (fileUrl === '#') {
      alert('This is a simulated document view.');
      return;
    }
    window.open(getDocumentUrl(fileUrl), '_blank', 'noopener,noreferrer');
  };

  const handleSuggestionClick = (discipline: string) => {
    setSearch(discipline);
    setActiveQuery(discipline);
  };

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-fixed-dim min-h-screen flex flex-col font-sans">
      {/* TopNavBar */}
      <header className="w-full sticky top-0 z-50 bg-surface shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div className="flex justify-between items-center px-container-margin-desktop py-4 w-full gap-8">
          <div className="flex items-center gap-8 flex-1">
            <a
              className="text-headline-md font-headline-md font-bold text-primary shrink-0"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push('/');
              }}
            >
              ScholarHub
            </a>

            {/* Central Search Bar */}
            <div className="relative max-w-xl w-full">
              <span
                onClick={handleSearchSubmit}
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary cursor-pointer hover:text-primary transition-colors"
              >
                search
              </span>
              <input
                className="w-full h-12 pl-12 pr-4 bg-surface-container-low border-none rounded-lg font-body-md text-primary focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none"
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
            <nav className="hidden md:flex items-center gap-8">
              <a
                className="text-primary font-bold border-b-2 border-primary py-1 transition-colors"
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
                  alert('My Documents clicked (Simulated)');
                }}
              >
                My Documents
              </a>
              <a
                className="text-secondary font-label-md hover:text-primary transition-colors"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('AI Assistant clicked (Simulated)');
                }}
              >
                AI Assistant
              </a>
            </nav>

            <div className="flex items-center gap-4 border-l border-outline-variant pl-6">
              <button
                onClick={() => alert('Notifications clicked (Simulated)')}
                className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-2 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                notifications
              </button>
              <button
                onClick={() => alert('Settings clicked (Simulated)')}
                className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-2 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                settings
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-container-high">
                <img
                  alt="User Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmRIQIc6LO9lV5rVtojZ7Vh-4aAm0za_O0i5ayKA2xj5hmmtTyNfQvFCZNPhEfrXG_1djLfBLkYl-oRMknt4VMjwDxAHTLWyqk3U8mvXoulTPKmZi_lPoDe5yP9DJa1_HnZhUWZF8pI3XxjStB2JqRcoeuyOfo7DSOd9-q8HaWShAn_Rqgu1w26jKT2gX7DqpcPd3kC4Uam3KP7ywqZsOefPY_o9YIMdPmCJHLvDhiQBVe4ou63D8uVWKJY3uShYdVn9kYtYeSsJg"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex flex-col md:flex-row flex-1 w-full min-h-[calc(100vh-80px)]">
        {/* Sidebar Filter Panel */}
        <aside className="w-full md:w-[25%] bg-surface border-r border-outline-variant p-container-margin-desktop md:sticky md:top-[80px] md:h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-md text-label-md text-primary uppercase tracking-widest">
              Filters
            </h2>
            <button
              onClick={handleClearAll}
              className="text-label-sm text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Filter Groups */}
          <div className="space-y-8">
            {/* Sort By */}
            <section>
              <div
                onClick={() => toggleSection('sort')}
                className="flex items-center justify-between mb-4 group cursor-pointer"
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
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === 'recent'}
                      onChange={() => setSortBy('recent')}
                      className="w-4 h-4 border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                      Most Recent
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === 'viewed'}
                      onChange={() => setSortBy('viewed')}
                      className="w-4 h-4 border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                      Most Viewed
                    </span>
                  </label>
                </div>
              )}
            </section>

            <hr className="border-outline-variant" />

            {/* University */}
            <section>
              <div
                onClick={() => toggleSection('uni')}
                className="flex items-center justify-between mb-4 group cursor-pointer"
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
                  {['Stanford University', 'London School of Economics', 'MIT', 'Harvard University', 'UC Berkeley'].map((uni) => (
                    <label key={uni} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedUnis.includes(uni)}
                        onChange={() => handleUniversityChange(uni)}
                        className="filter-checkbox w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
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

            {/* Document Type */}
            <section>
              <div
                onClick={() => toggleSection('type')}
                className="flex items-center justify-between mb-4 group cursor-pointer"
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
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeChange(type)}
                        className="filter-checkbox w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
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

            {/* Academic Year */}
            <section>
              <div
                onClick={() => toggleSection('year')}
                className="flex items-center justify-between mb-4 group cursor-pointer"
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
                  className="w-full bg-surface-container-low border-none rounded-lg font-label-md text-on-surface-variant focus:ring-2 focus:ring-primary py-2.5 px-4 outline-none"
                >
                  <option>2023 / 2024</option>
                  <option>2022 / 2023</option>
                  <option>2021 / 2022</option>
                </select>
              )}
            </section>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="w-full md:w-[75%] bg-surface-container-lowest p-container-margin-desktop flex flex-col">
          {filteredDocuments.length > 0 ? (
            <div className="max-w-4xl mx-auto w-full">
              {/* Results Header */}
              <div className="flex items-end justify-between mb-8 pb-4 border-b border-outline-variant">
                <div>
                  <h1 className="font-headline-lg text-primary mb-1">Search Results</h1>
                  <p className="font-body-md text-on-surface-variant">
                    Showing{' '}
                    <span className="font-bold text-primary">
                      {filteredDocuments.length}
                    </span>{' '}
                    results for &quot;
                    <span className="italic">{activeQuery || 'All Documents'}</span>&quot;
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => alert('Grid view clicked (Simulated)')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low text-label-md text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md transition-all active:scale-95 shadow-sm cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">
                      format_list_bulleted
                    </span>
                  </button>
                </div>
              </div>

              {/* Connection Error Banner (in Results list) */}
              {error && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3 mb-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] border border-error/10">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                  <div>
                    <p className="font-label-md text-label-md font-semibold">Backend offline</p>
                    <p className="text-xs opacity-80">
                      Could not load database documents. Showing matching simulated documents.
                    </p>
                  </div>
                </div>
              )}

              {/* Results List */}
              <div className="space-y-4">
                {filteredDocuments.map((doc) => {
                  const category = getDocumentCategory(doc);
                  return (
                    <article
                      key={doc.id}
                      onClick={() => handleCardClick(doc.fileUrl)}
                      className="group relative bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex gap-6 items-start">
                        <div className="w-16 h-20 shrink-0 bg-surface-container-low rounded-lg flex items-center justify-center border border-outline-variant group-hover:border-primary transition-colors">
                          <span className="material-symbols-outlined text-[32px] text-secondary group-hover:text-primary transition-colors">
                            {getCategoryIcon(category)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-headline-md text-primary group-hover:text-primary-container leading-tight">
                              {doc.title}
                            </h3>
                            <button
                              onClick={(e) => toggleBookmark(doc.id, e)}
                              className="material-symbols-outlined text-secondary hover:text-primary transition-colors cursor-pointer"
                            >
                              <span
                                className={`material-symbols-outlined ${
                                  bookmarkedIds.includes(doc.id) ? 'filled text-primary' : ''
                                }`}
                              >
                                bookmark
                              </span>
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                                account_balance
                              </span>
                              <span className="font-label-md text-on-surface-variant">
                                {getUniversityName(doc)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                                code
                              </span>
                              <span className="font-label-md text-on-surface-variant">
                                {doc.subject?.code ?? 'GEN101'}
                              </span>
                            </div>
                            <div className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-secondary uppercase tracking-wider">
                              {category}
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-label-sm text-secondary border-t border-outline-variant pt-4">
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

              {/* Pagination */}
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  disabled
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-30 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-lg bg-primary text-on-primary font-label-md">
                    1
                  </button>
                  <button
                    onClick={() => alert('Page 2 clicked (Simulated)')}
                    className="w-10 h-10 rounded-lg border border-outline-variant text-primary font-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    2
                  </button>
                  <button
                    onClick={() => alert('Page 3 clicked (Simulated)')}
                    className="w-10 h-10 rounded-lg border border-outline-variant text-primary font-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    3
                  </button>
                  <span className="flex items-center px-2 text-secondary">...</span>
                  <button
                    onClick={() => alert('Page 12 clicked (Simulated)')}
                    className="w-10 h-10 rounded-lg border border-outline-variant text-primary font-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    12
                  </button>
                </div>
                <button
                  onClick={() => alert('Next page clicked (Simulated)')}
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= EXPLORE EMPTY STATE ================= */
            <div className="flex-grow flex flex-col items-center justify-center text-center py-12 md:py-24 px-4 w-full max-w-4xl mx-auto">
              {/* Connection Error Banner (in Empty state) */}
              {error && (
                <div className="max-w-xl w-full bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3 mb-8 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] border border-error/10">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                  <div className="text-left">
                    <p className="font-label-md text-label-md font-semibold">Backend server offline</p>
                    <p className="text-xs opacity-80">
                      Failed to query backend database. Try starting port 3000.
                    </p>
                  </div>
                </div>
              )}

              {/* Illustration Section */}
              <div className="relative w-full max-w-lg mb-12 animate-fade-in">
                <img
                  alt="Search Not Found Illustration"
                  className="w-full h-auto"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjq4iiNttHXdhtTrh_gAe3aSgH5Meq3lX3cu9VbuzXrlfBB9bxx7BKYDh05hLAXQnUox7kJcaR2IC_cWCxbsfGKbeRIrXvS7iA-7G3GMPIt3w2KsuF1oBrFWS2X_4YS1mV8UPLDSNXD0OmQ4nIfZuaa97IwApBLlrdvRkIJ1-XqvUHIb2T1jZUx-keKNdiEduQ_LsvdQxjTt2cs4s9FcnXdRffee4vp4mzk3CgJ7UlmUAT_G5yArIk_d0QEHgY2S7l4NOEjKa_19w"
                />
              </div>

              {/* Feedback Content */}
              <div className="max-w-2xl space-y-6">
                <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">
                  We couldn&apos;t find any documents matching your search
                </h1>
                <p className="font-body-lg text-body-lg text-secondary">
                  Check your spelling, use more general keywords, or try a different subject. Sometimes
                  the most specific knowledge is yet to be shared.
                </p>
              </div>

              {/* CTA Action Buttons */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => alert('Upload Document dialog initiated (Simulated)')}
                  className="h-12 px-8 bg-primary-container text-white rounded-lg font-label-md text-label-md hover:shadow-lg active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  Upload Your Own Document
                </button>
                <button
                  onClick={() => alert('Opening AI Support chatbot (Simulated)')}
                  className="h-12 px-8 border border-outline-variant bg-white text-primary rounded-lg font-label-md text-label-md hover:bg-surface-container-low active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  Ask AI Support
                </button>
              </div>

              {/* Suggestion Chips */}
              <div className="mt-16 pt-8 border-t border-outline-variant w-full max-w-xl">
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline mb-6">
                  Popular Disciplines
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Computer Science', 'Molecular Biology', 'Microeconomics', 'Applied Ethics'].map(
                    (discipline) => (
                      <button
                        key={discipline}
                        onClick={() => handleSuggestionClick(discipline)}
                        className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-md text-label-md hover:bg-outline-variant transition-colors cursor-pointer"
                      >
                        {discipline}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Credit */}
      <footer className="w-full px-container-margin-desktop py-8 border-t border-outline-variant flex justify-between items-center text-outline text-secondary bg-surface z-10">
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
        <div className="bg-surface min-h-screen flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-3xl text-secondary">sync</span>
        </div>
      }
    >
      <SearchExplore />
    </Suspense>
  );
}
