import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateMajorDto, UpdateMajorDto, CreateCourseDto, UpdateCourseDto } from './dto/catalog.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // Catalog APIs
  // ---------------------------------------------------------

  async getMajors() {
    return this.prisma.major.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCatalogCourses(majorCode?: string) {
    const where: any = { isSystem: true, isActive: true };
    if (majorCode) {
      where.majors = {
        some: { major: { code: majorCode } },
      };
    }
    const courses = await this.prisma.subject.findMany({
      where,
      include: {
        majors: { include: { major: true } },
      },
      orderBy: { name: 'asc' },
    });

    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      majors: c.majors.map((m) => ({ id: m.major.id, code: m.major.code, name: m.major.name })),
    }));
  }

  async createMajor(dto: CreateMajorDto) {
    const existing = await this.prisma.major.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Major code already exists');

    return this.prisma.major.create({ data: dto });
  }

  async updateMajor(id: string, dto: UpdateMajorDto) {
    if (dto.code) {
      const existing = await this.prisma.major.findUnique({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Major code already exists');
      }
    }
    return this.prisma.major.update({
      where: { id },
      data: dto,
    });
  }

  async createCatalogCourse(dto: CreateCourseDto, adminId: string) {
    const existing = await this.prisma.subject.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Course code already exists');

    return this.prisma.subject.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        isSystem: true,
        createdBy: adminId,
        majors: dto.majorIds ? {
          create: dto.majorIds.map((majorId) => ({ majorId })),
        } : undefined,
      },
      include: {
        majors: { include: { major: true } },
      },
    });
  }

  async updateCatalogCourse(id: number, dto: UpdateCourseDto) {
    const existing = await this.prisma.subject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');

    if (dto.code && dto.code !== existing.code) {
      const codeCheck = await this.prisma.subject.findUnique({ where: { code: dto.code } });
      if (codeCheck) throw new BadRequestException('Course code already exists');
    }

    const data: any = {
      code: dto.code,
      name: dto.name,
      description: dto.description,
    };

    if (dto.majorIds) {
      // Re-link majors
      await this.prisma.majorSubject.deleteMany({ where: { subjectId: id } });
      data.majors = {
        create: dto.majorIds.map((majorId) => ({ majorId })),
      };
    }

    return this.prisma.subject.update({
      where: { id },
      data,
      include: {
        majors: { include: { major: true } },
      },
    });
  }

  async updateCourseStatus(id: number, isActive: boolean) {
    return this.prisma.subject.update({
      where: { id },
      data: { isActive },
    });
  }

  // ---------------------------------------------------------
  // Legacy Logic
  // ---------------------------------------------------------

  /**
   * Get all subjects visible to the user:
   * system subjects (isSystem=true) OR personal subjects (createdBy=userId)
   */
  async getSubjects(userId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: {
        OR: [{ isSystem: true, isActive: true }, { createdBy: userId }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }, { id: 'asc' }],
    });

    return subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      isSystem: subject.isSystem,
    }));
  }

  /**
   * Create a personal subject for the user.
   * Returns existing subject if one with same name/code already belongs to user or is system.
   */
  async createSubject(userId: string, dto: CreateSubjectDto) {
    // Only Admin is allowed to hit the controller endpoint in Phase 5.
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Subject name cannot be empty');
    }

    // Generate a unique code/slug from name
    const code = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);

    if (!code) {
      throw new BadRequestException('Subject name is invalid');
    }

    const existingName = await this.prisma.subject.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });
    if (existingName) {
      throw new BadRequestException('Subject name already exists');
    }

    const existingCode = await this.prisma.subject.findUnique({
      where: { code },
    });
    if (existingCode) {
      throw new BadRequestException('Subject code already exists');
    }

    const newSubject = await this.prisma.subject.create({
      data: {
        name: trimmedName,
        code,
        description: dto.description?.trim() || null,
        isSystem: false,
        createdBy: userId,
      },
    });

    return {
      id: newSubject.id,
      name: newSubject.name,
      code: newSubject.code,
      isSystem: newSubject.isSystem,
    };
  }

  /**
   * Validate that a subject is accessible by the given user.
   * Used by Document upload/edit to prevent using other users' private subjects.
   */
  async validateSubjectAccess(subjectId: number, userId: string): Promise<void> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    if (!subject.isSystem && subject.createdBy !== userId) {
      throw new ForbiddenException(`You do not have access to subject with ID ${subjectId}`);
    }

    if (subject.isSystem && !subject.isActive) {
      throw new BadRequestException(`Course with ID ${subjectId} is not active`);
    }
  }
}
