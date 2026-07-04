import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFolderDto, UpdateFolderDto } from './dto';

@Injectable()
export class PersonalFoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async getFolders(userId: string) {
    const folders = await this.prisma.personalFolder.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    return folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      documentCount: f._count.documents,
    }));
  }

  private async checkFolderDepth(parentId: string, userId: string, currentDepth = 1): Promise<number> {
    if (currentDepth > 2) {
      throw new BadRequestException('Thư mục chỉ hỗ trợ tối đa 3 cấp.');
    }
    const parent = await this.prisma.personalFolder.findUnique({
      where: { id: parentId },
    });
    if (!parent || parent.ownerId !== userId) {
      throw new NotFoundException('Không tìm thấy thư mục cha hoặc bạn không có quyền.');
    }
    if (parent.parentId) {
      return this.checkFolderDepth(parent.parentId, userId, currentDepth + 1);
    }
    return currentDepth;
  }

  private async checkCycle(folderId: string, newParentId: string) {
    if (folderId === newParentId) {
      throw new BadRequestException('Thư mục không thể là cha của chính nó.');
    }
    let currentParentId: string | null = newParentId;
    while (currentParentId) {
      const parent = await this.prisma.personalFolder.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });
      if (!parent) break;
      if (parent.parentId === folderId) {
        throw new BadRequestException('Không thể di chuyển thư mục này vào trong thư mục con của nó.');
      }
      currentParentId = parent.parentId;
    }
  }

  async createFolder(userId: string, dto: CreateFolderDto) {
    if (dto.parentId) {
      await this.checkFolderDepth(dto.parentId, userId);
    }

    const folder = await this.prisma.personalFolder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId || null,
        ownerId: userId,
      },
    });

    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      documentCount: 0,
    };
  }

  async updateFolder(userId: string, folderId: string, dto: UpdateFolderDto) {
    const existing = await this.prisma.personalFolder.findUnique({
      where: { id: folderId },
    });

    if (!existing || existing.ownerId !== userId) {
      throw new NotFoundException('Không tìm thấy thư mục hoặc bạn không có quyền.');
    }

    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      if (dto.parentId) {
        await this.checkFolderDepth(dto.parentId, userId);
        await this.checkCycle(folderId, dto.parentId);
      }
    }

    const folder = await this.prisma.personalFolder.update({
      where: { id: folderId },
      data: {
        name: dto.name,
        parentId: dto.parentId === undefined ? undefined : dto.parentId,
      },
    });

    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  async deleteFolder(userId: string, folderId: string) {
    const existing = await this.prisma.personalFolder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: { documents: true, children: true },
        },
      },
    });

    if (!existing || existing.ownerId !== userId) {
      throw new NotFoundException('Không tìm thấy thư mục hoặc bạn không có quyền.');
    }

    if (existing._count.documents > 0 || existing._count.children > 0) {
      throw new ConflictException({
        statusCode: 409,
        message: 'PERSONAL_FOLDER_NOT_EMPTY',
        error: 'Conflict',
      });
    }

    await this.prisma.personalFolder.delete({
      where: { id: folderId },
    });

    return { success: true };
  }
}
