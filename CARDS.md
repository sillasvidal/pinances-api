# Cards Module - Documentation

## Overview

The Cards module manages credit cards in the system. Each card tracks closing dates, due dates, limits, and is user-scoped for multi-tenant support.

## Features

✅ **CRUD Operations** - Create, read, update, delete credit cards  
✅ **Card Summary** - Get limit and usage information  
✅ **User Isolation** - Each user sees only their cards  
✅ **JWT Protected** - All endpoints require authentication  
✅ **Swagger Documented** - Full API documentation  
✅ **Soft Delete** - Cards are deactivated, not permanently deleted  

## Endpoints

### Create Card

```http
POST /api/v1/cards
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nubank Ultravioleta",
  "brand": "Mastercard",
  "last_digits": "1234",
  "total_limit": 5000.00,
  "closing_day": 15,
  "due_day": 25
}
```

### List All Cards

```http
GET /api/v1/cards
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Nubank Ultravioleta",
    "brand": "Mastercard",
    "last_digits": "1234",
    "total_limit": 5000.00,
    "closing_day": 15,
    "due_day": 25,
    "active": true,
    "created_at": "2025-11-25T10:00:00Z",
    "updated_at": "2025-11-25T10:00:00Z"
  }
]
```

### Get Card by ID

```http
GET /api/v1/cards/{id}
Authorization: Bearer {token}
```

### Get Card Summary

```http
GET /api/v1/cards/{id}/summary
Authorization: Bearer {token}
```

**Response:**
```json
{
  "card": {
    "id": "uuid",
    "name": "Nubank Ultravioleta",
    "brand": "Mastercard",
    "last_digits": "1234",
    "total_limit": 5000.00,
    "closing_day": 15,
    "due_day": 25
  },
  "total_limit": 5000.00,
  "available_limit": 5000.00,
  "current_usage": 0.00
}
```

> **Note:** Current usage calculation will be implemented when the Invoices module is added.

### Update Card

```http
PUT /api/v1/cards/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nubank Ultravioleta Premium",
  "total_limit": 10000.00
}
```

### Delete Card (Soft Delete)

```http
DELETE /api/v1/cards/{id}
Authorization: Bearer {token}
```

## Card Cycle

Credit cards have two important dates:

### Closing Day
The day when the invoice closes and no more charges are added to the current invoice.

### Due Day
The day when the invoice payment is due.

**Example:**
- **Closing Day**: 15th of each month
- **Due Day**: 25th of each month

**Timeline:**
1. **Nov 1-15**: Purchases go to November invoice
2. **Nov 15**: Invoice closes
3. **Nov 16-Dec 15**: Purchases go to December invoice
4. **Nov 25**: November invoice payment due

## Common Use Cases

### 1. Add a New Credit Card

```bash
curl -X POST http://localhost:3000/api/v1/cards \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Itaú Personnalité",
    "brand": "Visa",
    "last_digits": "5678",
    "total_limit": 8000.00,
    "closing_day": 10,
    "due_day": 20
  }'
```

### 2. List All Your Cards

```bash
curl -X GET http://localhost:3000/api/v1/cards \
  -H "Authorization: Bearer {token}"
```

### 3. Check Card Limit and Usage

```bash
curl -X GET http://localhost:3000/api/v1/cards/{id}/summary \
  -H "Authorization: Bearer {token}"
```

### 4. Update Card Limit

```bash
curl -X PUT http://localhost:3000/api/v1/cards/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "total_limit": 12000.00
  }'
```

### 5. Deactivate a Card

```bash
curl -X DELETE http://localhost:3000/api/v1/cards/{id} \
  -H "Authorization: Bearer {token}"
```

## Data Model

```typescript
{
  id: string;              // UUID
  name: string;            // Card name/nickname
  brand: string;           // Visa, Mastercard, etc.
  last_digits: string;     // Last 4 digits (for identification)
  total_limit: number;     // Credit limit
  closing_day: number;     // Day of month (1-31)
  due_day: number;         // Day of month (1-31)
  active: boolean;         // Whether card is active
  user_id: string;         // Owner (auto-set)
  created_at: Date;
  updated_at: Date;
}
```

## Validation Rules

- **name**: Required, string
- **brand**: Required, string
- **last_digits**: Required, exactly 4 characters
- **total_limit**: Optional, number
- **closing_day**: Required, integer between 1-31
- **due_day**: Required, integer between 1-31
- **active**: Optional, boolean (default: true)

## Testing in Swagger

1. Go to `http://localhost:3000/documentation`
2. Authorize with your JWT token
3. Navigate to the **cards** section
4. Try the endpoints:
   - Create a card
   - List your cards
   - Get card summary
   - Update/delete

## Integration with Other Modules

The Cards module integrates with:

- **Invoices** (to be implemented): Monthly invoices for each card
- **Commitments**: Installment purchases on credit cards
- **Transactions**: Individual purchases on the card

## Next Steps

The Cards module is complete! Future enhancements:

- ✅ Invoices module (monthly invoice management)
- ✅ Auto-generate invoices based on closing_day
- ✅ Track card usage across invoices
- ✅ Payment tracking
- ✅ Invoice history

**Remaining modules:**
- Commitments module (installment tracking)
- Invoices module (credit card invoices)
- Reports module (accrual vs cash flow)
