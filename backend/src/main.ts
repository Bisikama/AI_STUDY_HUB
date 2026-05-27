import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5000', 'http://localhost:3000'],
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
