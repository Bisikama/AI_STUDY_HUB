'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';

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

function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

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

function getStaticRating(index: number): string {
  const ratings = ['4.8', '4.5', '4.9', '4.2', '4.7', '4.6'];

  return ratings[index % ratings.length];
}

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const exploreUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
    }

    const queryString = params.toString();

    return `${API_BASE_URL}/api/explore${queryString ? `?${queryString}` : ''}`;
  }, [debouncedSearch]);

  const { data: documents = [], error, isLoading } = useSWR(exploreUrl, fetcher);

  return (
    <main className="min-h-screen bg-[#070b1f] text-white">
      <aside className="fixed top-0 left-0 hidden h-screen w-72 border-r border-white/10 bg-[#0b1028] lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 text-lg font-bold">
            {}
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.3em] text-cyan-300">AI STUDY HUB</p>
          </div>
        </div>

        <nav className="px-4 py-8">
          <p className="mb-5 px-3 text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
            Main Menu
          </p>

          <div className="space-y-3">
            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">
              <span className="text-lg">▦</span>
              Overview
            </button>

            <button className="flex w-full items-center gap-3 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 px-4 py-3 text-left text-sm font-semibold text-cyan-300">
              <span className="text-lg">▤</span>
              Library
            </button>

            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">
              <span className="text-lg">⌘</span>
              Courses
            </button>
          </div>
        </nav>

        <div className="absolute right-4 bottom-6 left-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-lg font-bold">
              N
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">Sinh viên Nguyễn Văn</p>
              <span className="mt-1 inline-flex rounded-md bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                USER
              </span>
            </div>
            <span className="text-slate-500">⌃</span>
          </div>
        </div>
      </aside>

      <section className="min-h-screen lg:pl-72">
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#0b1028]/70 px-6 backdrop-blur-xl lg:px-8">
          <p className="text-xs font-bold tracking-[0.35em] text-slate-400 uppercase">
            AI Study Hub System
          </p>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              System Online
            </p>
          </div>
        </header>

        <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-5 py-8 sm:px-8">
          <div className="pointer-events-none absolute top-0 right-0 h-[520px] w-[520px] rounded-full bg-purple-700/30 blur-[130px]" />
          <div className="pointer-events-none absolute top-20 left-20 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">My Library</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Manage all your uploaded and saved study materials
                </p>
              </div>

              <div className="flex gap-3">
                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10">
                  ⌄ Filter
                </button>
                <button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.02]">
                  Upload New
                </button>
              </div>
            </div>

            <div className="mb-7 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#090e25]/80 px-5 py-4">
                <span className="text-xl text-slate-500">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search documents by name, type, subject code..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Community Documents</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            {isLoading && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
                Loading documents...
              </div>
            )}

            {error && (
              <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center text-red-300">
                Không thể tải danh sách tài liệu. Kiểm tra backend port 3000.
              </div>
            )}

            {!isLoading && !error && documents.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
                Không tìm thấy tài liệu phù hợp.
              </div>
            )}

            {!isLoading && !error && documents.length > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {documents.map((document, index) => (
                  <article
                    key={document.id}
                    className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.07]"
                  >
                    <div className="mb-5 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-300">
                        ▤
                      </div>

                      <div className="rounded-xl bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">
                        ★ {getStaticRating(index)}
                      </div>
                    </div>

                    <h3 className="mb-3 min-h-14 text-xl leading-7 font-extrabold text-white">
                      {document.title}
                    </h3>

                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="rounded-md bg-white/5 px-2 py-1 text-slate-300">
                        {formatFileType(document.fileType)}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>•</span>
                      <span>{document.subject?.code ?? 'No Code'}</span>
                    </div>

                    <p className="mb-4 min-h-12 text-sm leading-6 text-slate-400">
                      {document.description ?? 'Chưa có mô tả cho tài liệu này.'}
                    </p>

                    <p className="mb-5 text-sm font-semibold text-slate-300">
                      {document.subject?.name ?? 'Unknown subject'}
                    </p>

                    <div className="border-t border-white/10 pt-4">
                      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl bg-[#0b1028]/70 px-3 py-3">
                          <p className="text-sm font-bold text-white">{document.quizCount}</p>
                          <p className="text-xs text-slate-500">Quiz</p>
                        </div>

                        <div className="rounded-2xl bg-[#0b1028]/70 px-3 py-3">
                          <p className="text-sm font-bold text-white">{document.viewCount}</p>
                          <p className="text-xs text-slate-500">Views</p>
                        </div>

                        <div className="rounded-2xl bg-[#0b1028]/70 px-3 py-3">
                          <p className="text-sm font-bold text-white">
                            {document.hasSummary ? 'Yes' : 'No'}
                          </p>
                          <p className="text-xs text-slate-500">Summary</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>◷</span>
                          <span>{formatCreatedAt(document.createdAt)}</span>
                        </div>

                        <a
                          href={getDocumentUrl(document.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
                          title="Open document"
                        >
                          ⤓
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
