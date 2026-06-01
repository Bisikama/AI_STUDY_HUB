import { Controller, Post, Body } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    // Tạm thời trả về message để test xem nó đã "thông" chưa
    return { message: 'Đã nhận được data từ Frontend!', data: registerDto };
  }
}
