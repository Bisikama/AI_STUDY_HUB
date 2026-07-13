import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateTeacherVerificationDto,
  ReviewTeacherVerificationDto,
} from './dto/teacher-verification.dto';

@Injectable()
export class TeacherVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submitRequest(userId: string, dto: CreateTeacherVerificationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.isTeacherBanned) {
      throw new BadRequestException(
        'Tài khoản của bạn đã bị chặn quyền đăng ký làm Giảng viên do vi phạm điều khoản!',
      );
    }

    if (user.role === 'TEACHER') {
      throw new BadRequestException('Tài khoản của bạn đã có quyền Giảng viên!');
    }

    const existing = await this.prisma.teacherVerification.findUnique({
      where: { userId },
    });

    if (existing && existing.status === 'PENDING') {
      throw new ConflictException('Bạn đã gửi yêu cầu xác thực và đang chờ duyệt.');
    }

    const verification = await this.prisma.teacherVerification.upsert({
      where: { userId },
      update: {
        teacherCode: dto.teacherCode.trim(),
        department: dto.department.trim(),
        proofUrl: dto.proofUrl.trim(),
        status: 'PENDING',
        adminNote: null,
      },
      create: {
        userId,
        teacherCode: dto.teacherCode.trim(),
        department: dto.department.trim(),
        proofUrl: dto.proofUrl.trim(),
        status: 'PENDING',
      },
    });

    return {
      message: 'Gửi yêu cầu Xác Thực Giảng Viên thành công!',
      verification,
    };
  }

  async getMyVerification(userId: string) {
    const verification = await this.prisma.teacherVerification.findUnique({
      where: { userId },
    });
    return verification;
  }

  async getAdminList() {
    const list = await this.prisma.teacherVerification.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list;
  }

  async reviewRequest(id: string, dto: ReviewTeacherVerificationDto) {
    const verification = await this.prisma.teacherVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      throw new NotFoundException('Không tìm thấy yêu cầu xác thực');
    }

    const updatedVerification = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.teacherVerification.update({
        where: { id },
        data: {
          status: dto.status,
          adminNote: dto.adminNote?.trim() || null,
        },
      });

      if (dto.status === 'APPROVED') {
        await tx.user.update({
          where: { id: verification.userId },
          data: { role: 'TEACHER' },
        });
      }

      return updated;
    });

    // Tạo thông báo hệ thống trực tiếp trên web cho người dùng tương ứng
    try {
      const title = dto.status === 'APPROVED'
        ? 'Yêu cầu xác thực Giảng viên được phê duyệt'
        : 'Yêu cầu xác thực Giảng viên bị từ chối';
      const content = dto.status === 'APPROVED'
        ? 'Yêu cầu xác thực Giảng viên của bạn đã được phê duyệt thành công. Bạn hiện đã có quyền Giảng viên trên hệ thống.'
        : `Yêu cầu xác thực Giảng viên của bạn đã bị từ chối. Lý do: ${dto.adminNote?.trim() || 'Không có lý do cụ thể'}`;

      await this.notificationsService.create(verification.userId, title, content);
    } catch (err) {
      console.error('Lỗi khi tạo thông báo xác thực giảng viên:', err);
    }

    return {
      message: `Đã ${dto.status === 'APPROVED' ? 'phe duyệt' : 'từ chối'} yêu cầu Xác Thực Giảng Viên.`,
      verification: updatedVerification,
    };
  }

  async uploadProofImage(file: Express.Multer.File): Promise<string> {
    return this.supabase.uploadToSupabase(file.buffer, file.originalname, file.mimetype);
  }
}
