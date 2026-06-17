import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service'; // Đường dẫn trỏ tới file prisma của bạn
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Kiểm tra email tồn tại
    const userExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (userExists) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Lưu vào database (Khớp với Prisma Schema của bạn)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        fullName: dto.name, // Frontend gửi 'name', DB lưu 'fullName'
        role: 'STUDENT',
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
    console.log('>>> ĐANG LOGIN VỚI QUYỀN:', user.role);

    // 3. Tạo JWT Token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName, 
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role 
      },
      token,
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
