import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { ExploreModule } from './explore/exploreModule';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, DocumentsModule, ExploreModule, AdminModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
