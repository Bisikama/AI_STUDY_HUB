import { mapDocumentError } from './errorMapper';

describe('errorMapper', () => {
  describe('mapDocumentError', () => {
    it('should return conflict message if response status is 409 and message is present', () => {
      const error = {
        response: {
          status: 409,
          data: {
            message: 'Conflict occurred',
          },
        },
      };
      expect(mapDocumentError(error)).toBe('Conflict occurred');
    });

    it('should return specific messages for known error codes', () => {
      const testCases = [
        { code: 'DOCUMENT_INVALID_FILE', expected: 'Invalid file format or corrupted file. Please check again.' },
        { code: 'STORAGE_OPERATION_FAILED', expected: 'Could not save file at this time. Please try again later.' },
        { code: 'ACCOUNT_LOCKED', expected: 'Your account has been locked. Please contact the administrator.' },
        { code: 'DOCUMENT_PUBLIC_SUBJECT_REQUIRED', expected: 'Only System Subjects can submit for public review.' },
        { code: 'DOCUMENT_PENDING_REVIEW', expected: 'Cannot edit document while it is pending review.' },
        { code: 'DOCUMENT_INVALID_STATE', expected: 'Document state changed or invalid. Please refresh the page.' },
        { code: 'DOCUMENT_NOT_ACTIVE', expected: 'Document is no longer active or has been deleted.' },
        { code: 'STORAGE_QUOTA_EXCEEDED', expected: 'Your storage quota is full (1 GiB). Please delete some old documents to continue.' },
        { code: 'COPYRIGHT_SOURCE_UNKNOWN', expected: 'Document lacks copyright information or the source is not permitted for sharing.' },
        { code: 'COPYRIGHT_DECLARATION_REQUIRED', expected: 'You must declare copyright ownership to publish this document.' },
        { code: 'COPYRIGHT_METADATA_INCOMPLETE', expected: 'Copyright metadata is incomplete (e.g., missing open license URL).' },
        { code: 'AI_ANALYSIS_UNSUPPORTED_FILE_TYPE', expected: 'This file type is not supported for AI analysis.' },
        { code: 'AI_ANALYSIS_UNSUPPORTED', expected: 'AI analysis is not supported for this document.' },
        { code: 'AI_ANALYSIS_REQUIRED', expected: 'AI analysis is required before publishing.' },
        { code: 'AI_ANALYSIS_PROCESSING', expected: 'AI is currently analyzing the document. Please wait.' },
        { code: 'AI_ANALYSIS_FAILED', expected: 'AI analysis failed. Please try again.' },
        { code: 'AI_SUMMARY_OR_QUIZ_MISSING', expected: 'Document is missing AI-generated summary or quizzes.' },
        { code: 'AI_NOT_READY_FOR_PUBLICATION', expected: 'Document is not ready for publication due to pending or missing AI analysis.' },
        { code: 'DOCUMENT_EXISTS', expected: 'A document with this name or content already exists.' },
        { code: 'DOCUMENT_PROCESSING_FAILED', expected: 'Document processing failed.' },
        { code: 'DOCUMENT_NOT_FOUND', expected: 'Document not found.' },
        { code: 'DOCUMENT_TOO_LARGE', expected: 'The document exceeds the maximum allowed file size.' },
        { code: 'PERSONAL_FOLDER_NOT_EMPTY', expected: 'Cannot delete or modify folder because it is not empty.' },
        { code: 'COURSE_CREATION_ADMIN_ONLY', expected: 'Only administrators can create courses.' },
      ];

      testCases.forEach(({ code, expected }) => {
        const error = { response: { data: { code } } };
        expect(mapDocumentError(error)).toBe(expected);

        // Fallback to data.message if code is not code but in message field
        const errorMsg = { response: { data: { message: code } } };
        expect(mapDocumentError(errorMsg)).toBe(expected);
      });
    });

    it('should handle session expired for 401 status', () => {
      const error = { response: { status: 401 } };
      expect(mapDocumentError(error)).toBe('Session expired. Please log in again.');
    });

    it('should handle forbidden for 403 status', () => {
      const error = { response: { status: 403 } };
      expect(mapDocumentError(error)).toBe('You do not have permission to perform this action.');
    });

    it('should fall back to data message if code does not match', () => {
      const error = { response: { data: { message: 'Some custom error message' } } };
      expect(mapDocumentError(error)).toBe('Some custom error message');
    });

    it('should fall back to raw error message if response is not present', () => {
      const error = { message: 'Network Error' };
      expect(mapDocumentError(error)).toBe('An unknown error occurred. Please try again.');
    });
  });
});
