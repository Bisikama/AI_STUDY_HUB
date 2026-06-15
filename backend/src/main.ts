import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import cookieParser from 'cookie-parser';

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
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
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

  await app.listen(3000);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
