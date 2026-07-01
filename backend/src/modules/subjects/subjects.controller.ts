import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
  Patch,
  ParseIntPipe,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateMajorDto, UpdateMajorDto, CreateCourseDto, UpdateCourseDto } from './dto/catalog.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // ---------------------------------------------------------
  // Public Catalog APIs (Student/Teacher)
  // ---------------------------------------------------------

  @Get('catalog/majors')
  @UseGuards(JwtAuthGuard)
  async getMajors() {
    const majors = await this.subjectsService.getMajors();
    return {
      statusCode: 200,
      message: 'Get majors successfully',
      data: majors,
    };
  }

  @Get('catalog/courses')
  @UseGuards(JwtAuthGuard)
  async getCatalogCourses(@Query('majorCode') majorCode?: string) {
    const courses = await this.subjectsService.getCatalogCourses(majorCode);
    return {
      statusCode: 200,
      message: 'Get courses successfully',
      data: courses,
    };
  }

  // ---------------------------------------------------------
  // Admin Catalog APIs
  // ---------------------------------------------------------

  @Post('catalog/majors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createMajor(@Body() dto: CreateMajorDto) {
    const major = await this.subjectsService.createMajor(dto);
    return {
      statusCode: 201,
      message: 'Major created successfully',
      data: major,
    };
  }

  @Patch('catalog/majors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateMajor(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateMajorDto,
  ) {
    const major = await this.subjectsService.updateMajor(id, dto);
    return {
      statusCode: 200,
      message: 'Major updated successfully',
      data: major,
    };
  }

  @Post('catalog/courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCatalogCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser('id') adminId: string,
  ) {
    const course = await this.subjectsService.createCatalogCourse(dto, adminId);
    return {
      statusCode: 201,
      message: 'Course created successfully',
      data: course,
    };
  }

  @Patch('catalog/courses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCatalogCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
  ) {
    const course = await this.subjectsService.updateCatalogCourse(id, dto);
    return {
      statusCode: 200,
      message: 'Course updated successfully',
      data: course,
    };
  }

  @Patch('catalog/courses/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCourseStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    const course = await this.subjectsService.updateCourseStatus(id, isActive);
    return {
      statusCode: 200,
      message: 'Course status updated successfully',
      data: course,
    };
  }

  // ---------------------------------------------------------
  // Legacy APIs
  // ---------------------------------------------------------

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSubjects(
    @CurrentUser('id') userId: string,
  ): Promise<{ statusCode: number; message: string; data: unknown[] }> {
    const subjects = await this.subjectsService.getSubjects(userId);
    return {
      statusCode: 200,
      message: 'Get subjects successfully',
      data: subjects,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: any,
  ): Promise<{ statusCode: number; message: string; data: unknown }> {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'COURSE_CREATION_ADMIN_ONLY',
        error: 'Forbidden',
      });
    }

    const subject = await this.subjectsService.createSubject(user.id, dto);
    return {
      statusCode: 201,
      message: 'Subject created successfully',
      data: subject,
    };
  }
}
