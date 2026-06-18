'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useUploadDocument } from '@/hooks/useUploadDocument';

//  Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
};
const ACCEPTED_EXTENSIONS = ['.pdf', '.txt'];

// Default subject ID — should be replaced once subject selector is implemented
const DEFAULT_SUBJECT_ID = 1;

//  Toast types
type ToastVariant = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

//  Toast Component
function ToastNotification({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm min-w-[280px] items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
            t.variant === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {t.variant === 'success' ? (
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

//  Sidebar
function Sidebar() {
  const navItems = [
    {
      label: 'Discover',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
        </svg>
      ),
      active: false,
      href: '/explore',
    },
    {
      label: 'My Documents',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      active: true,
      href: '/dashboard/documents',
    },
    {
      label: 'Practice Mode',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      active: false,
      href: '/practice',
    },
    {
      label: 'AI Assistant',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"
          />
        </svg>
      ),
      active: false,
      href: '/ai-assistant',
    },
  ];

  const bottomItems = [
    {
      label: 'Settings',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/settings',
    },
    {
      label: 'Help',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      href: '/help',
    },
  ];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900">
          <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <p className="text-sm leading-none font-bold text-gray-900">ScholarHub</p>
          <p className="mt-0.5 text-[9px] font-semibold tracking-widest text-gray-400 uppercase">
            Academic Excellence
          </p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              item.active
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      {/* New Research Button */}
      <div className="px-3 pb-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-950">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Research
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="border-t border-gray-200 px-3 py-3">
        {bottomItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="mb-0.5 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}

//  Main UploadZone Component
export default function UploadZone() {
  //  State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [institution, setInstitution] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastIdRef = useRef(0);

  const { trigger, isMutating } = useUploadDocument();

  //  Toast helpers
  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  //  Progress simulation
  const startProgress = useCallback(() => {
    setProgress(0);
    let current = 0;
    progressIntervalRef.current = setInterval(() => {
      current += Math.random() * 8 + 2; // random increment 2-10%
      if (current >= 95) {
        current = 95;
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
      setProgress(Math.round(current));
    }, 300);
  }, []);

  const stopProgress = useCallback((success: boolean) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (success) setProgress(100);
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  //  Dropzone
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0]?.errors[0];
        if (err?.code === 'file-too-large') {
          addToast('File quá lớn! Kích thước tối đa là 10MB.', 'error');
        } else if (err?.code === 'file-invalid-type') {
          addToast('Chỉ chấp nhận file PDF (.pdf) hoặc TXT (.txt).', 'error');
        } else {
          addToast('File không hợp lệ. Vui lòng thử lại.', 'error');
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setProgress(0);
      }
    },
    [addToast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: isMutating,
    noClick: true, // ← tắt mở picker khi click vào vùng dropzone
    noKeyboard: true, // ← chỉ dùng nút Browse Files
  });

  // ── Remove selected file ────────────────────────────────────────────────────
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  //  Tag handling
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags((prev) => [...prev, trimmed]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  //  Reset form
  const handleCancel = () => {
    setSelectedFile(null);
    setProgress(0);
    setTitle('');
    setSubject('');
    setInstitution('');
    setTagInput('');
    setTags([]);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  //  Submit
  const handleSubmit = async () => {
    if (!selectedFile) {
      addToast('Vui lòng chọn một file để upload.', 'error');
      return;
    }
    if (!title.trim()) {
      addToast('Tiêu đề tài liệu là bắt buộc.', 'error');
      return;
    }

    startProgress();
    try {
      await trigger({
        file: selectedFile,
        title: title.trim(),
        description: [subject, institution, ...tags].filter(Boolean).join(' | ') || undefined,
        subjectId: DEFAULT_SUBJECT_ID,
      });

      stopProgress(true);
      addToast('Tài liệu đã được upload thành công!', 'success');

      // Reset after short delay so user sees 100%
      setTimeout(() => handleCancel(), 1500);
    } catch {
      stopProgress(false);
      addToast('Upload thất bại. Vui lòng thử lại.', 'error');
    }
  };

  //  File size formatter
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  //  Render
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Toasts */}
      <ToastNotification toasts={toasts} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Upload Materials</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add new study documents, research papers, or lecture notes to your workspace.
            </p>
          </div>

          {/*  Dropzone Card */}
          {/* Hidden native file input — triggered by Browse Files button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length === 0) return;
              // Reuse the same onDrop validation path
              const f = files[0];
              if (!ACCEPTED_TYPES[f.type as keyof typeof ACCEPTED_TYPES]) {
                addToast('Chỉ chấp nhận file PDF (.pdf) hoặc TXT (.txt).', 'error');
                e.target.value = '';
                return;
              }
              if (f.size > MAX_FILE_SIZE) {
                addToast('File quá lớn! Kích thước tối đa là 10MB.', 'error');
                e.target.value = '';
                return;
              }
              setSelectedFile(f);
              setProgress(0);
              e.target.value = ''; // reset so same file can be re-selected
            }}
          />

          <div
            {...getRootProps()}
            className={`mb-4 cursor-default rounded-xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
              isDragActive
                ? 'border-gray-500 bg-gray-100'
                : isMutating
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                  : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />

            {/* Cloud upload icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <p className="text-lg font-semibold text-gray-800">
              {isDragActive ? 'Thả file vào đây...' : 'Drag and Drop your study materials here'}
            </p>
            <p className="mt-1.5 text-sm text-gray-400">
              Supports {ACCEPTED_EXTENSIONS.join(', ')} up to 10MB per file.
            </p>

            {/* Browse Files button — opens native file picker */}
            <button
              type="button"
              disabled={isMutating}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-6 rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Browse Files
            </button>
          </div>

          {/* ── Active Uploads Card ─────────────────────────────────────────── */}
          {selectedFile && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
              <p className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Active Uploads
              </p>
              <div className="flex items-center gap-3">
                {/* PDF icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path fill="white" d="M14 2v6h6" />
                    <text x="6" y="18" fontSize="5" fontWeight="bold" fill="#ef4444">
                      PDF
                    </text>
                  </svg>
                </div>

                {/* File info + progress */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-gray-800">
                      {selectedFile.name}
                    </span>
                    <span className="ml-3 shrink-0 text-xs font-semibold text-gray-500">
                      {isMutating || progress > 0 ? `${progress}%` : formatSize(selectedFile.size)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gray-900 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={handleRemoveFile}
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove file"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Document Details Form ───────────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-6">
            <h2 className="mb-5 text-lg font-bold text-gray-900">Document Details</h2>

            <hr className="mb-6 border-gray-100" />

            {/* Title */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isMutating}
                placeholder="e.g. Introduction to Quantum Computing Notes"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors outline-none focus:border-gray-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Subject + Institution grid */}
            <div className="mb-5 grid grid-cols-2 gap-4">
              {/* Subject / Course */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subject / Course
                </label>
                <div className="relative">
                  <input
                    id="doc-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isMutating}
                    placeholder="e.g. PHYS 401"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 placeholder-gray-400 transition-colors outline-none focus:border-gray-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {/* Book icon */}
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Institution */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Institution
                </label>
                <div className="relative">
                  <input
                    id="doc-institution"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    disabled={isMutating}
                    placeholder="e.g. MIT"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-gray-900 placeholder-gray-400 transition-colors outline-none focus:border-gray-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {/* Institution icon */}
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Category Tags */}
            <div className="mb-7">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Category Tags
              </label>
              <div
                className={`flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors focus-within:border-gray-400 focus-within:bg-white ${
                  isMutating ? 'cursor-not-allowed opacity-60' : ''
                }`}
              >
                {/* Existing tags as pills */}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700"
                  >
                    {tag}
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <svg
                        className="h-2.5 w-2.5"
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" d="M2 2l6 6M8 2l-6 6" />
                      </svg>
                    </button>
                  </span>
                ))}

                {/* Tag input */}
                <input
                  id="doc-tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={isMutating}
                  placeholder={tags.length === 0 ? 'Add a tag...' : ''}
                  className="min-w-[100px] flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none disabled:cursor-not-allowed"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Press enter to add a tag.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                id="upload-cancel-btn"
                onClick={handleCancel}
                disabled={isMutating}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="upload-submit-btn"
                onClick={handleSubmit}
                disabled={isMutating || !selectedFile || !title.trim()}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMutating ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Save Document'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
