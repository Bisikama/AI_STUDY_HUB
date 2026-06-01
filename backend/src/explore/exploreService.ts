import { Injectable } from '@nestjs/common';
import { DocumentStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetExploreQueryDto } from './dto/getExploreQuery.dto';
import { ExploreDocumentItem } from './types/exploreDocumentItem.type';

@Injectable()
export class ExploreService {
  constructor(private readonly prismaService: PrismaService) {}

  async getExploreDocuments(query: GetExploreQueryDto): Promise<ExploreDocumentItem[]> {
    const search = query.search?.trim();

    const documents = await this.prismaService.document.findMany({
      where: {
        status: DocumentStatus.AVAILABLE,
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
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        previewUrl: true,
        fileType: true,
        fileSize: true,
        downloadCount: true,
        viewCount: true,
        createdAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        summary: {
          select: {
            id: true,
          },
        },
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

    return documents.map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
      subject: document.subject,
      fileUrl: document.fileUrl,
      previewUrl: document.previewUrl,
      fileType: document.fileType,
      fileSize: document.fileSize.toString(),
      downloadCount: document.downloadCount,
      viewCount: document.viewCount,
      quizCount: document._count.quizzes,
      hasSummary: Boolean(document.summary),
      createdAt: document.createdAt,
    }));
  }
}
