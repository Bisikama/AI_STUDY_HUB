import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
