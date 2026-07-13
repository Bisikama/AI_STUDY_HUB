import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CheckQuizAnswerDto } from './dto/checkQuizAnswer.dto';
import { GetExploreQueryDto } from './dto/getExploreQuery.dto';
import { ExploreService } from './exploreService';
import { ExploreDocumentItem } from './types/exploreDocumentItem.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getExploreDocuments(@Query() query: GetExploreQueryDto): Promise<ExploreDocumentItem[]> {
    return this.exploreService.getExploreDocuments(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/ai-cache')
  async getDocumentAiCache(@Param('id') id: string) {
    return this.exploreService.getDocumentAiCache(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/quiz/check')
  async checkQuizAnswer(@Param('id') id: string, @Body() body: CheckQuizAnswerDto) {
    return this.exploreService.checkQuizAnswer(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/quiz/submit')
  async submitQuizAttempt(
    @Param('id') id: string,
    @Body() body: { quizId: string; score: number },
    @CurrentUser('id') userId: string,
  ) {
    return this.exploreService.submitQuizAttempt(userId, body.quizId, body.score);
  }
}
