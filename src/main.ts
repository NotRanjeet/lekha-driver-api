import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import Decimal from 'decimal.js';
import express, { Request, Response } from 'express';

// Patch BigInt serialisation so JSON.stringify works on BigInt fields
// (e.g. duration_ms in driver_request_status_history)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Patch Prisma Decimal serialisation
(Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

const expressApp = express();

// Singleton bootstrap — safe for concurrent cold-start requests on Vercel
let bootstrapPromise: Promise<express.Express> | null = null;

function bootstrap(): Promise<express.Express> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
      );

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

      await app.init();
      return expressApp;
    })();
  }
  return bootstrapPromise;
}

// Vercel serverless handler — Vercel calls this for every request
export default async (req: Request, res: Response): Promise<void> => {
  const server = await bootstrap();
  server(req, res);
};

// Local development — start a real HTTP server when not on Vercel
if (!process.env.VERCEL) {
  bootstrap().then((server) => {
    const port = process.env.PORT ?? 3002;
    server.listen(port, () => {
      console.log(`Application is running on: http://localhost:${port}`);
    });
  });
}
