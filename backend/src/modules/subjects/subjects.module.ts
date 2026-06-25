import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { SubjectQueryService } from './subject-query.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubjectsController],
  providers: [SubjectsService, SubjectQueryService],
  exports: [SubjectsService, SubjectQueryService],
})
export class SubjectsModule {}
