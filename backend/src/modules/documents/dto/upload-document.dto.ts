import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsPositive,
  IsUUID,
} from 'class-validator';

/**
 * DTO for uploading and parsing documents
 */
export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must not be empty' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsNumber({}, { message: 'Subject ID must be a valid number' })
  @IsPositive({ message: 'Subject ID must be a positive number' })
  subjectId!: number;

  @IsString()
  @IsOptional()
  tags?: string; // JSON string of tag names

  @IsOptional()
  @IsUUID('4', { message: 'Personal Folder ID must be a valid UUID' })
  personalFolderId?: string;
}
