import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

import { SupabaseModule } from 'src/supabase/supabase.module';
import { PrismaModule } from 'src/database/prisma.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
