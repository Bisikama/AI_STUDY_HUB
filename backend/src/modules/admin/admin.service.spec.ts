import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: SupabaseService,
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Storage Accounting Tests (Phase 4.1)', () => {
    let mockPrisma: any;
    let mockSupabase: any;

    beforeEach(async () => {
      mockPrisma = {
        document: {
          findUnique: jest.fn(),
          delete: jest.fn(),
        },
        userStorageUsage: {
          updateMany: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
      };
      
      mockSupabase = {
        deleteFromSupabase: jest.fn().mockResolvedValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AdminService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: SupabaseService, useValue: mockSupabase },
          {
            provide: NotificationsService,
            useValue: {
              create: jest.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<AdminService>(AdminService);
    });

    it('9. Force delete: soft-deleted -> trashBytes giảm chỉ sau Supabase delete success', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', uploadedBy: 'user-id', fileSize: 500n, deletionStatus: 'SOFT_DELETED' });
      await service.forceDeleteDocument('doc-1');
      expect(mockSupabase.deleteFromSupabase).toHaveBeenCalled();
      expect(mockPrisma.userStorageUsage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-id' }, data: expect.objectContaining({ trashBytes: { decrement: 500n } })
      }));
    });

    it('9. Force delete: active document -> usedBytes giảm chỉ sau Supabase delete success', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', uploadedBy: 'user-id', fileSize: 500n, deletionStatus: 'ACTIVE' });
      await service.forceDeleteDocument('doc-1');
      expect(mockSupabase.deleteFromSupabase).toHaveBeenCalled();
      expect(mockPrisma.userStorageUsage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-id' }, data: expect.objectContaining({ usedBytes: { decrement: 500n } })
      }));
    });

    it('9. Force delete: Supabase delete fail -> DB/counter giữ nguyên', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', uploadedBy: 'user-id', fileSize: 500n, deletionStatus: 'ACTIVE' });
      mockSupabase.deleteFromSupabase.mockRejectedValue(new Error('Cloud Fail'));
      await expect(service.forceDeleteDocument('doc-1')).rejects.toThrow();
      expect(mockPrisma.document.delete).not.toHaveBeenCalled();
      expect(mockPrisma.userStorageUsage.updateMany).not.toHaveBeenCalled();
    });
  });
});
