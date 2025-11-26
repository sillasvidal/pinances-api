# Commitments Module - Documentation

## Overview

The Commitments module manages installment purchases and obligations. This is the **key module** for separating Accrual (DRE) from Cash Flow accounting regimes.

## Key Concepts

### Accrual vs Cash Flow

**Commitment (Accrual Impact):**
- When you buy a R$ 3,000 notebook in 12 installments
- The **full R$ 3,000** impacts your accrual accounting **immediately** on `accrual_date`
- This represents the obligation you assumed

**Transactions (Cash Flow Impact):**
- Each R$ 250 monthly payment impacts cash flow when paid
- 12 separate transactions linked to the commitment
- Each transaction has its own `transaction_date`

## Features

✅ **CRUD Operations** - Create, read, update, delete commitments  
✅ **Fund Reservation** - Auto-reserves funds in investment accounts  
✅ **Payment Tracking** - Track which installments are paid  
✅ **Progress Summary** - See payment progress and next due date  
✅ **Flexible Payment** - Support for cards or accounts  
✅ **Multiple Frequencies** - Monthly, weekly, or annual  
✅ **User Isolation** - Each user sees only their commitments  

## Endpoints

### Create Commitment

```http
POST /api/v1/commitments
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Notebook Dell",
  "type": "expense",
  "total_amount": 3000.00,
  "installments_count": 12,
  "installment_amount": 250.00,
  "accrual_date": "2025-11-25",
  "first_installment_date": "2025-12-05",
  "frequency": "monthly",
  "card_id": "uuid-card",
  "category": "Eletrônicos"
}
```

**Response:**
```json
{
  "id": "uuid",
  "description": "Notebook Dell",
  "type": "expense",
  "total_amount": 3000.00,
  "installments_count": 12,
  "installment_amount": 250.00,
  "accrual_date": "2025-11-25",
  "first_installment_date": "2025-12-05",
  "frequency": "monthly",
  "card_id": "uuid-card",
  "category": "Eletrônicos",
  "active": true
}
```

### List Commitments

```http
GET /api/v1/commitments?type=expense&active=true&category=Eletrônicos
Authorization: Bearer {token}
```

### Get Commitment Summary

```http
GET /api/v1/commitments/{id}/summary
Authorization: Bearer {token}
```

**Response:**
```json
{
  "commitment": { ... },
  "total_amount": 3000.00,
  "installment_amount": 250.00,
  "installments_paid": 3,
  "installments_remaining": 9,
  "amount_paid": 750.00,
  "amount_remaining": 2250.00,
  "next_installment_date": "2026-03-05"
}
```

## Use Cases

### 1. Credit Card Purchase (12x)

```bash
curl -X POST http://localhost:3000/api/v1/commitments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Notebook Dell Inspiron",
    "type": "expense",
    "total_amount": 3000.00,
    "installments_count": 12,
    "installment_amount": 250.00,
    "accrual_date": "2025-11-25",
    "first_installment_date": "2025-12-05",
    "frequency": "monthly",
    "card_id": "uuid-card",
    "category": "Eletrônicos"
  }'
```

**Impact:**
- ✅ Accrual: R$ 3,000 on Nov 25, 2025
- ✅ Cash Flow: R$ 250/month starting Dec 5, 2025

### 2. Investment Account Purchase (Reserved Funds)

```bash
curl -X POST http://localhost:3000/api/v1/commitments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Curso de programação",
    "type": "expense",
    "total_amount": 1200.00,
    "installments_count": 6,
    "installment_amount": 200.00,
    "accrual_date": "2025-11-25",
    "first_installment_date": "2025-12-01",
    "frequency": "monthly",
    "source_account_id": "uuid-investment-account",
    "category": "Educação"
  }'
```

**Impact:**
- ✅ Accrual: R$ 1,200 on Nov 25
- ✅ Reserves R$ 1,200 in investment account
- ✅ Cash Flow: R$ 200/month as paid
- ✅ Reserve decreases as installments are paid

### 3. Check Payment Progress

```bash
curl -X GET http://localhost:3000/api/v1/commitments/{id}/summary \
  -H "Authorization: Bearer {token}"
```

## Fund Reservation Logic

When creating a commitment with an **investment account**:

```typescript
// Before commitment
account.current_balance = 10,000
account.commitment_reserve = 0
account.available_balance = 10,000

// After creating R$ 3,000 commitment
account.current_balance = 10,000
account.commitment_reserve = 3,000
account.available_balance = 7,000

// After paying 1st installment (R$ 250)
account.current_balance = 9,750
account.commitment_reserve = 2,750
account.available_balance = 7,000
```

## Payment Frequencies

### Monthly
```json
{
  "frequency": "monthly",
  "first_installment_date": "2025-12-05"
}
```
Payments: Dec 5, Jan 5, Feb 5, Mar 5, ...

### Weekly
```json
{
  "frequency": "weekly",
  "first_installment_date": "2025-12-05"
}
```
Payments: Dec 5, Dec 12, Dec 19, Dec 26, ...

### Annual
```json
{
  "frequency": "annual",
  "first_installment_date": "2025-12-05"
}
```
Payments: Dec 5 2025, Dec 5 2026, Dec 5 2027, ...

## Integration with Transactions

When creating installment payments, link to the commitment:

```bash
curl -X POST http://localhost:3000/api/v1/transactions/card \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "uuid-card",
    "description": "Parcela 1/12 - Notebook Dell",
    "amount": 250.00,
    "transaction_date": "2025-12-05",
    "commitment_id": "uuid-commitment",
    "installment_number": 1,
    "category": "Eletrônicos"
  }'
```

## Accrual vs Cash Flow Example

**Purchase:** Notebook for R$ 3,000 in 12x of R$ 250

### Accrual Regime (DRE)
```
Nov 2025: -R$ 3,000 (obligation assumed)
Dec 2025: R$ 0
Jan 2026: R$ 0
...
```

### Cash Flow Regime
```
Nov 2025: R$ 0
Dec 2025: -R$ 250 (1st payment)
Jan 2026: -R$ 250 (2nd payment)
Feb 2026: -R$ 250 (3rd payment)
...
```

## Data Model

```typescript
{
  id: string;
  description: string;
  type: 'expense' | 'income';
  total_amount: number;        // Accrual impact
  installments_count: number;
  installment_amount: number;  // Cash flow impact per period
  accrual_date: Date;          // When obligation was assumed
  first_installment_date: Date;
  frequency: 'monthly' | 'weekly' | 'annual';
  card_id?: string;
  source_account_id?: string;
  category?: string;
  active: boolean;
  user_id: string;
  transactions: Transaction[]; // Paid installments
}
```

## Testing in Swagger

1. Go to `http://localhost:3000/documentation`
2. Authorize with your JWT token
3. Navigate to **commitments** section
4. Create a commitment
5. Check the summary to see progress
6. Create transactions linked to the commitment
7. Check summary again to see updated progress

## Next Steps

The Commitments module is complete! This is the foundation for:

- ✅ Reports module (accrual vs cash flow analysis)
- ✅ Budget tracking based on commitments
- ✅ Financial projections
- ✅ Cash flow forecasting

**Remaining module:**
- Reports module (DRE vs Fluxo de Caixa)
