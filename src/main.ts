import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { initSentry } from './config/sentry.config';
import { logger } from './config/logger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SentryFilter } from './common/filters/sentry.filter';

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalFilters(new SentryFilter());
  app.use(
    require('morgan')('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }),
  );

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

  const port = process.env.PORT ?? 3123;
  await app.listen(port);
  const loggerService = new Logger('Bootstrap');
  loggerService.log(`🚀 Application is running on: http://localhost:${port}`);
  loggerService.log(`📚 Swagger documentation: http://localhost:${port}/documentation`);
}
bootstrap();

