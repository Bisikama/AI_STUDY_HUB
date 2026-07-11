import UploadZone from '@/components/documents/UploadZone';

export const metadata = {
  title: 'Upload Materials — AI STUDY HUB',
  description: 'Upload study documents, research papers, and lecture notes.',
};

/**
 * /dashboard/upload — Server component shell that mounts the UploadZone client component.
 */
export default function DashboardUploadPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50/30">
      <UploadZone />
    </div>
  );
}