import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async getTags(@CurrentUser('id') userId: string) {
    const tags = await this.tagsService.getTags(userId);
    return {
      statusCode: 200,
      message: 'Get tags successfully',
      data: tags,
    };
  }

  @Post()
  async createTag(@Body() createTagDto: CreateTagDto, @CurrentUser('id') userId: string) {
    const tag = await this.tagsService.createTag(createTagDto, userId);
    return {
      statusCode: 201,
      message: 'Tag created successfully',
      data: tag,
    };
  }
}
