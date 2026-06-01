import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { AdminService } from './admin/admin.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, DocumentsModule, AdminModule],
  controllers: [],
  providers: [AdminService],
})
export class AppModule { }
