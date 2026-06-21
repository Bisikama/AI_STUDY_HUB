import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Gắn Guard bảo vệ toàn bộ các API trong Controller này
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Chỉ những ai có role 'ADMIN' mới được đi qua
@Controller('admin') // Kết hợp với global prefix /api -> thành /api/admin
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  async getMetrics() {
    return this.adminService.getSystemMetrics();
  }

  /**
   * Lấy danh sách toàn bộ người dùng
   * GET /api/admin/users
   */
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  /**
   * Lấy danh sách tài liệu đang chờ duyệt
   * GET /api/admin/documents/pending
   */
  @Get('documents/pending')
  async getPendingDocuments() {
    return this.adminService.getPendingDocuments();
  }

  /**
   * Phê duyệt hoặc từ chối tài liệu
   * PATCH /api/admin/documents/:id/approve
   * Body: { status: 'APPROVED' | 'REJECTED' }
   */
  @Patch('documents/:id/approve')
  async approveOrRejectDoc(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.adminService.approveOrRejectDoc(id, body.status);
  }

  /**
   * Xóa hoàn toàn tài liệu khỏi hệ thống (Cloud + DB)
   * DELETE /api/admin/documents/:id
   */
  @Delete('documents/:id')
  async forceDeleteDocument(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminService.forceDeleteDocument(id);
  }
}
