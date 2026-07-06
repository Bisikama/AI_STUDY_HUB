export const mapDocumentError = (error: any): string => {
  const code = error?.response?.data?.code || error?.response?.data?.message || error?.message;

  switch (code) {
    case 'DOCUMENT_INVALID_FILE':
      return 'Invalid PDF file. Please check again.';
    case 'STORAGE_OPERATION_FAILED':
      return 'Could not save file at this time. Please try again later.';
    case 'ACCOUNT_LOCKED':
      return 'Your account has been locked. Please contact the administrator.';
    case 'DOCUMENT_PUBLIC_SUBJECT_REQUIRED':
      return 'Only System Subjects can submit for public review.';
    case 'DOCUMENT_INVALID_STATE':
      return 'Document state changed or invalid. Please refresh the page.';
    case 'DOCUMENT_NOT_ACTIVE':
      return 'Document is no longer active or has been deleted.';
    case 'STORAGE_QUOTA_EXCEEDED':
      return 'Your storage quota is full (1 GiB). Please delete some old documents to continue.';
    default:
      if (error?.response?.status === 401) {
        return 'Session expired. Please log in again.';
      }
      if (error?.response?.status === 403) {
        return 'You do not have permission to perform this action.';
      }
      return 'An unknown error occurred. Please try again.';
  }
};
