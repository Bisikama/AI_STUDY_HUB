import UploadZone from '@/components/documents/UploadZone';

export const metadata = {
  title: 'Upload Materials — ScholarHub',
  description: 'Upload study documents, research papers, and lecture notes.',
};

/**
 * /upload — Server component shell that mounts the UploadZone client component.
 * The entire sidebar + layout lives inside UploadZone itself to keep
 * the component fully self-contained for Task 2.4.
 */
export default function UploadPage() {
  return <UploadZone />;
}
