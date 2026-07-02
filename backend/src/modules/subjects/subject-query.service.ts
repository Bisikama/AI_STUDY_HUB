import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SubjectQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * INTERNAL QUERY: Get Eligible Public Subjects
   * Returns system subjects that have at least one eligible document
   * (PUBLIC + ACTIVE + READY extraction + READY AI)
   */
  async getEligiblePublicSubjects() {
    const subjects = await this.prisma.subject.findMany({
      where: {
        isSystem: true,
        documents: {
          some: {
            visibilityStatus: 'PUBLIC',
            deletionStatus: 'ACTIVE',
            extractionStatus: 'READY',
            aiStatus: 'READY',
          },
        },
      },
      include: {
        _count: {
          select: {
            documents: {
              where: {
                visibilityStatus: 'PUBLIC',
                deletionStatus: 'ACTIVE',
                extractionStatus: 'READY',
                aiStatus: 'READY',
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      documentCount: s._count.documents,
    }));
  }
}
