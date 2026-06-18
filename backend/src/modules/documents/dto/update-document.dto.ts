import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsPositive,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating document metadata
 */
export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Title must not be empty' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsInt({ message: 'Subject ID must be an integer' })
  @IsPositive({ message: 'Subject ID must be a positive number' })
  @IsOptional()
  @Type(() => Number)
  subjectId?: number;

  @IsString()
  @IsOptional()
  tags?: string; // JSON string of tag names
}

