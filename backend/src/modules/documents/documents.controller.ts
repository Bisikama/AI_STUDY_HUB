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
  Delete,
  BadRequestException,
  Inject,
  Header,
  Patch,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ValidateFilePipe } from './pipes';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  GetDocumentsDto,
  CreateOrUpdateRatingDto,
  CreateReportDto,
} from './dto';
import { DocumentsService } from './documents.service';
import { DocumentAccessService } from './document-access.service';
import type { StorageAdapter } from '../../supabase/storage-adapter.interface';
import type {
  SanitizedDocument,
  SanitizedDocumentDetails,
  AnalyzeResult,
  MyDocumentListItem,
} from './types/document.types';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('/analyze/:id')
  // @UseGuards(JwtAuthGuard)
  async analyze(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: AnalyzeResult }> {
    const result = await this.documentsService.analyze(id, userId);
    return {
      statusCode: 201,
      message: 'Analyze completed successfully',
      data: result,
    };
  }

  @Post('/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(new ValidateFilePipe()) file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: SanitizedDocument }> {
    const document = await this.documentsService.uploadAndParse(
      file,
      dto.title,
      dto.description,
      dto.subjectId,
      userId,
      dto.tags,
    );

    return {
      statusCode: 201,
      message: 'Document uploaded and parsed successfully',
      data: document,
    };
  }

  @Get('me/storage-summary')
  @UseGuards(JwtAuthGuard)
  async getStorageSummary(@CurrentUser('id') userId: string) {
    const summary = await this.documentsService.getStorageSummary(userId);
    return {
      statusCode: 200,
      message: 'Storage summary retrieved successfully',
      data: summary,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyDocuments(
    @CurrentUser('id') userId: string,
    @Req() req: any,
  ): Promise<{ statusCode: number; message: string; data: MyDocumentListItem[] }> {
    if ('status' in req.query) {
      throw new BadRequestException(
        'The "status" query parameter is not supported. Use "visibilityStatus" instead.',
      );
    }
    const query = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      q: req.query.q as string,
      subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string, 10) : undefined,
      visibilityStatus: req.query.visibilityStatus as any,
    };
    const documents = await this.documentsService.getDocumentsByUser(userId, query);
    return {
      statusCode: 200,
      message: 'Get user documents successfully',
      data: documents,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getDetails(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: SanitizedDocumentDetails }> {
    const document = await this.documentsService.getDetails(id, userId);
    return {
      statusCode: 200,
      message: 'Get document details successfully',
      data: document,
    };
  }

  @Get(':id/preview')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async getPreviewUrl(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.documentsService.getSignedDocumentAccess(
      id,
      userId,
      'SIGNED_PREVIEW',
    );
    return {
      statusCode: 200,
      message: 'Preview URL generated successfully',
      data: result,
    };
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async getDownloadUrl(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.documentsService.getSignedDocumentAccess(
      id,
      userId,
      'SIGNED_DOWNLOAD',
    );
    return {
      statusCode: 200,
      message: 'Download URL generated successfully',
      data: result,
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteDocument(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string }> {
    const result = await this.documentsService.softDeleteDocument(id, userId);
    return {
      statusCode: 200,
      message: result.message,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateDocument(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: SanitizedDocument }> {
    // Only allow title, description, subjectId, tags
    const safeDto = {
      title: dto.title,
      description: dto.description,
      subjectId: dto.subjectId,
      tags: dto.tags,
    };
    const document = await this.documentsService.updateDocument(id, userId, safeDto);
    return {
      statusCode: 200,
      message: 'Document updated successfully',
      data: document,
    };
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  async followDocument(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string }> {
    await this.documentsService.followDocument(id, userId);
    return {
      statusCode: 200,
      message: 'Document followed successfully',
    };
  }

  @Post(':id/unfollow')
  @UseGuards(JwtAuthGuard)
  async unfollowDocument(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string }> {
    await this.documentsService.unfollowDocument(id, userId);
    return {
      statusCode: 200,
      message: 'Document unfollowed successfully',
    };
  }

  @Post(':id/request-public')
  @UseGuards(JwtAuthGuard)
  async requestPublic(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.documentsService.requestPublic(id, userId);
    return {
      statusCode: 200,
      message: 'Document public visibility requested successfully',
      data: document,
    };
  }

  @Post(':id/withdraw-public')
  @UseGuards(JwtAuthGuard)
  async withdrawPublic(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.documentsService.withdrawPublic(id, userId);
    return {
      statusCode: 200,
      message: 'Document public visibility withdrawn successfully',
      data: document,
    };
  }

  @Post(':documentId/ratings')
  @UseGuards(JwtAuthGuard)
  async rateDocument(
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @Body() dto: CreateOrUpdateRatingDto,
    @CurrentUser('id') userId: string,
  ) {
    const rating = await this.documentsService.rateDocument(
      documentId,
      userId,
      dto.rating,
      dto.comment,
    );
    return {
      statusCode: 201,
      message: 'Document rated successfully',
      data: rating,
    };
  }

  @Get(':documentId/ratings')
  async getRatings(@Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string) {
    const ratings = await this.documentsService.getRatings(documentId);
    return {
      statusCode: 200,
      message: 'Get document ratings successfully',
      data: ratings,
    };
  }

  @Patch(':documentId/ratings/me')
  @UseGuards(JwtAuthGuard)
  async updateRatingMe(
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @Body() dto: CreateOrUpdateRatingDto,
    @CurrentUser('id') userId: string,
  ) {
    const rating = await this.documentsService.rateDocument(
      documentId,
      userId,
      dto.rating,
      dto.comment,
    );
    return {
      statusCode: 200,
      message: 'Document rating updated successfully',
      data: rating,
    };
  }

  @Delete(':documentId/ratings/me')
  @UseGuards(JwtAuthGuard)
  async deleteRatingMe(
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.documentsService.deleteRating(documentId, userId);
    return {
      statusCode: 200,
      message: result.message,
    };
  }

  @Post(':documentId/reports')
  @UseGuards(JwtAuthGuard)
  async reportDocument(
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @Body() dto: CreateReportDto,
    @CurrentUser('id') userId: string,
  ) {
    const report = await this.documentsService.reportDocument(
      documentId,
      userId,
      dto.reason,
      dto.description,
    );
    return {
      statusCode: 201,
      message: 'Document reported successfully',
      data: report,
    };
  }
}
