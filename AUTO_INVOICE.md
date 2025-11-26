# Auto-Invoice Generation - Documentation

## Overview

The system now automatically creates credit card invoices when you add card transactions. You no longer need to manually create invoices!

## How It Works

When you create a card transaction using the special endpoint, the system:

1. **Determines the invoice period** based on the transaction date and card's closing day
2. **Finds or creates** the appropriate invoice automatically
3. **Links the transaction** to the invoice
4. **Updates the invoice total** automatically

## Smart Invoice Period Calculation

The system intelligently determines which invoice period a transaction belongs to:

```
Card: closing_day = 15, due_day = 25

Transaction on Nov 10 → Goes to November invoice (closes Nov 15)
Transaction on Nov 20 → Goes to December invoice (closes Dec 15)
```

**Logic:**
- If transaction date ≤ closing_day → Current month's invoice
- If transaction date > closing_day → Next month's invoice

## New Endpoint

### Create Card Transaction (Auto-Invoice)

```http
POST /api/v1/transactions/card
Authorization: Bearer {token}
Content-Type: application/json

{
  "card_id": "uuid-card",
  "description": "Compra no supermercado",
  "amount": 150.00,
  "transaction_date": "2025-11-20",
  "category": "Alimentação"
}
```

**Response:**
```json
{
  "transaction": {
    "id": "uuid-transaction",
    "description": "Compra no supermercado",
    "type": "expense",
    "amount": 150.00,
    "transaction_date": "2025-11-20",
    "invoice_id": "uuid-invoice",
    "category": "Alimentação"
  },
  "invoice": {
    "id": "uuid-invoice",
    "closing_date": "2025-12-15",
    "due_date": "2025-12-25",
    "status": "open"
  }
}
```

## Example Scenarios

### Scenario 1: First Transaction of the Month

```bash
# Card: closing_day=15, due_day=25
# Transaction on Nov 10

curl -X POST http://localhost:3000/api/v1/transactions/card \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "uuid-card",
    "description": "Netflix",
    "amount": 45.90,
    "transaction_date": "2025-11-10",
    "category": "Assinaturas"
  }'
```

**Result:**
- ✅ Creates November invoice (closing: Nov 15, due: Nov 25)
- ✅ Adds transaction to November invoice
- ✅ Invoice total: R$ 45.90

### Scenario 2: Adding to Existing Invoice

```bash
# Same card, transaction on Nov 12 (before closing)

curl -X POST http://localhost:3000/api/v1/transactions/card \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "uuid-card",
    "description": "Uber",
    "amount": 25.00,
    "transaction_date": "2025-11-12",
    "category": "Transporte"
  }'
```

**Result:**
- ✅ Finds existing November invoice
- ✅ Adds transaction to same invoice
- ✅ Invoice total updated: R$ 70.90

### Scenario 3: Transaction After Closing Day

```bash
# Transaction on Nov 20 (after closing day 15)

curl -X POST http://localhost:3000/api/v1/transactions/card \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "uuid-card",
    "description": "Restaurante",
    "amount": 120.00,
    "transaction_date": "2025-11-20",
    "category": "Alimentação"
  }'
```

**Result:**
- ✅ Creates December invoice (closing: Dec 15, due: Dec 25)
- ✅ Adds transaction to December invoice
- ✅ November invoice remains at R$ 70.90
- ✅ December invoice total: R$ 120.00

## Invoice Period Examples

### Card with closing_day=15, due_day=25

| Transaction Date | Invoice Period | Closing Date | Due Date |
|-----------------|----------------|--------------|----------|
| Nov 1 - Nov 15  | November       | Nov 15       | Nov 25   |
| Nov 16 - Dec 15 | December       | Dec 15       | Dec 25   |
| Dec 16 - Jan 15 | January        | Jan 15       | Jan 25   |

### Card with closing_day=25, due_day=10

| Transaction Date | Invoice Period | Closing Date | Due Date |
|-----------------|----------------|--------------|----------|
| Nov 1 - Nov 25  | November       | Nov 25       | Dec 10   |
| Nov 26 - Dec 25 | December       | Dec 25       | Jan 10   |
| Dec 26 - Jan 25 | January        | Jan 25       | Feb 10   |

## Automatic Total Calculation

The invoice `total_amount` is automatically calculated by summing all linked transactions:

```typescript
// Invoice starts at 0
invoice.total_amount = 0

// Add transaction 1: R$ 45.90
invoice.total_amount = 45.90

// Add transaction 2: R$ 25.00
invoice.total_amount = 70.90

// Add transaction 3: R$ 120.00 (different invoice)
// Previous invoice stays at 70.90
```

## Installment Transactions

For installment purchases, link to a commitment:

```bash
curl -X POST http://localhost:3000/api/v1/transactions/card \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "uuid-card",
    "description": "Parcela 1/12 - Notebook",
    "amount": 250.00,
    "transaction_date": "2025-11-10",
    "commitment_id": "uuid-commitment",
    "installment_number": 1,
    "category": "Eletrônicos"
  }'
```

## Benefits

✅ **No Manual Work** - Invoices created automatically  
✅ **Smart Period Detection** - Correct invoice based on closing dates  
✅ **Automatic Totals** - Invoice amounts always up-to-date  
✅ **Reuses Invoices** - Multiple transactions in same period use same invoice  
✅ **Accurate Tracking** - Each transaction knows its invoice  

## Testing in Swagger

1. Go to `http://localhost:3000/documentation`
2. Authorize with your JWT token
3. Navigate to **transactions** section
4. Find `POST /api/v1/transactions/card`
5. Try creating transactions with different dates
6. Check the **invoices** section to see auto-created invoices

## Migration from Manual Creation

If you were manually creating invoices before:

**Old Way (Manual):**
```bash
# Step 1: Create invoice
POST /api/v1/invoices/generate/{cardId}

# Step 2: Create transaction with invoice_id
POST /api/v1/transactions
{
  "invoice_id": "...",
  "description": "...",
  ...
}
```

**New Way (Automatic):**
```bash
# Single step - invoice created automatically!
POST /api/v1/transactions/card
{
  "card_id": "...",
  "description": "...",
  ...
}
```

## Next Steps

Future enhancements:
- ✅ Auto-close invoices on closing date
- ✅ Scheduled job to generate invoices for all cards
- ✅ Notifications when invoice is created
- ✅ Bulk import of card transactions
