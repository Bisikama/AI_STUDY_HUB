import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateTeacherVerificationDto {
  @IsNotEmpty({ message: 'Mã giảng viên không được để trống' })
  @IsString()
  teacherCode: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;
}

export class ReviewTeacherVerificationDto {
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'], { message: 'Trạng thái phải là APPROVED hoặc REJECTED' })
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  adminNote?: string;
}
