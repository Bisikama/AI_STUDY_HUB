import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Hỗ trợ trích xuất JWT Token từ Cookie (access_token) hoặc Header (Bearer Token)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: 'super-secret-key', // Phải khớp với secret key trong auth.module.ts
    });
  }

  // Phương thức validate tự động chạy sau khi Token được xác thực thành công
  validate(payload: { sub: string; email: string; role: string }) {
    if (!payload) {
      throw new UnauthorizedException('Token không hợp lệ!');
    }
    
    // Đối tượng trả về ở đây sẽ được NestJS gán vào request.user
    return { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role 
    };
  }
}
