import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module'; // 1. Import nó vào đây

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DocumentsModule,
    AuthModule, // 2. Thêm vào danh sách imports
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
