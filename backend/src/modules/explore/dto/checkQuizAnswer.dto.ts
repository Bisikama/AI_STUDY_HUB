import { IsNotEmpty, IsUUID } from 'class-validator';

export class CheckQuizAnswerDto {
  @IsUUID()
  @IsNotEmpty()
  quizId: string;

  @IsUUID()
  @IsNotEmpty()
  selectedOptionId: string;
}
