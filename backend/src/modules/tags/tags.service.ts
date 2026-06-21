import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTags(userId: string) {
    return this.prisma.tag.findMany({
      where: {
        OR: [{ isSystem: true }, { createdBy: userId }],
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createTag(createTagDto: CreateTagDto, userId: string) {
    const trimmedName = createTagDto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Tag name cannot be empty');
    }

    // Convert to slug: lowercase, replace spaces with hyphens, remove non-alphanumeric
    const slug = trimmedName
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w-]/g, '');

    if (!slug) {
      throw new BadRequestException('Invalid tag name');
    }

    // Check if tag already exists for this user or as a system tag
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        slug: slug,
        OR: [{ isSystem: true }, { createdBy: userId }],
      },
    });

    if (existingTag) {
      return existingTag; // Return existing instead of throwing error (idempotent)
    }

    // Create new personal tag
    return this.prisma.tag.create({
      data: {
        name: trimmedName,
        slug: slug,
        createdBy: userId,
        isSystem: false,
      },
    });
  }
}
