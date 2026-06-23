import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import cookieParser from 'cookie-parser';

import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable cookie-parser
  app.use(cookieParser());

  // Thiết lập tiền tố /api cho tất cả route
  app.setGlobalPrefix('api');

  // Phục vụ file tĩnh
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Bật CORS (Bắt buộc phải có credentials: true để nhận Cookie)
  const configService = app.get(ConfigService);
  const allowedOrigins =
    configService.get<string>('ALLOWED_ORIGINS') ||
    'http://localhost:3000,http://localhost:5000,https://ai-study-ph9xjpnls-bisikamas-projects.vercel.app/';
  const originArray = allowedOrigins.split(',').map((origin) => origin.trim().replace(/\/$/, ''));

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép các request không có origin (như Mobile App, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      const isAllowed =
        allowedOrigins === '*' ||
        originArray.includes('*') ||
        originArray.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.github.dev') ||
        origin.endsWith('.gitpod.io');

      if (isAllowed) {
        return callback(null, true);
      }
      
      console.warn(`[CORS Blocked] Origin "${origin}" is not allowed. Configured ALLOWED_ORIGINS: "${allowedOrigins}"`);
      return callback(null, false);
    },
    credentials: true,
  });

  // Pipeline validate dữ liệu
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
