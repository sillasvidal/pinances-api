import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { logger } from '../../config/logger.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const userId = request.user?.id;
    const userEmail = request.user?.email;

    const startTime = Date.now();

    // Log incoming request
    logger.info('Incoming request', {
      method,
      url,
      userId,
      userEmail,
      body: this.sanitizeBody(body),
      query,
      params,
    });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          method,
          url,
          userId,
          duration: `${duration}ms`,
          statusCode: context.switchToHttp().getResponse().statusCode,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        logger.error('Request failed', {
          method,
          url,
          userId,
          duration: `${duration}ms`,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
