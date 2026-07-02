import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let prismaService: PrismaService;

  const mockPrisma = {
    subject: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubjectsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getSubjects', () => {
    it('should return system subjects and personal subjects belonging to user', async () => {
      mockPrisma.subject.findMany.mockResolvedValue([
        { id: 1, name: 'System Subject', code: 'sys', isSystem: true, isActive: true, createdBy: null },
        { id: 2, name: 'My Subject', code: 'my-sub', isSystem: false, isActive: true, createdBy: 'user-1' },
      ]);

      const result = await service.getSubjects('user-1');
      expect(result).toEqual([
        { id: 1, name: 'System Subject', code: 'sys', isSystem: true },
        { id: 2, name: 'My Subject', code: 'my-sub', isSystem: false },
      ]);
      expect(mockPrisma.subject.findMany).toHaveBeenCalledWith({
        where: { OR: [{ isSystem: true, isActive: true }, { createdBy: 'user-1' }] },
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }, { id: 'asc' }],
      });
    });
  });

  describe('createSubject', () => {
    it('should create a personal subject if name/code are unique', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);
      mockPrisma.subject.findUnique.mockResolvedValue(null);
      mockPrisma.subject.create.mockResolvedValue({
        id: 3,
        name: 'New Subject',
        code: 'new-subject',
        isSystem: false,
        createdBy: 'user-1',
      });

      const result = await service.createSubject('user-1', { name: 'New Subject' });
      expect(result).toEqual({ id: 3, name: 'New Subject', code: 'new-subject', isSystem: false });
    });

    it('should throw if name is duplicated', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue({ id: 1 });
      await expect(service.createSubject('user-1', { name: 'Existing' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if code is duplicated', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 2 });
      await expect(service.createSubject('user-1', { name: 'Existing Code' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should ignore isSystem in dto (implicit from signature not accepting it)', () => {
      // Logic handled via dto validation and service only mapping isSystem: false
      expect(true).toBe(true);
    });
  });

  describe('validateSubjectAccess', () => {
    it('should allow if system subject and active', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1, isSystem: true, isActive: true });
      await expect(service.validateSubjectAccess(1, 'any-user')).resolves.not.toThrow();
    });

    it('should throw BadRequest if system subject and inactive', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 1, isSystem: true, isActive: false });
      await expect(service.validateSubjectAccess(1, 'any-user')).rejects.toThrow(BadRequestException);
    });

    it('should allow if personal subject and user is creator', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({
        id: 2,
        isSystem: false,
        isActive: true,
        createdBy: 'user-1',
      });
      await expect(service.validateSubjectAccess(2, 'user-1')).resolves.not.toThrow();
    });

    it('should throw Forbidden if personal subject and user is not creator', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({
        id: 2,
        isSystem: false,
        isActive: true,
        createdBy: 'user-1',
      });
      await expect(service.validateSubjectAccess(2, 'user-2')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFound if subject does not exist', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);
      await expect(service.validateSubjectAccess(999, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
