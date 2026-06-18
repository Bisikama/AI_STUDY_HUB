import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  UploadedFile,
  UseInterceptors,
  Get,
  ParseUUIDPipe,
  Optional,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ValidateFilePipe } from './pipes';
import { UploadDocumentDto } from './dto';
import type {
  SanitizedDocument,
  SanitizedDocumentDetails,
  AnalyzeResult,
} from './types/document.types';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('/analyze/:id')
  async analyze(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Optional()
    @Headers('x-user-id')
    userId?: string,
  ): Promise<{ statusCode: number; message: string; data: AnalyzeResult }> {
    const result = await this.documentsService.analyze(id, userId);
    return {
      statusCode: 201,
      message: 'Analyze completed successfully',
      data: result,
    };
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(new ValidateFilePipe()) file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Optional()
    @Headers('x-user-id')
    userId?: string,
  ): Promise<{ statusCode: number; message: string; data: SanitizedDocument }> {
    const document = await this.documentsService.uploadAndParse(
      file,
      dto.title,
      dto.description,
      dto.subjectId,
      userId,
    );

    return {
      statusCode: 201,
      message: 'Document uploaded and parsed successfully',
      data: document,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyDocuments(
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: SanitizedDocument[] }> {
    const documents = await this.documentsService.getDocumentsByUser(userId);
    return {
      statusCode: 200,
      message: 'Get user documents successfully',
      data: documents,
    };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getDetails(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId?: string,
  ): Promise<{ statusCode: number; message: string; data: SanitizedDocumentDetails }> {
    const document = await this.documentsService.getDetails(id, userId);
    return {
      statusCode: 200,
      message: 'Get document details successfully',
      data: document,
    };
  }
}
