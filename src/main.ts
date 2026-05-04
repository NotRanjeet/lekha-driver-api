import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import Decimal from 'decimal.js';
import express, { Request, Response } from 'express';

// Patch BigInt serialisation so JSON.stringify works on BigInt fields
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Patch Prisma Decimal serialisation
(Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

function setupSwagger(app: any, prefix: string): void {
  const config = new DocumentBuilder()
    .setTitle('Driver Portal API')
    .setDescription(
      'Self-service endpoints for drivers — profile, contracts, invoices, payments, and support requests.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  });
}

// Export for Vercel serverless
export default async (req: Request, res: Response): Promise<void> => {
  if (!(global as any).cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    const prefix = process.env.API_PREFIX ?? 'api';

    app.enableCors({ origin: true, credentials: true });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.setGlobalPrefix(prefix);

    setupSwagger(app, prefix);

    await app.init();
    (global as any).cachedApp = app.getHttpAdapter().getInstance();
  }

  return (global as any).cachedApp(req, res);
};

// Bootstrap for local development
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.API_PREFIX ?? 'api';
  const port = process.env.PORT ?? 3002;

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix(prefix);

  setupSwagger(app, prefix);

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/${prefix}`);
  console.log(`Swagger docs available at: http://localhost:${port}/${prefix}/docs`);
}

// Only run in local development, not on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap();
}
