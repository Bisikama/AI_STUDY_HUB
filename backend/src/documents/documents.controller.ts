/// <reference types="multer" />
import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':id/analyze')
  async analyze(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const result = await this.documentsService.analyze(id, userId);
    return {
      statusCode: 201,
      message: 'Analyze completed successfully',
      data: result,
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('subjectId') subjectIdStr: string,
    @Body('userId') userIdFromBody?: string,
    @Headers('x-user-id') userIdFromHeader?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!title) {
      throw new BadRequestException('Title is required');
    }
    if (!subjectIdStr) {
      throw new BadRequestException('subjectId is required');
    }

    const subjectId = parseInt(subjectIdStr, 10);
    if (isNaN(subjectId)) {
      throw new BadRequestException('subjectId must be a number');
    }

    const userId = userIdFromHeader || userIdFromBody;

    const document = await this.documentsService.uploadAndParse(
      file,
      title,
      description,
      subjectId,
      userId,
    );

    return {
      statusCode: 201,
      message: 'Document uploaded and parsed successfully',
      data: document,
    };
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    const document = await this.documentsService.getDetails(id);
    return {
      statusCode: 200,
      message: 'Get document details successfully',
      data: document,
    };
  }
}
