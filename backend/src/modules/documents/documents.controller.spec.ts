import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockDocumentsService = {
    analyze: jest.fn(),
    uploadAndParse: jest.fn(),
    getDetails: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('analyze', () => {
    it('should call documentsService.analyze and return formatted response', async () => {
      const mockResult = { summary: 'mock-summary', quiz: 'mock-quiz' };
      mockDocumentsService.analyze.mockResolvedValue(mockResult);

      const response = await controller.analyze('doc-123', 'user-456');

      expect(mockDocumentsService.analyze).toHaveBeenCalledWith('doc-123', 'user-456');
      expect(response).toEqual({
        statusCode: 201,
        message: 'Analyze completed successfully',
        data: mockResult,
      });
    });
  });

  describe('upload', () => {
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('dummy'),
      size: 100,
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    it('should call uploadAndParse, returning wrapped response', async () => {
      const mockDoc = { id: 'doc-123', title: 'Title' };
      mockDocumentsService.uploadAndParse.mockResolvedValue(mockDoc);

      const dto = {
        title: 'Title',
        description: 'Desc',
        subjectId: 42,
      };

      const response = await controller.upload(mockFile, dto, 'user-123');

      expect(mockDocumentsService.uploadAndParse).toHaveBeenCalledWith(
        mockFile,
        'Title',
        'Desc',
        42,
        'user-123',
        undefined,
      );
      expect(response).toEqual({
        statusCode: 201,
        message: 'Document uploaded and parsed successfully',
        data: mockDoc,
      });
    });
  });

  describe('getDetails', () => {
    it('should call documentsService.getDetails and return formatted response', async () => {
      const mockResult = { id: 'doc-123', summary: {}, quizzes: [] };
      mockDocumentsService.getDetails.mockResolvedValue(mockResult);

      const response = await controller.getDetails('doc-123');

      expect(mockDocumentsService.getDetails).toHaveBeenCalledWith('doc-123', undefined);
      expect(response).toEqual({
        statusCode: 200,
        message: 'Get document details successfully',
        data: mockResult,
      });
    });
  });
});
