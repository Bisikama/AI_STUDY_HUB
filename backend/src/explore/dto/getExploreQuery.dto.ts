import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GetExploreQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
