import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus, DocumentStatus } from '../../../../generated/prisma/client';

export class ResolveReportDto {
  @IsEnum(ReportStatus, {
    message: 'Trạng thái xử lý báo cáo không hợp lệ.',
  })
  status: ReportStatus;

  @IsOptional()
  @IsEnum(DocumentStatus, {
    message: 'Trạng thái tài liệu không hợp lệ.',
  })
  documentStatus?: DocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Ghi chú tối đa 1000 ký tự.' })
  adminNote?: string;
}
