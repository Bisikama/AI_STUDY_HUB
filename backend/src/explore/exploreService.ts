import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetExploreQueryDto } from './dto/getExploreQuery.dto';
import { ExploreDocumentItem } from './types/exploreDocumentItem.type';

@Injectable()
export class ExploreService {
  constructor(private readonly prismaService: PrismaService) {}

  async getExploreDocuments(query: GetExploreQueryDto): Promise<ExploreDocumentItem[]> {
    const keyword = query.search?.trim();

    const documents = await this.prismaService.document.findMany({
      where: {
        status: 'AVAILABLE',
        ...(keyword
          ? {
              OR: [
                {
                  title: {
                    contains: keyword,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  description: {
                    contains: keyword,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  subject: {
                    is: {
                      name: {
                        contains: keyword,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                },
                {
                  subject: {
                    is: {
                      code: {
                        contains: keyword,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        subject: true,
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents
      .filter((document) => document.subject !== null)
      .map((document): ExploreDocumentItem => {
        return {
          id: document.id,
          title: document.title,
          description: document.description,
          subject: {
            id: document.subject!.id,
            name: document.subject!.name,
            code: document.subject!.code,
          },
          fileUrl: document.fileUrl,
          previewUrl: document.previewUrl,
          fileType: document.fileType,
          fileSize: document.fileSize.toString(),
          downloadCount: document.downloadCount,
          viewCount: document.viewCount,
          quizCount: document._count.quizzes,
          hasSummary: false,
          createdAt: document.createdAt,
        };
      });
  }
}
