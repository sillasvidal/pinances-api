import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],

    // Release tracking
    release: process.env.npm_package_version,

    // Before send hook to filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from request body
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          ['password', 'token', 'secret'].forEach((field) => {
            if (data[field]) {
              data[field] = '***REDACTED***';
            }
          });
        }
      }
      return event;
    },
  });
}
