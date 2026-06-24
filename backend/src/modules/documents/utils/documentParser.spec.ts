import { parseDocument } from './documentParser';
import * as mammoth from 'mammoth';

// Mock mammoth
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

// Mock pdf-parse
const mockGetText = jest.fn();
const mockDestroy = jest.fn();

jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation(() => {
      return {
        getText: mockGetText,
        destroy: mockDestroy,
      };
    }),
  };
});
import { PDFParse } from 'pdf-parse';

describe('DocumentParser Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TXT Parser', () => {
    it('should correctly parse plain text from txt file buffer', async () => {
      const buffer = Buffer.from('Hello world in text format', 'utf-8');
      const result = await parseDocument(buffer, 'test.txt', 'text/plain');
      expect(result).toBe('Hello world in text format');
    });

    it('should correctly parse txt when mime type is not text/plain but extension is txt', async () => {
      const buffer = Buffer.from('Extension match', 'utf-8');
      const result = await parseDocument(buffer, 'test.txt', 'application/octet-stream');
      expect(result).toBe('Extension match');
    });
  });

  describe('PDF Parser', () => {
    it('should call pdf-parse and return extracted text', async () => {
      const buffer = Buffer.from('pdf data dummy');
      mockGetText.mockResolvedValueOnce({ text: 'Extracted PDF text content', total: 5 });

      const result = await parseDocument(buffer, 'test.pdf', 'application/pdf');

      expect(PDFParse).toHaveBeenCalledWith({ data: buffer });
      expect(mockGetText).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
      expect(result).toEqual({ text: 'Extracted PDF text content', pageCount: 5 });
    });

    it('should throw error when pdf-parse fails', async () => {
      const buffer = Buffer.from('corrupted pdf');
      mockGetText.mockRejectedValueOnce(new Error('Parse error'));

      await expect(parseDocument(buffer, 'test.pdf', 'application/pdf')).rejects.toThrow(
        'Failed to parse PDF file: Parse error',
      );
    });
  });

  describe('DOCX Parser', () => {
    it('should call mammoth and return extracted text', async () => {
      const buffer = Buffer.from('docx data dummy');
      (mammoth.extractRawText as jest.Mock).mockResolvedValue({
        value: 'Extracted DOCX text content',
      });

      const result = await parseDocument(
        buffer,
        'test.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );

      expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer });
      expect(result).toBe('Extracted DOCX text content');
    });

    it('should throw error when mammoth fails', async () => {
      const buffer = Buffer.from('corrupted docx');
      (mammoth.extractRawText as jest.Mock).mockRejectedValue(new Error('Mammoth error'));

      await expect(
        parseDocument(
          buffer,
          'test.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
      ).rejects.toThrow('Failed to parse DOCX file: Mammoth error');
    });
  });

  describe('DOC (old format) Parser', () => {
    it('should try mammoth first and return text if doc is actually a renamed docx', async () => {
      const buffer = Buffer.from('doc dummy');
      (mammoth.extractRawText as jest.Mock).mockResolvedValue({
        value: 'Extracted renamed docx content',
      });

      const result = await parseDocument(buffer, 'test.doc', 'application/msword');
      expect(result).toBe('Extracted renamed docx content');
    });

    it('should throw error suggesting format conversion when mammoth fails on doc', async () => {
      const buffer = Buffer.from('real binary doc');
      (mammoth.extractRawText as jest.Mock).mockRejectedValue(new Error('Not a zip file'));

      await expect(parseDocument(buffer, 'test.doc', 'application/msword')).rejects.toThrow(
        'Format .doc (Word 97-2003) is not supported directly. Please convert it to .docx or .pdf before uploading.',
      );
    });
  });

  describe('Unsupported Formats', () => {
    it('should throw error for unsupported extension and mime type', async () => {
      const buffer = Buffer.from('png data dummy');
      await expect(parseDocument(buffer, 'image.png', 'image/png')).rejects.toThrow(
        'Unsupported file format: png (image/png)',
      );
    });
  });
});
