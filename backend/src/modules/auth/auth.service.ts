import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Kiểm tra email tồn tại
    const userExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (userExists) {
      throw new ConflictException('Email này đã được sử dụng!');
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Lưu vào database (Khớp với Prisma Schema của bạn)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        fullName: dto.name,
        role: 'STUDENT',
        storageUsage: {
          create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n },
        },
      },
    });

    return {
      message: 'Đăng ký thành công!',
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  async login(dto: LoginDto) {
    // 1. Tìm user
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu!');
    }
    // 2. Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu!');
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị khóa!',
        code: 'ACCOUNT_LOCKED',
      });
    }

    console.log('>>> ĐANG LOGIN VỚI QUYỀN:', user.role);

    // 3. Tạo JWT Token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      token,
    };
  }

  async loginWithGoogle(idToken: string) {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId ? [clientId] : undefined,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Thông tin từ Google không hợp lệ!');
      }

      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      const avatarUrl = payload.picture || null;

      // 1. Kiểm tra xem user đã tồn tại chưa
      let user = await this.prisma.user.findUnique({ where: { email } });

      // 2. Nếu chưa tồn tại, tạo mới tài khoản
      if (!user) {
        // Tạo password ngẫu nhiên và mã hóa nó
        const randomPassword =
          Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = await this.prisma.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            fullName: name,
            avatarUrl,
            role: 'STUDENT',
            storageUsage: {
              create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n },
            },
          },
        });
      }

      if (!user.isActive) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'Tài khoản của bạn đã bị khóa!',
          code: 'ACCOUNT_LOCKED',
        });
      }

      // 3. Tạo JWT Token
      const jwtPayload = { sub: user.id, email: user.email, role: user.role };
      const token = await this.jwtService.signAsync(jwtPayload);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          username: user.username,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw new UnauthorizedException('Xác thực tài khoản Google thất bại!');
    }
  }

  async forgotPassword(email: string) {
    // 1. Tìm user
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Tránh email enumeration: trả về success ngay cả khi không tìm thấy user
    if (!user) {
      return { message: 'Nếu tài khoản tồn tại, mã OTP sẽ được gửi về email.' };
    }

    // 2. Tạo mã OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Thiết lập thời gian hết hạn (10 phút)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Lưu mã OTP vào bảng PasswordResetToken
    // Trước khi lưu mới, xóa các token cũ của user này để dọn dẹp DB
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: otp,
        expiresAt,
      },
    });

    // 5. Gửi email
    const mailSent = await this.mailService.sendOtp(email, otp);

    return {
      message: 'Email khôi phục mật khẩu đã được gửi qua dịch vụ Supabase.',
    };
  }

  async resetPassword(dto: any) {
    const { email, otp, password } = dto;

    // 1. Tìm user
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Thông tin xác thực không hợp lệ!');
    }

    // 2. Tìm token reset trùng với userId và otp, chưa hết hạn, chưa sử dụng
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        token: otp,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Mã OTP không chính xác hoặc đã hết hạn!');
    }

    // 3. Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Cập nhật mật khẩu mới cho user
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // 5. Đánh dấu token đã sử dụng
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Đặt lại mật khẩu thành công!' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng!');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      phoneNumber: user.phoneNumber,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(
    userId: string,
    dto: { fullName: string; username?: string; phoneNumber?: string },
  ) {
    if (dto.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Tên đăng nhập này đã được sử dụng!');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        username: dto.username || null,
        phoneNumber: dto.phoneNumber || null,
      },
    });

    return {
      message: 'Cập nhật thông tin tài khoản thành công!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
      },
    };
  }
}
