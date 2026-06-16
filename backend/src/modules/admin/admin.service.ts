import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { DocumentStatus } from '../../../generated/prisma';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
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
   * Lấy danh sách tài liệu đang chờ duyệt (status = PENDING)
   * Dùng cho bảng hàng đợi phê duyệt trong Admin Dashboard
   */
  async getPendingDocuments() {
    try {
      const documents = await this.prisma.document.findMany({
        where: { status: DocumentStatus.PENDING },
        include: {
          subject: {
            select: { id: true, name: true, code: true },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' }, // File nào chờ lâu nhất hiện trước
      });

      return this.sanitizeData(documents);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tài liệu PENDING:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách tài liệu chờ duyệt');
    }
  }

  async approveOrRejectDoc(docId: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const dbStatus = status === 'APPROVED' ? DocumentStatus.APPROVED : DocumentStatus.PRIVATE;

      const document = await this.prisma.document.findUnique({
        where: { id: docId },
      });

      if (!document) {
        throw new NotFoundException('Không tìm thấy tài liệu với ID đã cho');
      }

      const updatedDoc = await this.prisma.document.update({
        where: { id: docId },
        data: {
          status: dbStatus,
        },
      });

      return {
        success: true,
        message: `Tài liệu đã được cập nhật trạng thái thành ${status}`,
        document: this.sanitizeData(updatedDoc),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
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
      await this.prisma.document.delete({
        where: { id: docId },
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
}
