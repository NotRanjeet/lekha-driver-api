import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import Decimal from 'decimal.js';

// Patch BigInt serialisation so JSON.stringify works on BigInt fields
// (e.g. duration_ms in driver_request_status_history)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Patch Prisma Decimal serialisation
(Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Driver Portal API')
    .setDescription(
      'Self-service endpoints for drivers — profile, contracts, invoices, payments, and support requests.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  await app.listen(process.env.PORT ?? 3002);
}

bootstrap();
