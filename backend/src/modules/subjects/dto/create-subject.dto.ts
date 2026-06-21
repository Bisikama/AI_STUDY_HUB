import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Subject name is required' })
  @MaxLength(100, { message: 'Subject name must not exceed 100 characters' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;
}
