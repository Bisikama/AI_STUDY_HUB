import { IsInt, Min, Max, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateOrUpdateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
