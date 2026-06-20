import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { raw } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  // Corps binaire pour les trames JPEG envoyées par les bornes ESP32-CAM.
  // (Le middleware JSON par défaut ne traite que application/json.)
  app.use(
    raw({ type: ['image/jpeg', 'application/octet-stream'], limit: '5mb' }),
  );

  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  Logger.log(`🚀 API de pointage démarrée sur http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
