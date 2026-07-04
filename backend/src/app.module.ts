import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { DocumentsModule } from './modules/documents/documents.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaModule } from './database/prisma.module';
import { ExploreModule } from './modules/explore/exploreModule';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TagsModule } from './modules/tags/tags.module';
import { TeacherVerificationModule } from './modules/teacher-verification/teacher-verification.module';
import { ApiResponseInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';
import { PersonalFoldersModule } from './modules/personal-folders/personal-folders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DocumentsModule,
    AdminModule,
    ExploreModule,
    DashboardModule,
    SubjectsModule,
    TagsModule,
    TeacherVerificationModule,
    PersonalFoldersModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
