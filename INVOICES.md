# Invoices Module - Documentation

## Overview

The Invoices module manages monthly credit card invoices. Each invoice tracks charges for a specific period, payment status, and automatically calculates due dates based on the card's configuration.

## Features

✅ **CRUD Operations** - Create, read, update, delete invoices  
✅ **Monthly Generation** - Auto-generate invoices based on card closing dates  
✅ **Payment Tracking** - Record full or partial payments  
✅ **Invoice Closing** - Close invoices to prevent new charges  
✅ **Overdue Detection** - Automatically mark overdue invoices  
✅ **Advanced Filtering** - Filter by card, status, and date range  
✅ **User Isolation** - Each user sees only their invoices  
✅ **JWT Protected** - All endpoints require authentication  

## Invoice Lifecycle

```
OPEN → CLOSED → PAID
  ↓
OVERDUE (if past due date and unpaid)
```

- **OPEN**: Invoice is active, charges can be added
- **CLOSED**: Invoice closed on closing_day, no more charges
- **PAID**: Invoice fully paid
- **OVERDUE**: Past due date and not fully paid

## Endpoints

### Generate Monthly Invoice

```http
POST /api/v1/invoices/generate/{cardId}
Authorization: Bearer {token}
```

Automatically generates an invoice with:
- Closing date based on card's `closing_day`
- Due date based on card's `due_day`
- Initial amount: 0
- Status: open

### Create Invoice Manually

```http
POST /api/v1/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "card_id": "uuid-card",
  "closing_date": "2025-11-15",
  "due_date": "2025-11-25",
  "total_amount": 0,
  "paid_amount": 0,
  "status": "open"
}
```

### List Invoices with Filters

```http
GET /api/v1/invoices?cardId=uuid&status=open&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

**Query Parameters:**
- `cardId` (optional): Filter by card UUID
- `status` (optional): `open`, `closed`, `paid`, or `overdue`
- `startDate` (optional): Filter by due date range
- `endDate` (optional): Filter by due date range

### Get Invoice Details

```http
GET /api/v1/invoices/{id}
Authorization: Bearer {token}
```

Returns invoice with all associated transactions.

### Pay Invoice

```http
POST /api/v1/invoices/{id}/pay
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1500.00
}
```

- Supports partial payments
- Automatically updates status to `paid` when fully paid
- Validates payment doesn't exceed total

### Close Invoice

```http
POST /api/v1/invoices/{id}/close
Authorization: Bearer {token}
```

Changes status from `open` to `closed`. No more charges can be added.

### Update Invoice

```http
PUT /api/v1/invoices/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "total_amount": 2000.00
}
```

### Delete Invoice

```http
DELETE /api/v1/invoices/{id}
Authorization: Bearer {token}
```

## Common Use Cases

### 1. Generate Invoice for Current Month

```bash
curl -X POST http://localhost:3000/api/v1/invoices/generate/{cardId} \
  -H "Authorization: Bearer {token}"
```

### 2. List All Open Invoices

```bash
curl -X GET "http://localhost:3000/api/v1/invoices?status=open" \
  -H "Authorization: Bearer {token}"
```

### 3. Pay Invoice in Full

```bash
curl -X POST http://localhost:3000/api/v1/invoices/{id}/pay \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500.00
  }'
```

### 4. Make Partial Payment

```bash
curl -X POST http://localhost:3000/api/v1/invoices/{id}/pay \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500.00
  }'
```

### 5. Close Invoice on Closing Day

```bash
curl -X POST http://localhost:3000/api/v1/invoices/{id}/close \
  -H "Authorization: Bearer {token}"
```

### 6. Get Invoices for a Specific Card

```bash
curl -X GET "http://localhost:3000/api/v1/invoices?cardId={cardId}" \
  -H "Authorization: Bearer {token}"
```

## Data Model

```typescript
{
  id: string;              // UUID
  card_id: string;         // Related card
  closing_date: Date;      // When invoice closes
  due_date: Date;          // Payment due date
  total_amount: number;    // Total invoice amount
  paid_amount: number;     // Amount already paid
  status: 'open' | 'closed' | 'paid' | 'overdue';
  created_at: Date;
  updated_at: Date;
  
  // Relations
  card: Card;              // Card details
  transactions: Transaction[];  // All charges
}
```

## Invoice Generation Logic

When generating a monthly invoice:

```typescript
// Example: Card with closing_day=15, due_day=25
const today = new Date('2025-11-10');

// Closing date: 15th of current month
const closingDate = new Date(2025, 10, 15); // Nov 15

// Due date: 25th of current month
const dueDate = new Date(2025, 10, 25); // Nov 25

// If due_day < closing_day, due date is next month
// Example: closing_day=25, due_day=10
// closingDate = Nov 25
// dueDate = Dec 10
```

## Payment Tracking

```typescript
// Initial invoice
{
  total_amount: 2000.00,
  paid_amount: 0.00,
  status: 'open'
}

// After partial payment of 500
{
  total_amount: 2000.00,
  paid_amount: 500.00,
  status: 'closed' // or 'open'
}

// After full payment
{
  total_amount: 2000.00,
  paid_amount: 2000.00,
  status: 'paid' // Auto-updated
}
```

## Overdue Detection

The service includes a method to mark overdue invoices:

```typescript
async updateOverdueInvoices(): Promise<void>
```

This can be called periodically (e.g., daily cron job) to:
- Find invoices past due date
- With status `open` or `closed`
- Not fully paid
- Update status to `overdue`

## Integration with Transactions

When creating a transaction linked to an invoice:

```json
{
  "description": "Compra no supermercado",
  "type": "expense",
  "amount": 150.00,
  "transaction_date": "2025-11-10",
  "invoice_id": "uuid-invoice",
  "category": "Alimentação"
}
```

The invoice's `total_amount` should be updated accordingly (this will be automated in future updates).

## Testing in Swagger

1. Go to `http://localhost:3000/documentation`
2. Authorize with your JWT token
3. Navigate to the **invoices** section
4. Try the workflow:
   - Generate invoice for a card
   - Add transactions to the invoice
   - Close the invoice
   - Pay the invoice
   - Check status changes

## Next Steps

The Invoices module is complete! Future enhancements:

- ✅ Auto-update `total_amount` when transactions are added
- ✅ Scheduled job to auto-generate monthly invoices
- ✅ Scheduled job to mark overdue invoices
- ✅ Email notifications for due dates
- ✅ Payment history tracking

**Remaining modules:**
- Commitments module (installment tracking with accrual impact)
- Reports module (accrual vs cash flow analysis)
