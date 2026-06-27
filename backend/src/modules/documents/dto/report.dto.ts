import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportReason } from '../../../../generated/prisma/client';

export class CreateReportDto {
  @IsEnum(ReportReason, {
    message: 'Lý do báo cáo không hợp lệ.',
  })
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Mô tả chi tiết tối đa 500 ký tự.' })
  description?: string;
}
