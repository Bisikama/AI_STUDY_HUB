import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/admin') // Thiết lập đường dẫn cha là /api/admin
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics') // Endpoint cụ thể: GET /api/admin/metrics
  async getMetrics() {
    // Gọi xuống service bắt nó tính toán rồi trả kết quả về cho client
    return this.adminService.getSystemMetrics();
  }
}