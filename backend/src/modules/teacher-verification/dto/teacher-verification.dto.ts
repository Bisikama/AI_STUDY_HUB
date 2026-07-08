import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDefined } from 'class-validator';

export class CreateTeacherVerificationDto {
  @IsNotEmpty({ message: 'Mã giảng viên không được để trống' })
  @IsDefined({ message: 'Mã giảng viên là bắt buộc' })
  @IsString()
  teacherCode: string;

  @IsNotEmpty({ message: 'Khoa/Bộ môn không được để trống' })
  @IsDefined({ message: 'Khoa/Bộ môn là bắt buộc' })
  @IsString()
  department: string;

  @IsNotEmpty({ message: 'Minh chứng không được để trống' })
  @IsDefined({ message: 'Minh chứng là bắt buộc' })
  @IsString()
  proofUrl: string;
}

export class ReviewTeacherVerificationDto {
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'], { message: 'Trạng thái phải là APPROVED hoặc REJECTED' })
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  adminNote?: string;
}
