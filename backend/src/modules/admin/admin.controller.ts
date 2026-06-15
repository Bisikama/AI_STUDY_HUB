import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Gắn Guard bảo vệ toàn bộ các API trong Controller này
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Chỉ những ai có role 'ADMIN' mới được đi qua
@Controller('admin') // Đã sửa lại đường dẫn cho chuẩn (kết hợp với main.ts sẽ thành /api/admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  async getMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Patch('documents/:id/approve')
  async approveOrRejectDoc(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { status: 'AVAILABLE' | 'FAILED' },
  ) {
    return this.adminService.approveOrRejectDoc(id, body.status);
  }
}
