import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExploreController } from './exploreController';
import { ExploreService } from './exploreService';

@Module({
  imports: [PrismaModule],
  controllers: [ExploreController],
  providers: [ExploreService],
  exports: [ExploreService],
})
export class ExploreModule {}
