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
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
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

  @Get(':id')
  async getDetails(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<{ statusCode: number; message: string; data: SanitizedDocumentDetails }> {
    const document = await this.documentsService.getDetails(id);
    return {
      statusCode: 200,
      message: 'Get document details successfully',
      data: document,
    };
  }

  @Post('/:id/view')
  @UseGuards(JwtAuthGuard)
  async recordView(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
  ): Promise<{ statusCode: number; message: string }> {
    const userId = req.user.id;
    await this.documentsService.recordView(id, userId);
    return {
      statusCode: 200,
      message: 'Document view recorded successfully',
    };
  }
}
