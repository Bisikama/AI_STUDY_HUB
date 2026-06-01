import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController], // Controller nằm ở đây
})
export class AuthModule {}
