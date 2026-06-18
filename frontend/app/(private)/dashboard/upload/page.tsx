import UploadZone from '@/components/documents/UploadZone';

export const metadata = {
  title: 'Upload Materials — ScholarHub',
  description: 'Upload study documents, research papers, and lecture notes.',
};

/**
 * /dashboard/upload — Server component shell that mounts the UploadZone client component.
 */
export default function DashboardUploadPage() {
  return <UploadZone />;
}
