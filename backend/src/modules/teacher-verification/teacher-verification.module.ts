import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { TeacherVerificationService } from './teacher-verification.service';
import { TeacherVerificationController } from './teacher-verification.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherVerificationController],
  providers: [TeacherVerificationService],
  exports: [TeacherVerificationService],
})
export class TeacherVerificationModule {}
