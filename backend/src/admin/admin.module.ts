import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module'; // Đảm bảo đường dẫn này trỏ đúng tới folder PrismaModule của dự án bạn

@Module({
  imports: [PrismaModule], // Import PrismaModule để AdminService có thể xài được Prisma
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}