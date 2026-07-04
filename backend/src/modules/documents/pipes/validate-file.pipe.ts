import { Injectable, PipeTransform, UnprocessableEntityException, Logger } from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class ValidateFilePipe implements PipeTransform {
  private readonly logger = new Logger(ValidateFilePipe.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  private readonly DANGEROUS_EXTENSIONS = [
    '.exe',
    '.msi',
    '.dll',
    '.bat',
    '.cmd',
    '.apk',
    '.scr',
    '.sh',
  ];

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      this.logger.warn('Upload rejected: No file provided');
      this.throwInvalidError();
    }

    if (file.size === 0) {
      this.logger.warn('Upload rejected: File size is 0 bytes');
      this.throwInvalidError();
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.logger.warn(`Upload rejected: File size exceeds 10MB (${file.size} bytes)`);
      this.throwInvalidError();
    }

    const originalName = (file.originalname || '').trim();
    if (!originalName) {
      this.logger.warn('Upload rejected: originalname is empty or whitespace');
      this.throwInvalidError();
    }

    let ext = path.extname(originalName).toLowerCase().trim();
    // In Node.js path.extname('.pdf') is '', so handle this edge case manually
    if (!ext && originalName.startsWith('.')) {
      ext = originalName.toLowerCase().trim();
    }

    // Reject if filename is just the extension (e.g., ".pdf")
    if (originalName === ext || originalName === '') {
      this.logger.warn(`Upload rejected: Filename contains only extension (${originalName})`);
      this.throwInvalidError();
    }

    if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
      this.logger.warn(`Upload rejected: Dangerous extension (${ext})`);
      this.throwInvalidError();
    }

    if (ext === '.pdf') {
      if (file.buffer && file.buffer.length >= 5) {
        const magicBytes = file.buffer.toString('utf8', 0, 5);
        if (magicBytes !== '%PDF-') {
          this.logger.warn(`Upload rejected: Invalid magic bytes for PDF`);
          this.throwInvalidError();
        }
      } else {
        this.logger.warn(`Upload rejected: File buffer is missing or too short for PDF`);
        this.throwInvalidError();
      }
    }

    // Sanitize filename to prevent path traversal
    file.originalname = this.sanitizeFileName(originalName, ext);

    return file;
  }

  private throwInvalidError(): never {
    throw new UnprocessableEntityException({
      code: 'DOCUMENT_INVALID_FILE',
      message: 'DOCUMENT_INVALID_FILE',
    });
  }

  private sanitizeFileName(fileName: string, ext: string): string {
    // Remove directory paths (slashes and backslashes)
    const safeName = fileName.replace(/^.*[\\\/]/, '');

    // Remove control characters (including null bytes)
    const noControlChars = safeName.replace(/[\x00-\x1F\x7F]/g, '');

    // Ensure it's not empty or just an extension, fallback to 'document.ext'
    if (!noControlChars || noControlChars === ext) {
      return `document${ext || '.bin'}`;
    }

    return noControlChars;
  }
}
