export const mapDocumentError = (error: any): string => {
  const responseData = error?.response?.data;

  if (error?.response?.status === 409 && responseData?.message) {
    return responseData.message;
  }

  const code = responseData?.code || responseData?.message || error?.message;

  switch (code) {
    case 'DOCUMENT_INVALID_FILE':
      return 'Invalid file format or corrupted file. Please check again.';
    case 'STORAGE_OPERATION_FAILED':
      return 'Could not save file at this time. Please try again later.';
    case 'ACCOUNT_LOCKED':
      return 'Your account has been locked. Please contact the administrator.';
    case 'DOCUMENT_PUBLIC_SUBJECT_REQUIRED':
      return 'Only System Subjects can submit for public review.';
    case 'DOCUMENT_PENDING_REVIEW':
      return 'Cannot edit document while it is pending review.';
    case 'DOCUMENT_INVALID_STATE':
      return 'Document state changed or invalid. Please refresh the page.';
    case 'DOCUMENT_NOT_ACTIVE':
      return 'Document is no longer active or has been deleted.';
    case 'STORAGE_QUOTA_EXCEEDED':
      return 'Your storage quota is full (1 GiB). Please delete some old documents to continue.';
    case 'COPYRIGHT_SOURCE_UNKNOWN':
      return 'Document lacks copyright information or the source is not permitted for sharing.';
    case 'COPYRIGHT_DECLARATION_REQUIRED':
      return 'You must declare copyright ownership to publish this document.';
    case 'COPYRIGHT_METADATA_INCOMPLETE':
      return 'Copyright metadata is incomplete (e.g., missing open license URL).';

    case 'AI_ANALYSIS_UNSUPPORTED_FILE_TYPE':
      return 'This file type is not supported for AI analysis.';
    case 'AI_ANALYSIS_UNSUPPORTED':
      return 'AI analysis is not supported for this document.';
    case 'AI_ANALYSIS_REQUIRED':
      return 'AI analysis is required before publishing.';
    case 'AI_ANALYSIS_PROCESSING':
      return 'AI is currently analyzing the document. Please wait.';
    case 'AI_ANALYSIS_FAILED':
      return 'AI analysis failed. Please try again.';
    case 'AI_SUMMARY_OR_QUIZ_MISSING':
      return 'Document is missing AI-generated summary or quizzes.';
    case 'AI_NOT_READY_FOR_PUBLICATION':
      return 'Document is not ready for publication due to pending or missing AI analysis.';

    case 'DOCUMENT_EXISTS':
      return 'A document with this name or content already exists.';
    case 'DOCUMENT_PROCESSING_FAILED':
      return 'Document processing failed.';
    case 'DOCUMENT_NOT_FOUND':
      return 'Document not found.';
    case 'DOCUMENT_TOO_LARGE':
      return 'The document exceeds the maximum allowed file size.';

    case 'PERSONAL_FOLDER_NOT_EMPTY':
      return 'Cannot delete or modify folder because it is not empty.';
    case 'COURSE_CREATION_ADMIN_ONLY':
      return 'Only administrators can create courses.';
    default:
      if (error?.response?.status === 401) {
        return 'Session expired. Please log in again.';
      }
      if (error?.response?.status === 403) {
        return 'You do not have permission to perform this action.';
      }
      if (responseData?.message) {
        return responseData.message;
      }
      return 'An unknown error occurred. Please try again.';
  }
};
