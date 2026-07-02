import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PersonalFoldersService } from './personal-folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('personal-folders')
@UseGuards(JwtAuthGuard)
export class PersonalFoldersController {
  constructor(private readonly foldersService: PersonalFoldersService) {}

  @Post()
  async create(
    @Body() dto: CreateFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.foldersService.createFolder(userId, dto);
    return {
      statusCode: 201,
      message: 'Tạo thư mục thành công',
      data,
    };
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    const data = await this.foldersService.getFolders(userId);
    return {
      statusCode: 200,
      message: 'Lấy danh sách thư mục thành công',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.foldersService.updateFolder(userId, id, dto);
    return {
      statusCode: 200,
      message: 'Cập nhật thư mục thành công',
      data,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.foldersService.deleteFolder(userId, id);
    return {
      statusCode: 200,
      message: 'Xóa thư mục thành công',
      data: null,
    };
  }
}
