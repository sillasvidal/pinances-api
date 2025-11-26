# Observability Stack - Documentation

## Overview

Complete observability solution for the Pinances API with logging, error tracking, and metrics monitoring.

## Stack Components

### 1. Winston Logger
Structured logging with JSON format and file rotation.

### 2. Morgan
HTTP request/response logging.

### 3. Sentry
Real-time error tracking and performance monitoring.

### 4. Prometheus + Grafana
Metrics collection and visualization.

## Features Implemented

✅ **Structured Logging** - JSON logs with timestamps and context  
✅ **HTTP Logging** - All requests logged with Morgan  
✅ **Error Tracking** - Automatic error capture in Sentry  
✅ **User Context** - User info attached to errors  
✅ **Sensitive Data Filtering** - Passwords/tokens redacted  
✅ **Metrics Endpoint** - `/metrics` for Prometheus  
✅ **Docker Monitoring** - Prometheus + Grafana containers  

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Sentry (optional)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development

# Metrics
ENABLE_METRICS=true
```

### 2. Start Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9091
- **API Metrics**: http://localhost:3000/metrics

## Log Files

Logs are stored in the `logs/` directory:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

### View Logs

```bash
# Tail combined logs
tail -f logs/combined.log

# Filter errors
grep "error" logs/combined.log

# Parse JSON logs
cat logs/combined.log | jq '.'
```

### Log Example

```json
{
  "level": "info",
  "message": "Incoming request",
  "timestamp": "2025-11-25T23:00:00.000Z",
  "method": "POST",
  "url": "/api/v1/transactions/card",
  "userId": "uuid-user",
  "userEmail": "user@example.com",
  "body": {
    "card_id": "uuid-card",
    "amount": 150.00
  }
}
```

## Sentry Setup

### 1. Create Account

1. Go to https://sentry.io
2. Create a free account (5,000 events/month)
3. Create a new project
4. Copy the DSN

### 2. Configure

Add to `.env`:

```env
SENTRY_DSN=https://your-key@sentry.io/project-id
```

### 3. Features

- **Error Tracking**: Automatic capture of exceptions
- **Performance Monitoring**: Transaction timing
- **User Context**: User ID and email attached
- **Release Tracking**: Version tracking
- **Alerts**: Email/Slack notifications

## Prometheus Metrics

### Available Metrics

**Default Metrics:**
- `process_cpu_user_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_total_bytes` - Heap size
- `http_request_duration_seconds` - Request duration

### Access Metrics

```bash
curl http://localhost:3000/metrics
```

### Query Examples (Prometheus)

```promql
# Request rate
rate(http_request_duration_seconds_count[5m])

# Error rate
rate(http_request_duration_seconds_count{status=~"5.."}[5m])

# P95 response time
histogram_quantile(0.95, http_request_duration_seconds_bucket)
```

## Grafana Dashboards

### Access

1. Open http://localhost:3001
2. Login: `admin` / `admin`
3. Navigate to Dashboards

### Create Dashboard

1. Click "+" → "Dashboard"
2. Add panel
3. Select Prometheus datasource
4. Enter query (e.g., `rate(http_request_duration_seconds_count[5m])`)
5. Save dashboard

### Recommended Panels

**API Overview:**
- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Active requests

**System Health:**
- CPU usage
- Memory usage
- Heap size

## Logging Interceptor

Automatically logs all requests with:
- HTTP method and URL
- User ID and email
- Request body (sanitized)
- Response time
- Status code

### Sensitive Data

The following fields are automatically redacted:
- `password`
- `token`
- `secret`
- `authorization`

## Exception Filter

Catches all exceptions and:
- Logs to Winston
- Sends to Sentry (if configured)
- Adds user context
- Returns formatted error response

## Usage Examples

### View Real-time Logs

```bash
# Development (console + files)
npm run start:dev

# Production (files only)
npm run start:prod
```

### Monitor Errors

Check Sentry dashboard for:
- Error frequency
- Stack traces
- User impact
- Performance issues

### Check Metrics

```bash
# API metrics
curl http://localhost:3000/metrics

# Prometheus UI
open http://localhost:9090

# Grafana dashboards
open http://localhost:3001
```

## Docker Commands

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Stop monitoring
docker-compose -f docker-compose.monitoring.yml down

# Remove volumes (reset data)
docker-compose -f docker-compose.monitoring.yml down -v
```

## Troubleshooting

### Logs not appearing

Check `LOG_DIR` exists:
```bash
mkdir -p logs
```

### Sentry not working

1. Verify `SENTRY_DSN` is set
2. Check console for initialization message
3. Trigger a test error

### Metrics not showing

1. Verify `/metrics` endpoint works
2. Check Prometheus targets: http://localhost:9090/targets
3. Verify `host.docker.internal` resolves

### Grafana can't connect

1. Check Prometheus is running
2. Verify datasource configuration
3. Test connection in Grafana settings

## Best Practices

✅ **Log Levels**
- `error`: Exceptions and failures
- `warn`: Warnings and deprecations
- `info`: General information (default)
- `debug`: Detailed debugging

✅ **Sensitive Data**
- Never log passwords
- Redact tokens and secrets
- Sanitize user input

✅ **Performance**
- Use appropriate log levels
- Rotate log files
- Monitor disk usage

✅ **Monitoring**
- Set up alerts in Grafana
- Monitor error rates
- Track response times

## Next Steps

**Enhancements:**
- Custom business metrics
- Advanced Grafana dashboards
- Alert rules in Prometheus
- Log aggregation (ELK stack)
- Distributed tracing (Jaeger)
