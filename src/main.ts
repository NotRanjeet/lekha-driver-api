import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Global prefix ──────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Validation ─────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── CORS ───────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Swagger ────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Lekha Driver API')
    .setDescription(
      'Standalone REST API for the Lekha Driver Portal. ' +
        'Handles authentication, trip management, documents, and earnings for drivers.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'refresh-token',
    )
    .addTag('Auth', 'Driver authentication endpoints')
    .addTag('Driver', 'Driver profile and vehicle management')
    .addTag('Trips', 'Trip lifecycle management')
    .addTag('Documents', 'Driver document verification')
    .addTag('Earnings', 'Earnings and payout history')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ─── Start ──────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Lekha Driver API running on http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
