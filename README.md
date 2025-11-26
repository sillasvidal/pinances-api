# Pinances API

Personal finance management API built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Dual Accounting Regimes**: Supports both Accrual (DRE) and Cash Flow accounting
- **Account Management**: Track checking and investment accounts
- **Credit Card Management**: Manage cards, invoices, and payment cycles
- **Installment Tracking**: Separate commitment obligations from actual payments
- **Commitment Reserve**: Prevent double-spending of committed funds

## Database Schema

The system uses 5 main entities:

- **accounts**: Bank accounts (checking/investment) with commitment reserves
- **cards**: Credit cards with closing and due dates
- **invoices**: Monthly credit card invoices
- **commitments**: Installment obligations (impacts accrual accounting)
- **transactions**: Actual financial movements (impacts cash flow)

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
```

### Environment Variables

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=pinances
PORT=3000
```

### Database Setup

```bash
# Create database
createdb pinances

# Run the application (TypeORM will auto-sync in development)
npm run start:dev
```

The application will start on `http://localhost:3000`

## API Documentation

**Swagger UI** is available at:

```
http://localhost:3000/documentation
```

The interactive documentation allows you to:
- View all available endpoints
- Test API requests directly from the browser
- See request/response schemas
- View example payloads

See [SWAGGER.md](./SWAGGER.md) for detailed documentation guide.

## API Endpoints

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/accounts` | List all accounts |
| GET | `/api/v1/accounts/:id` | Get account details |
| GET | `/api/v1/accounts/:id/balance` | Get account balance and reserve |
| POST | `/api/v1/accounts` | Create new account |
| PUT | `/api/v1/accounts/:id` | Update account |
| DELETE | `/api/v1/accounts/:id` | Soft delete account |

### Example: Create Account

```bash
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Corrente Nubank",
    "type": "checking",
    "current_balance": 5000.00,
    "institution": "Nubank"
  }'
```

### Example: Get Account Balance

```bash
curl http://localhost:3000/api/v1/accounts/{id}/balance
```

Response:
```json
{
  "current_balance": 5000.00,
  "commitment_reserve": 1200.00,
  "available_balance": 3800.00
}
```

## Project Structure

```
src/
├── entities/           # TypeORM entities
│   ├── account.entity.ts
│   ├── card.entity.ts
│   ├── invoice.entity.ts
│   ├── commitment.entity.ts
│   └── transaction.entity.ts
├── accounts/          # Accounts module
│   ├── accounts.module.ts
│   ├── accounts.controller.ts
│   ├── accounts.service.ts
│   └── dto/
│       ├── create-account.dto.ts
│       └── update-account.dto.ts
├── config/            # Configuration files
│   └── typeorm.config.ts
└── app.module.ts      # Root module
```

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Run tests
npm run test

# Lint and format
npm run lint
npm run format
```

## Next Steps

To complete the implementation:

1. **Create remaining modules**: Cards, Commitments, Transactions, Reports
2. **Implement commitment logic**: Auto-reserve funds when creating installments
3. **Build reports endpoints**: Accrual vs Cash flow calculations
4. **Add authentication**: JWT-based auth for multi-user support
5. **Create migrations**: Replace auto-sync with proper migrations
6. **Add tests**: Unit and integration tests
7. **API documentation**: Swagger/OpenAPI integration

## Architecture Highlights

### Accrual vs Cash Accounting

- **Commitments** impact the accrual regime on `accrual_date`
- **Transactions** impact cash flow on `transaction_date`
- When paying an installment, create a **Transaction** linked to the **Commitment**

### Commitment Reserve

Investment accounts track `commitment_reserve` to ensure committed funds aren't spent twice:

1. Create commitment → Reserve full amount
2. Pay installment → Reduce reserve by installment amount
3. Cancel commitment → Release full reserve

## License

UNLICENSED
