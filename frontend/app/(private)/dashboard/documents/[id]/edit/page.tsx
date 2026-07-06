'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';
import { subjectsApi, Subject, Major, CatalogItem } from '@/services/subjectsApi';
import { tagsApi, Tag } from '@/services/tagsApi';
import { personalFoldersApi, PersonalFolder } from '@/services/personalFoldersApi';
import { getCleanFileType } from '@/utils/fileUtils';
// -----------------------------------------------------------
// COMPONENT MỚI: Hiệu ứng 3D Hover cho Poster
// -----------------------------------------------------------
function InteractivePosterCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Góc nghiêng nhẹ nhàng (3 độ)
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          transform: isHovered ? 'translateZ(16px)' : 'translateZ(0px)',
          transition: 'transform 0.3s ease-out'
        }}
        className="h-full w-full"
      >
        {children}
      </div>
    </div>
  );
}

// Helper Removed - Now using getCleanFileType from @/utils/fileUtils


export default function EditDocumentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    data: response,
    error: fetchError,
    isLoading,
  } = useSWR(id ? `/documents/${id}` : null, () => documentsApi.getDocumentById(id));

  // Load majors
  const { data: majorsResponse } = useSWR('/subjects/catalog/majors', () => subjectsApi.getMajors());
  const majors: Major[] = majorsResponse || [];

  const document = response;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMajorCode, setSelectedMajorCode] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  // Load catalog courses
  const { data: catalogResponse } = useSWR(
    selectedMajorCode ? `/subjects/catalog?majorCode=${selectedMajorCode}` : null,
    () => subjectsApi.getCatalog(selectedMajorCode)
  );
  const courses: CatalogItem[] = catalogResponse || [];

  // Load personal folders
  const { data: foldersResponse, mutate: mutateFolders } = useSWR('/personal-folders', () => personalFoldersApi.getFolders());
  const folders: PersonalFolder[] = foldersResponse || [];
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Load tags
  const { data: tagsResponse } = useSWR(
    '/tags',
    () => tagsApi.getTags(),
  );
  const availableTags: Tag[] = tagsResponse || [];

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (document && !hasInitialized) {
      setTitle(document.title || '');
      setDescription(document.description || '');
      setSelectedSubjectId(document.subjectId || null);
      if (document.subject?.majors && document.subject.majors.length > 0) {
        setSelectedMajorCode(document.subject.majors[0].major.code);
      }
      setSelectedFolderId(document.personalFolderId || '');
      if (document.tags) {
        setSelectedTags(document.tags.map((t: any) => t.tag || t));
      }
      setHasInitialized(true);
    }
  }, [document, hasInitialized]);

  // Tags logic
  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    const slug = trimmed.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
    if (!slug) return;

    if (selectedTags.length >= 10) {
      setSaveError('Maximum 10 tags allowed');
      return;
    }

    if (selectedTags.some((t) => t.slug === slug || t.name.toLowerCase() === trimmed.toLowerCase())) {
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

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      setIsCreatingFolder(true);
      const result = await personalFoldersApi.create({ name });
      await mutateFolders();
      setSelectedFolderId(result.id);
      setShowCreateFolder(false);
      setNewFolderName('');
    } catch {
      setSaveError('Failed to create folder. Please try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError('Title cannot be empty');
      return;
    }
    if (!selectedSubjectId) {
      setSaveError('Please select a Course.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: selectedSubjectId,
        personalFolderId: selectedFolderId || null,
      };

      if (selectedTags.length > 0) {
        payload.tags = selectedTags.map(t => t.name);
      } else {
        payload.tags = [];
      }

      await documentsApi.updateDocument(id, payload);
      router.push(`/dashboard/documents/${id}`);
    } catch (err: any) {
      const { mapDocumentError } = await import('@/utils/errorMapper');
      setSaveError(mapDocumentError(err) || 'Failed to update document metadata.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-[#FAFAFA]">
        <span className="material-symbols-outlined animate-spin text-3xl text-gray-400">sync</span>
      </div>
    );
  }

  if (fetchError || !document) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center bg-[#FAFAFA] p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900 tracking-tight">Access Denied / Not Found</h2>
        <p className="mb-6 text-[13px] text-gray-500 max-w-sm">
          You do not have permission to edit this document or it has been removed.
        </p>
        <Link
          href="/dashboard/documents"
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
        >
          Back to My Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl bg-[#FAFAFA] p-6 font-sans md:p-10 lg:px-12">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center text-[13px] font-medium text-gray-500">
          <Link
            href={`/dashboard/documents/${id}`}
            className="flex items-center transition-colors hover:text-gray-900"
          >
            <span className="material-symbols-outlined mr-1 text-[16px]">arrow_back</span>
            Documents Item
          </Link>
          <span className="material-symbols-outlined mx-2 text-[14px] text-gray-300">chevron_right</span>
          <span className="text-gray-900">Edit Settings</span>
        </div>
        <h1 className="mb-2 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Document Settings</h1>
        <p className="text-[13px] text-gray-500">Update metadata and organize your study material.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (Form) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            {saveError && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600 border border-red-100">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {saveError}
              </div>
            )}

            <div className="flex flex-col gap-7">
              {/* Document Name */}
              <div>
                <label className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-[14px] text-gray-900 outline-none transition-all focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g. Neuroscience_Chapter_04_Synapses"
                />
                <p className="mt-2 flex items-center gap-1 text-[12px] text-gray-500">
                  <span className="material-symbols-outlined text-[14px] text-gray-400">lightbulb</span>
                  Descriptive names help AI generate better quizzes.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 text-[14px] text-gray-900 outline-none transition-all focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900"
                  placeholder="Add notes, context, or summary for this document..."
                />
              </div>

              {/* Major & Course Grouping */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Major */}
                <div>
                  <label className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
                    Major Filter
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMajorCode}
                      onChange={(e) => {
                        setSelectedMajorCode(e.target.value);
                        setSelectedSubjectId(null);
                      }}
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 pr-10 text-[13px] text-gray-900 outline-none transition-all focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="">-- All Majors --</option>
                      {majors.map((m) => (
                        <option key={m.code} value={m.code}>{m.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-[20px] text-gray-400">arrow_drop_down</span>
                  </div>
                </div>

                {/* Course */}
                <div>
                  <label className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
                    Course / Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubjectId ?? ''}
                      onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!selectedMajorCode && !selectedSubjectId}
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 pr-10 text-[13px] text-gray-900 outline-none transition-all focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 disabled:opacity-60 disabled:bg-gray-100"
                    >
                      {document?.subject && !selectedMajorCode && (
                        <option value={document.subject.id}>{document.subject.code} - {document.subject.name}</option>
                      )}
                      {selectedMajorCode && <option value="">-- Select a Course --</option>}
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-[20px] text-gray-400">arrow_drop_down</span>
                  </div>
                </div>
              </div>

              {/* Personal Folder */}
              <div>
                <label className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
                  Personal Folder
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedFolderId}
                      onChange={(e) => setSelectedFolderId(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 pr-10 text-[13px] text-gray-900 outline-none transition-all focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="">-- Unfiled (Root) --</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-[20px] text-gray-400">arrow_drop_down</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateFolder((v) => !v)}
                    className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    title="Create new folder"
                  >
                    <span className="material-symbols-outlined text-[20px]">create_new_folder</span>
                  </button>
                </div>

                {/* Create Folder Inline Modal */}
                {showCreateFolder && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 p-2 border border-gray-100">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateFolder(); } }}
                      placeholder="Enter folder name..."
                      disabled={isCreatingFolder}
                      className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-[13px] text-gray-900 outline-none focus:border-gray-900 disabled:opacity-60"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateFolder()}
                      disabled={isCreatingFolder || !newFolderName.trim()}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
                    >
                      {isCreatingFolder ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                      className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Study Tags */}
              <div className="relative">
                <label className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-gray-700">
                  <span>Study Tags</span>
                  <span className="text-gray-400 font-normal text-[11px]">Max 10 tags</span>
                </label>

                <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 transition-all focus-within:border-gray-900 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="flex items-center gap-1.5 rounded-md bg-gray-900 pl-2.5 pr-1 py-1 text-[12px] font-medium text-white shadow-sm"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSaving}
                        className="flex h-4 w-4 items-center justify-center rounded hover:bg-white/20 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}

                  <div className="relative flex-1 min-w-[140px]">
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
                      disabled={isSaving || selectedTags.length >= 10}
                      placeholder={selectedTags.length >= 10 ? 'Limit reached' : 'Type or select a tag...'}
                      className="w-full bg-transparent text-[13px] text-gray-900 placeholder-gray-400 outline-none disabled:cursor-not-allowed px-1 py-0.5"
                    />

                    {/* Dropdown Tags */}
                    {showTagDropdown && availableTags.length > 0 && (
                      <div className="absolute left-0 top-full z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg p-1">
                        {availableTags
                          .filter(t => !selectedTags.some(st => st.slug === t.slug))
                          .filter(t => t.name.toLowerCase().includes(newTagName.toLowerCase()))
                          .map(tag => (
                            <div
                              key={tag.slug}
                              onClick={() => handleAddTag(tag.name)}
                              className="cursor-pointer flex items-center justify-between rounded-md px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <span className="font-medium">{tag.name}</span>
                              {tag.isSystem && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">System</span>
                              )}
                            </div>
                          ))}
                        {availableTags.filter(t => !selectedTags.some(st => st.slug === t.slug) && t.name.toLowerCase().includes(newTagName.toLowerCase())).length === 0 && (
                          <div className="px-3 py-3 text-center text-[12px] text-gray-500 italic">
                            Press Enter to create "{newTagName}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Preview with 3D Poster) */}
        <div className="flex flex-col gap-6 lg:col-span-4">

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            {/* THAY ẢNH VÀO THUỘC TÍNH SRC CỦA THẺ IMG BÊN DƯỚI */}
            <InteractivePosterCard className="mb-6 w-full cursor-pointer">
              <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-[#0A0A0A] shadow-inner group border border-gray-800">

                {/* 1. Nền Lưới (Grid Background) phong cách Hacker/Tech */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] transition-transform duration-1000 group-hover:scale-110"></div>

                {/* 2. Hiệu ứng ánh sáng (Glowing Orbs) */}
                <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-blue-600/30 blur-[40px] transition-all duration-700 group-hover:bg-blue-500/50 group-hover:scale-150"></div>
                <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-purple-600/20 blur-[40px] transition-all duration-700 group-hover:bg-purple-500/40 group-hover:scale-150"></div>

                {/* 3. Nội dung trung tâm (Logo & Text) */}
                <div className="z-10 flex flex-col items-center gap-4 transition-transform duration-500 group-hover:-translate-y-2">

                  {/* Cụm Logo SVG */}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg">
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-md opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>

                  {/* Cụm Text */}
                  <div className="text-center">
                    <h2 className="text-[18px] font-black tracking-widest text-white uppercase drop-shadow-md">
                      AI<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">-STUDY-HUB</span>
                    </h2>
                    <p className="mt-1.5 text-[9px] font-bold tracking-[0.3em] text-gray-500 uppercase">
                      Academic Excellence
                    </p>
                  </div>

                </div>

                {/* Đường kẻ ngang trang trí mờ ở dưới */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 h-[1px] w-12 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
              </div>
            </InteractivePosterCard>

            <div className="flex flex-col gap-3.5 text-[13px] text-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Last Modified</span>
                <span className="font-semibold text-gray-900">{formatDate(document.updatedAt)}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 whitespace-nowrap">File Info</span>
                {/* Fixed Overlap Text Issue here */}
                <span className="font-semibold text-gray-900 text-right break-words overflow-hidden">
                  {getCleanFileType(document.fileType)} <span className="text-gray-400 font-mono font-normal block mt-0.5">{formatSize(document.fileSize)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">AI Readiness</span>
                <span className="flex items-center gap-1.5 font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  High
                </span>
              </div>
            </div>

            <hr className="my-5 border-gray-100" />

            <p className="text-[12px] leading-relaxed text-gray-500 text-center">
              Modifying details will automatically sync with your flashcards and quizzes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push(`/dashboard/documents/${id}`)}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-3 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !selectedSubjectId}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}