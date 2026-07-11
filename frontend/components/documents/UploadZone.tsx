'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useUploadDocument } from '@/hooks/useUploadDocument';
import useSWR, { mutate } from 'swr';
import { subjectsApi, CatalogItem } from '@/services/subjectsApi';
import { tagsApi, Tag } from '@/services/tagsApi';
import { personalFoldersApi, PersonalFolder } from '@/services/personalFoldersApi';
import { FPT_MAJOR_OPTIONS } from '@/constants/majorOptions';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/zip': ['.zip'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};
const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.zip', '.xlsx', '.jpg', '.png'];

// Toast types
type ToastVariant = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

// Toast Component
function ToastNotification({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-in slide-in-from-bottom-5 fade-in pointer-events-auto flex max-w-sm min-w-[300px] items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-white shadow-xl ring-1 transition-all duration-300 ${
            t.variant === 'success'
              ? 'bg-emerald-600 shadow-emerald-900/20 ring-emerald-700/50'
              : 'bg-red-600 shadow-red-900/20 ring-red-700/50'
          }`}
        >
          {t.variant === 'success' ? (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className="leading-relaxed">{t.message}</p>
        </div>
      ))}
    </div>
  );
}

// Sidebar Component
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
          strokeWidth={2}
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
          strokeWidth={2}
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
          strokeWidth={2}
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
          strokeWidth={2}
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
          strokeWidth={2}
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
          strokeWidth={2}
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
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
          <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <p className="text-sm leading-none font-bold tracking-tight text-slate-900">
            AI STUDY HUB
          </p>
          <p className="mt-1 text-[10px] font-medium tracking-widest text-slate-500 uppercase">
            Academic Excellence
          </p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              item.active
                ? 'bg-slate-100/80 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      {/* New Research Button */}
      <div className="px-4 pb-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]">
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
      <div className="space-y-1 border-t border-slate-100 px-4 py-4">
        {bottomItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}

// Main UploadZone Component
export default function UploadZone() {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Subject (Major -> Course) state
  const [selectedMajorCode, setSelectedMajorCode] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Study Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  // Tags state
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastIdRef = useRef(0);

  const { trigger, isMutating } = useUploadDocument();

  // Mock FPT majors for upload form
  const majors = FPT_MAJOR_OPTIONS;

  // Load catalog courses
  const { data: catalogResponse } = useSWR(
    selectedMajorCode ? `/subjects/catalog/courses?majorCode=${selectedMajorCode}` : null,
    () => subjectsApi.getCatalog(selectedMajorCode),
  );
  const courses: CatalogItem[] = catalogResponse || [];

  // Load personal folders
  const { data: foldersResponse, mutate: mutateFolders } = useSWR('/personal-folders', () =>
    personalFoldersApi.getFolders(),
  );
  const folders: PersonalFolder[] = foldersResponse || [];

  // Load tags
  const { data: tagsResponse, error: tagsError } = useSWR('/tags', () => tagsApi.getTags());
  const availableTags: Tag[] = tagsResponse || [];

  // Warn if tags failed to load
  useEffect(() => {
    if (tagsError) {
      addToast('Failed to load tags. You can still upload without them.', 'error');
    }
  }, [tagsError, addToast]);

  // Toast helpers
  function addToast(message: string, variant: ToastVariant) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  // Progress simulation
  const startProgress = useCallback(() => {
    setProgress(0);
    let current = 0;
    progressIntervalRef.current = setInterval(() => {
      current += Math.random() * 8 + 2;
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

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Dropzone
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0]?.errors[0];
        if (err?.code === 'file-too-large') {
          addToast('File too large! Maximum size is 10MB.', 'error');
        } else if (err?.code === 'file-invalid-type') {
          addToast(
            `Unsupported file type. Allowed types: ${ACCEPTED_EXTENSIONS.join(', ')}`,
            'error',
          );
        } else {
          addToast('Invalid file. Please try again.', 'error');
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
    noClick: true,
    noKeyboard: true,
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    const slug = trimmed
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w-]/g, '');
    if (!slug) return;

    if (selectedTags.length >= 10) {
      addToast('Maximum 10 tags allowed', 'error');
      return;
    }

    if (
      selectedTags.some((t) => t.slug === slug || t.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setNewTagName('');
      return;
    }

    const existing = availableTags.find((t) => t.slug === slug);
    if (existing) {
      setSelectedTags([...selectedTags, existing]);
    } else {
      setSelectedTags([...selectedTags, { id: -1, name: trimmed, slug, isSystem: false }]);
    }

    setNewTagName('');
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    setSelectedTags(selectedTags.filter((t) => t.slug !== tagToRemove.slug));
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setProgress(0);
    setTitle('');
    setDescription('');
    setSelectedMajorCode('');
    setSelectedSubjectId(null);
    setSelectedFolderId('');
    setShowCreateFolder(false);
    setNewFolderName('');
    setSelectedTags([]);
    setNewTagName('');
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      addToast('Folder name cannot be empty.', 'error');
      return;
    }
    try {
      setIsCreatingFolder(true);
      const result = await personalFoldersApi.create({ name });
      await mutateFolders();
      setSelectedFolderId(result.id);
      setShowCreateFolder(false);
      setNewFolderName('');
      addToast(`Study Folder "${result.name}" created and selected!`, 'success');
    } catch {
      addToast('Failed to create folder. Please try again.', 'error');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      addToast('Please select a file to upload.', 'error');
      return;
    }
    if (!title.trim() || title.trim().length > 150) {
      addToast('Document title is required and must be max 150 characters.', 'error');
      return;
    }
    if (!selectedMajorCode || !selectedSubjectId) {
      addToast('Please select a Major and Course before uploading.', 'error');
      return;
    }

    startProgress();
    try {
      const payload = {
        file: selectedFile,
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: selectedSubjectId,
        personalFolderId: selectedFolderId || undefined,
        tags: selectedTags.length > 0 ? JSON.stringify(selectedTags.map((t) => t.name)) : undefined,
      };

      const result = await trigger(payload);

      stopProgress(true);

      if (result.extractionStatus === 'READY') {
        addToast('Document uploaded successfully! PDF text extracted successfully.', 'success');
      } else if (result.extractionStatus === 'FAILED') {
        addToast(
          'Upload successful! Could not extract text, but the file is saved and previewable.',
          'success',
        );
      } else {
        addToast('Document uploaded successfully!', 'success');
      }

      mutate((key) => Array.isArray(key) && key[0] === '/documents/me');
      setTimeout(() => handleCancel(), 1500);
    } catch (err: unknown) {
      stopProgress(false);
      const { mapDocumentError } = await import('@/utils/errorMapper');
      addToast(mapDocumentError(err), 'error');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <ToastNotification toasts={toasts} />

      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Materials</h1>
          <p className="mt-2 text-base text-slate-500">
            Add new study documents, research papers, or lecture notes to your workspace.
          </p>
        </div>

        {/* Dropzone Card */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length === 0) return;
            const f = files[0];
            if (
              !ACCEPTED_TYPES[f.type as keyof typeof ACCEPTED_TYPES] &&
              !ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
            ) {
              addToast(
                `Unsupported file type. Allowed types: ${ACCEPTED_EXTENSIONS.join(', ')}`,
                'error',
              );
              e.target.value = '';
              return;
            }
            if (f.size > MAX_FILE_SIZE) {
              addToast('File too large! Maximum size is 10MB.', 'error');
              e.target.value = '';
              return;
            }
            setSelectedFile(f);
            setProgress(0);
            e.target.value = '';
          }}
        />

        <div
          {...getRootProps()}
          className={`mb-6 cursor-default rounded-2xl border-2 border-dashed px-10 py-16 text-center transition-all duration-200 ${
            isDragActive
              ? 'border-indigo-400 bg-indigo-50/50'
              : isMutating
                ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
          }`}
        >
          <input {...getInputProps()} />

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 shadow-sm ring-4 ring-slate-50">
            <svg
              className="h-7 w-7 text-slate-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <p className="text-lg font-semibold text-slate-800">
            {isDragActive ? 'Drop file here...' : 'Drag and Drop your study materials here'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Supports {ACCEPTED_EXTENSIONS.join(', ')} up to 10MB per file.
          </p>

          <button
            type="button"
            disabled={isMutating}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Browse Files
          </button>
        </div>

        {/* Active Uploads Card */}
        {selectedFile && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Active Upload
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 ring-1 ring-red-100">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path fill="white" d="M14 2v6h6" />
                  <text x="6" y="18" fontSize="5" fontWeight="bold" fill="#ef4444">
                    PDF
                  </text>
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {selectedFile.name}
                  </span>
                  <span className="ml-4 shrink-0 text-xs font-bold text-slate-500">
                    {isMutating || progress > 0 ? `${progress}%` : formatSize(selectedFile.size)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isMutating}
                onClick={handleRemoveFile}
                className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Remove file"
              >
                <svg
                  className="h-5 w-5"
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

        {/* Document Details Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Document Details</h2>
          <hr className="my-6 border-slate-100" />

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isMutating}
                placeholder="e.g. Introduction to Quantum Computing Notes"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Grid for Major & Course */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Major <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMajorCode}
                  onChange={(e) => {
                    setSelectedMajorCode(e.target.value);
                    setSelectedSubjectId(null);
                  }}
                  disabled={isMutating}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition-all outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">-- Select a Major --</option>
                  {majors.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubjectId ?? ''}
                  onChange={(e) =>
                    setSelectedSubjectId(e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={isMutating || !selectedMajorCode}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition-all outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">-- Select a Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Personal Folder */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Personal Folder
              </label>
              <div className="flex gap-3">
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  disabled={isMutating}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition-all outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">-- Unfiled (Root) --</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(!showCreateFolder)}
                  disabled={isMutating}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New
                </button>
              </div>

              {showCreateFolder && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-3 flex gap-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    disabled={isCreatingFolder}
                    placeholder="Enter folder name..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateFolder();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    disabled={isCreatingFolder || !newFolderName.trim()}
                    className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isCreatingFolder ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isMutating}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Optional description or notes for this document..."
              />
            </div>

            {/* Study Tags */}
            <div className="relative">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Study Tags <span className="ml-1 text-xs font-normal text-slate-400">(Max 10)</span>
              </label>

              <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 transition-all focus-within:border-slate-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isMutating}
                      className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-50"
                    >
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}

                <div className="relative min-w-[150px] flex-1">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => {
                      setNewTagName(e.target.value);
                      setShowTagDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagName);
                      }
                    }}
                    onFocus={() => setShowTagDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                    disabled={isMutating || selectedTags.length >= 10}
                    placeholder={
                      selectedTags.length >= 10 ? 'Max tags reached' : 'Type or select a tag...'
                    }
                    className="w-full bg-transparent px-2 py-1 text-sm text-slate-900 placeholder-slate-400 outline-none disabled:cursor-not-allowed"
                  />

                  {showTagDropdown && availableTags.length > 0 && (
                    <div className="absolute top-full left-0 z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-slate-900/5">
                      {availableTags
                        .filter((t) => !selectedTags.some((st) => st.slug === t.slug))
                        .filter((t) => t.name.toLowerCase().includes(newTagName.toLowerCase()))
                        .map((tag) => (
                          <div
                            key={tag.slug}
                            onClick={() => handleAddTag(tag.name)}
                            className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                          >
                            <span className="font-medium">{tag.name}</span>
                            {tag.isSystem && (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                System
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              id="upload-cancel-btn"
              onClick={handleCancel}
              disabled={isMutating}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              id="upload-submit-btn"
              onClick={handleSubmit}
              disabled={isMutating || !selectedFile || !title.trim() || !selectedSubjectId}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
                'Upload Document'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
