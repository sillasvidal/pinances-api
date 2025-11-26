# Swagger Documentation Setup

## Access Swagger UI

Once the application is running, access the interactive API documentation at:

```
http://localhost:3000/documentation
```

## Features

- **Interactive API Testing**: Test all endpoints directly from the browser
- **Request/Response Schemas**: View detailed data structures
- **Example Values**: Pre-filled examples for easy testing
- **Validation Rules**: See all validation constraints

## Available Endpoints

### Accounts Module

All account management endpoints are documented with:
- Request body schemas
- Response examples
- HTTP status codes
- Error responses

**Endpoints:**
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts` - List all accounts
- `GET /api/v1/accounts/:id` - Get account details
- `GET /api/v1/accounts/:id/balance` - Get balance info
- `PUT /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Soft delete account

## Testing Without Database

If PostgreSQL is not running, you can still view the Swagger documentation. However, to test the endpoints, you'll need to:

1. **Start PostgreSQL**:
   ```bash
   # macOS with Homebrew
   brew services start postgresql@14
   
   # Or using Docker
   docker run --name pinances-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=pinances \
     -p 5432:5432 \
     -d postgres:14
   ```

2. **Create .env file**:
   ```bash
   cp .env.example .env
   ```

3. **Start the application**:
   ```bash
   npm run start:dev
   ```

## Swagger Configuration

The Swagger setup includes:

- **Title**: Pinances API
- **Description**: Personal finance management with dual accounting regimes
- **Version**: 1.0
- **Tags**: accounts, cards, commitments, transactions, reports

## Example: Testing Account Creation

1. Navigate to `http://localhost:3000/documentation`
2. Find the `POST /api/v1/accounts` endpoint
3. Click "Try it out"
4. Use the pre-filled example or modify:
   ```json
   {
     "name": "Conta Corrente Nubank",
     "type": "checking",
     "current_balance": 5000.00,
     "institution": "Nubank"
   }
   ```
5. Click "Execute"
6. View the response

## Global Validation

All requests are automatically validated using:
- `whitelist: true` - Strips unknown properties
- `forbidNonWhitelisted: true` - Rejects unknown properties
- `transform: true` - Auto-transforms types

Invalid requests will return `400 Bad Request` with detailed error messages.
