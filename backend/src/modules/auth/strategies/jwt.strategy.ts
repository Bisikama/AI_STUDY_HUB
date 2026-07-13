import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Hỗ trợ trích xuất JWT Token từ cả Authorization Header (Bearer) và Cookie (access_token)
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-key', // Phải khớp với secret key trong auth.module.ts
    });
  }

  // Phương thức validate tự động chạy sau khi Token được xác thực thành công
  async validate(payload: { sub: string; email: string; role: string }) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token không hợp lệ!');
    }

    // Truy vấn thông tin user từ database để kiểm tra trạng thái hoạt động
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại!');
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị khóa!',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Đối tượng trả về ở đây sẽ được NestJS gán vào request.user
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
