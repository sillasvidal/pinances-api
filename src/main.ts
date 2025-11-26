import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/documentation`);
}
bootstrap();

