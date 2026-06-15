import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Module({
  // Không import gì thêm vì ConfigModule đã được khai báo global trong AppModule
  providers: [SupabaseService],
  // Export để các module khác (như DocumentsModule) có thể inject SupabaseService
  exports: [SupabaseService],
})
export class SupabaseModule {}
