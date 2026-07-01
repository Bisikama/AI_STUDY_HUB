import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSubjects(
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: unknown[] }> {
    const subjects = await this.subjectsService.getSubjects(userId);
    return {
      statusCode: 200,
      message: 'Get subjects successfully',
      data: subjects,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: unknown }> {
    const subject = await this.subjectsService.createSubject(userId, dto);
    return {
      statusCode: 201,
      message: 'Subject created successfully',
      data: subject,
    };
  }
}
