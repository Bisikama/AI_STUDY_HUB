import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

import { SupabaseModule } from 'src/supabase/supabase.module';
import { PrismaModule } from 'src/database/prisma.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [PrismaModule, SupabaseModule, SubjectsModule, TagsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
