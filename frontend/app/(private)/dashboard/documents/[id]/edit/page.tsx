'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsApi } from '@/services/documentsApi';
import { subjectsApi, Subject } from '@/services/subjectsApi';
import { tagsApi, Tag } from '@/services/tagsApi';

export default function EditDocumentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    data: response,
    error: fetchError,
    isLoading,
  } = useSWR(id ? `/documents/${id}` : null, () => documentsApi.getDocumentById(id));

  const { data: subjectsResponse, mutate: mutateSubjects } = useSWR(
    '/subjects',
    () => subjectsApi.getSubjects(),
  );

  const document = response;
  const subjects: Subject[] = subjectsResponse || [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
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

  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setDescription(document.description || '');
      setSelectedSubjectId(document.subjectId || null);
      if (document.tags) {
        setSelectedTags(document.tags.map((t: any) => t.tag || t));
      }
    }
  }, [document]);

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
      const result = await subjectsApi.createSubject({ name });
      await mutateSubjects();
      setSelectedSubjectId(result.id);
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
      setSaveError('Please select a Study Folder.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: selectedSubjectId,
      };

      if (selectedTags.length > 0) {
        payload.tags = selectedTags.map(t => t.name);
      } else {
        payload.tags = [];
      }

      await documentsApi.updateDocument(id, payload);
      router.push(`/dashboard/documents/${id}`);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to update document metadata.');
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
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#1a1c23]">sync</span>
      </div>
    );
  }

  if (fetchError || !document) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Access Denied / Not Found</h2>
        <p className="mb-6 text-gray-500">
          You do not have permission to edit this document or it does not exist.
        </p>
        <Link
          href="/dashboard/documents"
          className="rounded-lg bg-[#1a1c23] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-black"
        >
          Back to My Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl bg-[#F8F9FA] p-6 font-sans md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center text-sm font-medium text-gray-900">
          <Link
            href="/dashboard/documents"
            className="flex items-center text-gray-500 transition-colors hover:text-gray-900"
          >
            <span className="material-symbols-outlined mr-1 text-[20px]">arrow_back</span>
            Documents
          </Link>
          <span className="material-symbols-outlined mx-1 text-[16px] text-gray-400">chevron_right</span>
          <span>Edit Document</span>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">Document Settings</h1>
        <p className="text-gray-500">Update the metadata and organization of your study material.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (Form) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {saveError && (
              <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {saveError}
              </div>
            )}

            <div className="flex flex-col gap-6">
              {/* Document Name */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span className="material-symbols-outlined text-[18px] text-gray-500">edit</span>
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#1a1c23] focus:ring-1 focus:ring-[#1a1c23]"
                  placeholder="e.g. Neuroscience_Chapter_04_Synapses"
                />
                <p className="mt-2 text-[13px] italic text-gray-500">
                  Tip: Use descriptive names to help AI generate better quizzes.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span className="material-symbols-outlined text-[18px] text-gray-500">description</span>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#1a1c23] focus:ring-1 focus:ring-[#1a1c23]"
                  placeholder="Optional description or notes for this document..."
                />
              </div>

              {/* Study Folder */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span className="material-symbols-outlined text-[18px] text-gray-500">folder</span>
                  Study Folder <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedSubjectId ?? ''}
                    onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : null)}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#1a1c23]"
                  >
                    <option value="">-- Select a folder --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{!s.isSystem ? ' (personal)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCreateFolder((v) => !v)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    title="Create new folder"
                  >
                    <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                  </button>
                </div>
                {showCreateFolder && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateFolder(); } }}
                      placeholder="New folder name..."
                      disabled={isCreatingFolder}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#1a1c23] disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateFolder()}
                      disabled={isCreatingFolder || !newFolderName.trim()}
                      className="rounded-xl bg-[#1a1c23] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
                    >
                      {isCreatingFolder ? '...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Study Tags */}
              <div className="relative">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span className="material-symbols-outlined text-[18px] text-gray-500">sell</span>
                  Study Tags <span className="text-gray-400 font-normal">(Max 10)</span>
                </label>
                
                <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 transition-all focus-within:border-[#1a1c23] focus-within:ring-1 focus-within:ring-[#1a1c23]">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="flex items-center gap-1.5 rounded-full bg-[#1a1c23] px-3 py-1 text-xs font-medium text-white"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSaving}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-50"
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  
                  <div className="relative flex-1 min-w-[120px]">
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
                      placeholder={selectedTags.length >= 10 ? 'Max tags reached' : 'Type or select a tag...'}
                      className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none disabled:cursor-not-allowed"
                    />
                    
                    {/* Dropdown */}
                    {showTagDropdown && availableTags.length > 0 && (
                      <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                        {availableTags
                          .filter(t => !selectedTags.some(st => st.slug === t.slug))
                          .filter(t => t.name.toLowerCase().includes(newTagName.toLowerCase()))
                          .map(tag => (
                            <div
                              key={tag.slug}
                              onClick={() => handleAddTag(tag.name)}
                              className="cursor-pointer px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <span className="font-medium">{tag.name}</span>
                              {tag.isSystem && <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">System</span>}
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Preview) */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-6 flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900">
              <span className="material-symbols-outlined text-6xl text-gray-700">menu_book</span>
            </div>

            <div className="flex flex-col gap-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last Modified</span>
                <span className="font-medium text-gray-900">{formatDate(document.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>File Type</span>
                <span className="font-medium text-gray-900">
                  {document.fileType.split('/')[1]?.toUpperCase() || document.fileType} ({formatSize(document.fileSize)})
                </span>
              </div>
              <div className="flex justify-between">
                <span>AI Readiness</span>
                <span className="flex items-center gap-1 font-bold text-gray-900">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  High
                </span>
              </div>
            </div>

            <hr className="my-5 border-gray-100" />

            <p className="text-[13px] leading-relaxed text-gray-500">
              Moving or renaming this document will update all associated flashcard sets and quiz links automatically.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/dashboard/documents/${id}`)}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !selectedSubjectId}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a1c23] py-3.5 font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
