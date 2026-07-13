import { Test, TestingModule } from '@nestjs/testing';
import { TeacherVerificationService } from './teacher-verification.service';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('TeacherVerificationService', () => {
  let service: TeacherVerificationService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    teacherVerification: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockSupabase = {
    uploadToSupabase: jest.fn(),
  };

  const mockNotifications = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherVerificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TeacherVerificationService>(TeacherVerificationService);
    jest.clearAllMocks();
  });

  describe('submitRequest', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.submitRequest('user-1', { teacherCode: 'TC123', department: 'CS', proofUrl: 'url' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is teacher banned', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isTeacherBanned: true });

      await expect(
        service.submitRequest('user-1', { teacherCode: 'TC123', department: 'CS', proofUrl: 'url' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is already a teacher', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isTeacherBanned: false, role: 'TEACHER' });

      await expect(
        service.submitRequest('user-1', { teacherCode: 'TC123', department: 'CS', proofUrl: 'url' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already has a PENDING verification request', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isTeacherBanned: false, role: 'STUDENT' });
      mockPrisma.teacherVerification.findUnique.mockResolvedValue({ status: 'PENDING' });

      await expect(
        service.submitRequest('user-1', { teacherCode: 'TC123', department: 'CS', proofUrl: 'url' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should upsert verification and return success message if request is valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isTeacherBanned: false, role: 'STUDENT' });
      mockPrisma.teacherVerification.findUnique.mockResolvedValue(null);
      mockPrisma.teacherVerification.upsert.mockResolvedValue({ id: 'verify-1' });

      const result = await service.submitRequest('user-1', {
        teacherCode: ' TC123 ',
        department: ' CS ',
        proofUrl: ' http://proof.com ',
      });

      expect(result.message).toBe('Gửi yêu cầu Xác Thực Giảng Viên thành công!');
      expect(mockPrisma.teacherVerification.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {
          teacherCode: 'TC123',
          department: 'CS',
          proofUrl: 'http://proof.com',
          status: 'PENDING',
          adminNote: null,
        },
        create: {
          userId: 'user-1',
          teacherCode: 'TC123',
          department: 'CS',
          proofUrl: 'http://proof.com',
          status: 'PENDING',
        },
      });
    });
  });

  describe('getMyVerification', () => {
    it('should return verification record if exists', async () => {
      mockPrisma.teacherVerification.findUnique.mockResolvedValue({ id: 'verify-1', status: 'PENDING' });
      const result = await service.getMyVerification('user-1');
      expect(result).toEqual({ id: 'verify-1', status: 'PENDING' });
    });
  });

  describe('getAdminList', () => {
    it('should return many verifications with user info', async () => {
      mockPrisma.teacherVerification.findMany.mockResolvedValue([
        { id: 'verify-1', user: { fullName: 'John Doe' } },
      ]);
      const result = await service.getAdminList();
      expect(result).toHaveLength(1);
    });
  });

  describe('reviewRequest', () => {
    it('should throw NotFoundException if verification not found', async () => {
      mockPrisma.teacherVerification.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewRequest('verify-1', { status: 'APPROVED', adminNote: 'Note' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should run database transaction and approve user as teacher', async () => {
      mockPrisma.teacherVerification.findUnique.mockResolvedValue({ id: 'verify-1', userId: 'user-1' });

      const mockTx = {
        teacherVerification: {
          update: jest.fn().mockResolvedValue({ id: 'verify-1', status: 'APPROVED' }),
        },
        user: {
          update: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
      };
      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await service.reviewRequest('verify-1', { status: 'APPROVED', adminNote: ' Approved ' });

      expect(result.message).toBe('Đã phe duyệt yêu cầu Xác Thực Giảng Viên.');
      expect(mockTx.teacherVerification.update).toHaveBeenCalledWith({
        where: { id: 'verify-1' },
        data: { status: 'APPROVED', adminNote: 'Approved' },
      });
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'TEACHER' },
      });
    });

    it('should run database transaction and reject verification without changing role', async () => {
      mockPrisma.teacherVerification.findUnique.mockResolvedValue({ id: 'verify-1', userId: 'user-1' });

      const mockTx = {
        teacherVerification: {
          update: jest.fn().mockResolvedValue({ id: 'verify-1', status: 'REJECTED' }),
        },
        user: {
          update: jest.fn(),
        },
      };
      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await service.reviewRequest('verify-1', { status: 'REJECTED', adminNote: ' Rejected ' });

      expect(result.message).toBe('Đã từ chối yêu cầu Xác Thực Giảng Viên.');
      expect(mockTx.teacherVerification.update).toHaveBeenCalledWith({
        where: { id: 'verify-1' },
        data: { status: 'REJECTED', adminNote: 'Rejected' },
      });
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });
  });

  describe('uploadProofImage', () => {
    it('should call Supabase uploadToSupabase', async () => {
      mockSupabase.uploadToSupabase.mockResolvedValue('proof-url');
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'proof.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.uploadProofImage(mockFile);
      expect(result).toBe('proof-url');
      expect(mockSupabase.uploadToSupabase).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname,
        mockFile.mimetype,
      );
    });
  });
});
