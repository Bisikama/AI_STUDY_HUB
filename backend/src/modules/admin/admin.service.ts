import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  DocumentStatus,
  VisibilityStatus,
  ReportStatus,
  ReportReason,
  DeletionStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GetAdminQuizzesQueryDto, UpdateQuestionDto } from './dto/admin-quiz.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}
  // Helper function để convert BigInt → Number
  private sanitizeData<T>(data: unknown): T {
    if (data === null || data === undefined) return data as unknown as T;
    if (typeof data === 'bigint') return Number(data) as unknown as T;
    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.sanitizeData<unknown>(item)) as unknown as T;
    }
    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(obj)) {
        copy[key] = this.sanitizeData<unknown>(obj[key]);
      }
      return copy as unknown as T;
    }
    return data as T;
  }

  async getSystemMetrics() {
    try {
      // 1. Đếm tổng số lượng user
      const totalUsers = await this.prisma.user.count();

      // 2. Đếm tổng số lượng tài liệu học thuật
      const totalDocuments = await this.prisma.document.count();

      // 3. Sử dụng aggregate tính tổng dung lượng (cột fileSize kiểu BigInt)
      const storageAggregation = await this.prisma.document.aggregate({
        _sum: {
          fileSize: true,
        },
      });

      // Nếu db trống chưa có file nào, tổng sum trả về null -> gán mặc định bằng BigInt(0)
      const totalStorageBigInt = storageAggregation._sum.fileSize || BigInt(0);

      // Trả về đúng 3 con số tổng như Nghiệm thu (DoD) yêu cầu
      return {
        totalUsers,
        totalDocuments,
        // Ép từ BigInt về Number để tránh lỗi "Do not know how to serialize a BigInt" khi chuyển thành JSON
        totalStorage: Number(totalStorageBigInt),
      };
    } catch (error) {
      console.error('Lỗi vận hành API Admin Metrics:', error);
      throw new InternalServerErrorException('Không thể truy xuất số liệu hệ thống lúc này');
    }
  }

  /**
   * Lấy danh sách toàn bộ người dùng trong hệ thống
   * Dùng cho bảng User Management trong Admin Overview
   */
  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { documents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách user:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách người dùng');
    }
  }

  /**
   * Lấy danh sách tài liệu đang chờ duyệt (status = PENDING)
   * Dùng cho bảng hàng đợi phê duyệt trong Admin Dashboard
   * Chỉ lấy các tài liệu có visibilityStatus = PENDING_REVIEW, deletionStatus = ACTIVE và status = ACTIVE
   */
  async getPendingDocuments() {
    try {
      const documents = await this.prisma.document.findMany({
        where: {
          visibilityStatus: VisibilityStatus.PENDING_REVIEW,
          deletionStatus: DeletionStatus.ACTIVE,
          status: DocumentStatus.ACTIVE,
        },
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          fileSize: true,
          fileType: true,
          status: true,
          visibilityStatus: true,
          fullText: true, // nội dung text đầy đủ để admin review
          createdAt: true,
          fileHash: true,
          copyrightSourceType: true,
          copyrightAuthorName: true,
          copyrightDeclaredAt: true,
          subject: {
            select: { id: true, name: true, code: true },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' }, // File nào chờ lâu nhất hiện trước
      });

      const enrichedDocs = await Promise.all(
        documents.map(async (doc) => {
          let duplicateSource: any = null;
          if (doc.fileHash) {
            duplicateSource = await this.prisma.document.findFirst({
              where: {
                fileHash: doc.fileHash,
                id: { not: doc.id },
                visibilityStatus: VisibilityStatus.PUBLIC,
                status: DocumentStatus.ACTIVE,
              },
              select: {
                id: true,
                title: true,
                createdAt: true,
                user: {
                  select: { fullName: true, email: true },
                },
              },
            });
          }

          return {
            ...doc,
            isDuplicateDetected: !!duplicateSource,
            duplicateSourceInfo: duplicateSource
              ? {
                  id: duplicateSource.id,
                  title: duplicateSource.title,
                  author: duplicateSource.user.fullName,
                  email: duplicateSource.user.email,
                  createdAt: duplicateSource.createdAt,
                }
              : null,
          };
        }),
      );

      return this.sanitizeData(enrichedDocs);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tài liệu PENDING:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách tài liệu chờ duyệt');
    }
  }

  private checkCopyrightEligibility(document: any): { isEligible: boolean; reason?: string } {
    switch (document.copyrightSourceType) {
      case 'OWN_ORIGINAL':
        if (!document.copyrightDeclaredAt || document.copyrightDeclaredBy !== document.uploadedBy) {
          return { isEligible: false, reason: 'Thiếu thông tin tuyên bố bản quyền của tác giả chính chủ.' };
        }
        return { isEligible: true };
      case 'OPEN_LICENSE':
        if (!document.copyrightSourceUrl || !document.copyrightLicense || !document.copyrightAttribution) {
          return { isEligible: false, reason: 'Thông tin bản quyền mở (Open License) không đầy đủ (thiếu URL nguồn, Giấy phép hoặc Tác quyền).' };
        }
        return { isEligible: true };
      case 'AUTHORIZED':
        if (!document.copyrightPermissionReference) {
          return { isEligible: false, reason: 'Thiếu thông tin tham chiếu quyền cho phép của bên sở hữu.' };
        }
        return { isEligible: true };
      case 'FPT_OFFICIAL':
        if (!document.copyrightSourceUrl && !document.copyrightPermissionReference) {
          return { isEligible: false, reason: 'Thông tin tài liệu FPT Official không đầy đủ (thiếu URL nguồn hoặc Tham chiếu quyền).' };
        }
        return { isEligible: true };
      case 'THIRD_PARTY':
      case 'UNKNOWN':
      default:
        return { isEligible: false, reason: 'Nguồn gốc bản quyền không được phép chia sẻ công khai.' };
    }
  }

  async approveOrRejectDoc(
    docId: string,
    status: 'APPROVED' | 'REJECTED',
    adminId?: string,
    rejectReason?: string,
  ) {
    try {
      const dbStatus = status === 'APPROVED' ? VisibilityStatus.PUBLIC : VisibilityStatus.PRIVATE;

      const document = await this.prisma.document.findUnique({
        where: { id: docId },
        include: {
          subject: true,
          summary: true,
          quizzes: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!document) {
        throw new NotFoundException('Không tìm thấy tài liệu với ID đã cho');
      }

      if (document.visibilityStatus !== VisibilityStatus.PENDING_REVIEW) {
        throw new BadRequestException('Tài liệu không ở trạng thái chờ duyệt (PENDING_REVIEW).');
      }

      if (status === 'APPROVED') {
        // 1. AI READY
        if (document.aiStatus !== 'READY') {
          throw new BadRequestException('Tài liệu chưa hoàn tất AI Analyze (Trạng thái AI: ' + document.aiStatus + ').');
        }

        // 2. Summary + Quiz tồn tại và hợp lệ
        if (!document.summary) {
          throw new BadRequestException('Tài liệu thiếu thông tin tóm tắt nội dung (Summary) của AI.');
        }
        if (!document.quizzes || document.quizzes.length === 0) {
          throw new BadRequestException('Tài liệu chưa có bộ câu hỏi (Quiz) ôn tập của AI.');
        }
        const hasQuestions = document.quizzes.some((q) => q.questions && q.questions.length > 0);
        if (!hasQuestions) {
          throw new BadRequestException('Bộ câu hỏi Quiz của tài liệu phải có ít nhất một câu hỏi.');
        }

        // 3. Copyright hợp lệ
        const copyright = this.checkCopyrightEligibility(document);
        if (!copyright.isEligible) {
          throw new BadRequestException(`Vi phạm điều kiện bản quyền: ${copyright.reason}`);
        }

        // 4. Course system + active
        if (!document.subject?.isSystem || !document.subject?.isActive) {
          throw new BadRequestException('Học phần liên kết không hợp lệ, không thuộc hệ thống hoặc đang bị khóa.');
        }

        // 5. Document chưa soft delete, hidden hoặc removed
        if (document.deletionStatus !== DeletionStatus.ACTIVE || document.status !== DocumentStatus.ACTIVE) {
          throw new BadRequestException('Không thể duyệt tài liệu đã bị xóa tạm, bị ẩn hoặc gỡ bỏ.');
        }

        // Cập nhật trạng thái
        const updatedDoc = await this.prisma.document.update({
          where: { id: docId },
          data: {
            visibilityStatus: dbStatus,
          },
        });

        // Ghi log vận hành (Audit Log)
        this.logger.log(`[AUDIT] Admin ${adminId || 'System'} APPROVED document ${docId}`);

        return {
          success: true,
          message: `Tài liệu đã được phê duyệt thành công (PUBLIC).`,
          document: this.sanitizeData(updatedDoc),
        };
      } else {
        // REJECTED flow
        const updatedDoc = await this.prisma.document.update({
          where: { id: docId },
          data: {
            visibilityStatus: dbStatus,
            rejectReason: rejectReason || null,
          },
        });

        // Tạo thông báo hệ thống trực tiếp trên web
        await this.notificationsService.create(
          updatedDoc.uploadedBy,
          'Yêu cầu chia sẻ tài liệu bị từ chối',
          `Yêu cầu chia sẻ công khai tài liệu "${updatedDoc.title}" đã bị từ chối. Lý do: ${rejectReason || 'Không có lý do cụ thể'}`,
        );

        // Ghi log vận hành (Audit Log) với lý do từ chối
        this.logger.log(
          `[AUDIT] Admin ${adminId || 'System'} REJECTED document ${docId}. Lý do: ${rejectReason || 'Không có lý do cụ thể'}`,
        );

        return {
          success: true,
          message: `Tài liệu đã bị từ chối phê duyệt (đưa về trạng thái PRIVATE).`,
          document: this.sanitizeData(updatedDoc),
        };
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Lỗi khi phê duyệt/từ chối document:', error);
      throw new InternalServerErrorException('Không thể cập nhật trạng thái document');
    }
  }

  /**
   * Xóa vật lý tài liệu: xóa file trên Supabase Storage trước,
   * sau đó mới xóa record trong DB (kéo theo Summary, Quiz theo Cascade).
   * Quan trọng: PHẢI xóa Cloud trước — nếu làm ngược lại mà Cloud lỗi
   * thì DB sạch nhưng file rác vẫn còn trên Storage tốn tiền mãi mãi.
   */
  async forceDeleteDocument(docId: string) {
    // 1. Tìm document trong DB, lấy fileUrl để biết đường dẫn trên Supabase
    const document = await this.prisma.document.findUnique({
      where: { id: docId },
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy tài liệu với ID đã cho');
    }

    // 2. Xóa file vật lý trên Supabase Storage trước
    try {
      await this.supabaseService.deleteFromSupabase(document.fileUrl);
    } catch (error) {
      console.error('Lỗi khi xóa file trên Supabase Storage:', error);
      throw new InternalServerErrorException(
        `Không thể xóa file trên Cloud Storage: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 3. Chỉ sau khi Cloud xóa thành công mới xóa record trong DB
    // Prisma Cascade tự động xóa DocumentSummary, Quiz, QuizQuestion, QuizOption liên quan
    try {
      await this.prisma.$transaction(async (tx: any) => {
        await tx.document.delete({
          where: { id: docId },
        });

        if (document.fileSize != null) {
          if (document.deletionStatus === 'ACTIVE') {
            await tx.userStorageUsage.updateMany({
              where: { userId: document.uploadedBy },
              data: { usedBytes: { decrement: document.fileSize } },
            });
          } else {
            await tx.userStorageUsage.updateMany({
              where: { userId: document.uploadedBy },
              data: { trashBytes: { decrement: document.fileSize } },
            });
          }
        }
      });
    } catch (error) {
      console.error('Lỗi khi xóa document trong DB:', error);
      throw new InternalServerErrorException(
        `File đã xóa trên Cloud nhưng xóa DB thất bại, cần kiểm tra thủ công: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      success: true,
      message: 'Tài liệu đã được xóa hoàn toàn khỏi hệ thống',
    };
  }

  async getQuizzes(query: GetAdminQuizzesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const subjectId = query.subjectId;

    const where: any = {
      ...(subjectId ? { document: { subjectId } } : {}),
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
                document: {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };

    try {
      const [quizzes, totalItems] = await Promise.all([
        this.prisma.quiz.findMany({
          where,
          include: {
            document: {
              select: {
                id: true,
                title: true,
                subject: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
            user: {
              select: { id: true, fullName: true, email: true },
            },
            _count: {
              select: { questions: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.quiz.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: this.sanitizeData(quizzes),
        totalItems,
        totalPages,
        page,
        limit,
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quiz:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách bộ câu hỏi');
    }
  }

  async getQuizById(id: string) {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id },
        include: {
          document: {
            select: { id: true, title: true },
          },
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Không tìm thấy bộ câu hỏi với ID đã cho');
      }

      return this.sanitizeData(quiz);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Lỗi khi lấy chi tiết quiz:', error);
      throw new InternalServerErrorException('Không thể lấy chi tiết bộ câu hỏi');
    }
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    try {
      const question = await this.prisma.quizQuestion.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new NotFoundException('Không tìm thấy câu hỏi với ID đã cho');
      }

      // Nếu có cập nhật options, kiểm tra xem có đúng 1 đáp án chính xác không
      if (dto.options) {
        const correctCount = dto.options.filter((opt) => opt.isCorrect).length;
        if (correctCount !== 1) {
          throw new BadRequestException('Mỗi câu hỏi phải có chính xác một đáp án đúng');
        }
      }

      const updatedQuestion = await this.prisma.$transaction(async (tx) => {
        // Cập nhật text của câu hỏi
        if (dto.questionText !== undefined) {
          await tx.quizQuestion.update({
            where: { id: questionId },
            data: { questionText: dto.questionText },
          });
        }

        // Cập nhật các options
        if (dto.options) {
          for (const opt of dto.options) {
            await tx.quizOption.update({
              where: { id: opt.id },
              data: {
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              },
            });
          }
        }

        return tx.quizQuestion.findUnique({
          where: { id: questionId },
          include: { options: true },
        });
      });

      return this.sanitizeData(updatedQuestion);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Lỗi khi cập nhật câu hỏi:', error);
      throw new InternalServerErrorException('Không thể cập nhật câu hỏi');
    }
  }

  async deleteQuiz(id: string) {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id },
      });

      if (!quiz) {
        throw new NotFoundException('Không tìm thấy bộ câu hỏi với ID đã cho');
      }

      await this.prisma.$transaction(async (tx) => {
        // Xóa quiz (Cascade delete sẽ tự động xóa QuizQuestion, QuizOption, UserQuizAttempt liên quan)
        await tx.quiz.delete({
          where: { id },
        });

        // Cập nhật lại cờ isAIGenerated của Document gốc về false
        await tx.document.update({
          where: { id: quiz.documentId },
          data: { isAIGenerated: false },
        });
      });

      return {
        success: true,
        message: 'Bộ câu hỏi đã được xóa thành công',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Lỗi khi xóa bộ câu hỏi:', error);
      throw new InternalServerErrorException('Không thể xóa bộ câu hỏi');
    }
  }

  async getQuizAnalytics(id: string) {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id },
        include: {
          document: {
            select: { id: true, title: true },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Không tìm thấy bộ câu hỏi với ID đã cho');
      }

      const attempts = await this.prisma.userQuizAttempt.findMany({
        where: { quizId: id },
      });

      const totalAttempts = attempts.length;
      const averageScore =
        totalAttempts > 0
          ? Number((attempts.reduce((sum, item) => sum + item.score, 0) / totalAttempts).toFixed(2))
          : 0;

      return {
        quizId: quiz.id,
        quizTitle: quiz.title,
        documentTitle: quiz.document.title,
        totalAttempts,
        averageScore,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Lỗi khi lấy thống kê quiz:', error);
      throw new InternalServerErrorException('Không thể lấy thống kê bộ câu hỏi');
    }
  }

  async getReports(query: {
    status?: any;
    reason?: any;
    documentId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.reason) {
      where.reason = query.reason;
    }
    if (query.documentId) {
      where.documentId = query.documentId;
    }

    try {
      const [reports, totalItems] = await Promise.all([
        this.prisma.documentReport.findMany({
          where,
          include: {
            document: {
              select: {
                id: true,
                title: true,
                status: true,
                visibilityStatus: true,
                uploadedBy: true,
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            reporter: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.documentReport.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: this.sanitizeData(reports),
        totalItems,
        totalPages,
        page,
        limit,
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách báo cáo:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách báo cáo');
    }
  }

  async getReportDetails(reportId: string) {
    try {
      const report = await this.prisma.documentReport.findUnique({
        where: { id: reportId },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              status: true,
              visibilityStatus: true,
              uploadedBy: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      if (!report) {
        throw new NotFoundException('Không tìm thấy báo cáo.');
      }

      return this.sanitizeData(report);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Lỗi khi lấy chi tiết báo cáo:', error);
      throw new InternalServerErrorException('Không thể lấy chi tiết báo cáo');
    }
  }

  async updateReport(reportId: string, adminId: string, dto: ResolveReportDto) {
    const report = await this.prisma.documentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo.');
    }

    try {
      const updatedReport = await this.prisma.$transaction(async (tx) => {
        // 1. Update this report
        const rep = await tx.documentReport.update({
          where: { id: reportId },
          data: {
            status: dto.status,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            adminNote: dto.adminNote?.trim() || null,
          },
          include: {
            document: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        });

        // 2. If rejected
        if (dto.status === 'REJECTED') {
          // Check if there are other pending/reviewing reports for this document
          const otherActiveReportsCount = await tx.documentReport.count({
            where: {
              documentId: report.documentId,
              id: { not: reportId },
              status: {
                in: ['PENDING', 'REVIEWING'],
              },
            },
          });

          // If no active reports left, and document is UNDER_REVIEW, restore it to ACTIVE
          if (otherActiveReportsCount === 0) {
            const doc = await tx.document.findUnique({
              where: { id: report.documentId },
              select: { status: true },
            });
            if (doc && doc.status === 'UNDER_REVIEW') {
              await tx.document.update({
                where: { id: report.documentId },
                data: { status: 'ACTIVE' },
              });
            }
          }
        }

        // 3. If resolved and documentStatus is provided
        if (dto.status === 'RESOLVED' && dto.documentStatus) {
          const doc = await tx.document.update({
            where: { id: report.documentId },
            data: {
              status: dto.documentStatus,
            },
            include: {
              user: true,
            },
          });

          // If documentStatus is HIDDEN or REMOVED, auto resolve all other active reports
          if (dto.documentStatus === 'HIDDEN' || dto.documentStatus === 'REMOVED') {
            // Auto ban/demote the teacher if banTeacher is true OR if it's set by default
            const shouldBan = dto.banTeacher !== undefined ? dto.banTeacher : true;
            if (shouldBan && doc.user.role === 'TEACHER') {
              await tx.user.update({
                where: { id: doc.uploadedBy },
                data: {
                  role: 'STUDENT',
                  isTeacherBanned: true,
                },
              });

              await tx.teacherVerification.updateMany({
                where: { userId: doc.uploadedBy },
                data: {
                  status: 'REJECTED',
                  adminNote:
                    'Tự động bị hạ quyền và chặn đăng ký Giảng viên do vi phạm điều khoản (tài liệu bị báo cáo và gỡ bỏ).',
                },
              });
            }

            await tx.documentReport.updateMany({
              where: {
                documentId: report.documentId,
                id: { not: reportId },
                status: {
                  in: ['PENDING', 'REVIEWING'],
                },
              },
              data: {
                status: 'RESOLVED',
                reviewedBy: adminId,
                reviewedAt: new Date(),
                adminNote:
                  'Báo cáo được giải quyết tự động vì tài liệu đã bị ẩn hoặc gỡ bỏ bởi quản trị viên.',
              },
            });
          }
        }

        return rep;
      });

      return this.sanitizeData(updatedReport);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Lỗi khi cập nhật báo cáo:', error);
      throw new InternalServerErrorException('Không thể cập nhật báo cáo');
    }
  }

  async banTeacher(userId: string, adminNote?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    if (user.role !== 'TEACHER') {
      throw new BadRequestException('Người dùng này không có vai trò Giảng viên.');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            role: 'STUDENT',
            isTeacherBanned: true,
          },
        });

        await tx.teacherVerification.updateMany({
          where: { userId },
          data: {
            status: 'REJECTED',
            adminNote:
              adminNote?.trim() ||
              'Bị quản trị viên hạ quyền thủ công và chặn nâng quyền Giảng viên.',
          },
        });

        return updatedUser;
      });

      return this.sanitizeData(result);
    } catch (error) {
      console.error('Lỗi khi hạ quyền và chặn giảng viên:', error);
      throw new InternalServerErrorException('Không thể hạ quyền và chặn giảng viên');
    }
  }
}
