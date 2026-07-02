import { Module } from '@nestjs/common';
import { PersonalFoldersController } from './personal-folders.controller';
import { PersonalFoldersService } from './personal-folders.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalFoldersController],
  providers: [PersonalFoldersService]
})
export class PersonalFoldersModule {}
