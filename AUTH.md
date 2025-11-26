# Authentication System - Quick Start Guide

## Overview

The API now supports multi-user authentication with JWT tokens. All financial data is isolated per user.

## Authentication Flow

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Use Protected Endpoints

All financial endpoints now require authentication. Include the JWT token in the Authorization header:

```bash
curl -X GET http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```bash
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Corrente Nubank",
    "type": "checking",
    "current_balance": 5000.00,
    "institution": "Nubank"
  }'
```

## Testing with Swagger

1. Navigate to `http://localhost:3000/documentation`
2. Click the **"Authorize"** button (lock icon) at the top
3. Enter your JWT token in the format: `Bearer your-token-here`
4. Click "Authorize"
5. Now you can test all protected endpoints directly from Swagger!

## Security Features

✅ **Password Hashing**: Passwords are hashed with bcrypt (10 rounds)  
✅ **JWT Tokens**: Short-lived tokens (15 minutes)  
✅ **User Isolation**: Each user only sees their own data  
✅ **Protected Endpoints**: All financial endpoints require authentication  

## Environment Variables

Make sure to set these in your `.env` file:

```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
BCRYPT_ROUNDS=10
```

## Database Changes

All entities now include `user_id`:
- `accounts.user_id`
- `cards.user_id`
- `commitments.user_id`
- `transactions.user_id`

The database will auto-sync in development mode. For production, create proper migrations.

## Testing User Isolation

Create two users and verify they can't see each other's data:

```bash
# User 1
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@test.com", "name": "User One", "password": "pass123"}'

# User 2
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user2@test.com", "name": "User Two", "password": "pass123"}'

# Create account as User 1
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "User 1 Account", "type": "checking"}'

# Try to list accounts as User 2 (should not see User 1's account)
curl -X GET http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer USER2_TOKEN"
```

## Next Steps

- Implement refresh tokens for extended sessions
- Add password reset functionality
- Add email verification
- Implement role-based access control (admin, user)
