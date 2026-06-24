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
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    documentChunk: {
      createMany: jest.fn(),
      findMany: jest.fn(),
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
    quizQuestion: {
      create: jest.fn(),
    },
    quizOption: {
      create: jest.fn(),
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

  beforeEach(async () => {
    jest.clearAllMocks();
    mockParseDocument.mockReset();
    mockParseDocument.mockResolvedValue({
      text: 'Default valid extracted PDF text with at least twenty characters.',
      pageCount: 1,
    });

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id', role: 'STUDENT' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: STORAGE_ADAPTER, useValue: mockStorageAdapter },
        { provide: SubjectsService, useValue: mockSubjectsService },
        { provide: TagsService, useValue: mockTagsService },
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
        expect.objectContaining({ status: 502 }) // BadGatewayException
      );
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: 'doc-fail-upload' } });
    });

    it('should return 502 and delete object if DB update fails after uploadPrivate succeeds', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-fail-db' });
      mockStorageAdapter.uploadPrivate.mockResolvedValueOnce({ storagePath: 'test/path' });
      mockPrisma.document.update.mockRejectedValueOnce(new Error('DB failure'));

      await expect(service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'user-id')).rejects.toThrow(
        expect.objectContaining({ status: 502 })
      );
      expect(mockStorageAdapter.deleteObject).toHaveBeenCalledWith('test/path');
    });
    it('should ignore extraction errors and return document', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1, name: 'Subject 1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      mockPrisma.document.create.mockResolvedValue({ id: 'doc-1', status: 'PRIVATE' });
      
      // extraction fails
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'PENDING' });
      (parseDocument as jest.Mock).mockRejectedValueOnce(new Error('Extract error'));

      const result = await service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'user-id');
      expect(result.id).toBe('doc-1');
      expect(result).not.toHaveProperty('fullText');
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
        title: 'Document Title',
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
          title: 'Document Title - AI Quiz',
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

      // Verify document flag update
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: mockDocumentId },
        data: { isAIGenerated: true },
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

    it('should return document structure with summary and quizzes', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-id',
        title: 'Title',
        fileSize: BigInt(999),
        storagePath: 'documents/user-id/doc-id/test.pdf',
        deletionStatus: 'ACTIVE',
        summary: { id: 's-1' },
        quizzes: [{ id: 'q-1' }],
        deletedAt: null,
        status: 'APPROVED',
        fullText: 'secret text',
      });

      const result = await service.getDetails('doc-id');
      expect(result).toEqual({
        id: 'doc-id',
        title: 'Title',
        fileSize: 999,
        storagePath: 'documents/user-id/doc-id/test.pdf',
        deletionStatus: 'ACTIVE',
        summary: { id: 's-1' },
        quizzes: [{ id: 'q-1' }],
        deletedAt: null,
        status: 'APPROVED',
        isFollowed: false,
        isOwner: false,
      });
      expect(result).not.toHaveProperty('fullText');
    });
  });

  describe('extractAndPersist', () => {
    it('should skip if document does not exist', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      const res = await service.extractAndPersist({ documentId: 'invalid', pdfBuffer: Buffer.from(''), originalName: 'a.pdf', mimeType: 'app/pdf' });
      expect(res).toEqual({ extractionStatus: 'FAILED', chunkCount: 0 });
    });

    it('should skip if mimeType is not application/pdf', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'PENDING' });
      const res = await service.extractAndPersist({ documentId: 'doc-1', pdfBuffer: Buffer.from(''), originalName: 'a.txt', mimeType: 'text/plain' });
      expect(res).toEqual({ extractionStatus: 'FAILED', chunkCount: 0 });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { extractionStatus: 'FAILED' }
      });
    });

    it('should skip if already READY or FAILED', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'READY' });
      const res = await service.extractAndPersist({ documentId: 'doc-1', pdfBuffer: Buffer.from(''), originalName: 'a.pdf', mimeType: 'app/pdf' });
      expect(res).toEqual({ extractionStatus: 'READY', chunkCount: 0 });
    });

    it('should update to FAILED if parseDocument throws', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'PENDING' });
      mockParseDocument.mockRejectedValueOnce(new Error('Parser error'));
      const res = await service.extractAndPersist({ documentId: 'doc-1', pdfBuffer: Buffer.from(''), originalName: 'a.pdf', mimeType: 'application/pdf' });
      expect(res).toEqual({ extractionStatus: 'FAILED', chunkCount: 0 });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { extractionStatus: 'FAILED' },
      });
    });

    it('should update to FAILED if normalized text < 20 chars', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'PENDING' });
      mockParseDocument.mockResolvedValueOnce({ text: '  short   ', pageCount: 1 });
      const res = await service.extractAndPersist({ documentId: 'doc-1', pdfBuffer: Buffer.from(''), originalName: 'a.pdf', mimeType: 'application/pdf' });
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
      const res = await service.extractAndPersist({ documentId: 'doc-1', pdfBuffer: Buffer.from(''), originalName: 'a.pdf', mimeType: 'application/pdf' });
      
      expect(res.extractionStatus).toBe('READY');
      expect(res.chunkCount).toBe(1);
      expect(mockPrisma.documentChunk.createMany).toHaveBeenCalledWith({
        data: [{ documentId: 'doc-1', chunkIndex: 0, content: validText, charStart: 0, charEnd: 100 }]
      });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          extractionStatus: 'READY',
          fullText: validText,
          pageCount: 1,
        }
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
      const res = await service.extractAndPersist({ documentId: 'doc-1', pdfBuffer: Buffer.from(''), originalName: 'a.pdf', mimeType: 'application/pdf' });
      
      expect(res.extractionStatus).toBe('READY');
      expect(res.chunkCount).toBe(2);
      expect(res.pageCount).toBe(3);
      
      const calls = mockPrisma.documentChunk.createMany.mock.calls[0][0].data;
      expect(calls[0]).toEqual({ documentId: 'doc-1', chunkIndex: 0, content: validText.slice(0, 1500), charStart: 0, charEnd: 1500 });
      // Next chunk starts at 1500 - 200 = 1300
      expect(calls[1]).toEqual({ documentId: 'doc-1', chunkIndex: 1, content: validText.slice(1300, 2000), charStart: 1300, charEnd: 2000 });
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          extractionStatus: 'READY',
          fullText: validText,
          pageCount: 3,
        }
      });
    });

    it('should fallback to FAILED if transaction throws', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', extractionStatus: 'PENDING' });
      const validText = 'a'.repeat(100);
      mockParseDocument.mockResolvedValueOnce({ text: validText, pageCount: 1 });
      
      mockPrisma.$transaction.mockRejectedValueOnce(new Error('DB Failed'));
      
      const res = await service.extractAndPersist({ documentId: 'doc-1', pdfBuffer: Buffer.from(''), originalName: 'a.pdf', mimeType: 'application/pdf' });
      expect(res.extractionStatus).toBe('FAILED');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { extractionStatus: 'FAILED' }
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
        { id: 'doc-1', uploadedBy: 'user-1', deletionStatus: 'ACTIVE', fileType: 'application/pdf', fileUrl: 'secret.url' },
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
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', uploadedBy: 'user-1', deletionStatus: 'ACTIVE', deletedAt: null });
      await service.softDeleteDocument('doc-1', 'user-1');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: expect.objectContaining({ deletionStatus: 'SOFT_DELETED', visibilityStatus: 'PRIVATE' }),
      });
    });
  });
});
