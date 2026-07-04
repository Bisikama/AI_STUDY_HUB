import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDefined } from 'class-validator';

export class CreateTeacherVerificationDto {
  @IsNotEmpty({ message: 'Mã giảng viên không được để trống' })
  @IsDefined({ message: 'Mã giảng viên là bắt buộc' })
  @IsString()
  teacherCode: string;

  @IsDefined({ message: 'Khoa là bắt buộc' })
  @IsNotEmpty()
  @IsString()
  department: string;

  @IsDefined({ message: 'Khoa là bắt buộc' })
  @IsNotEmpty()
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
