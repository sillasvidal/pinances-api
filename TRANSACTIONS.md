# Transactions Module - Documentation

## Overview

The Transactions module manages all financial movements in the system, including expenses, income, and transfers. Each transaction is user-scoped and can be linked to accounts, invoices, or commitments.

## Features

✅ **CRUD Operations** - Create, read, update, delete transactions  
✅ **Advanced Filtering** - Filter by type, date range, and category  
✅ **Statistics** - Get financial summaries for any period  
✅ **User Isolation** - Each user sees only their transactions  
✅ **JWT Protected** - All endpoints require authentication  
✅ **Swagger Documented** - Full API documentation  

## Endpoints

### Create Transaction

```http
POST /api/v1/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Compra no supermercado",
  "type": "expense",
  "amount": 150.50,
  "transaction_date": "2025-11-25",
  "account_id": "uuid-account",
  "category": "Alimentação",
  "notes": "Compra semanal"
}
```

### List Transactions with Filters

```http
GET /api/v1/transactions?type=expense&startDate=2025-01-01&endDate=2025-12-31&category=Alimentação
Authorization: Bearer {token}
```

**Query Parameters:**
- `type` (optional): `expense`, `income`, or `transfer`
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `category` (optional): Filter by category

### Get Transaction Statistics

```http
GET /api/v1/transactions/statistics?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total_income": 5000.00,
  "total_expenses": 3500.00,
  "total_transfers": 500.00,
  "balance": 1500.00,
  "by_category": [
    { "category": "Alimentação", "total": 800.00 },
    { "category": "Transporte", "total": 300.00 },
    { "category": "Lazer", "total": 200.00 }
  ]
}
```

### Get Transaction by ID

```http
GET /api/v1/transactions/{id}
Authorization: Bearer {token}
```

### Update Transaction

```http
PUT /api/v1/transactions/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 175.00,
  "category": "Alimentação e Bebidas"
}
```

### Delete Transaction

```http
DELETE /api/v1/transactions/{id}
Authorization: Bearer {token}
```

## Transaction Types

### Expense
Regular expenses like purchases, bills, etc.

```json
{
  "type": "expense",
  "description": "Conta de luz",
  "amount": 150.00,
  "transaction_date": "2025-11-25",
  "account_id": "uuid-account",
  "category": "Utilidades"
}
```

### Income
Income from salary, freelance work, etc.

```json
{
  "type": "income",
  "description": "Salário",
  "amount": 5000.00,
  "transaction_date": "2025-11-01",
  "account_id": "uuid-account",
  "category": "Salário"
}
```

### Transfer
Money transfers between accounts.

```json
{
  "type": "transfer",
  "description": "Transferência para investimento",
  "amount": 1000.00,
  "transaction_date": "2025-11-15",
  "account_id": "uuid-source-account"
}
```

## Linking to Commitments

When a transaction is part of an installment payment:

```json
{
  "type": "expense",
  "description": "Parcela 1/12 - Notebook",
  "amount": 100.00,
  "transaction_date": "2025-11-05",
  "invoice_id": "uuid-invoice",
  "commitment_id": "uuid-commitment",
  "installment_number": 1,
  "category": "Eletrônicos"
}
```

## Common Use Cases

### 1. Record a Simple Expense

```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Almoço",
    "type": "expense",
    "amount": 35.00,
    "transaction_date": "2025-11-25",
    "category": "Alimentação"
  }'
```

### 2. Get All Expenses for a Month

```bash
curl -X GET "http://localhost:3000/api/v1/transactions?type=expense&startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer {token}"
```

### 3. Get Monthly Statistics

```bash
curl -X GET "http://localhost:3000/api/v1/transactions/statistics?startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer {token}"
```

### 4. Filter by Category

```bash
curl -X GET "http://localhost:3000/api/v1/transactions?category=Alimentação&startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer {token}"
```

## Data Model

```typescript
{
  id: string;                    // UUID
  description: string;           // Transaction description
  type: 'expense' | 'income' | 'transfer';
  amount: number;                // Transaction amount
  transaction_date: Date;        // When it happened (impacts cash flow)
  account_id?: string;           // Related account
  invoice_id?: string;           // Related invoice (credit card)
  commitment_id?: string;        // Related commitment (installment)
  installment_number?: number;   // Which installment (1, 2, 3...)
  category?: string;             // Transaction category
  notes?: string;                // Additional notes
  user_id: string;               // Owner (auto-set)
  created_at: Date;
  updated_at: Date;
}
```

## Testing in Swagger

1. Go to `http://localhost:3000/documentation`
2. Authorize with your JWT token
3. Navigate to the **transactions** section
4. Try the endpoints:
   - Create a transaction
   - List with filters
   - Get statistics
   - Update/delete

## Next Steps

The Transactions module is complete and ready to use! You can now:

- ✅ Record expenses, income, and transfers
- ✅ Filter transactions by multiple criteria
- ✅ Get financial statistics
- ✅ Link transactions to accounts and commitments

**Remaining modules to implement:**
- Cards module (credit card management)
- Commitments module (installment tracking)
- Reports module (accrual vs cash flow)
