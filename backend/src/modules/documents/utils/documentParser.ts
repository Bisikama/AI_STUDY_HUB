import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

/**
 * Parses a document file buffer and extracts plain text.
 * Supports PDF, TXT, and DOCX (DOC is supported via best-effort or throws error if binary .doc).
 *
 * @param fileBuffer The file buffer to parse
 * @param originalName The original file name to inspect extension
 * @param mimeType The file mime type
 * @returns The extracted plain text
 */
export async function parseDocument(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<string> {
  const extension = originalName.split('.').pop()?.toLowerCase();
  const mime = mimeType.toLowerCase();

  // 1. TXT
  if (extension === 'txt' || mime === 'text/plain') {
    return fileBuffer.toString('utf-8');
  }

  // 2. PDF
  if (extension === 'pdf' || mime === 'application/pdf') {
    let parser: PDFParse | undefined;
    try {
      parser = new PDFParse({ data: fileBuffer });
      const data = await parser.getText();
      return data.text || '';
    } catch (error) {
      throw new Error(
        `Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      if (parser) {
        await parser.destroy();
      }
    }
  }

  // 3. DOCX
  if (
    extension === 'docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value || '';
    } catch (error) {
      throw new Error(
        `Failed to parse DOCX file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // 4. Old DOC (binary)
  if (extension === 'doc' || mime === 'application/msword') {
    // Mammoth only supports docx. Real binary .doc is extremely complex.
    // Try to parse using mammoth in case it is a mislabeled docx, otherwise throw error.
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value || '';
    } catch {
      throw new Error(
        'Format .doc (Word 97-2003) is not supported directly. Please convert it to .docx or .pdf before uploading.',
      );
    }
  }

  throw new Error(`Unsupported file format: ${extension} (${mimeType})`);
}
declare module 'pdf-parse' {
  export default function pdfParse(dataBuffer: Buffer, options?: any): Promise<{ text: string }>;
}
