/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
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
  parseDocument: jest
    .fn()
    .mockResolvedValue(
      'Extracted plain text contents for test. This content must be longer than fifty characters to pass validation.',
    ),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

import { parseDocument } from './utils/documentParser';

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

  const mockSupabase = {
    uploadToSupabase: jest.fn().mockResolvedValue('http://mock-supabase-url.com/file.pdf'),
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
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id', role: 'STUDENT' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: SupabaseService, useValue: mockSupabase },
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

      const result = await service.uploadAndParse(mockFile, 'Title', 'Desc', 1);

      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            uploadedBy: 'fallback-user-id',
          }),
        }),
      );
      expect(result).toEqual({ id: 'doc-id', title: 'Title', fileSize: 100 });
    });

    it('should throw BadRequestException if parsing fails', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1, name: 'Subject 1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      (parseDocument as jest.Mock).mockRejectedValueOnce(new Error('Extract error'));

      await expect(service.uploadAndParse(mockFile, 'Title', 'Desc', 1, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
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
        summary: { id: 's-1' },
        quizzes: [{ id: 'q-1' }],
        deletedAt: null,
        status: 'APPROVED',
      });

      const result = await service.getDetails('doc-id');
      expect(result).toEqual({
        id: 'doc-id',
        title: 'Title',
        fileSize: 999,
        summary: { id: 's-1' },
        quizzes: [{ id: 'q-1' }],
        deletedAt: null,
        status: 'APPROVED',
      });
    });
  });
});
