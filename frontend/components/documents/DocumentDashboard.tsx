'use client';

import { useMyDocuments } from '@/hooks/useMyDocuments';
import { getVisibilityPresentation } from '@/utils/visibility-status';

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper component for Status Badge
const StatusBadge = ({ visibilityStatus }: { visibilityStatus?: string }) => {
  const { label, className } = getVisibilityPresentation(visibilityStatus);

  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${className}`}>
      {label}
    </span>
  );
};

export default function DocumentDashboard() {
  const { documents, isLoading, isError } = useMyDocuments();
  const documentItems = Array.isArray(documents) ? documents : (documents?.data ?? []);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <span className="material-symbols-outlined text-blue-600 animate-spin text-5xl mb-4">
          progress_activity
        </span>
        <p className="text-gray-500 font-medium animate-pulse">Loading your documents...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-red-50/50 rounded-2xl border border-red-100 text-center">
        <div className="h-16 w-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h3 className="text-lg font-semibold text-red-700 mb-1">Failed to load documents</h3>
        <p className="text-sm text-red-500 max-w-sm">
          An error occurred while fetching your documents. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="px-6 py-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Documents</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Manage your uploaded documents.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-100">
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          {documentItems.length} Files
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">Document Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Size</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Upload Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {documentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-5xl text-gray-300">folder_off</span>
                    </div>
                    <p className="text-gray-500 font-medium">You have no documents.</p>
                    <p className="text-xs text-gray-400">Upload a document to see it here.</p>
                  </div>
                </td>
              </tr>
            ) : (
              documentItems.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-gray-50/80 transition-all duration-200 group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {/* Dynamic File Icon */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm border ${doc.fileType.includes('pdf')
                        ? 'bg-red-50 text-red-500 border-red-100 group-hover:bg-red-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100'
                        } transition-colors`}>
                        <span className="material-symbols-outlined text-xl">
                          {doc.fileType.includes('pdf') ? 'picture_as_pdf' : 'description'}
                        </span>
                      </div>

                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {doc.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    {doc.subject ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                        {doc.subject.code}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Empty</span>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded text-xs border border-gray-100">
                      {formatSize(doc.fileSize)}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-gray-500 font-medium">
                      {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <StatusBadge visibilityStatus={doc.visibilityStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}