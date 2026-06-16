'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

import { dashboardApi, ExploreDocument } from '@/services/dashboardApi';

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
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('User');

  const loadDashboardData = async () => {
    try {
      const data = await dashboardApi.getDashboardData();
      setRecentlyViewed(data.recentlyViewed || []);
      setPublicDocuments(data.publicDocuments || []);
      setTrendingDocs(data.trending || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj && userObj.fullName) {
          setUserFullName(userObj.fullName);
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
    try {
      await dashboardApi.recordView(docId);
    } catch (err) {
      console.error('Failed to record view:', err);
    }
    router.push(`/explore?search=${encodeURIComponent(docTitle)}`);
  };

  const toggleSaveDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
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
                router.push('/explore');
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

              <button className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <img
                  alt="User profile avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYqSMGF3Z3oHdYhn5TKuHMKRLqgbBxxxtoRNxnakx4QY5gEAylvvaC7DqnO-6wRdWbBIdm8lN9SEhMxCbp8hakT47O6vbJLl91-97D8pkJXLj50c3nW8qB-8avFTT50YGPsF-9s6SN75_vCxKk31GsSz7WxQH4X-qlX6XGkFSqpq9alyYCX-ZxYLwHMCljNf0kwH5AertyqfjrTSYFBaxqzh-1604Hz7HFbNugFP3ndIVAs_2OpIbQSJgwvDs5Kcf11UWU6_PEEOQ"
                />
              </button>
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
                      router.push('/explore');
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentlyViewed.map((doc) => (
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt="Sarah J. avatar profile picture"
                        className="w-10 h-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKnnE9P8WplUJMxgDKRUPtxvrITGrpi-hIFPFfkPJz6oIZBQQwhURIyhGnsxfdGzugqzkbfErVWvEXVDQj40Z8jZPgGOqIZxv-iQyguS7fnYjLa36ZJQnXbCk_lBFV7OxsVwQ3nvdhn0hnYgs75Q3OEbKjYauRURKkxAFUml8OZhtI9RB61neoZvyycGXvBcD6FfN7pEdKb-2n0h7XV1Hm6YScxugLFyu6R1-OspAxktJA0roF_6UUt98S76BVyaYvqEqcy1khE"
                      />
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Sarah J.</p>
                        <p className="font-label-sm text-label-sm text-secondary">
                          42 docs uploaded
                        </p>
                      </div>
                    </div>
                    <span className="bg-primary-fixed-dim text-on-primary-fixed px-2 py-1 rounded text-xs font-bold">
                      #1
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt="Michael T. avatar profile picture"
                        className="w-10 h-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9oEKKeSTGWU2aMKR3uIJjXccVa_ApxQ96iHoa3ZIY_fK-Eru2ODGjVBSM-Ot3QYwTQcFovUpYv4p5hMugpW95zvu2FNrnu3sH_LKPJ795Unfp_WkNm3NETpHEXztHgptc2Z-2V3S53oBbYbFIlDgVyVpK7FrWYJvZTMMTnqYIB1Qlxaz0cUXnQ3dMgjx53S_Yf4L92SgHMKhkrvovBy94za6Va35s-KRjK8N-g5R9XuupjLW1RdU1r9yHas58uqAX1SO3WeThAIc"
                      />
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Michael T.</p>
                        <p className="font-label-sm text-label-sm text-secondary">
                          38 docs uploaded
                        </p>
                      </div>
                    </div>
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-xs font-bold">
                      #2
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt="Emily R. avatar profile picture"
                        className="w-10 h-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLzW5NgJtFtUnPROHmp5OiPtOFcLRfXICeEm2wazxYt8sTF4aiFaYMAnUfN6PiBeRqLd1h726ph7PBxyMUbQa4gWQdGtEeygAUQzhJE803Il3X4CT5-2kL_rYsz3_tXaR5twW4iQ_jhERXGtG-yOnfVvnjlorL3eK42Xlae2OarbZR_vsqeIBqrE-AdpY66fFBzLMY6DkDeuTdaBTBjUsh-tMTohgJCQ7CguJFWsTp_-0xYLtlniFiS7b8CLz6eZ-s7OCixOs3-2M"
                      />
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Emily R.</p>
                        <p className="font-label-sm text-label-sm text-secondary">
                          29 docs uploaded
                        </p>
                      </div>
                    </div>
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-xs font-bold">
                      #3
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => alert('Leaderboard clicked (Simulated)')}
                  className="w-full mt-6 py-2 border border-[#E9ECEF] text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  View Leaderboard
                </button>
              </section>

              <section className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-4xl mb-4 text-[#e0e3e8]">
                    workspace_premium
                  </span>
                  <h3 className="font-headline-md text-headline-md text-white mb-2 font-semibold">
                    Unlock Premium
                  </h3>
                  <p className="font-body-md text-body-md text-[#bfc7d0] mb-6">
                    Get unlimited access to millions of documents, practice tests, and expert answers.
                  </p>
                  <button
                    onClick={() => alert('Subscription flow initiated (Simulated)')}
                    className="bg-white text-[#212529] px-6 py-3 rounded-full font-label-md text-label-md font-semibold hover:bg-[#e0e3e6] transition-colors w-full text-center cursor-pointer"
                  >
                    Start Free Trial
                  </button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
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
