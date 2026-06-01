import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockDocument = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Document',
    description: 'A test document',
    subjectId: 1,
    uploadedBy: '550e8400-e29b-41d4-a716-446655440001',
    fileUrl: '/uploads/test.pdf',
    previewUrl: null,
    fileSize: BigInt(1024),
    fileType: 'application/pdf',
    downloadCount: 0,
    viewCount: 0,
    status: 'PROCESSING',
    fullText: 'Test content',
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            document: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('approveOrRejectDoc', () => {
    it('should approve a document by updating its status to AVAILABLE', async () => {
      const documentId = mockDocument.id;
      const approvedDocument = {
        ...mockDocument,
        status: 'AVAILABLE',
      };

      (prisma.document.findUnique as jest.Mock).mockResolvedValue(mockDocument);
      (prisma.document.update as jest.Mock).mockResolvedValue(approvedDocument);

      const result = await service.approveOrRejectDoc(documentId, 'AVAILABLE');

      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { status: 'AVAILABLE' },
      });
      expect(result.status).toBe('AVAILABLE');
    });

    it('should reject a document by updating its status to FAILED', async () => {
      const documentId = mockDocument.id;
      const rejectedDocument = {
        ...mockDocument,
        status: 'FAILED',
      };

      (prisma.document.findUnique as jest.Mock).mockResolvedValue(mockDocument);
      (prisma.document.update as jest.Mock).mockResolvedValue(rejectedDocument);

      const result = await service.approveOrRejectDoc(documentId, 'FAILED');

      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
      expect(result.status).toBe('FAILED');
    });

    it('should throw NotFoundException if document does not exist', async () => {
      const documentId = 'non-existent-id';

      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.approveOrRejectDoc(documentId, 'AVAILABLE')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
    });

    it('should convert BigInt to Number in the returned document', async () => {
      const documentId = mockDocument.id;
      const approvedDocument = {
        ...mockDocument,
        status: 'AVAILABLE',
      };

      (prisma.document.findUnique as jest.Mock).mockResolvedValue(mockDocument);
      (prisma.document.update as jest.Mock).mockResolvedValue(approvedDocument);

      const result = await service.approveOrRejectDoc(documentId, 'AVAILABLE');

      expect(typeof result.fileSize).toBe('number');
    });
  });
});
