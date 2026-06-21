import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../database/prisma.module';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule, // Cần để AdminService dùng được SupabaseService (xóa file Cloud)
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
