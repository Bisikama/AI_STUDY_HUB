import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all subjects visible to the user:
   * system subjects (isSystem=true) OR personal subjects (createdBy=userId)
   */
  async getSubjects(userId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: {
        OR: [{ isSystem: true }, { createdBy: userId }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    return subjects;
  }

  /**
   * Create a personal subject for the user.
   * Returns existing subject if one with same name/code already belongs to user or is system.
   */
  async createSubject(userId: string, dto: CreateSubjectDto) {
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

    // Check if system subject with same name already exists → return it
    const systemMatch = await this.prisma.subject.findFirst({
      where: {
        isSystem: true,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });
    if (systemMatch) return systemMatch;

    // Check if user already has a personal subject with same name → return it
    const personalMatch = await this.prisma.subject.findFirst({
      where: {
        isSystem: false,
        createdBy: userId,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });
    if (personalMatch) return personalMatch;

    // Try to create; handle unique constraint on code by appending userId suffix
    let finalCode = code;
    const codeExists = await this.prisma.subject.findUnique({ where: { code } });
    if (codeExists) {
      // Append short userId suffix to make code unique
      finalCode = `${code}-${userId.slice(0, 8)}`;
    }

    const newSubject = await this.prisma.subject.create({
      data: {
        name: trimmedName,
        code: finalCode,
        description: dto.description?.trim() || null,
        isSystem: false,
        createdBy: userId,
      },
    });

    return newSubject;
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
      throw new ForbiddenException(
        `You do not have access to subject with ID ${subjectId}`,
      );
    }
  }
}
