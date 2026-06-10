import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  // Inject PrismaService vào để đấm query database
  constructor(private readonly prisma: PrismaService) {}

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
      // 1. Đếm tổng số lượng user[cite: 1]
      const totalUsers = await this.prisma.user.count();

      // 2. Đếm tổng số lượng tài liệu học thuật[cite: 1]
      const totalDocuments = await this.prisma.document.count();

      // 3. Sử dụng aggregate tính tổng dung lượng (cột fileSize kiểu BigInt)[cite: 1]
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

  async approveOrRejectDoc(docId: string, status: 'AVAILABLE' | 'FAILED') {
    try {
      const dbStatus = status === 'AVAILABLE' ? 'APPROVED' : 'PRIVATE';

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
        document: this.sanitizeData(updatedDoc), // Trả về document đã được sanitize để convert BigInt về Number nếu có
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Lỗi khi phê duyệt/từ chối document:', error);
      throw new InternalServerErrorException('Không thể cập nhật trạng thái document');
    }
  }
}
