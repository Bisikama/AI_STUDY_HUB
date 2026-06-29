import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TeacherVerificationService } from './teacher-verification.service';
import { CreateTeacherVerificationDto, ReviewTeacherVerificationDto } from './dto/teacher-verification.dto';

@Controller('teacher-verification')
export class TeacherVerificationController {
  constructor(private readonly verificationService: TeacherVerificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTeacherVerificationDto,
  ) {
    return this.verificationService.submitRequest(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyVerification(@CurrentUser('id') userId: string) {
    const data = await this.verificationService.getMyVerification(userId);
    return {
      statusCode: 200,
      data,
    };
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminList() {
    const data = await this.verificationService.getAdminList();
    return {
      statusCode: 200,
      data,
    };
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async reviewRequest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ReviewTeacherVerificationDto,
  ) {
    return this.verificationService.reviewRequest(id, dto);
  }
}
