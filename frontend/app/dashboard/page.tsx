'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

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

function getRating(docId: string, index: number): string {
  if (docId === 'mock-1') return '98%';
  if (docId === 'mock-2') return '95%';
  const ratings = ['98%', '95%', '99%', '92%', '97%', '96%'];
  return ratings[index % ratings.length];
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
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return null;
  });
  const { getProfile } = useAuth();

  useEffect(() => {
    // Fetch từ API để đồng bộ dữ liệu mới nhất từ database
    getProfile()
      .then((updatedUser) => {
        setUser(updatedUser);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to sync profile:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleCardClick = () => {
    alert('This is a simulated document view. Search or upload documents on the Explore page.');
  };

  const toggleSaveDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id],
    );
  };

  const recentlyViewed = MOCK_DOCUMENTS.slice(0, 2);
  const trendingDocs = MOCK_DOCUMENTS.slice(2);

  return (
    <div className="bg-background text-on-background flex min-h-screen font-sans">
      {/* Sidebar Nav */}
      <nav
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } border-outline-variant bg-surface-container-lowest fixed top-0 left-0 z-20 h-full w-64 flex-col border-r p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all md:flex`}
      >
        <div className="mb-8 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <div>
              <h1 className="font-headline-md text-headline-md text-primary">ScholarHub</h1>
              <p className="font-label-sm text-label-sm text-secondary">Academic Excellence</p>
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
          <button
            onClick={() => router.push('/explore')}
            className="bg-primary-container text-on-primary font-label-md text-label-md flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined">add</span> New Research
          </button>
        </div>

        <ul className="flex flex-grow flex-col gap-2">
          <li>
            <a
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push('/explore');
              }}
            >
              <span className="material-symbols-outlined">explore</span> Discover
            </a>
          </li>
          <li>
            <a
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
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
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
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
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('AI Assistant clicked (Simulated)');
              }}
            >
              <span className="material-symbols-outlined">psychology</span> AI Assistant
            </a>
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
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
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
              className="text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-3 rounded-lg px-4 py-3 transition-transform active:scale-95"
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
              className="text-error font-label-md text-label-md flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-transform hover:bg-red-50 hover:text-rose-700 active:scale-95"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/');
              }}
            >
              <span className="material-symbols-outlined text-error">logout</span> Đăng xuất
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
              <span className="font-headline-md text-headline-md text-primary">ScholarHub</span>
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
                onClick={() => router.push('/explore')}
                className="font-label-md text-label-md hidden h-10 cursor-pointer items-center gap-2 rounded-full bg-[#212529] px-4 py-2 text-white transition-opacity hover:opacity-90 md:flex"
              >
                <span className="material-symbols-outlined text-[20px]">upload</span> Upload
              </button>

              <button className="text-secondary hover:text-primary relative cursor-pointer p-2 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="bg-error absolute top-2 right-2 h-2 w-2 rounded-full"></span>
              </button>

              <button className="border-outline-variant hover:border-primary focus:ring-primary h-10 w-10 overflow-hidden rounded-full border transition-colors focus:ring-2 focus:ring-offset-2">
                <img
                  alt="User profile avatar"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYqSMGF3Z3oHdYhn5TKuHMKRLqgbBxxxtoRNxnakx4QY5gEAylvvaC7DqnO-6wRdWbBIdm8lN9SEhMxCbp8hakT47O6vbJLl91-97D8pkJXLj50c3nW8qB-8avFTT50YGPsF-9s6SN75_vCxKk31GsSz7WxQH4X-qlX6XGkFSqpq9alyYCX-ZxYLwHMCljNf0kwH5AertyqfjrTSYFBaxqzh-1604Hz7HFbNugFP3ndIVAs_2OpIbQSJgwvDs5Kcf11UWU6_PEEOQ"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="p-container-margin-mobile md:p-container-margin-desktop max-w-max-width mx-auto w-full flex-1">
          <section className="mb-12">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
              Welcome back, {user?.name || 'Alex'}
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
                      router.push('/explore');
                    }}
                  >
                    View all
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {recentlyViewed.map((doc, idx) => (
                    <div
                      key={doc.id}
                      onClick={handleCardClick}
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
                              alert('Download clicked (Simulated)');
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
                          <span className="material-symbols-outlined text-[16px]">visibility</span>{' '}
                          1.2k
                        </span>
                        <span className="font-label-sm text-label-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">thumb_up</span>{' '}
                          {getRating(doc.id, idx)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Trending */}
              <section>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">
                  Trending in your network
                </h3>
                <div className="bg-surface-container-lowest overflow-hidden rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                  {trendingDocs.map((doc) => {
                    const fileInfo = getFileTypeIconAndStyle(doc.fileType);
                    return (
                      <div
                        key={doc.id}
                        onClick={handleCardClick}
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
                              <span className="text-[#212529]">
                                Added {formatCreatedAt(doc.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleSaveDoc(doc.id, e)}
                          className={`font-label-sm text-label-sm hidden cursor-pointer rounded-full border px-4 py-2 transition-colors sm:block ${
                            savedDocIds.includes(doc.id)
                              ? 'bg-primary-container border-primary-container text-white'
                              : 'border-[#212529] text-[#212529] hover:bg-[#212529] hover:text-white'
                          }`}
                        >
                          {savedDocIds.includes(doc.id) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    );
                  })}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt="Sarah J. avatar profile picture"
                        className="h-10 w-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKnnE9P8WplUJMxgDKRUPtxvrITGrpi-hIFPFfkPJz6oIZBQQwhURIyhGnsxfdGzugqzkbfErVWvEXVDQj40Z8jZPgGOqIZxv-iQyguS7fnYjLa36ZJQnXbCk_lBFV7OxsVwQ3nvdhn0hnYgs75Q3OEbKjYauRURKkxAFUml8OZhtI9RB61neoZvyycGXvBcD6FfN7pEdKb-2n0h7XV1Hm6YScxugLFyu6R1-OspAxktJA0roF_6UUt98S76BVyaYvqEqcy1khE"
                      />
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Sarah J.</p>
                        <p className="font-label-sm text-label-sm text-secondary">
                          42 docs uploaded
                        </p>
                      </div>
                    </div>
                    <span className="bg-primary-fixed-dim text-on-primary-fixed rounded px-2 py-1 text-xs font-bold">
                      #1
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt="Michael T. avatar profile picture"
                        className="h-10 w-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9oEKKeSTGWU2aMKR3uIJjXccVa_ApxQ96iHoa3ZIY_fK-Eru2ODGjVBSM-Ot3QYwTQcFovUpYv4p5hMugpW95zvu2FNrnu3sH_LKPJ795Unfp_WkNm3NETpHEXztHgptc2Z-2V3S53oBbYbFIlDgVyVpK7FrWYJvZTMMTnqYIB1Qlxaz0cUXnQ3dMgjx53S_Yf4L92SgHMKhkrvovBy94za6Va35s-KRjK8N-g5R9XuupjLW1RdU1r9yHas58uqAX1SO3WeThAIc"
                      />
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Michael T.</p>
                        <p className="font-label-sm text-label-sm text-secondary">
                          38 docs uploaded
                        </p>
                      </div>
                    </div>
                    <span className="bg-surface-variant text-on-surface-variant rounded px-2 py-1 text-xs font-bold">
                      #2
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt="Emily R. avatar profile picture"
                        className="h-10 w-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLzW5NgJtFtUnPROHmp5OiPtOFcLRfXICeEm2wazxYt8sTF4aiFaYMAnUfN6PiBeRqLd1h726ph7PBxyMUbQa4gWQdGtEeygAUQzhJE803Il3X4CT5-2kL_rYsz3_tXaR5twW4iQ_jhERXGtG-yOnfVvnjlorL3eK42Xlae2OarbZR_vsqeIBqrE-AdpY66fFBzLMY6DkDeuTdaBTBjUsh-tMTohgJCQ7CguJFWsTp_-0xYLtlniFiS7b8CLz6eZ-s7OCixOs3-2M"
                      />
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Emily R.</p>
                        <p className="font-label-sm text-label-sm text-secondary">
                          29 docs uploaded
                        </p>
                      </div>
                    </div>
                    <span className="bg-surface-variant text-on-surface-variant rounded px-2 py-1 text-xs font-bold">
                      #3
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => alert('Leaderboard clicked (Simulated)')}
                  className="text-on-surface font-label-md text-label-md hover:bg-surface-container-low mt-6 w-full cursor-pointer rounded-lg border border-[#E9ECEF] py-2 transition-colors"
                >
                  View Leaderboard
                </button>
              </section>

              <section className="bg-primary-container text-on-primary-container group relative overflow-hidden rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                <div className="relative z-10">
                  <span className="material-symbols-outlined mb-4 text-4xl text-[#e0e3e8]">
                    workspace_premium
                  </span>
                  <h3 className="font-headline-md text-headline-md mb-2 font-semibold text-white">
                    Unlock Premium
                  </h3>
                  <p className="font-body-md text-body-md mb-6 text-[#bfc7d0]">
                    Get unlimited access to millions of documents, practice tests, and expert
                    answers.
                  </p>
                  <button
                    onClick={() => alert('Subscription flow initiated (Simulated)')}
                    className="font-label-md text-label-md w-full cursor-pointer rounded-full bg-white px-6 py-3 text-center font-semibold text-[#212529] transition-colors hover:bg-[#e0e3e6]"
                  >
                    Start Free Trial
                  </button>
                </div>
                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white opacity-5 blur-2xl transition-transform duration-500 group-hover:scale-110"></div>
              </section>
            </div>
          </div>
        </main>
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
    const token = localStorage.getItem('token');
    const timer = setTimeout(() => {
      setIsLoggedIn(!!token);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (isLoggedIn === null) {
    return <DashboardSkeleton />;
  }

  if (!isLoggedIn) {
    router.replace('/login');
    return null;
  }

  return <DashboardPage />;
}
