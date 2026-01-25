# Authentication System - Testing Guide

## 🎯 Available Endpoints

All auth endpoints are prefixed with `/api/v1/auth`

### 1. Register New User
```bash
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "john@example.com",
      "name": "John Doe",
      "profileCompleteness": 30
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "15m"
    }
  }
}
```

### 2. Login
```bash
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "john@example.com",
      "name": "John Doe",
      "currentRole": null,
      "targetRole": null,
      "profileCompleteness": 30,
      "hasUploadedResume": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "15m"
    }
  }
}
```

### 3. Get Current User (Protected)
```bash
GET http://localhost:5000/api/v1/auth/me
Authorization: Bearer <accessToken>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": null,
      "currentRole": null,
      "targetRole": null,
      "experienceYears": 0,
      "profileCompleteness": 30,
      "hasUploadedResume": false,
      "isEmailVerified": false,
      "lastLogin": "2026-01-25T14:48:00.000Z",
      "createdAt": "2026-01-25T14:30:00.000Z"
    }
  }
}
```

### 4. Update Profile (Protected)
```bash
PUT http://localhost:5000/api/v1/auth/profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "John Smith",
  "currentRole": "Software Engineer",
  "targetRole": "Senior Software Engineer",
  "experienceYears": 3,
  "phone": "+1234567890"
}
```

### 5. Refresh Access Token
```bash
POST http://localhost:5000/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "15m"
    }
  }
}
```

### 6. Logout
```bash
POST http://localhost:5000/api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

## 🧪 Easy Testing with curl

### Setup (Save tokens to variables)
```bash
# 1. Register a user
RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }')

# Extract tokens
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.refreshToken')

echo "✅ Registered successfully"
echo "Access Token: $ACCESS_TOKEN"

# 2. Get current user (protected route)
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 3. Update profile
curl -X PUT http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentRole": "Junior Developer",
    "targetRole": "Senior Developer",
    "experienceYears": 2
  }' | jq

# 4. Logout
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq
```

## ⚠️ Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Please provide a valid email",
        "value": "invalid-email"
      }
    ]
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "message": "Not authorized, no token provided",
    "statusCode": 401
  }
}
```

### Duplicate Email (409)
```json
{
  "success": false,
  "error": {
    "message": "Email already registered",
    "statusCode": 409
  }
}
```

## 📋 Test Checklist

Run MongoDB first:
```bash
sudo docker run -d -p 27017:27017 --name career-ai-mongodb mongo:latest
```

Then start the server:
```bash
cd backend
npm run dev
```

✅ Test cases to verify:
- [ ] Register new user → Should return 201 with tokens
- [ ] Register duplicate email → Should return 409 error
- [ ] Login with correct credentials → Should return 200 with tokens
- [ ] Login with wrong password → Should return 401 error
- [ ] Access protected route without token → Should return 401 error
- [ ] Access protected route with valid token → Should return 200 with user data
- [ ] Refresh token → Should return new token pair
- [ ] Logout → Should invalidate refresh token
- [ ] Login after logout → Old refresh token should not work
