/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { STORAGE_ADAPTER } from '../../supabase/storage-adapter.interface';
import type { StorageAdapter } from '../../supabase/storage-adapter.interface';
import { SubjectsService } from '../subjects/subjects.service';
import { TagsService } from '../tags/tags.service';
import { DocumentAccessService } from './document-access.service';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';

interface ServiceWithPrivateMethods {
  sanitizeData<T>(data: unknown): T;
}

jest.mock('./utils/documentParser', () => ({
  parseDocument: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

import { parseDocument } from './utils/documentParser';
const mockParseDocument = parseDocument as jest.MockedFunction<typeof parseDocument>;

// Mock GoogleGenerativeAI
const mockCountTokens = jest.fn();
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  countTokens: mockCountTokens,
  generateContent: mockGenerateContent,
});

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      };
    }),
  };
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    $executeRaw: jest.fn(),
    subject: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    documentChunk: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    tag: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    documentTag: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    userFollowedDocument: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    documentSummary: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    quiz: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    personalFolder: {
      findUnique: jest.fn(),
    },
    quizQuestion: {
      create: jest.fn(),
    },
    quizOption: {
      create: jest.fn(),
    },
    documentRating: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    documentReport: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    userStorageUsage: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    storageReservation: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('mock-api-key-123'),
  };

  const mockStorageAdapter = {
    uploadPrivate: jest.fn().mockResolvedValue({ storagePath: 'private/path/file.pdf' }),
    createPreviewUrl: jest.fn(),
    createDownloadUrl: jest.fn(),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    uploadToSupabase: jest.fn(),
    deleteFromSupabase: jest.fn(),
  };

  const mockSubjectsService = {
    createSubject: jest.fn(),
    getSubjects: jest.fn(),
    validateSubjectAccess: jest.fn().mockResolvedValue(undefined),
  };

  const mockTagsService = {
    getTags: jest.fn(),
  };

  const mockDocumentAccessService = {
    authorizeAccess: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma);
    });
    mockParseDocument.mockReset();
    mockParseDocument.mockResolvedValue({
      text: 'Default valid extracted PDF text with at least twenty characters.',
      pageCount: 1,
    });

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id', role: 'STUDENT' });

    mockPrisma.$executeRaw.mockResolvedValue(1);

    mockPrisma.userStorageUsage.findUnique.mockResolvedValue({
      userId: 'user-id',
      quotaBytes: 1073741824n,
      usedBytes: 0n,
      reservedBytes: 0n,
      trashBytes: 0n,
    });
    mockPrisma.storageReservation.findMany.mockResolvedValue([]);
    mockPrisma.storageReservation.create.mockResolvedValue({ id: 'res-id' });
    mockPrisma.storageReservation.findUnique.mockResolvedValue({
      id: 'res-id',
      userId: 'user-id',
      bytes: 100n,
      status: 'PENDING',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: STORAGE_ADAPTER, useValue: mockStorageAdapter },
        { provide: SubjectsService, useValue: mockSubjectsService },
        { provide: TagsService, useValue: mockTagsService },
        { provide: DocumentAccessService, useValue: mockDocumentAccessService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('sanitizeData helper', () => {
    it('should convert BigInt to Number in nested objects', () => {
      const input = {
        id: 1,
        fileSize: BigInt(5000),
        nested: {
          someVal: BigInt(123456789),
          array: [BigInt(1), BigInt(2)],
        },
      };

      const result = (service as unknown as ServiceWithPrivateMethods).sanitizeData<{
        id: number;
        fileSize: number;
        nested: { someVal: number; array: number[] };
      }>(input);
      expect(result).toEqual({
        id: 1,
        fileSize: 5000,
        nested: {
          someVal: 123456789,
          array: [1, 2],
        },
      });
      expect(typeof result.fileSize).toBe('number');
      expect(typeof result.nested.someVal).toBe('number');
    });

    it('should pass non-objects and null through', () => {
      const serviceWithPrivates = service as unknown as ServiceWithPrivateMethods;
      expect(serviceWithPrivates.sanitizeData(null)).toBeNull();
      expect(serviceWithPrivates.sanitizeData(undefined)).toBeUndefined();
      expect(serviceWithPrivates.sanitizeData('string')).toBe('string');
      expect(serviceWithPrivates.sanitizeData(123)).toBe(123);
    });
  });

  describe('uploadAndParse', () => {
    const mockFile = {
      buffer: Buffer.from('test'),
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
    } as Express.Multer.File;

    it('should throw NotFoundException if subject does not exist', async () => {
      mockSubjectsService.validateSubjectAccess.mockRejectedValueOnce(
        new NotFoundException('Subject not found'),
      );

      await expect(service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSubjectsService.validateSubjectAccess).toHaveBeenCalledWith(1, 'user-id');
    });

    it('should throw NotFoundException if user is provided but does not exist', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1, name: 'Subject 1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'invalid-user'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'invalid-user' } });
    });

    it('should fallback to first user if no userId is provided', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1, name: 'Subject 1' });
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'fallback-user-id',
        name: 'First User',
      });
      mockPrisma.document.create.mockResolvedValue({
        id: 'doc-id',
        title: 'Title',
        fileSize: BigInt(100),
      });
      mockPrisma.document.update.mockResolvedValue({});
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        title: 'Title',
        fileSize: BigInt(100),
        storagePath: 'private/path/file.pdf',
        extractionStatus: 'PENDING',
      });

      const result = await service.uploadAndParse(mockFile, 'Title', 'Desc', 1);

      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            uploadedBy: 'fallback-user-id',
            extractionStatus: 'PENDING',
            fileUrl: '', // Q6 technical staging dummy
          }),
        }),
      );
      expect(mockStorageAdapter.uploadPrivate).toHaveBeenCalled();
      expect(result.id).toEqual('doc-id');
    });

    it('should return 502 (BadGatewayException) if uploadPrivate fails and cleanup staging', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-fail-upload' });
      mockStorageAdapter.uploadPrivate.mockRejectedValueOnce(new Error('Storage failure'));

      await expect(service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'user-id')).rejects.toThrow(
        expect.objectContaining({ status: 502 }), // BadGatewayException
      );
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: 'doc-fail-upload' } });
    });

    it('should return 502 and delete object if DB update fails after uploadPrivate succeeds', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-fail-db' });
      mockStorageAdapter.uploadPrivate.mockResolvedValueOnce({ storagePath: 'test/path' });
      mockPrisma.document.update.mockRejectedValueOnce(new Error('DB failure'));

      await expect(service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'user-id')).rejects.toThrow(
        expect.objectContaining({ status: 502 }),
      );
      expect(mockStorageAdapter.deleteObject).toHaveBeenCalledWith('test/path');
    });
    it('should ignore extraction errors and return safe document payload', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1, name: 'Subject 1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-1', status: 'PRIVATE' });

      const mockDate = new Date('2026-01-01T00:00:00Z');
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        title: 'Title',
        description: 'Desc',
        subjectId: 1,
        fileType: 'application/pdf',
        fileSize: BigInt(123),
        visibilityStatus: 'PRIVATE',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'FAILED',
        aiStatus: 'READY',
        pageCount: 1,
        createdAt: mockDate,
        storagePath: 'secret/path',
        fileUrl: 'http://secret.url',
        fullText: 'secret text',
      });
      (parseDocument as jest.Mock).mockRejectedValueOnce(new Error('Extract error'));

      const result = await service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'user-id');
      expect(result.id).toBe('doc-1');
      expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result.fileSize).toBe(123);
      expect(result).not.toHaveProperty('fullText');
      expect(result).not.toHaveProperty('storagePath');
      expect(result).not.toHaveProperty('fileUrl');
    });
  });

  describe('analyze', () => {
    const mockDocumentId = 'doc-id-123';
    const mockUserId = 'user-id-456';

    it('should throw NotFoundException if document does not exist', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if document is PENDING', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PENDING',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        deletedAt: null,
      });

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if document has no text content', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        fullText: '',
        fileUrl: '',
        deletedAt: null,
        uploadedBy: mockUserId,
      });

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if text content exceeds 40,000 characters (Layer 1 Defense)', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        fullText: 'A'.repeat(40001),
        deletedAt: null,
        uploadedBy: mockUserId,
      });

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      expect((mockPrisma.document.findUnique as jest.Mock).mock.calls.length).toBe(1);
    });

    it('should throw InternalServerErrorException if GEMINI_API_KEY is not set', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        fullText: 'Short content',
        deletedAt: null,
        uploadedBy: mockUserId,
      });
      mockConfig.get.mockReturnValueOnce(undefined);

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException if token count exceeds 30,000 (Layer 2 Defense)', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        fullText: 'Short content',
        deletedAt: null,
        uploadedBy: mockUserId,
      });
      mockCountTokens.mockResolvedValueOnce({ totalTokens: 30001 });

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCountTokens).toHaveBeenCalledWith('Short content');
    });

    it('should throw InternalServerErrorException if Gemini SDK fails', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        fullText: 'Short content',
        deletedAt: null,
        uploadedBy: mockUserId,
      });
      mockCountTokens.mockResolvedValueOnce({ totalTokens: 100 });
      mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API is down'));

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException if Gemini returns invalid JSON structure', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        fullText: 'Short content',
        deletedAt: null,
        uploadedBy: mockUserId,
      });
      mockCountTokens.mockResolvedValueOnce({ totalTokens: 100 });
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => '{"invalid": "json"',
        },
      });

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException if Gemini returns JSON missing required keys', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'test.pdf',
        storagePath: 'test.pdf',
        fullText: 'Short content',
        deletedAt: null,
        uploadedBy: mockUserId,
      });
      mockCountTokens.mockResolvedValueOnce({ totalTokens: 100 });
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => '{"summary": [], "keyPoints": []}', // quizzes missing
        },
      });

      await expect(service.analyze(mockDocumentId, mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should run transaction to save summary and quiz on success', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: mockDocumentId,
        status: 'PRIVATE',
        title: 'Document Title.pdf',
        storagePath: 'Document Title.pdf',
        fullText: 'Short content',
        uploadedBy: mockUserId,
        deletedAt: null,
      });
      mockCountTokens.mockResolvedValueOnce({ totalTokens: 100 });

      const mockGeminiJson = {
        summary: [
          { heading: 'Introduction', content: 'Intro text' },
          { heading: 'Key Concept', content: 'Concept text' },
        ],
        keyPoints: ['Point 1', 'Point 2'],
        quizzes: [
          {
            question: 'Question 1?',
            options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
            correctAnswer: 1,
          },
        ],
      };

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockGeminiJson),
        },
      });

      // Transaction step returns
      mockPrisma.documentSummary.create.mockResolvedValue({
        id: 'summary-id',
        summaryText: 'text',
      });
      mockPrisma.quiz.create.mockResolvedValue({ id: 'quiz-id', title: 'Quiz' });
      mockPrisma.quizQuestion.create.mockResolvedValue({ id: 'question-id' });
      mockPrisma.quizOption.create.mockResolvedValue({ id: 'option-id' });
      mockPrisma.document.update.mockResolvedValue({ id: mockDocumentId, isAIGenerated: true });
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-id',
        questions: [
          {
            id: 'question-id',
            questionText: 'Question 1?',
            options: [
              { id: 'opt-a', optionText: 'Opt A', isCorrect: false },
              { id: 'opt-b', optionText: 'Opt B', isCorrect: true },
            ],
          },
        ],
      });

      const result = await service.analyze(mockDocumentId, mockUserId);

      // Verify db cleanups
      expect(mockPrisma.documentSummary.deleteMany).toHaveBeenCalledWith({
        where: { documentId: mockDocumentId },
      });
      expect(mockPrisma.quiz.deleteMany).toHaveBeenCalledWith({
        where: { documentId: mockDocumentId },
      });

      // Verify create summary
      expect(mockPrisma.documentSummary.create).toHaveBeenCalledWith({
        data: {
          documentId: mockDocumentId,
          summaryText: '### Introduction\nIntro text\n\n### Key Concept\nConcept text',
          keyPoints: '• Point 1\n• Point 2',
          status: 'COMPLETED',
        },
      });

      // Verify create quiz
      expect(mockPrisma.quiz.create).toHaveBeenCalledWith({
        data: {
          documentId: mockDocumentId,
          title: 'Document Title.pdf - AI Quiz',
          createdBy: mockUserId,
        },
      });

      // Verify create questions and options
      expect(mockPrisma.quizQuestion.create).toHaveBeenCalledWith({
        data: {
          quizId: 'quiz-id',
          questionText: 'Question 1?',
        },
      });

      expect(mockPrisma.quizOption.create).toHaveBeenCalledTimes(4);
      expect(mockPrisma.quizOption.create).toHaveBeenNthCalledWith(1, {
        data: { questionId: 'question-id', optionText: 'Opt A', isCorrect: false },
      });
      expect(mockPrisma.quizOption.create).toHaveBeenNthCalledWith(2, {
        data: { questionId: 'question-id', optionText: 'Opt B', isCorrect: true },
      });

      // Verify document flag updates (PROCESSING -> READY)
      expect(mockPrisma.document.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.document.update).toHaveBeenNthCalledWith(1, {
        where: { id: mockDocumentId },
        data: {
          aiStatus: 'PROCESSING',
          aiRunId: expect.any(String),
          aiProcessingStartedAt: expect.any(Date),
          aiAttemptCount: { increment: 1 },
          aiFailureReason: null,
        },
      });
      expect(mockPrisma.document.update).toHaveBeenNthCalledWith(2, {
        where: { id: mockDocumentId },
        data: {
          aiStatus: 'READY',
          aiGeneratedAt: expect.any(Date),
          isAIGenerated: true,
        },
      });

      // Verify output
      expect(result).toBeDefined();
      expect(result.summary.id).toBe('summary-id');
      expect(result.quiz.id).toBe('quiz-id');
      expect(result.document.isAIGenerated).toBe(true);
    });
  });

  describe('getDetails', () => {
    it('should throw NotFoundException if document does not exist', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.getDetails('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return safe document structure and omit forbidden fields', async () => {
      const ownerId = 'user-1';
      const mockDate = new Date('2026-01-01T00:00:00Z');
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        title: 'Title',
        description: 'Desc',
        subjectId: 1,
        subject: { id: 1, name: 'Math', code: 'MATH101', isSystem: true },
        fileType: 'application/pdf',
        fileSize: BigInt(999),
        visibilityStatus: 'PRIVATE',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        pageCount: 10,
        createdAt: mockDate,
        updatedAt: mockDate,
        requestedAt: null,
        // Forbidden fields
        uploadedBy: ownerId,
        storagePath: 'documents/user-id/doc-id/test.pdf',
        fileUrl: 'http://example.com/file',
        previewUrl: 'http://example.com/preview',
        status: 'APPROVED',
        fullText: 'secret text',
        summary: { id: 's-1' },
        quizzes: [{ id: 'q-1' }],
        tags: [{ tag: { id: 1, name: 'AI', slug: 'ai' } }],
        aiRunId: 'run-1',
        aiProcessingStartedAt: mockDate,
        aiGeneratedAt: mockDate,
        aiAttemptCount: 1,
        aiFailureReason: 'none',
        deletedAt: null,
      });

      const result = await service.getDetails('doc-id', ownerId);

      // Safe fields exist
      expect(result).toEqual(
        expect.objectContaining({
          id: 'doc-id',
          title: 'Title',
          description: 'Desc',
          subjectId: 1,
          subject: { id: 1, name: 'Math', code: 'MATH101', isSystem: true },
          fileType: 'application/pdf',
          fileSize: 999,
          visibilityStatus: 'PRIVATE',
          deletionStatus: 'ACTIVE',
          extractionStatus: 'READY',
          aiStatus: 'READY',
          pageCount: 10,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          requestedAt: null,
          isOwner: true,
          isFollowed: false,
        }),
      );

      // Timestamps serialize to ISO strings
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');

      // Forbidden fields absent
      const forbiddenFields = [
        'uploadedBy',
        'fileUrl',
        'previewUrl',
        'storagePath',
        'fullText',
        'aiRunId',
        'aiProcessingStartedAt',
        'aiGeneratedAt',
        'aiAttemptCount',
        'aiFailureReason',
        'deletedAt',
      ];
      forbiddenFields.forEach((field) => {
        expect(result).not.toHaveProperty(field);
      });

      expect(result.tags).toEqual([{ id: 1, name: 'AI', slug: 'ai' }]);
      expect(result.tags[0]).not.toHaveProperty('tag');
      expect(result.tags[0]).not.toHaveProperty('documentId');
      expect(result.tags[0]).not.toHaveProperty('tagId');
      expect(result.tags[0]).not.toHaveProperty('createdBy');
      expect(result.tags[0]).not.toHaveProperty('createdAt');
      expect(result.tags[0]).not.toHaveProperty('updatedAt');
    });
  });

  describe('extractAndPersist', () => {
    it('should skip if document does not exist', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      const res = await service.extractAndPersist({
        documentId: 'invalid',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.pdf',
        mimeType: 'app/pdf',
      });
      expect(res).toEqual({ extractionStatus: 'FAILED', chunkCount: 0 });
    });

    it('should skip if file type is unsupported', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        extractionStatus: 'PENDING',
      });
      const res = await service.extractAndPersist({
        documentId: 'doc-1',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.doc',
        mimeType: 'application/msword',
      });
      expect(res).toEqual({ extractionStatus: 'UNSUPPORTED', chunkCount: 0 });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { extractionStatus: 'UNSUPPORTED' },
      });
    });

    it('should skip if already READY or FAILED', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'READY' });
      const res = await service.extractAndPersist({
        documentId: 'doc-1',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.pdf',
        mimeType: 'app/pdf',
      });
      expect(res).toEqual({ extractionStatus: 'READY', chunkCount: 0 });
    });

    it('should update to FAILED if parseDocument throws', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        extractionStatus: 'PENDING',
      });
      mockParseDocument.mockRejectedValueOnce(new Error('Parser error'));
      const res = await service.extractAndPersist({
        documentId: 'doc-1',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
      });
      expect(res).toEqual({ extractionStatus: 'FAILED', chunkCount: 0 });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { extractionStatus: 'FAILED' },
      });
    });

    it('should update to FAILED if normalized text < 20 chars', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        extractionStatus: 'PENDING',
      });
      mockParseDocument.mockResolvedValueOnce({ text: '  short   ', pageCount: 1 });
      const res = await service.extractAndPersist({
        documentId: 'doc-1',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
      });
      expect(res).toEqual({ extractionStatus: 'FAILED', chunkCount: 0 });
    });

    it('should chunk correctly for exactly 1 chunk <= 1500 chars', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        extractionStatus: 'PENDING',
        aiStatus: 'NOT_REQUESTED',
        fullText: null,
        pageCount: null,
      });
      const validText = 'a'.repeat(100);
      mockParseDocument.mockResolvedValueOnce({ text: validText, pageCount: 1 });
      const res = await service.extractAndPersist({
        documentId: 'doc-1',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
      });

      expect(res.extractionStatus).toBe('READY');
      expect(res.chunkCount).toBe(1);
      expect(mockPrisma.documentChunk.createMany).toHaveBeenCalledWith({
        data: [
          { documentId: 'doc-1', chunkIndex: 0, content: validText, charStart: 0, charEnd: 100 },
        ],
      });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          extractionStatus: 'READY',
          fullText: validText,
          pageCount: 1,
        },
      });
    });

    it('should chunk multiple times for > 1500 chars and respect 200 char overlap', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        extractionStatus: 'PENDING',
        aiStatus: 'NOT_REQUESTED',
        fullText: null,
        pageCount: null,
      });
      // text is 2000 long
      const validText = 'a'.repeat(1500) + 'b'.repeat(500);
      mockParseDocument.mockResolvedValueOnce({ text: validText, pageCount: 3 });
      const res = await service.extractAndPersist({
        documentId: 'doc-1',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
      });

      expect(res.extractionStatus).toBe('READY');
      expect(res.chunkCount).toBe(2);
      expect(res.pageCount).toBe(3);

      const calls = mockPrisma.documentChunk.createMany.mock.calls[0][0].data;
      expect(calls[0]).toEqual({
        documentId: 'doc-1',
        chunkIndex: 0,
        content: validText.slice(0, 1500),
        charStart: 0,
        charEnd: 1500,
      });
      // Next chunk starts at 1500 - 200 = 1300
      expect(calls[1]).toEqual({
        documentId: 'doc-1',
        chunkIndex: 1,
        content: validText.slice(1300, 2000),
        charStart: 1300,
        charEnd: 2000,
      });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          extractionStatus: 'READY',
          fullText: validText,
          pageCount: 3,
        },
      });
    });

    it('should fallback to FAILED if transaction throws', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        extractionStatus: 'PENDING',
      });
      const validText = 'a'.repeat(100);
      mockParseDocument.mockResolvedValueOnce({ text: validText, pageCount: 1 });

      mockPrisma.$transaction.mockRejectedValueOnce(new Error('DB Failed'));

      const res = await service.extractAndPersist({
        documentId: 'doc-1',
        pdfBuffer: Buffer.from(''),
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
      });
      expect(res.extractionStatus).toBe('FAILED');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { extractionStatus: 'FAILED' },
      });
    });
  });

  describe('getReadyChunksForAI', () => {
    it('returns ordered chunks if READY', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'READY' });
      mockPrisma.documentChunk.findMany.mockResolvedValue([
        { chunkIndex: 0, content: 'A', charStart: 0, charEnd: 1 },
        { chunkIndex: 1, content: 'B', charStart: 1, charEnd: 2 },
      ]);

      const res = await service.getReadyChunksForAI('doc-1');
      expect(res).toHaveLength(2);
    });

    it('throws BadRequestException if PENDING or FAILED', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'FAILED' });
      await expect(service.getReadyChunksForAI('doc-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDocumentsByUser', () => {
    it('returns only owned active documents without followed docs and includes fileType but no sensitive fields', async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          uploadedBy: 'user-1',
          deletionStatus: 'ACTIVE',
          fileType: 'application/pdf',
          fileUrl: 'secret.url',
        },
      ]);
      const res = await service.getDocumentsByUser('user-1', { page: 1, limit: 10 });
      expect(res).toHaveLength(1);
      expect(mockPrisma.userFollowedDocument.findMany).not.toHaveBeenCalled();

      const returnedDoc = res[0] as any;
      expect(returnedDoc.fileType).toBe('application/pdf');
      expect(returnedDoc.fileUrl).toBeUndefined();
      expect(returnedDoc.uploadedBy).toBeUndefined();
      expect(returnedDoc.storagePath).toBeUndefined();
    });
  });

  describe('softDeleteDocument', () => {
    it('soft deletes active owned document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        uploadedBy: 'user-1',
        deletionStatus: 'ACTIVE',
        deletedAt: null,
      });
      await service.softDeleteDocument('doc-1', 'user-1');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: expect.objectContaining({
          deletionStatus: 'SOFT_DELETED',
          visibilityStatus: 'PRIVATE',
        }),
      });
    });
  });

  describe('Q9 - requestPublic', () => {
    const validAiDocument = {
      id: 'doc-1',
      uploadedBy: 'user-1',
      visibilityStatus: 'PRIVATE',
      deletionStatus: 'ACTIVE',
      deletedAt: null,
      storagePath: 'path/to/file.pdf',
      extractionStatus: 'READY',
      aiStatus: 'READY',
      subject: { isSystem: true },
      summary: { content: 'test' },
      quizzes: [{ questions: [{ id: 'q1' }] }],
      copyrightSourceType: 'OWN_ORIGINAL',
      copyrightDeclaredAt: new Date(),
      copyrightDeclaredBy: 'user-1',
    };

    it('1. Owner requests public on valid PRIVATE document with system subject', async () => {
      mockPrisma.document.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.document.findUnique.mockResolvedValueOnce(validAiDocument).mockResolvedValueOnce({
        id: 'doc-1',
        visibilityStatus: 'PENDING_REVIEW',
      });

      const res = await service.requestPublic('doc-1', 'user-1');
      expect(res.visibilityStatus).toBe('PENDING_REVIEW');
      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: 'doc-1',
          visibilityStatus: 'PRIVATE',
          deletionStatus: 'ACTIVE',
        }),
        data: expect.objectContaining({
          visibilityStatus: 'PENDING_REVIEW',
          requestedAt: expect.any(Date),
        }),
      });
    });

    it('1b. Teacher requests public on valid PRIVATE document -> auto approved to PUBLIC', async () => {
      mockPrisma.document.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.document.findUnique
        .mockResolvedValueOnce({
          ...validAiDocument,
          id: 'doc-teacher',
          uploadedBy: 'teacher-1',
          copyrightDeclaredBy: 'teacher-1',
        })
        .mockResolvedValueOnce({
          id: 'doc-teacher',
          visibilityStatus: 'PUBLIC',
        });

      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'TEACHER' });

      const res = await service.requestPublic('doc-teacher', 'teacher-1');
      expect(res.visibilityStatus).toBe('PUBLIC');
      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ id: 'doc-teacher' }),
        data: expect.objectContaining({ visibilityStatus: 'PUBLIC' }),
      });
    });

    it('2. Personal Subject -> 422 DOCUMENT_PUBLIC_SUBJECT_REQUIRED', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-2',
        subject: { isSystem: false },
      });
      await expect(service.requestPublic('doc-2', 'user-1')).rejects.toThrow(
        'DOCUMENT_PUBLIC_SUBJECT_REQUIRED',
      );
    });

    it('3. Invalid lifecycle -> 409 DOCUMENT_INVALID_STATE', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-3',
        visibilityStatus: 'PENDING_REVIEW', // Already pending
      });
      await expect(service.requestPublic('doc-3', 'user-1')).rejects.toThrow(
        'DOCUMENT_INVALID_STATE',
      );
    });

    it('3a. Owner, extractionStatus = FAILED -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-4',
        extractionStatus: 'FAILED',
      });
      await expect(service.requestPublic('doc-4', 'user-1')).rejects.toThrow(
        'Tài liệu phải hoàn tất AI Analyze',
      );
    });

    it('3b. Owner, aiStatus = NOT_REQUESTED -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-5',
        aiStatus: 'NOT_REQUESTED',
      });
      await expect(service.requestPublic('doc-5', 'user-1')).rejects.toThrow(
        'Tài liệu phải hoàn tất AI Analyze',
      );
    });

    it('3c. Owner, aiStatus = PROCESSING -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-6',
        aiStatus: 'PROCESSING',
      });
      await expect(service.requestPublic('doc-6', 'user-1')).rejects.toThrow(
        'Tài liệu phải hoàn tất AI Analyze',
      );
    });

    it('3d. Owner, storagePath = null -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-7',
        storagePath: null,
      });
      await expect(service.requestPublic('doc-7', 'user-1')).rejects.toThrow(
        'DOCUMENT_INVALID_STATE',
      );
    });

    it('3e. Owner, already PENDING_REVIEW -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-8',
        visibilityStatus: 'PENDING_REVIEW',
      });
      await expect(service.requestPublic('doc-8', 'user-1')).rejects.toThrow(
        'DOCUMENT_INVALID_STATE',
      );
    });

    it('3f. Owner, already PUBLIC -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-9',
        visibilityStatus: 'PUBLIC',
      });
      await expect(service.requestPublic('doc-9', 'user-1')).rejects.toThrow(
        'DOCUMENT_INVALID_STATE',
      );
    });

    it('3g. Owner, SOFT_DELETED / non-ACTIVE -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-10',
        deletionStatus: 'SOFT_DELETED',
      });
      await expect(service.requestPublic('doc-10', 'user-1')).rejects.toThrow(
        'DOCUMENT_INVALID_STATE',
      );
    });

    it('3h. Race condition handled by updateMany returning 0 count -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(validAiDocument);
      mockPrisma.document.updateMany.mockResolvedValue({ count: 0 }); // State changed concurrently
      await expect(service.requestPublic('doc-1', 'user-1')).rejects.toThrow(
        'DOCUMENT_INVALID_STATE',
      );
    });

    it('3i. Owner, aiStatus = READY but Summary missing -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-11',
        summary: null,
      });
      await expect(service.requestPublic('doc-11', 'user-1')).rejects.toThrow(
        'Tài liệu phải hoàn tất AI Analyze',
      );
    });

    it('3j. Owner, aiStatus = READY but Quiz/Questions missing -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-12',
        quizzes: [],
      });
      await expect(service.requestPublic('doc-12', 'user-1')).rejects.toThrow(
        'Tài liệu phải hoàn tất AI Analyze',
      );
    });

    it('3k. Document extraction UNSUPPORTED -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-13',
        extractionStatus: 'UNSUPPORTED',
      });
      await expect(service.requestPublic('doc-13', 'user-1')).rejects.toThrow(
        'Tài liệu phải hoàn tất AI Analyze',
      );
    });

    it('3l. Teacher, extraction READY + aiStatus NOT_REQUESTED -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...validAiDocument,
        id: 'doc-teacher-fail',
        uploadedBy: 'teacher-1',
        aiStatus: 'NOT_REQUESTED',
      });
      // Role isn't fetched yet because it fails early
      await expect(service.requestPublic('doc-teacher-fail', 'teacher-1')).rejects.toThrow(
        'Tài liệu phải hoàn tất AI Analyze',
      );
    });

    it('4. Owner-only: User B cannot request public for User A document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        uploadedBy: 'user-A',
      });
      await expect(service.requestPublic('doc-1', 'user-B')).rejects.toThrow('permission');
    });
  });

  describe('Q9 - withdrawPublic', () => {
    it('5. Withdraw success: PUBLIC -> PRIVATE', async () => {
      mockPrisma.document.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.document.findUnique
        .mockResolvedValueOnce({
          id: 'doc-pub',
          uploadedBy: 'user-1',
          visibilityStatus: 'PUBLIC',
          deletionStatus: 'ACTIVE',
          deletedAt: null,
          storagePath: 'documents/user-1/doc-pub/example.pdf',
        })
        .mockResolvedValueOnce({
          id: 'doc-pub',
          visibilityStatus: 'PRIVATE',
        });

      const res = await service.withdrawPublic('doc-pub', 'user-1');
      expect(res.visibilityStatus).toBe('PRIVATE');
    });

    it('6. Withdraw invalid state -> 409', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-priv',
        uploadedBy: 'user-1',
        visibilityStatus: 'PRIVATE', // Not public
        deletionStatus: 'ACTIVE',
        deletedAt: null,
        storagePath: 'path',
      });
      await expect(service.withdrawPublic('doc-priv', 'user-1')).rejects.toThrow(
        'DOCUMENT_INVALID_STATE',
      );
    });

    it('7. User B cannot withdraw User A PUBLIC document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-pub',
        uploadedBy: 'user-A',
        visibilityStatus: 'PUBLIC',
      });
      await expect(service.withdrawPublic('doc-pub', 'user-B')).rejects.toThrow('permission');
    });
  });

  describe('updateDocument', () => {
    it('should return safe mapped response and omit forbidden fields', async () => {
      const mockDate = new Date('2026-01-01T00:00:00Z');
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });
      mockPrisma.document.update.mockResolvedValue({});
      mockPrisma.document.findUniqueOrThrow.mockResolvedValue({
        id: 'doc-id',
        title: 'New Title',
        description: 'New Desc',
        subjectId: 2,
        subject: {
          id: 2,
          name: 'Science',
          code: 'SCI101',
          isSystem: false,
        },
        tags: [],
        fileType: 'application/pdf',
        fileSize: BigInt(123),
        visibilityStatus: 'PRIVATE',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        pageCount: 5,
        createdAt: mockDate,
        updatedAt: mockDate,
        requestedAt: null,
      });
      const result = await service.updateDocument('doc-id', 'user-1', { title: 'New Title' });
      expect(result.id).toBe('doc-id');
      expect(result.isOwner).toBe(true);
      expect(result.isFollowed).toBe(false);
      expect(result.updatedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result).not.toHaveProperty('fullText');
      expect(result).not.toHaveProperty('storagePath');
      expect(result).not.toHaveProperty('uploadedBy');
    });

    it('should process valid tags and use a transaction', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });

      mockPrisma.tag.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, name: 'Interview', slug: 'interview' });
      mockPrisma.tag.create.mockResolvedValueOnce({ id: 1, name: 'AI', slug: 'ai' });
      mockPrisma.documentTag.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.documentTag.create.mockResolvedValue({});

      mockPrisma.document.findUniqueOrThrow.mockResolvedValue({
        id: 'doc-id',
        tags: [
          { tag: { id: 1, name: 'AI', slug: 'ai' } },
          { tag: { id: 2, name: 'Interview', slug: 'interview' } },
        ],
      });

      const result = await service.updateDocument('doc-id', 'user-1', {
        tags: [' AI ', 'ai', 'Interview'],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.documentTag.deleteMany).toHaveBeenCalledWith({
        where: { documentId: 'doc-id' },
      });
      expect(mockPrisma.tag.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrisma.documentTag.create).toHaveBeenCalledTimes(2);
      expect(result.tags).toEqual([
        { id: 1, name: 'AI', slug: 'ai' },
        { id: 2, name: 'Interview', slug: 'interview' },
      ]);
    });

    it('should clear all relations when explicit tags: [] is sent', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });

      mockPrisma.document.findUniqueOrThrow.mockResolvedValue({
        id: 'doc-id',
        tags: [],
      });

      const result = await service.updateDocument('doc-id', 'user-1', { tags: [] });
      expect(mockPrisma.documentTag.deleteMany).toHaveBeenCalledWith({
        where: { documentId: 'doc-id' },
      });
      expect(mockPrisma.tag.findFirst).not.toHaveBeenCalled();
      expect(result.tags).toEqual([]);
    });

    it('should update personalFolderId when valid folder is provided', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });
      mockPrisma.personalFolder.findUnique.mockResolvedValue({ id: 'folder-b', ownerId: 'user-1' });
      mockPrisma.document.update.mockResolvedValue({});
      mockPrisma.document.findUniqueOrThrow.mockResolvedValue({ id: 'doc-id' });

      await service.updateDocument('doc-id', 'user-1', { personalFolderId: 'folder-b' });

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-id' },
          data: expect.objectContaining({ personalFolderId: 'folder-b' }),
        })
      );
    });

    it('should set personalFolderId to null when null is provided', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });
      mockPrisma.document.update.mockResolvedValue({});
      mockPrisma.document.findUniqueOrThrow.mockResolvedValue({ id: 'doc-id' });

      await service.updateDocument('doc-id', 'user-1', { personalFolderId: null } as any);

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-id' },
          data: expect.objectContaining({ personalFolderId: null }),
        })
      );
    });

    it('should not update personalFolderId when it is omitted from payload', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });
      mockPrisma.document.update.mockResolvedValue({});
      mockPrisma.document.findUniqueOrThrow.mockResolvedValue({ id: 'doc-id' });

      await service.updateDocument('doc-id', 'user-1', { title: 'New Title' });

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-id' },
          data: expect.not.objectContaining({ personalFolderId: expect.anything() }),
        })
      );
    });

    it('should throw NotFoundException if folder does not belong to owner', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });
      mockPrisma.personalFolder.findUnique.mockResolvedValue({ id: 'folder-user-b', ownerId: 'user-2' });

      await expect(service.updateDocument('doc-id', 'user-1', { personalFolderId: 'folder-user-b' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should preserve relations when tags is omitted', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });

      mockPrisma.document.findUniqueOrThrow.mockResolvedValue({
        id: 'doc-id',
        tags: [{ tag: { id: 2, name: 'Old', slug: 'old' } }],
      });

      const result = await service.updateDocument('doc-id', 'user-1', { title: 'No tags' });
      expect(mockPrisma.documentTag.deleteMany).not.toHaveBeenCalled();
    });

    it('should reject more than 10 tags', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });
      const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      await expect(service.updateDocument('doc-id', 'user-1', { tags })).rejects.toThrow(
        'Maximum 10 tags',
      );
      expect(mockPrisma.documentTag.deleteMany).not.toHaveBeenCalled();
    });

    it('should simulate failure during replacement and rollback (mock limitation)', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        uploadedBy: 'user-1',
        deletedAt: null,
        deletionStatus: 'ACTIVE',
        storagePath: 'path',
      });

      mockPrisma.$transaction.mockRejectedValueOnce(new Error('DB Failed'));

      await expect(service.updateDocument('doc-id', 'user-1', { tags: ['fail'] })).rejects.toThrow(
        'DB Failed',
      );
      // Note: In an actual Prisma environment, a thrown error inside $transaction rolls back all changes.
      // Since we mock $transaction here, we only verify that it rejects and propagates the error,
      // representing the atomic failure boundary required by the specification.
    });
  });

  describe('sanitizeData', () => {
    it('should serialize Date to ISO string and BigInt to Number', () => {
      const input = {
        dateField: new Date('2026-01-01T00:00:00Z'),
        bigIntField: BigInt(100),
        nested: {
          date: new Date('2026-01-02T00:00:00Z'),
        },
        arr: [BigInt(50), new Date('2026-01-03T00:00:00Z')],
      };
      const result = (service as unknown as ServiceWithPrivateMethods).sanitizeData<{
        dateField: string;
        bigIntField: number;
        nested: { date: string };
        arr: [number, string];
      }>(input);
      expect(result.dateField).toBe('2026-01-01T00:00:00.000Z');
      expect(result.bigIntField).toBe(100);
      expect(result.nested.date).toBe('2026-01-02T00:00:00.000Z');
      expect(result.arr[0]).toBe(50);
      expect(result.arr[1]).toBe('2026-01-03T00:00:00.000Z');
    });
  });

  describe('Document Ratings & Reports', () => {
    describe('rateDocument', () => {
      it('should throw NotFoundException if document does not exist', async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null);
        await expect(service.rateDocument('doc-1', 'user-1', 5)).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if user rates their own document', async () => {
        mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', uploadedBy: 'user-1' });
        await expect(service.rateDocument('doc-1', 'user-1', 5)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should upsert rating and update document averages', async () => {
        mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', uploadedBy: 'user-other' });
        mockPrisma.documentRating.upsert.mockResolvedValue({
          id: 'rating-1',
          rating: 5,
          comment: 'Good',
        });
        mockPrisma.documentRating.aggregate.mockResolvedValue({
          _avg: { rating: 4.5 },
          _count: { rating: 10 },
        });
        mockPrisma.document.update.mockResolvedValue({ id: 'doc-1' });

        const result = await service.rateDocument('doc-1', 'user-1', 5, 'Good');
        expect(result).toBeDefined();
        expect(mockPrisma.documentRating.upsert).toHaveBeenCalled();
        expect(mockPrisma.document.update).toHaveBeenCalledWith({
          where: { id: 'doc-1' },
          data: { averageRating: 4.5, ratingCount: 10 },
        });
      });
    });

    describe('reportDocument', () => {
      it('should throw NotFoundException if document does not exist', async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null);
        await expect(
          service.reportDocument('doc-1', 'user-1', 'INCORRECT_CONTENT'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if user reports their own document', async () => {
        mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', uploadedBy: 'user-1' });
        await expect(
          service.reportDocument('doc-1', 'user-1', 'INCORRECT_CONTENT'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw ConflictException if user already has active report', async () => {
        mockPrisma.document.findUnique.mockResolvedValue({
          id: 'doc-1',
          uploadedBy: 'user-other',
          visibilityStatus: 'PUBLIC',
          deletionStatus: 'ACTIVE',
          status: 'ACTIVE',
          deletedAt: null,
        });
        mockPrisma.documentReport.findFirst.mockResolvedValue({ id: 'report-1' });

        await expect(
          service.reportDocument('doc-1', 'user-1', 'INCORRECT_CONTENT'),
        ).rejects.toThrow(ConflictException);
      });

      it('should create report and auto moderate document if reports >= 3', async () => {
        mockPrisma.document.findUnique.mockResolvedValue({
          id: 'doc-1',
          uploadedBy: 'user-other',
          visibilityStatus: 'PUBLIC',
          deletionStatus: 'ACTIVE',
          status: 'ACTIVE',
          deletedAt: null,
        });
        mockPrisma.documentReport.findFirst.mockResolvedValue(null);
        mockPrisma.documentReport.create.mockResolvedValue({ id: 'report-new' });
        mockPrisma.document.update
          .mockResolvedValueOnce({ id: 'doc-1', reportCount: 3, status: 'ACTIVE' })
          .mockResolvedValueOnce({ id: 'doc-1', status: 'UNDER_REVIEW' });

        const result = await service.reportDocument(
          'doc-1',
          'user-1',
          'INCORRECT_CONTENT',
          'Description',
        );
        expect(result).toBeDefined();
        expect(mockPrisma.documentReport.create).toHaveBeenCalled();
        expect(mockPrisma.document.update).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Storage Accounting and Quota (Phase 4.1)', () => {
    const quotaBytes = 1073741824n;
    
    beforeEach(() => {
      mockPrisma.$executeRaw = jest.fn();
      mockStorageAdapter.uploadPrivate.mockResolvedValue({ storagePath: 'test/path' });
      mockParseDocument.mockResolvedValue({ title: 'Parsed Title', extractedText: 'Content' });
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-id-123' });
      mockPrisma.document.update.mockResolvedValue({ id: 'doc-id-123' });
      mockPrisma.userStorageUsage.findUnique.mockResolvedValue({
        userId: 'user-id', quotaBytes, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n,
      });
      mockPrisma.storageReservation.create.mockResolvedValue({ id: 'res-id' });
    });

    it('1. Exact quota boundary: used + reserved + incoming = quota', async () => {
      mockPrisma.userStorageUsage.findUnique.mockResolvedValue({
        userId: 'user-id', quotaBytes, usedBytes: quotaBytes - 100n, reservedBytes: 0n, trashBytes: 0n,
      });
      mockPrisma.$executeRaw.mockResolvedValue(1); // conditional update succeeds
      mockStorageAdapter.uploadPrivate.mockImplementation(async () => {
        console.log('TEST 1: mockStorageAdapter.uploadPrivate CALLED');
        return { storagePath: 'test/path' };
      });
      const file = { size: 100, originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as any;
      await expect(service.uploadAndParse(file, 'Test', '', 1, 'user-id')).resolves.toBeDefined();
    });

    it('2. Quota exceeded: vượt 1 byte, trả 409 STORAGE_QUOTA_EXCEEDED, Supabase không được gọi', async () => {
      mockPrisma.userStorageUsage.findUnique.mockResolvedValue({
        userId: 'user-id', quotaBytes, usedBytes: quotaBytes, reservedBytes: 0n, trashBytes: 0n,
      });
      mockPrisma.$executeRaw.mockResolvedValue(0); // conditional update fails
      const file = { size: 1, originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as any;
      await expect(service.uploadAndParse(file, 'Test', '', 1, 'user-id')).rejects.toMatchObject({
        response: expect.objectContaining({ error: 'STORAGE_QUOTA_EXCEEDED', statusCode: 409 })
      });
      expect(mockStorageAdapter.uploadPrivate).not.toHaveBeenCalled();
      expect(mockPrisma.document.create).not.toHaveBeenCalled();
      expect(mockParseDocument).not.toHaveBeenCalled();
    });

    it('3. Atomic reservation: verify conditional update database-level check is used', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(1);
      const file = { size: 100, originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as any;
      await service.uploadAndParse(file, 'Test', '', 1, 'user-id');
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('UPDATE "user_storage_usages"')]),
        expect.anything(), expect.anything(), expect.anything()
      );
    });

    it('4. Upload failure: Supabase fail -> reservation chuyển RELEASED', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockStorageAdapter.uploadPrivate.mockRejectedValue(new Error('Fail'));
      mockPrisma.storageReservation.findUnique.mockResolvedValue({ id: 'res-id', userId: 'user-id', bytes: 100n, status: 'PENDING' });
      const file = { size: 100, originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as any;
      await expect(service.uploadAndParse(file, 'Test', '', 1, 'user-id')).rejects.toThrow();
      expect(mockPrisma.storageReservation.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'RELEASED' })
      }));
      expect(mockPrisma.userStorageUsage.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ reservedBytes: { decrement: 100n } })
      }));
    });

    it('5. DB persistence failure: cleanup storage, release reservation', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockStorageAdapter.uploadPrivate.mockResolvedValue({ storagePath: 'test/path' });
      mockPrisma.document.update.mockRejectedValueOnce(new Error('DB Fail'));
      mockPrisma.storageReservation.findUnique.mockResolvedValue({ id: 'res-id', userId: 'user-id', bytes: 100n, status: 'PENDING' });
      const file = { size: 100, originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as any;
      await expect(service.uploadAndParse(file, 'Test', '', 1, 'user-id')).rejects.toThrow();
      expect(mockStorageAdapter.deleteObject).toHaveBeenCalledWith('test/path');
      expect(mockPrisma.storageReservation.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'RELEASED' })
      }));
    });

    it('6. Parser FAILED: file còn physical storage -> FINALIZED usedBytes tăng', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockStorageAdapter.uploadPrivate.mockResolvedValue({ storagePath: 'test/path' });
      mockParseDocument.mockRejectedValue(new Error('Parse Fail'));
      mockPrisma.storageReservation.findUnique.mockResolvedValue({ id: 'res-id', userId: 'user-id', bytes: 100n, status: 'PENDING' });
      const file = { size: 100, originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as any;
      await expect(service.uploadAndParse(file, 'Test', '', 1, 'user-id')).resolves.toBeDefined();
      expect(mockPrisma.storageReservation.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FINALIZED' })
      }));
      expect(mockPrisma.userStorageUsage.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ reservedBytes: { decrement: 100n }, usedBytes: { increment: 100n } })
      }));
    });

    it('7. Unsupported DOC/ZIP: reservation FINALIZED, usedBytes tăng', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockStorageAdapter.uploadPrivate.mockResolvedValue({ storagePath: 'test/path' });
      mockPrisma.storageReservation.findUnique.mockResolvedValue({ id: 'res-id', userId: 'user-id', bytes: 100n, status: 'PENDING' });
      const file = { size: 100, originalname: 'test.zip', mimetype: 'application/zip', buffer: Buffer.from('') } as any;
      await service.uploadAndParse(file, 'Test', '', 1, 'user-id');
      expect(mockPrisma.storageReservation.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FINALIZED' })
      }));
    });

    it('8. Soft-delete: active -> usedBytes giảm, trashBytes tăng đúng một lần', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', deletionStatus: 'ACTIVE', deletedAt: null, uploadedBy: 'user-id', fileSize: 500n });
      await service.softDeleteDocument('doc-1', 'user-id');
      expect(mockPrisma.userStorageUsage.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-id' },
        data: expect.objectContaining({ usedBytes: { decrement: 500n }, trashBytes: { increment: 500n } })
      }));
    });

    it('8. Soft-delete: delete lần hai -> throw NotFoundException', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', deletionStatus: 'SOFT_DELETED', deletedAt: new Date(), uploadedBy: 'user-id', fileSize: 500n });
      await expect(service.softDeleteDocument('doc-1', 'user-id')).rejects.toThrow();
    });

    it('10. Stale reservation: PENDING expired -> RELEASED một lần', async () => {
      const oldDate = new Date(Date.now() - 100000);
      mockPrisma.storageReservation.findMany.mockResolvedValue([{ id: 'stale-1', bytes: 200n }]);
      const txMock = {
        storageReservation: { findMany: jest.fn().mockResolvedValue([{ id: 'stale-1', bytes: 200n }]), updateMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'res-id' }), findUnique: jest.fn(), update: jest.fn() },
        userStorageUsage: { findUnique: jest.fn().mockResolvedValue({ quotaBytes, usedBytes: 0n, reservedBytes: 200n }), create: jest.fn(), update: jest.fn() },
        $executeRaw: jest.fn().mockResolvedValue(1)
      };
      mockPrisma.$transaction.mockImplementation(async (cb) => cb(txMock));
      const file = { size: 100, originalname: 'test.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as any;
      await service.uploadAndParse(file, 'Test', '', 1, 'user-id');
      expect(txMock.storageReservation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: { in: ['stale-1'] } },
        data: expect.objectContaining({ status: 'RELEASED' })
      }));
      expect(txMock.userStorageUsage.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ reservedBytes: { decrement: 200n } })
      }));
    });

    it('12. Storage summary: byte fields string, usedPercent đúng, availableBytes không âm', async () => {
      mockPrisma.userStorageUsage.findUnique.mockResolvedValue({
        userId: 'user-id', quotaBytes: 100n, usedBytes: 60n, reservedBytes: 10n, trashBytes: 5n,
      });
      const summary = await service.getStorageSummary('user-id');
      expect(summary.quotaBytes).toBe('100');
      expect(summary.usedBytes).toBe('60');
      expect(summary.reservedBytes).toBe('10');
      expect(summary.trashBytes).toBe('5');
      expect(summary.availableBytes).toBe('30');
      expect(summary.usedPercent).toBe(70);
    });
  });
});
