import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetAdminQuizzesQueryDto, UpdateQuestionDto } from './dto/admin-quiz.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  /**
   * Lấy danh sách toàn bộ bộ câu hỏi trắc nghiệm
   * GET /api/admin/quizzes
   */
  @Get('quizzes')
  async getQuizzes(@Query() query: GetAdminQuizzesQueryDto) {
    return this.adminService.getQuizzes(query);
  }

  /**
   * Lấy chi tiết câu hỏi của một bộ Quiz
   * GET /api/admin/quizzes/:id
   */
  @Get('quizzes/:id')
  async getQuizById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminService.getQuizById(id);
  }

  /**
   * Cập nhật câu hỏi và các lựa chọn
   * PATCH /api/admin/quizzes/questions/:questionId
   */
  @Patch('quizzes/questions/:questionId')
  async updateQuestion(
    @Param('questionId', new ParseUUIDPipe({ version: '4' })) questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.adminService.updateQuestion(questionId, dto);
  }

  /**
   * Xóa một bộ Quiz
   * DELETE /api/admin/quizzes/:id
   */
  @Delete('quizzes/:id')
  async deleteQuiz(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminService.deleteQuiz(id);
  }

  /**
   * Thống kê làm bài của bộ Quiz
   * GET /api/admin/quizzes/:id/analytics
   */
  @Get('quizzes/:id/analytics')
  async getQuizAnalytics(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminService.getQuizAnalytics(id);
  }

  /**
   * Lấy danh sách báo cáo tài liệu học thuật
   * GET /api/admin/reports
   */
  @Get('reports')
  async getReports(
    @Query() query: { status?: string; reason?: string; documentId?: string; page?: number; limit?: number },
  ) {
    return this.adminService.getReports(query);
  }

  /**
   * Xem chi tiết một báo cáo
   * GET /api/admin/reports/:reportId
   */
  @Get('reports/:reportId')
  async getReportDetails(@Param('reportId', new ParseUUIDPipe({ version: '4' })) reportId: string) {
    return this.adminService.getReportDetails(reportId);
  }

  /**
   * Cập nhật trạng thái báo cáo (RESOLVED hoặc REJECTED)
   * PATCH /api/admin/reports/:reportId
   */
  @Patch('reports/:reportId')
  async updateReport(
    @Param('reportId', new ParseUUIDPipe({ version: '4' })) reportId: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.updateReport(reportId, adminId, dto);
  }
}
