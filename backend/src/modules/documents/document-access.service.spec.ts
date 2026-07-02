import { Test, TestingModule } from '@nestjs/testing';
import { DocumentAccessService } from './document-access.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('DocumentAccessService', () => {
  let service: DocumentAccessService;

  const mockPrisma = {
    document: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentAccessService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<DocumentAccessService>(DocumentAccessService);
    jest.clearAllMocks();
  });

  describe('authorizeAccess', () => {
    it('throws NotFoundException if document not found', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(service.authorizeAccess('doc-1', 'user-1', 'SIGNED_PREVIEW')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if private and not owner or admin', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        uploadedBy: 'owner-id',
        visibilityStatus: 'PRIVATE',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });

      await expect(service.authorizeAccess('doc-1', 'user-1', 'SIGNED_PREVIEW')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException if document is soft deleted', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        uploadedBy: 'user-1',
        visibilityStatus: 'PRIVATE',
        deletionStatus: 'SOFT_DELETED',
        deletedAt: new Date(),
        storagePath: 'path/to/file',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });

      await expect(service.authorizeAccess('doc-1', 'user-1', 'SIGNED_PREVIEW')).rejects.toThrow(
        ConflictException,
      );
    });

    it('returns safe access record if active public document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        uploadedBy: 'owner-id',
        visibilityStatus: 'PUBLIC',
        deletionStatus: 'ACTIVE',
        deletedAt: null,
        storagePath: 'documents/user-1/doc-1/My PDF.pdf',
        fileType: 'application/pdf',
        title: 'My PDF',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });

      const res = await service.authorizeAccess('doc-1', 'user-1', 'SIGNED_PREVIEW');
      expect(res.isOwner).toBe(false);
      expect(res.isAdmin).toBe(false);
      expect(res.document.fileName).toBe('My PDF.pdf');
    });

    it('extracts filename from storagePath and does not override with title', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-2',
        uploadedBy: 'owner-id',
        visibilityStatus: 'PUBLIC',
        deletionStatus: 'ACTIVE',
        deletedAt: null,
        storagePath: 'documents/user-a/doc-a/lecture-notes.pdf',
        fileType: 'application/pdf',
        title: 'Totally Different Title',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });

      const res = await service.authorizeAccess('doc-2', 'user-a', 'SIGNED_DOWNLOAD');
      expect(res.document.fileName).toBe('lecture-notes.pdf');
    });

    it('returns safe access record if active private document and user is owner', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        uploadedBy: 'user-1',
        visibilityStatus: 'PRIVATE',
        deletionStatus: 'ACTIVE',
        deletedAt: null,
        storagePath: 'path/to/file',
        fileType: 'application/pdf',
        title: 'Private Doc',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });

      const res = await service.authorizeAccess('doc-1', 'user-1', 'SIGNED_DOWNLOAD');
      expect(res.isOwner).toBe(true);
    });
  });
});
