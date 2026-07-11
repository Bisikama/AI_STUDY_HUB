import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private mapDocument(document: any) {
    if (!document) return null;
    return {
      id: document.id,
      title: document.title,
      description: document.description,
      subject: document.subject
        ? {
            id: document.subject.id,
            name: document.subject.name,
            code: document.subject.code,
          }
        : null,
      fileUrl: document.fileUrl,
      previewUrl: document.previewUrl,
      fileType: document.fileType,
      fileSize:
        document.fileSize !== undefined && document.fileSize !== null
          ? document.fileSize.toString()
          : '0',
      downloadCount: document.downloadCount,
      viewCount: document.viewCount,
      rating: document.averageRating ?? 0,
      quizCount: document._count?.quizzes ?? 0,
      hasSummary: document.summary !== null,
      createdAt: document.createdAt,
    };
  }

  async getDashboardData(userId: string) {
    // 1. Recently Viewed: Top 12 documents viewed by the user (matching public display status)
    const recentlyViewedRecords = await this.prisma.userDocumentView.findMany({
      where: {
        userId,
        document: {
          visibilityStatus: 'PUBLIC',
          status: 'ACTIVE',
          deletionStatus: 'ACTIVE',
          extractionStatus: 'READY',
          aiStatus: 'READY',
          deletedAt: null,
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: 12,
      include: {
        document: {
          include: {
            subject: true,
            summary: true,
            _count: {
              select: { quizzes: true },
            },
          },
        },
      },
    });

    const recentlyViewed = recentlyViewedRecords
      .map((r) => this.mapDocument(r.document))
      .filter((doc) => doc !== null);

    // 2. Public Documents from OTHER users (status APPROVED/PUBLIC & fully processed)
    const publicDocs = await this.prisma.document.findMany({
      where: {
        visibilityStatus: 'PUBLIC',
        status: 'ACTIVE',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        deletedAt: null,
        uploadedBy: { not: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        subject: true,
        summary: true,
        _count: {
          select: { quizzes: true },
        },
      },
    });

    const publicDocuments = publicDocs.map((d) => this.mapDocument(d));

    // 3. Trending: Approved documents sorted by rating desc, then viewCount desc
    const trendingDocs = await this.prisma.document.findMany({
      where: {
        visibilityStatus: 'PUBLIC',
        status: 'ACTIVE',
        deletionStatus: 'ACTIVE',
        extractionStatus: 'READY',
        aiStatus: 'READY',
        deletedAt: null,
      },
      orderBy: [{ averageRating: 'desc' }, { viewCount: 'desc' }],
      take: 5,
      include: {
        subject: true,
        summary: true,
        _count: {
          select: { quizzes: true },
        },
      },
    });

    const trending = trendingDocs.map((d) => this.mapDocument(d));

    // 4. Top Contributors: Những người đăng tải tài liệu APPROVED/PUBLIC nhiều nhất
    const contributors = await this.prisma.user.findMany({
      where: {
        documents: {
          some: {
            visibilityStatus: 'PUBLIC',
            status: 'ACTIVE',
            deletionStatus: 'ACTIVE',
            extractionStatus: 'READY',
            aiStatus: 'READY',
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        _count: {
          select: {
            documents: {
              where: {
                visibilityStatus: 'PUBLIC',
                status: 'ACTIVE',
                deletionStatus: 'ACTIVE',
                extractionStatus: 'READY',
                aiStatus: 'READY',
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    const topContributors = contributors
      .map((c) => ({
        id: c.id,
        fullName: c.fullName,
        avatarUrl: c.avatarUrl,
        uploadedCount: c._count.documents,
      }))
      .sort((a, b) => b.uploadedCount - a.uploadedCount)
      .slice(0, 10);

    return {
      recentlyViewed,
      publicDocuments,
      trending,
      topContributors,
    };
  }
}
