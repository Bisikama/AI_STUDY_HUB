import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

/**
 * Custom pipe to validate file upload
 * Checks if file exists and has valid size
 */
@Injectable()
export class ValidateFilePipe implements PipeTransform {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size must not exceed ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    return file;
  }
}
