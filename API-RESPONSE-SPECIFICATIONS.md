# Complete API Response Specifications

This document contains the **complete request/response specifications** for every API endpoint used by the React application.

---

## 📋 Standard Response Format

All API endpoints should follow this standard wrapper format:

### Success Response
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": { /* response data */ }
}
```

### Error Response
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "ERROR_CODE",
    "description": "Human readable error message",
    "type": "Validation" // or "Failure", "NotFound", "Conflict", "Problem"
  }
}
```

### Error Types
- `Validation` - Invalid input data (400)
- `Failure` - General failure (400/401)
- `NotFound` - Resource not found (404)
- `Conflict` - Resource conflict (409)
- `Problem` - Server error (500)

---

## 🔐 Authentication Endpoints

### 1. Register New User

**Endpoint:** `POST /users/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",  // Optional
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b"  // User ID
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "REGISTRATION_FAILED",
    "description": "Email already exists",
    "type": "Conflict"
  }
}
```

---

### 2. Login with Password

**Endpoint:** `POST /users/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "emailVerified": true,
      "phoneVerified": false
    }
  }
}
```

**Error Response (401):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "description": "Invalid email or password",
    "type": "Validation"
  }
}
```

---

### 3. Login with OTP (Passwordless)

**Endpoint:** `POST /users/login-otp`

**Request Body (Email):**
```json
{
  "medium": "email",
  "email": "john.doe@example.com"
}
```

**Request Body (Phone):**
```json
{
  "medium": "phone",
  "phone": "+1234567890",
  "countryIso2": "US",        // Optional
  "dialCode": "+1",           // Optional
  "nationalNumber": "234567890" // Optional
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": "OTP sent successfully"
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "OTP_SEND_FAILED",
    "description": "Failed to send OTP",
    "type": "Failure"
  }
}
```

---

### 4. Verify OTP

**Endpoint:** `POST /users/verify-otp`

**Request Body:**
```json
{
  "purpose": "Login",  // "Login", "Registration", or "ForgotPassword"
  "contact": "john.doe@example.com",  // Email or phone
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "emailVerified": true,
      "phoneVerified": false
    }
  }
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "INVALID_OTP",
    "description": "Invalid or expired OTP code",
    "type": "Validation"
  }
}
```

---

### 5. Resend OTP

**Endpoint:** `POST /users/resend-otp`

**Request Body:**
```json
{
  "identifier": "john.doe@example.com",  // Email or phone
  "purpose": "Login"  // "Login", "Registration", or "ForgotPassword"
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "RESEND_FAILED",
    "description": "Failed to resend OTP",
    "type": "Failure"
  }
}
```

---

### 6. Get Verification Status

**Endpoint:** `POST /users/verification-status`

**Request Body:**
```json
{
  "email": "john.doe@example.com",  // Optional
  "phone": "+1234567890"            // Optional (one is required)
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "emailVerified": true,
    "phoneVerified": false
  }
}
```

---

### 7. Change Password

**Endpoint:** `POST /users/change-password`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "INVALID_PASSWORD",
    "description": "Current password is incorrect",
    "type": "Validation"
  }
}
```

---

### 8. Request Forgot Password

**Endpoint:** `POST /users/forgot-password/request`

**Request Body:**
```json
{
  "identifier": "john.doe@example.com"  // Email or phone
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

---

### 9. Reset Password (Confirm)

**Endpoint:** `POST /users/forgot-password/confirm`

**Request Body:**
```json
{
  "identifier": "john.doe@example.com",  // Email or phone
  "code": "123456",
  "newPassword": "NewPass456!"
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "INVALID_RESET_CODE",
    "description": "Invalid or expired reset code",
    "type": "Validation"
  }
}
```

---

## 👤 User Management Endpoints

### 10. Get Current User

**Endpoint:** `GET /users/me`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "emailVerified": true,
    "phoneVerified": false
  }
}
```

**Error Response (401):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "UNAUTHORIZED",
    "description": "Invalid or expired token",
    "type": "Failure"
  }
}
```

---

### 11. Get User by ID

**Endpoint:** `GET /users/{userId}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "emailVerified": true,
    "phoneVerified": false
  }
}
```

**Error Response (404):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "USER_NOT_FOUND",
    "description": "User not found",
    "type": "NotFound"
  }
}
```

---

## 📦 Product Management Endpoints

### 12. Get All Products

**Endpoint:** `GET /products?q={searchQuery}`  
**Headers:** `Authorization: Bearer {token}` (Optional)  
**Query Parameters:**
- `q` (optional): Search query string

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": [
    {
      "id": 1,
      "name": "Product Name",
      "price": 29.99,
      "stock": 100
    },
    {
      "id": 2,
      "name": "Another Product",
      "price": 49.99,
      "stock": 50
    }
  ]
}
```

---

### 13. Get Product by ID

**Endpoint:** `GET /products/{id}`  
**Headers:** `Authorization: Bearer {token}` (Optional)

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "id": 1,
    "name": "Product Name",
    "price": 29.99,
    "stock": 100
  }
}
```

