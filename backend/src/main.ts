import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties that are not defined in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties are sent
      transform: true, // Auto-transform to DTO class
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert primitives
      },
    }),
  );

  await app.listen(3000);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
