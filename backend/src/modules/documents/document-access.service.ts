import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { VisibilityStatus, DeletionStatus, Prisma } from '../../../generated/prisma/client';

export type DocumentAccessPurpose = 'SIGNED_PREVIEW' | 'SIGNED_DOWNLOAD';

export const getPublicEligibilityFilter = (): Prisma.DocumentWhereInput => ({
  visibilityStatus: 'PUBLIC',
  deletionStatus: 'ACTIVE',
  deletedAt: null,
  storagePath: { not: null },
  extractionStatus: 'READY',
  aiStatus: 'READY',
});

export const getModerationPendingFilter = (): Prisma.DocumentWhereInput => ({
  visibilityStatus: 'PENDING_REVIEW',
  deletionStatus: 'ACTIVE',
  deletedAt: null,
  storagePath: { not: null },
});

export interface SafeDocumentAccessRecord {
  id: string;
  uploadedBy: string;
  storagePath: string;
  visibilityStatus: VisibilityStatus;
  deletionStatus: DeletionStatus;
  deletedAt: Date | null;
  fileType: string;
  fileName: string;
}

export interface AuthorizedDocumentAccess {
  document: SafeDocumentAccessRecord;
  isOwner: boolean;
  isAdmin: boolean;
}

@Injectable()
export class DocumentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async authorizeAccess(
    documentId: string,
    userId: string,
    purpose: DocumentAccessPurpose,
  ): Promise<AuthorizedDocumentAccess> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        uploadedBy: true,
        storagePath: true,
        visibilityStatus: true,
        deletionStatus: true,
        deletedAt: true,
        fileType: true,
        title: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    let userRole = 'STUDENT';
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user) {
      userRole = user.role;
    }

    const isOwner = document.uploadedBy === userId;
    const isAdmin = userRole === 'ADMIN';

    // 1. Visibility check first to not leak existence/state of private documents
    if (document.visibilityStatus !== 'PUBLIC' && !isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to access this document');
    }

    // 2. Active state check
    if (
      document.deletionStatus !== 'ACTIVE' ||
      document.deletedAt !== null ||
      !document.storagePath
    ) {
      throw new ConflictException('DOCUMENT_NOT_ACTIVE');
    }

    // Attempt to extract the real stored filename from storagePath (e.g. documents/user/doc/filename.pdf)
    let finalFileName = '';
    if (document.storagePath) {
      finalFileName = document.storagePath.split('/').filter(Boolean).pop() || '';
    }

    // Fallback rule: use title if storagePath is unexpectedly empty or final segment is empty
    if (!finalFileName) {
      finalFileName = document.title || 'document';
    }

    // Sanitize to prevent unsafe header/disposition values while preserving extension
    finalFileName = finalFileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.\- ]/g, '')
      .trim();

    if (!finalFileName) {
      finalFileName = 'document';
    }

    // Ensure PDF extension if applicable
    const isPdf = document.fileType?.toLowerCase().includes('pdf');
    if (isPdf && !finalFileName.toLowerCase().endsWith('.pdf')) {
      finalFileName += '.pdf';
    }

    const safeRecord: SafeDocumentAccessRecord = {
      id: document.id,
      uploadedBy: document.uploadedBy,
      storagePath: document.storagePath,
      visibilityStatus: document.visibilityStatus,
      deletionStatus: document.deletionStatus,
      deletedAt: document.deletedAt,
      fileType: document.fileType,
      fileName: finalFileName,
    };

    return {
      document: safeRecord,
      isOwner,
      isAdmin,
    };
  }
}
