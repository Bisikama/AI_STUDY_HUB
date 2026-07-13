import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { TeacherVerificationService } from './teacher-verification.service';
import { TeacherVerificationController } from './teacher-verification.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, SupabaseModule, NotificationsModule],
  controllers: [TeacherVerificationController],
  providers: [TeacherVerificationService],
  exports: [TeacherVerificationService],
})
export class TeacherVerificationModule {}
