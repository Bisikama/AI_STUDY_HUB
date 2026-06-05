import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './modules/documents/documents.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdminService } from './modules/admin/admin.service';
import { PrismaModule } from './database/prisma.module';
import { ExploreModule } from './modules/explore/exploreModule';

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
