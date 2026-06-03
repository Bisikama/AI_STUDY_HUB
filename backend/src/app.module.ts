import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { AdminService } from './admin/admin.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExploreModule } from './explore/exploreModule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DocumentsModule,
    AdminModule,
    ExploreModule,
  ],
  controllers: [],
  providers: [AdminService],
})
export class AppModule {}