**Error Response (404):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "description": "Product not found",
    "type": "NotFound"
  }
}
```

---

### 14. Create Product

**Endpoint:** `POST /products`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "New Product",
  "price": 39.99,
  "stock": 75
}
```

**Success Response (201):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "id": 3,
    "name": "New Product",
    "price": 39.99,
    "stock": 75
  }
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "VALIDATION_ERROR",
    "description": "Product name is required",
    "type": "Validation"
  }
}
```

---

### 15. Update Product

**Endpoint:** `PUT /products/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "id": 1,
  "name": "Updated Product Name",
  "price": 34.99,
  "stock": 90
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "id": 1,
    "name": "Updated Product Name",
    "price": 34.99,
    "stock": 90
  }
}
```

**Error Response (404):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "description": "Product not found",
    "type": "NotFound"
  }
}
```

---

### 16. Delete Product

**Endpoint:** `DELETE /products/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Error Response (404):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "description": "Product not found",
    "type": "NotFound"
  }
}
```

---

## 📧 Contact Us Endpoints

### 17. Get All Contact Messages

**Endpoint:** `GET /contact-us?onlyUnresolved={true/false}`  
**Headers:** `Authorization: Bearer {token}`  
**Query Parameters:**
- `onlyUnresolved` (optional): Filter for unresolved messages only

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "subject": "Product Inquiry",
      "message": "I have a question about your product...",
      "createdAtUtc": "2025-01-15T10:30:00Z",
      "isResolved": false
    }
  ]
}
```

---

### 18. Get Contact Message by ID

**Endpoint:** `GET /contact-us/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "subject": "Product Inquiry",
    "message": "I have a question about your product...",
    "createdAtUtc": "2025-01-15T10:30:00Z",
    "isResolved": false
  }
}
```

**Error Response (404):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "MESSAGE_NOT_FOUND",
    "description": "Contact message not found",
    "type": "NotFound"
  }
}
```

---

### 19. Create Contact Message

**Endpoint:** `POST /contact-us`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",  // Optional
  "subject": "Product Inquiry",
  "message": "I have a question about your product..."
}
```

**Success Response (201):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": "550e8400-e29b-41d4-a716-446655440000"  // Message ID
}
```

**Error Response (400):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "VALIDATION_ERROR",
    "description": "Email is required",
    "type": "Validation"
  }
}
```

---

### 20. Update Contact Message

**Endpoint:** `PUT /contact-us/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Jane Smith",        // Optional
  "email": "jane@example.com", // Optional
  "phone": "+1234567890",      // Optional
  "subject": "Updated Subject", // Optional
  "message": "Updated message", // Optional
  "isResolved": true
}
```

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Error Response (404):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "MESSAGE_NOT_FOUND",
    "description": "Contact message not found",
    "type": "NotFound"
  }
}
```

---

### 21. Delete Contact Message

**Endpoint:** `DELETE /contact-us/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Error Response (404):**
```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "MESSAGE_NOT_FOUND",
    "description": "Contact message not found",
    "type": "NotFound"
  }
}
```

---

## 🔑 JWT Token Structure

Your JWT token should contain these claims:

```json
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "john.doe@example.com",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "John Doe",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "super_admin",
  "exp": 1760598586,
  "iss": "clean-architecture",
  "aud": "developers"
}
```

---

## ✅ Testing Checklist

### Authentication
- [ ] POST /users/register
- [ ] POST /users/login
- [ ] POST /users/login-otp (email)
- [ ] POST /users/login-otp (phone)
- [ ] POST /users/verify-otp
- [ ] POST /users/resend-otp
- [ ] POST /users/verification-status
- [ ] POST /users/change-password
- [ ] POST /users/forgot-password/request
- [ ] POST /users/forgot-password/confirm

### User Management
- [ ] GET /users/me
- [ ] GET /users/{userId}

### Products
- [ ] GET /products
- [ ] GET /products/{id}
- [ ] POST /products
- [ ] PUT /products/{id}
- [ ] DELETE /products/{id}

### Contact Messages
- [ ] GET /contact-us
- [ ] GET /contact-us/{id}
- [ ] POST /contact-us
- [ ] PUT /contact-us/{id}
- [ ] DELETE /contact-us/{id}

---

## 📝 Implementation Notes

1. **All responses must follow the `ApiResult<T>` wrapper format**
2. **Authorization header format:** `Authorization: Bearer {token}`
3. **Date format:** ISO 8601 (e.g., `2025-01-15T10:30:00Z`)
4. **GUID format:** Standard UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
5. **Phone format:** International format with country code (e.g., `+1234567890`)
6. **Error codes should be in UPPER_SNAKE_CASE**
7. **HTTP Status Codes:**
   - 200: Success
   - 201: Created
   - 400: Bad Request / Validation Error
   - 401: Unauthorized
   - 404: Not Found
   - 409: Conflict
   - 500: Internal Server Error
