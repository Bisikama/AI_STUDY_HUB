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
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${className}`}>
      {label}
    </span>
  );
};

export default function DocumentDashboard() {
  const { documents, isLoading, isError } = useMyDocuments();
  const documentItems = Array.isArray(documents) ? documents : (documents?.data ?? []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-500 p-6 rounded-xl border border-red-200">
        <p className="font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          Không thể tải danh sách tài liệu. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Documents</h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các tài liệu bạn đã tải lên.
          </p>
        </div>
        <div className="bg-primary-container text-on-primary px-3 py-1 rounded-full text-sm font-semibold">
          {documentItems.length} Files
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold w-1/3">Tên tài liệu</th>
              <th className="px-6 py-4 font-semibold">Môn học</th>
              <th className="px-6 py-4 font-semibold">Kích thước</th>
              <th className="px-6 py-4 font-semibold">Ngày tải lên</th>
              <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {documentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-gray-300">folder_open</span>
                    <p>Bạn chưa có tài liệu nào.</p>
                  </div>
                </td>
              </tr>
            ) : (
              documentItems.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                        <span className="material-symbols-outlined">
                          {doc.fileType.includes('pdf') ? 'picture_as_pdf' : 'description'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{doc.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{doc.description || 'Không có mô tả'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {doc.subject ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        {doc.subject.code}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Trống</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{formatSize(doc.fileSize)}</td>
                  <td className="px-6 py-4">
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-center">
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
