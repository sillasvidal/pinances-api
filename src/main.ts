import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { initSentry } from './config/sentry.config';
import { logger } from './config/logger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SentryFilter } from './common/filters/sentry.filter';

async function bootstrap() {
  // Initialize Sentry
  initSentry();

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter (Sentry)
  app.useGlobalFilters(new SentryFilter());

  // HTTP request logging with Morgan
  app.use(
    require('morgan')('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Pinances API')
    .setDescription(
      'Personal finance management API with dual accounting regimes (Accrual and Cash Flow)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('accounts', 'Bank account management')
    .addTag('cards', 'Credit card management')
    .addTag('commitments', 'Installment commitments')
    .addTag('transactions', 'Financial transactions')
    .addTag('reports', 'Financial reports')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, document);

  await app.listen(process.env.PORT ?? 3123);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3123}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3123}/documentation`);
}
bootstrap();

