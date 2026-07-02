import { Test, TestingModule } from '@nestjs/testing';
import { PersonalFoldersService } from './personal-folders.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

describe('PersonalFoldersService', () => {
  let service: PersonalFoldersService;
  let prisma: PrismaService;

  const mockPrisma = {
    personalFolder: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    document: {
      count: jest.fn(),
    }
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalFoldersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PersonalFoldersService>(PersonalFoldersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createFolder', () => {
    it('should throw if depth > 3', async () => {
      mockPrisma.personalFolder.findUnique.mockImplementation(({ where: { id } }) => {
        if (id === 'parent1') return Promise.resolve({ id: 'parent1', parentId: 'parent2', ownerId: 'user-1' });
        if (id === 'parent2') return Promise.resolve({ id: 'parent2', parentId: 'parent3', ownerId: 'user-1' });
        if (id === 'parent3') return Promise.resolve({ id: 'parent3', parentId: null, ownerId: 'user-1' });
        return Promise.resolve(null);
      });
      
      await expect(service.createFolder('user-1', { name: 'f1', parentId: 'parent1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateFolder', () => {
    it('should throw NotFound if user is not owner', async () => {
      mockPrisma.personalFolder.findUnique.mockResolvedValue({ id: 'folder-1', ownerId: 'user-2' });
      await expect(service.updateFolder('user-1', 'folder-1', { name: 'new' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequest for cycle creation', async () => {
      mockPrisma.personalFolder.findUnique.mockImplementation(({ where: { id } }) => {
        if (id === 'folder-1') return Promise.resolve({ id: 'folder-1', ownerId: 'user-1', parentId: null });
        if (id === 'parent-1') return Promise.resolve({ id: 'parent-1', ownerId: 'user-1', parentId: 'folder-1' });
        return Promise.resolve(null);
      });
      
      await expect(service.updateFolder('user-1', 'folder-1', { parentId: 'parent-1' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFolder', () => {
    it('should throw NotFound if not owner', async () => {
      mockPrisma.personalFolder.findUnique.mockResolvedValue({ id: 'folder-1', ownerId: 'user-2', _count: { documents: 0, children: 0 } });
      await expect(service.deleteFolder('user-1', 'folder-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw Conflict if folder has children', async () => {
      mockPrisma.personalFolder.findUnique.mockResolvedValue({ id: 'folder-1', ownerId: 'user-1', _count: { documents: 0, children: 1 } });
      await expect(service.deleteFolder('user-1', 'folder-1')).rejects.toThrow(ConflictException);
    });

    it('should throw Conflict if folder has documents', async () => {
      mockPrisma.personalFolder.findUnique.mockResolvedValue({ id: 'folder-1', ownerId: 'user-1', _count: { documents: 1, children: 0 } });
      await expect(service.deleteFolder('user-1', 'folder-1')).rejects.toThrow(ConflictException);
    });
  });
});
