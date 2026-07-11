import { getCleanFileType } from './fileUtils';

describe('fileUtils', () => {
  describe('getCleanFileType', () => {
    it('should return UNKNOWN if no mimeType is provided', () => {
      expect(getCleanFileType('')).toBe('UNKNOWN');
      expect(getCleanFileType(null as any)).toBe('UNKNOWN');
      expect(getCleanFileType(undefined as any)).toBe('UNKNOWN');
    });

    it('should return PDF for pdf mime types', () => {
      expect(getCleanFileType('application/pdf')).toBe('PDF');
      expect(getCleanFileType('APPLICATION/PDF')).toBe('PDF');
    });

    it('should return DOCX for word documents', () => {
      expect(getCleanFileType('application/msword')).toBe('DOCX');
      expect(getCleanFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('DOCX');
    });

    it('should return PPTX for powerpoint documents', () => {
      expect(getCleanFileType('application/vnd.ms-powerpoint')).toBe('PPTX');
      expect(getCleanFileType('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('PPTX');
    });

    it('should return XLSX for excel spreadsheets', () => {
      expect(getCleanFileType('application/vnd.ms-excel')).toBe('XLSX');
      expect(getCleanFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('XLSX');
    });

    it('should return segment after slash for other types', () => {
      expect(getCleanFileType('image/png')).toBe('PNG');
      expect(getCleanFileType('text/plain')).toBe('PLAIN');
      expect(getCleanFileType('audio/mpeg')).toBe('MPEG');
    });

    it('should truncate other types to 8 characters', () => {
      expect(getCleanFileType('application/verylongmimetype')).toBe('VERYLONG');
    });
  });
});
