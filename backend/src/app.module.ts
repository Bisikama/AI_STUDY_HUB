import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { LessonsModule } from './lessons/lessons.module';
import { PrismaModule } from './prisma/prisma.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    LessonsModule,
    PrismaModule,
    DocumentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
