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
        visibilityStatus: 'PUBLIC',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        deletedAt: null,
        subject: {
          isSystem: true,
        },
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
        visibilityStatus: 'PUBLIC',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        deletedAt: null,
        subject: {
          isSystem: true,
        },
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
        fileType: document.fileType,
        fileSize: document.fileSize.toString(),
        downloadCount: document.downloadCount,
        viewCount: document.viewCount,
        createdAt: document.createdAt,
      },

      summaries: document.summary ? [document.summary] : [],

      quizzes: document.quizzes.map((quiz) => ({
        id: quiz.id,
        documentId: quiz.documentId,
        createdBy: quiz.createdBy,
        title: quiz.title,
        createdAt: quiz.createdAt,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          quizId: question.quizId,
          questionText: question.questionText,
          createdAt: question.createdAt,
          options: question.options.map((option) => ({
            id: option.id,
            questionId: option.questionId,
            optionText: option.optionText,
            createdAt: option.createdAt,
          })),
        })),
      })),
    };
  }
}
