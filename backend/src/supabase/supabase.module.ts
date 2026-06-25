import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { STORAGE_ADAPTER } from './storage-adapter.interface';

@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useClass: SupabaseService,
    },
    SupabaseService,
  ],
  exports: [STORAGE_ADAPTER, SupabaseService],
})
export class SupabaseModule {}
