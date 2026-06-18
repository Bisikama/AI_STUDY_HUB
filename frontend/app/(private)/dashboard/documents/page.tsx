'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { documentsApi, Document } from '@/services/documentsApi';

export default function MyDocumentsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    data: response,
    error,
    isLoading,
  } = useSWR('/documents/me', () => documentsApi.getMyDocuments());

  const documents = response?.data || [];

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-red-500">
        Failed to load documents.
      </div>
    );
  }

  // Calculate storage (mocking total capacity as 2.5GB for demo based on 74% usage in image)
  const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
  const totalGB = (totalSize / (1024 * 1024 * 1024)).toFixed(1);
  const percentage = Math.min(Math.round((totalSize / (2.5 * 1024 * 1024 * 1024)) * 100), 100);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl bg-[#F8F9FA] p-6 font-sans md:p-8">
      {documents.length > 0 ? (
        <>
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
                Document Library
              </h1>
              <p className="mt-1 text-[15px] text-gray-500">
                Manage your course materials and AI-generated notes.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4 sm:mt-0">
              <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">view_list</span>
                  List
                </button>
              </div>

              <Link
                href="/dashboard/upload"
                className="flex items-center gap-2 rounded-lg bg-[#1a1c23] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black"
              >
                <span className="material-symbols-outlined text-[20px]">upload</span>
                Upload New
              </Link>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => {
              const isPdf = doc.fileType.toLowerCase().includes('pdf');
              return (
                <div
                  key={doc.id}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                    doc.isAIGenerated ? 'border-gray-300 bg-gray-100' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="mb-4">
                      {doc.isAIGenerated ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                          <span className="material-symbols-outlined">data_object</span>
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F3F5] text-gray-500">
                          <span className="material-symbols-outlined">
                            {isPdf ? 'picture_as_pdf' : 'description'}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="mb-1 truncate font-semibold text-gray-900" title={doc.title}>
                      {doc.title}
                    </h3>
                    
                    <p className="mb-2 truncate text-[12px] font-medium text-[#1a1c23]">
                      {doc.subject?.name ?? `SUB-${doc.subjectId}`}
                    </p>

                    <p className="mb-3 text-[13px] text-gray-500">
                      {doc.isAIGenerated ? 'AI Generated' : `Added ${formatDate(doc.createdAt)}`} •{' '}
                      {formatSize(doc.fileSize)}
                    </p>

                    {/* Tags Section */}
                    {!doc.isAIGenerated && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                        {doc.tags && doc.tags.length > 0 ? (
                          <>
                            {doc.tags.slice(0, 3).map((t: any) => (
                              <span
                                key={t.tag.id}
                                className="inline-flex max-w-[80px] truncate items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                                title={t.tag.name}
                              >
                                {t.tag.name}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                                +{doc.tags.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-transparent px-1 py-0.5 text-[10px] italic text-gray-400">
                            No tags
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    {doc.isAIGenerated ? (
                      <span className="rounded bg-black px-2 py-1 text-[11px] font-bold tracking-wider text-white">
                        AI INSIGHT
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400">
                        DOCUMENT
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-gray-400">
                      {doc.isAIGenerated ? (
                        <>
                          <button className="rounded p-1.5 transition-colors hover:bg-gray-200 hover:text-gray-700">
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                          </button>
                          <button className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-800">
                            <span className="material-symbols-outlined text-[16px]">bolt</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/dashboard/documents/${doc.id}`}
                            className="rounded p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Upload More Card */}
            <Link
              href="/dashboard/upload"
              className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-transparent transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors group-hover:bg-gray-200 group-hover:text-gray-700">
                <span className="material-symbols-outlined text-2xl">add</span>
              </div>
              <p className="mt-3 font-medium text-gray-600">Upload more</p>
            </Link>
          </div>

          {/* Bottom Widgets */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Storage Analysis */}
            <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Storage Analysis</h3>
                <span className="text-sm font-medium text-gray-500">
                  {percentage}% Capacity used
                </span>
              </div>

              <div className="mb-6 flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-[#1a1c23]" style={{ width: '45%' }}></div>
                <div className="h-full bg-gray-500" style={{ width: '15%' }}></div>
                <div className="h-full bg-gray-300" style={{ width: '10%' }}></div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#1a1c23]"></span>
                  <span className="text-gray-500">PDF ({totalGB || '1.2'} GB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                  <span className="text-gray-500">Docs (480 MB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-gray-300"></span>
                  <span className="text-gray-500">Media (210 MB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-gray-200 bg-gray-100"></span>
                  <span className="text-gray-500">Other</span>
                </div>
              </div>
            </div>

            {/* AI Summarizer */}
            <div className="relative col-span-1 flex flex-col justify-center overflow-hidden rounded-2xl bg-[#1a1c23] p-8 text-white shadow-md">
              <h3 className="mb-3 text-[22px] font-bold">AI Summarizer</h3>
              <p className="mb-8 text-sm leading-relaxed text-gray-400">
                Turn your 50-page PDFs into 5-minute study guides with one click.
              </p>
              <button className="w-full rounded-xl bg-white px-4 py-3.5 text-[15px] font-bold text-[#1a1c23] transition-colors hover:bg-gray-100">
                Try Smart Summary
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Empty State (Image 2) */
        <div className="flex flex-col items-center justify-center py-12">
          {/* Main Illustration Area */}
          <div className="relative mb-12 flex w-full max-w-md items-center justify-center">
            <div className="absolute h-[280px] w-[280px] rotate-6 rounded-[40px] border border-gray-100 bg-white shadow-sm"></div>
            <div className="absolute h-[280px] w-[280px] -rotate-3 rounded-[40px] border border-gray-100 bg-white shadow-sm"></div>
            <div className="relative z-10 flex h-[280px] w-[280px] items-center justify-center rounded-[40px] border border-gray-100 bg-white p-8 shadow-lg">
              <img
                src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                alt="No documents"
                className="h-full w-full object-contain"
              />
              <div className="absolute bottom-6 flex gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                <div className="h-2 w-2 rounded-full bg-gray-800"></div>
                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
              </div>
            </div>

            {/* Floating Icons */}
            <div className="absolute top-1/2 -left-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-lg">
              <span className="material-symbols-outlined text-gray-700">psychology</span>
            </div>
            <div className="absolute top-1/4 -right-8 flex h-14 w-14 rotate-12 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-lg">
              <span className="material-symbols-outlined text-gray-700">note_add</span>
            </div>
          </div>

          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">No documents yet</h2>
          <p className="mb-10 max-w-md text-center text-[15px] leading-relaxed text-gray-500">
            Start your academic journey by uploading lecture notes, textbooks, or research papers.
            Our AI will help you summarize, quiz, and learn faster.
          </p>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard/upload"
              className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-[#1a1c23] px-6 py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-black"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              Upload your first document
            </Link>
            <button className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              Try Sample Document
            </button>
          </div>

          <div className="mb-16 flex items-center gap-2 text-sm text-gray-400">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Supported formats: PDF, DOCX, TXT, and Markdown (Max 50MB)
          </div>

          {/* Feature Cards */}
          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <span className="material-symbols-outlined text-[20px]">description</span>
              </div>
              <h3 className="mb-2 font-bold text-gray-900">AI Summaries</h3>
              <p className="text-[13px] leading-relaxed text-gray-500">
                Transform long chapters into concise bullet points in seconds.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <span className="material-symbols-outlined text-[20px]">quiz</span>
              </div>
              <h3 className="mb-2 font-bold text-gray-900">Smart Quizzes</h3>
              <p className="text-[13px] leading-relaxed text-gray-500">
                Automatically generate flashcards and mock exams from your notes.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <h3 className="mb-2 font-bold text-gray-900">Chat with PDF</h3>
              <p className="text-[13px] leading-relaxed text-gray-500">
                Ask questions directly to your documents and get instant citations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
