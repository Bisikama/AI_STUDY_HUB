import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CheckQuizAnswerDto } from './dto/checkQuizAnswer.dto';
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
        status: 'ACTIVE',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        deletedAt: null,
        subject: {
          isSystem: true,
          isActive: true,
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
        subject: {
          include: {
            majors: {
              include: {
                major: true,
              },
            },
          },
        },
        summary: true,
        _count: {
          select: {
            quizzes: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
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
          majors: document.subject.majors.map((item) => ({
            code: item.major.code,
            name: item.major.name,
          })),
        },
        fileType: document.fileType,
        fileSize: document.fileSize.toString(),
        downloadCount: document.downloadCount,
        viewCount: document.viewCount,
        averageRating: Number(document.averageRating ?? 0),
        ratingCount: document.ratingCount,
        quizCount: document._count.quizzes,
        hasSummary: document.summary !== null,
        uploader: {
          id: document.user.id,
          fullName: document.user.fullName,
          role: document.user.role,
          isTeacher: document.user.role === 'TEACHER',
        },
        createdAt: document.createdAt,
        copyrightSourceType: document.copyrightSourceType,
        copyrightAuthorName: document.copyrightAuthorName,
        copyrightSourceUrl: document.copyrightSourceUrl,
        copyrightLicense: document.copyrightLicense,
        copyrightAttribution: document.copyrightAttribution,
      };
    });
  }

  async getDocumentAiCache(documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        visibilityStatus: 'PUBLIC',
        status: 'ACTIVE',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        deletedAt: null,
        subject: {
          isSystem: true,
          isActive: true,
        },
      },
      include: {
        subject: {
          include: {
            majors: {
              include: {
                major: true,
              },
            },
          },
        },
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
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
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
          majors: document.subject.majors.map((item) => ({
            code: item.major.code,
            name: item.major.name,
          })),
        },
        fileType: document.fileType,
        fileSize: document.fileSize.toString(),
        downloadCount: document.downloadCount,
        viewCount: document.viewCount,
        uploader: {
          id: document.user.id,
          fullName: document.user.fullName,
          role: document.user.role,
          isTeacher: document.user.role === 'TEACHER',
        },
        createdAt: document.createdAt,
        copyrightSourceType: document.copyrightSourceType,
        copyrightAuthorName: document.copyrightAuthorName,
        copyrightSourceUrl: document.copyrightSourceUrl,
        copyrightLicense: document.copyrightLicense,
        copyrightAttribution: document.copyrightAttribution,
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
            isCorrect: option.isCorrect,
          })),
        })),
      })),
    };
  }

  async checkQuizAnswer(documentId: string, body: CheckQuizAnswerDto) {
    const selectedOption = await this.prisma.quizOption.findFirst({
      where: {
        id: body.selectedOptionId,
        question: {
          quiz: {
            id: body.quizId,
            documentId,
            document: {
              visibilityStatus: 'PUBLIC',
              status: 'ACTIVE',
              deletionStatus: 'ACTIVE',
              extractionStatus: 'READY',
              aiStatus: 'READY',
              deletedAt: null,
              subject: {
                isSystem: true,
                isActive: true,
              },
            },
          },
        },
      },
      include: {
        question: {
          include: {
            options: {
              where: {
                isCorrect: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!selectedOption) {
      throw new NotFoundException('Quiz option not found');
    }

    const correctOptionId = selectedOption.question.options[0]?.id;

    if (!correctOptionId) {
      throw new NotFoundException('Correct option not found');
    }

    return {
      quizId: body.quizId,
      questionId: selectedOption.questionId,
      selectedOptionId: selectedOption.id,
      isCorrect: selectedOption.isCorrect,
      correctOptionId,
    };
  }
}
