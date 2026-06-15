import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response, // Thêm @Res để can thiệp vào response
  ) {
    // 1. Gọi service để check pass và tạo Token
    const result = await this.authService.login(dto);

    // 2. Set Cookie y chang chuẩn DoD yêu cầu
    res.cookie('access_token', result.token, {
      httpOnly: true, // Tránh bị XSS attack
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // Token sống 1 ngày
    });

    // 3. Trả về thông tin user cho Frontend dùng (như hiển thị tên, avatar...)
    return result;
  }
}
