import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockDocument = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Document',
    status: 'AVAILABLE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            approveOrRejectDoc: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('approveDocument', () => {
    it('should call adminService.approveOrRejectDoc with AVAILABLE status', async () => {
      const documentId = mockDocument.id;

      (service.approveOrRejectDoc as jest.Mock).mockResolvedValue(mockDocument);

      const result = await controller.approveDocument(documentId);

      expect(service.approveOrRejectDoc).toHaveBeenCalledWith(documentId, 'AVAILABLE');
      expect(result).toEqual(mockDocument);
    });
  });

  describe('rejectDocument', () => {
    it('should call adminService.approveOrRejectDoc with FAILED status', async () => {
      const documentId = mockDocument.id;

      (service.approveOrRejectDoc as jest.Mock).mockResolvedValue({
        ...mockDocument,
        status: 'FAILED',
      });

      const result = await controller.rejectDocument(documentId);

      expect(service.approveOrRejectDoc).toHaveBeenCalledWith(documentId, 'FAILED');
      expect(result.status).toBe('FAILED');
    });
  });
});
