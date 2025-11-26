# Reports Module - Documentation

## Overview

The Reports module provides financial analysis comparing **Accrual (DRE)** and **Cash Flow** accounting regimes. This is the culmination of the dual accounting system.

## Report Types

### 1. Cash Flow Report (Fluxo de Caixa)
Shows actual money movements based on transaction dates.

### 2. Accrual Report (DRE - Demonstração do Resultado)
Shows financial obligations based on commitment dates.

### 3. Comparative Report
Side-by-side comparison of both regimes.

### 4. Monthly Projection
Future expense projection based on active commitments.

## Endpoints

### Cash Flow Report

```http
GET /api/v1/reports/cash-flow?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "period": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  },
  "income": 60000.00,
  "expenses": 45000.00,
  "balance": 15000.00,
  "by_category": [
    { "category": "Alimentação", "amount": 12000.00 },
    { "category": "Transporte", "amount": 8000.00 }
  ]
}
```

### Accrual Report

```http
GET /api/v1/reports/accrual?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "period": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  },
  "income": 60000.00,
  "expenses": 52000.00,
  "balance": 8000.00,
  "by_category": [
    { "category": "Alimentação", "amount": 12000.00 },
    { "category": "Eletrônicos", "amount": 15000.00 }
  ]
}
```

### Comparative Report

```http
GET /api/v1/reports/comparative?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "period": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  },
  "cash_flow": {
    "income": 60000.00,
    "expenses": 45000.00,
    "balance": 15000.00
  },
  "accrual": {
    "income": 60000.00,
    "expenses": 52000.00,
    "balance": 8000.00
  },
  "difference": {
    "income": 0.00,
    "expenses": 7000.00,
    "balance": -7000.00
  }
}
```

### Monthly Projection

```http
GET /api/v1/reports/projection?months=12
Authorization: Bearer {token}
```

**Response:**
```json
{
  "projections": [
    {
      "month": "2025-12",
      "expected_expenses": 2500.00,
      "committed_expenses": 2500.00
    },
    {
      "month": "2026-01",
      "expected_expenses": 2500.00,
      "committed_expenses": 2500.00
    }
  ]
}
```

## Example Scenario

### Situation
- **Nov 2025**: Buy R$ 12,000 notebook in 12x of R$ 1,000
- **Monthly salary**: R$ 5,000
- **Monthly expenses**: R$ 2,000 (food, transport, etc.)

### Cash Flow (Nov 2025)
```
Income:   R$ 5,000 (salary)
Expenses: R$ 2,000 (regular) + R$ 1,000 (1st installment) = R$ 3,000
Balance:  R$ 2,000
```

### Accrual (Nov 2025)
```
Income:   R$ 5,000 (salary)
Expenses: R$ 2,000 (regular) + R$ 12,000 (notebook commitment) = R$ 14,000
Balance:  -R$ 9,000
```

### Interpretation
- **Cash Flow**: Positive R$ 2,000 (you have money)
- **Accrual**: Negative R$ 9,000 (you're in debt)
- **Reality**: You assumed a R$ 12,000 obligation but only paid R$ 1,000

## Use Cases

### 1. Monthly Analysis

```bash
curl -X GET "http://localhost:3000/api/v1/reports/comparative?startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer {token}"
```

### 2. Annual Summary

```bash
curl -X GET "http://localhost:3000/api/v1/reports/comparative?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer {token}"
```

### 3. Future Planning

```bash
curl -X GET "http://localhost:3000/api/v1/reports/projection?months=12" \
  -H "Authorization: Bearer {token}"
```

## Report Logic

### Cash Flow Calculation
```typescript
// Sum all transactions in period
income = SUM(transactions WHERE type='income' AND date IN period)
expenses = SUM(transactions WHERE type='expense' AND date IN period)
balance = income - expenses
```

### Accrual Calculation
```typescript
// Sum commitments assumed in period + one-time transactions
commitmentExpenses = SUM(commitments WHERE type='expense' AND accrual_date IN period)
transactionExpenses = SUM(transactions WHERE type='expense' AND commitment_id IS NULL AND date IN period)
totalExpenses = commitmentExpenses + transactionExpenses
```

### Projection Calculation
```typescript
// For each future month, calculate installments due
FOR each commitment:
  FOR each unpaid installment:
    IF installment_date IN month:
      monthExpenses += installment_amount
```

## Testing in Swagger

1. Go to `http://localhost:3000/documentation`
2. Authorize with your JWT token
3. Navigate to **reports** section
4. Try each report type:
   - Cash flow for current month
   - Accrual for current month
   - Comparative to see difference
   - Projection for next 12 months

## Real-World Example

**January 2025:**
- Salary: R$ 5,000
- Regular expenses: R$ 2,000
- Buy TV: R$ 3,600 in 12x of R$ 300

**Cash Flow (Jan):**
```
Income:   R$ 5,000
Expenses: R$ 2,000 + R$ 300 = R$ 2,300
Balance:  R$ 2,700 ✅ Positive
```

**Accrual (Jan):**
```
Income:   R$ 5,000
Expenses: R$ 2,000 + R$ 3,600 = R$ 5,600
Balance:  -R$ 600 ⚠️ Negative
```

**Insight:** You're spending more than you earn when considering obligations!

## Benefits

✅ **Dual Perspective** - See both cash and accrual views  
✅ **Category Breakdown** - Understand where money goes  
✅ **Future Planning** - Project expenses based on commitments  
✅ **Financial Health** - Identify if you're over-committed  
✅ **Decision Making** - Know if you can afford new commitments  

## Next Steps

All core modules are complete! The system now supports:

✅ **User Authentication** - Multi-user with JWT  
✅ **Accounts** - Bank and investment accounts  
✅ **Cards** - Credit card management  
✅ **Invoices** - Auto-generated monthly invoices  
✅ **Transactions** - Financial movements  
✅ **Commitments** - Installment tracking  
✅ **Reports** - Accrual vs Cash Flow analysis  

**Future enhancements:**
- Budgets and goals
- Recurring transactions
- Categories management
- Export to Excel/PDF
- Charts and visualizations
- Email notifications
