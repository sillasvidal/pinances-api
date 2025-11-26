import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { logger } from '../../config/logger.config';

@Catch()
export class SentryFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Add user context to Sentry
    if (request.user) {
      Sentry.setUser({
        id: (request.user as any).id,
        email: (request.user as any).email,
      });
    }

    // Add request context
    Sentry.setContext('request', {
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      body: request.body,
      query: request.query,
    });

    // Capture exception in Sentry
    if (status >= 500) {
      Sentry.captureException(exception);
    }

    // Log error
    logger.error('Exception caught', {
      status,
      message,
      path: request.url,
      method: request.method,
      userId: (request.user as any)?.id,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Send response
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    ['authorization', 'cookie'].forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    });
    return sanitized;
  }
}
