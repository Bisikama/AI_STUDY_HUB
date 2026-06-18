import DocumentDashboard from '@/components/documents/DocumentDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Documents - ScholarHub',
  description: 'Manage your uploaded academic documents',
};

export default function MyDocumentsPage() {
  return (
    <div className="p-container-margin-mobile md:p-container-margin-desktop max-w-max-width mx-auto w-full py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Tài Liệu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Xem và quản lý tất cả các tài liệu bạn đã tải lên hệ thống.
        </p>
      </div>

      <DocumentDashboard />
    </div>
  );
}
