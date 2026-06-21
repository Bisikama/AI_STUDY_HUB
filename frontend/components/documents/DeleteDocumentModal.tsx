'use client';

import React from 'react';

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  documentTitle: string;
  isDeleting: boolean;
  error?: string;
}

export default function DeleteDocumentModal({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
  isDeleting,
  error,
}: DeleteDocumentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-full max-w-md rounded-[24px] bg-white p-8 text-center shadow-2xl duration-200">
        <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-red-50">
          <span className="material-symbols-outlined text-4xl text-red-500">delete</span>
        </div>

        <h2 className="mb-3 text-[24px] font-bold text-gray-900">Delete Document?</h2>

        <p className="mb-6 px-2 text-[15px] leading-relaxed text-gray-600">
          You are about to delete{' '}
          <span className="font-semibold text-gray-900">"{documentTitle}"</span>. This action is
          irreversible.
        </p>

        <div className="mb-8 flex flex-col gap-4 rounded-xl bg-[#F8F9FA] p-5 text-left text-[14px] text-gray-600">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-[20px] text-gray-500">
              warning
            </span>
            <p className="leading-snug">
              This document will be removed from your library. You can ask an admin to restore it if
              needed.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-[20px] text-gray-500">
              cloud_off
            </span>
            <p className="leading-snug">
              This document will be removed from all your synced devices immediately.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-left text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B91C1C] py-3.5 font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span> Deleting...
              </>
            ) : (
              'Yes, Remove Document'
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full rounded-xl bg-[#F1F3F5] py-3.5 font-semibold text-gray-700 transition-colors hover:bg-[#E9ECEF] disabled:opacity-50"
          >
            Cancel, Keep Document
          </button>
        </div>
      </div>
    </div>
  );
}
