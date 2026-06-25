export function getVisibilityPresentation(visibilityStatus?: string) {
  switch (visibilityStatus) {
    case 'PUBLIC':
      return { label: 'PUBLIC', className: 'bg-green-100 text-green-700' };
    case 'PENDING_REVIEW':
      return { label: 'PENDING', className: 'bg-yellow-100 text-yellow-700' };
    case 'PRIVATE':
      return { label: 'PRIVATE', className: 'bg-gray-100 text-gray-700' };
    default:
      return { label: 'UNKNOWN', className: 'bg-gray-200 text-gray-500' };
  }
}
