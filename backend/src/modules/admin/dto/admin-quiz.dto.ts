import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetAdminQuizzesQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  subjectId?: number;
}

export class UpdateOptionDto {
  @IsString()
  id: string;

  @IsString()
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  questionText?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  @IsOptional()
  options?: UpdateOptionDto[];
}
