import { Controller, Get, Query } from '@nestjs/common';
import { GetExploreQueryDto } from './dto/getExploreQuery.dto';
import { ExploreService } from './exploreService';
import { ExploreDocumentItem } from './types/exploreDocumentItem.type';

@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  async getExploreDocuments(@Query() query: GetExploreQueryDto): Promise<ExploreDocumentItem[]> {
    return this.exploreService.getExploreDocuments(query);
  }
}
