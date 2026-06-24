import { Test, TestingModule } from '@nestjs/testing';
import { SubjectQueryService } from './subject-query.service';
import { PrismaService } from '../../database/prisma.service';

describe('SubjectQueryService', () => {
  let service: SubjectQueryService;
  let prismaService: PrismaService;

  const mockPrisma = {
    subject: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectQueryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SubjectQueryService>(SubjectQueryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getEligiblePublicSubjects', () => {
    it('should return system subjects with document count', async () => {
      mockPrisma.subject.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Math',
          code: 'math',
          _count: { documents: 5 },
        },
      ]);

      const result = await service.getEligiblePublicSubjects();
      expect(result).toEqual([
        { id: 1, name: 'Math', code: 'math', documentCount: 5 },
      ]);
      expect(mockPrisma.subject.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isSystem: true,
          documents: {
            some: {
              visibilityStatus: 'PUBLIC',
              deletionStatus: 'ACTIVE',
              extractionStatus: 'READY',
              aiStatus: 'READY',
            },
          },
        }),
      }));
    });
  });
});
