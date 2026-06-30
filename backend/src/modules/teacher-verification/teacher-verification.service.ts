import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTeacherVerificationDto, ReviewTeacherVerificationDto } from './dto/teacher-verification.dto';

@Injectable()
export class TeacherVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async submitRequest(userId: string, dto: CreateTeacherVerificationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
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
        department: dto.department?.trim() || null,
        proofUrl: dto.proofUrl || null,
        status: 'PENDING',
        adminNote: null,
      },
      create: {
        userId,
        teacherCode: dto.teacherCode.trim(),
        department: dto.department?.trim() || null,
        proofUrl: dto.proofUrl || null,
        status: 'PENDING',
      },
    });

    return {
      message: 'Gửi yêu cầu xác thực Giảng viên thành công!',
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

    return await this.prisma.$transaction(async (tx) => {
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

      return {
        message: `Đã ${dto.status === 'APPROVED' ? 'phe duyệt' : 'từ chối'} yêu cầu xác thực Giảng viên.`,
        verification: updated,
      };
    });
  }
}
