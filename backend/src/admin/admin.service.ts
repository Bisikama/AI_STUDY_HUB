import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  // Inject PrismaService vào để đấm query database
  constructor(private readonly prisma: PrismaService) {}

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
}