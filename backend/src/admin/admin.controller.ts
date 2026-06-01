import {
  Controller,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('documents/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveDocument(@Param('id') documentId: string) {
    return await this.adminService.approveOrRejectDoc(documentId, 'AVAILABLE');
  }

  @Patch('documents/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectDocument(@Param('id') documentId: string) {
    return await this.adminService.approveOrRejectDoc(documentId, 'FAILED');
  }
}
