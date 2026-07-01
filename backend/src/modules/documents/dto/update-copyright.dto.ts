import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CopyrightSourceType } from '../../../../generated/prisma/client';

export class UpdateCopyrightDto {
  @IsEnum(CopyrightSourceType, { message: 'Nguồn tài liệu không hợp lệ.' })
  sourceType: CopyrightSourceType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL không hợp lệ.' })
  @MaxLength(512)
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  license?: string;

  @IsOptional()
  @IsString()
  attribution?: string;

  @IsOptional()
  @IsString()
  permissionReference?: string;
}
