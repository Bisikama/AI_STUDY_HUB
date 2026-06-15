import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GetExploreQueryDto } from './dto/getExploreQuery.dto';
import { ExploreDocumentItem } from './types/exploreDocumentItem.type';

@Injectable()
export class ExploreService {
  constructor(private readonly prisma: PrismaService) {}

  async getExploreDocuments(query: GetExploreQueryDto): Promise<ExploreDocumentItem[]> {
    const search = query?.search?.trim();

    const documents = await this.prisma.document.findMany({
      where: {
        status: 'APPROVED',
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  subject: {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  subject: {
                    code: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        subject: true,
        summary: true,
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

    return documents.map((document): ExploreDocumentItem => {
      return {
        id: document.id,
        title: document.title,
        description: document.description,
        subject: {
          id: document.subject.id,
          name: document.subject.name,
          code: document.subject.code,
        },
        fileUrl: document.fileUrl,
        previewUrl: document.previewUrl,
        fileType: document.fileType,
        fileSize: document.fileSize.toString(),
        downloadCount: document.downloadCount,
        viewCount: document.viewCount,
        quizCount: document._count.quizzes,
        hasSummary: document.summary !== null,
        createdAt: document.createdAt,
      };
    });
  }

  async getDocumentAiCache(documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        status: 'APPROVED',
      },
      include: {
        subject: true,
        summary: true,
        quizzes: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        subject: {
          id: document.subject.id,
          name: document.subject.name,
          code: document.subject.code,
        },
        fileUrl: document.fileUrl,
        previewUrl: document.previewUrl,
        fileType: document.fileType,
        fileSize: document.fileSize.toString(),
        downloadCount: document.downloadCount,
        viewCount: document.viewCount,
        createdAt: document.createdAt,
      },

      // Schema hiện tại là 1 document có 1 summary: summary DocumentSummary?
      // Nhưng task yêu cầu FE nhận mảng summaries, nên mình trả dạng array.
      summaries: document.summary ? [document.summary] : [],

      quizzes: document.quizzes,
    };
  }
}
