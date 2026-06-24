import {
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class ValidateFilePipe implements PipeTransform {
  private readonly logger = new Logger(ValidateFilePipe.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      this.logger.warn('Upload rejected: No file provided');
      this.throwInvalidError();
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.logger.warn(`Upload rejected: File size exceeds 10MB (${file.size} bytes)`);
      this.throwInvalidError();
    }

    if (file.mimetype !== 'application/pdf') {
      this.logger.warn(`Upload rejected: Invalid mimetype (${file.mimetype})`);
      this.throwInvalidError();
    }

    const originalName = file.originalname || '';
    const ext = path.extname(originalName).toLowerCase();
    if (ext !== '.pdf') {
      this.logger.warn(`Upload rejected: Invalid extension (${ext})`);
      this.throwInvalidError();
    }

    if (file.buffer && file.buffer.length >= 5) {
      const magicBytes = file.buffer.toString('utf8', 0, 5);
      if (magicBytes !== '%PDF-') {
        this.logger.warn(`Upload rejected: Invalid magic bytes`);
        this.throwInvalidError();
      }
    } else {
      this.logger.warn(`Upload rejected: File buffer is missing or too short`);
      this.throwInvalidError();
    }

    // Sanitize filename to prevent path traversal
    file.originalname = this.sanitizeFileName(originalName);

    return file;
  }

  private throwInvalidError(): never {
    throw new UnprocessableEntityException({
      code: 'DOCUMENT_INVALID_FILE',
      message: 'DOCUMENT_INVALID_FILE',
    });
  }

  private sanitizeFileName(fileName: string): string {
    // Remove directory paths
    const safeName = fileName.replace(/^.*[\\\/]/, '');
    
    // Remove control characters
    const noControlChars = safeName.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Ensure it's not empty, fallback to 'document.pdf'
    if (!noControlChars || noControlChars === '.pdf') {
      return 'document.pdf';
    }

    return noControlChars;
  }
}
