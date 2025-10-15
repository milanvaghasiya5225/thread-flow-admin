# Complete API Response Specifications

This document contains the **complete request/response specifications** for every API endpoint based on your .NET API Swagger specification.

**🔒 Security Update:** Password login now requires mandatory 2-factor authentication (2FA) for enhanced security. See section "2. Login with Password" for the complete flow.

---

## 📋 Standard Response Format

All API endpoints follow this standard wrapper format:

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": { /* response data */ },
  "traceId": null,
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalCount": 50
  },
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message describing what went wrong",
  "data": null,
  "traceId": "unique-trace-id",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/login"
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request / Validation Error
- 401: Unauthorized
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

---

## 🔐 Authentication Endpoints

### 1. Register New User

**Endpoint:** `POST /users/register`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "userName": "johndoe",        // Optional
  "phone": "+1234567890",       // Optional
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",  // User ID
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email already exists",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/register"
}
```

---

### 2. Login with Password

**Endpoint:** `POST /users/login`

**Request Body:**
```json
{
  "email": "superadmin@local.com",
  "password": "SuperAdmin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImVhMGU1Yjc2LTdhMzgtNDZlOC1iN2JiLTE0ODQwYjRjZjEwYiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InN1cGVyYWRtaW5AbG9jYWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6IlN1cGVyIEFkbWluIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoic3VwZXJfYWRtaW4iLCJleHAiOjE3NjA2MDEwMzUsImlzcyI6ImNsZWFuLWFyY2hpdGVjdHVyZSIsImF1ZCI6ImRldmVsb3BlcnMifQ.h9EBvquwIDU5Km1GIyzXgfXqo_zrrNtLaH17bE2CQtQ"
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**⚠️ IMPORTANT - Mandatory 2FA Flow:**
The login flow now requires 2-factor authentication:
1. Client calls `POST /users/login` (validates credentials)
2. Server automatically sends OTP to user's email
3. Client redirects to OTP verification page
4. Client calls `POST /users/verify-otp` with the code
5. Server returns token after successful OTP verification

**Error Response (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/login"
}
```

---

### 3. Login with OTP (Send Verification Code)

**Endpoint:** `POST /users/login-otp`

**Request Body:**
```json
{
  "medium": "email",           // "email" or "phone"
  "email": "john@example.com", // Required if medium is "email"
  "phone": "+1234567890",      // Required if medium is "phone"
  "countryIso2": "US",         // Optional
  "dialCode": "+1",            // Optional
  "nationalNumber": "234567890" // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully",
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid email or phone number",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/login-otp"
}
```

---

### 4. Verify OTP (Complete Login)

**Endpoint:** `POST /users/verify-otp`

**Request Body:**
```json
{
  "purpose": "Login",        // "Login", "Registration", or "ForgotPassword"
  "contact": "john@example.com",  // Email or phone number
  "code": "123456"           // 6-digit OTP code
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "emailVerified": true,
      "phoneVerified": false,
      "roles": ["user"]
    }
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or expired OTP code",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/verify-otp"
}
```

---

### 5. Resend OTP

**Endpoint:** `POST /users/resend-otp`

**Request Body:**
```json
{
  "identifier": "john@example.com",  // Email or phone number
  "purpose": "Login"                 // "Login", "Registration", or "ForgotPassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP resent successfully",
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 6. Change Password

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
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 7. Request Forgot Password

**Endpoint:** `POST /users/forgot-password/request`

**Request Body:**
```json
{
  "identifier": "john@example.com"  // Email or phone number
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset code sent",
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 8. Reset Password (Confirm)

**Endpoint:** `POST /users/forgot-password/confirm`

**Request Body:**
```json
{
  "identifier": "john@example.com",  // Email or phone number
  "code": "123456",                  // 6-digit reset code
  "newPassword": "NewPass456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully",
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

## 👤 User Management Endpoints

### 9. Get Current User

**Endpoint:** `GET /users/me`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
    "userName": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "emailVerified": true,
    "phoneVerified": false,
    "roles": ["user", "admin"]
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/me"
}
```

---

### 10. Get All Users (Paginated)

**Endpoint:** `GET /users?role={role}&search={search}&page={page}&pageSize={pageSize}`  
**Headers:** `Authorization: Bearer {token}`  
**Query Parameters:**
- `role` (optional): Filter by role
- `search` (optional): Search query
- `page` (required): Page number (1-indexed)
- `pageSize` (required): Items per page

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": [
    {
      "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "userName": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "roles": ["user"]
    },
    {
      "id": "f1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "userName": "janedoe",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "phone": "+0987654321",
      "roles": ["admin"]
    }
  ],
  "traceId": null,
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalCount": 50
  },
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 11. Get User by ID

**Endpoint:** `GET /users/{userId}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
    "userName": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "emailVerified": true,
    "phoneVerified": false,
    "roles": ["user", "admin"]
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/{userId}"
}
```

---

### 12. Get Verification Status

**Endpoint:** `GET /users/verification-status`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "emailVerified": true,
    "phoneVerified": false
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

## 👥 Role Management Endpoints

### 13. Get User Roles

**Endpoint:** `GET /users/{userId}/roles`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": ["user", "admin", "super_admin"],
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 14. Assign Role to User

**Endpoint:** `POST /users/{userId}/roles`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "role": "admin",
  "reason": "Promoted to administrator"  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid role name",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/{userId}/roles"
}
```

---

### 15. Remove Role from User

**Endpoint:** `DELETE /users/{userId}/roles/{role}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Role not found for this user",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/users/{userId}/roles/{role}"
}
```

---

## 📧 Contact Management Endpoints

### 16. Get All Contacts (Paginated)

**Endpoint:** `GET /contact-us?status={status}&assignedTo={userId}&search={search}&page={page}&pageSize={pageSize}`  
**Headers:** `Authorization: Bearer {token}`  
**Query Parameters:**
- `status` (optional): Filter by status ("new", "in-progress", "resolved")
- `assignedTo` (optional): Filter by assigned user ID
- `search` (optional): Search query
- `page` (required): Page number (1-indexed)
- `pageSize` (required): Items per page

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "subject": "Product Inquiry",
      "message": "I have a question about your product...",
      "status": "new",
      "statusComment": null,
      "assignedTo": null,
      "assignedToUser": null,
      "createdAtUtc": "2025-10-15T10:30:00Z",
      "updatedAtUtc": "2025-10-15T10:30:00Z",
      "unreadMessageCount": 3
    }
  ],
  "traceId": null,
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalCount": 50
  },
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 17. Get Contact by ID

**Endpoint:** `GET /contact-us/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "subject": "Product Inquiry",
    "message": "I have a question about your product...",
    "status": "in-progress",
    "statusComment": "Investigating the issue",
    "assignedTo": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
    "assignedToUser": {
      "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "createdAtUtc": "2025-10-15T10:30:00Z",
    "updatedAtUtc": "2025-10-15T11:00:00Z",
    "messages": [
      {
        "id": "msg-001",
        "content": "I have a question about your product...",
        "isFromCustomer": true,
        "isRead": true,
        "createdAtUtc": "2025-10-15T10:30:00Z",
        "senderName": "Jane Smith",
        "senderEmail": "jane@example.com"
      },
      {
        "id": "msg-002",
        "content": "Thank you for reaching out. How can I help?",
        "isFromCustomer": false,
        "isRead": false,
        "createdAtUtc": "2025-10-15T10:45:00Z",
        "senderName": "John Doe",
        "senderEmail": "john@example.com"
      }
    ]
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Contact not found",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/contact-us/{id}"
}
```

---

### 18. Update Contact

**Endpoint:** `PUT /contact-us/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "Jane Smith",          // Optional
  "email": "jane@example.com",   // Optional
  "phone": "+1234567890",        // Optional
  "subject": "Updated Subject",  // Optional
  "message": "Updated message",  // Optional
  "status": "resolved",          // Optional: "new", "in-progress", "resolved"
  "statusComment": "Issue resolved",  // Optional
  "assignedTo": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b"  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Contact not found",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/contact-us/{id}"
}
```

---

### 19. Delete Contact

**Endpoint:** `DELETE /contact-us/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

**Error Response (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Contact not found",
  "data": null,
  "traceId": "abc-123",
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": "/contact-us/{id}"
}
```

---

### 20. Send Message to Contact

**Endpoint:** `POST /contact-us/{id}/messages`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "content": "Thank you for reaching out. How can I help?",
  "sendEmail": true,   // Send email notification to customer
  "sendSms": false     // Send SMS notification to customer
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": "msg-123",  // Message ID
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 21. Mark Message as Read

**Endpoint:** `PUT /messages/{id}/read`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 22. Get Contact Statistics

**Endpoint:** `GET /contact-us/statistics`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "total": 150,
    "new": 25,
    "inProgress": 50,
    "resolved": 75,
    "averageResponseTime": "2.5 hours",
    "unreadMessages": 10
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 23. Get Monthly Contact Statistics

**Endpoint:** `GET /contact-us/statistics/monthly?months={months}`  
**Headers:** `Authorization: Bearer {token}`  
**Query Parameters:**
- `months` (optional): Number of months to retrieve (default: 6)

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": [
    {
      "month": "2025-10",
      "total": 45,
      "new": 15,
      "inProgress": 20,
      "resolved": 10
    },
    {
      "month": "2025-09",
      "total": 38,
      "new": 12,
      "inProgress": 16,
      "resolved": 10
    }
  ],
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

## 📋 Todo Management Endpoints

### 24. Get All Todos for User

**Endpoint:** `GET /todos?userId={userId}`  
**Headers:** `Authorization: Bearer {token}`  
**Query Parameters:**
- `userId` (required): User ID

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": [
    {
      "id": "todo-001",
      "userId": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "description": "Complete project documentation",
      "isCompleted": false,
      "dueDate": "2025-10-20T00:00:00Z",
      "labels": ["work", "urgent"],
      "priority": 1,
      "createdAtUtc": "2025-10-15T10:30:00Z",
      "completedAtUtc": null
    }
  ],
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 25. Get Todo by ID

**Endpoint:** `GET /todos/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": {
    "id": "todo-001",
    "userId": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
    "description": "Complete project documentation",
    "isCompleted": false,
    "dueDate": "2025-10-20T00:00:00Z",
    "labels": ["work", "urgent"],
    "priority": 1,
    "createdAtUtc": "2025-10-15T10:30:00Z",
    "completedAtUtc": null
  },
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 26. Create Todo

**Endpoint:** `POST /todos`  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "userId": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
  "description": "Complete project documentation",
  "dueDate": "2025-10-20T00:00:00Z",  // Optional
  "labels": ["work", "urgent"],       // Optional
  "priority": 1                        // Optional (1=high, 2=medium, 3=low)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": "todo-001",  // Todo ID
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 27. Complete Todo

**Endpoint:** `PUT /todos/{id}/complete`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

### 28. Delete Todo

**Endpoint:** `DELETE /todos/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

## 📊 Audit Endpoints

### 29. Get Role Audit Logs

**Endpoint:** `GET /audit/roles?userId={userId}&page={page}&pageSize={pageSize}`  
**Headers:** `Authorization: Bearer {token}`  
**Query Parameters:**
- `userId` (optional): Filter by user ID
- `page` (required): Page number (1-indexed)
- `pageSize` (required): Items per page

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": [
    {
      "id": "audit-001",
      "userId": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "userName": "John Doe",
      "role": "admin",
      "action": "assigned",  // "assigned" or "removed"
      "reason": "Promoted to administrator",
      "performedBy": "f1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "performedByName": "Super Admin",
      "timestamp": "2025-10-15T10:30:00Z"
    }
  ],
  "traceId": null,
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalCount": 50
  },
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

## 🔗 Webhook Endpoints

### 30. Email Reply Webhook

**Endpoint:** `POST /webhooks/email-reply`

**Request Body:**
```json
{
  "to": "contact-123@yourdomain.com",
  "from": "customer@example.com",
  "subject": "Re: Product Inquiry",
  "text": "Thank you for your response. I have another question...",
  "html": "<p>Thank you for your response. I have another question...</p>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": null,
  "data": null,
  "traceId": null,
  "pagination": null,
  "timestamp": "2025-10-15T07:50:35.6605621+00:00",
  "path": ""
}
```

---

## 🔑 JWT Token Structure

The JWT token contains these claims:

```json
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "superadmin@local.com",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "Super Admin",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "super_admin",
  "exp": 1760598586,
  "iss": "clean-architecture",
  "aud": "developers"
}
```

---

## ✅ Testing Checklist

### Authentication & Users
- [x] POST /users/register
- [x] POST /users/login (with mandatory 2FA)
- [x] POST /users/login-otp (send OTP)
- [x] POST /users/verify-otp (verify OTP)
- [x] POST /users/resend-otp
- [x] POST /users/change-password
- [x] POST /users/forgot-password/request
- [x] POST /users/forgot-password/confirm
- [x] GET /users/me
- [x] GET /users
- [x] GET /users/{userId}
- [x] GET /users/verification-status

### Role Management
- [ ] GET /users/{userId}/roles
- [ ] POST /users/{userId}/roles
- [ ] DELETE /users/{userId}/roles/{role}

### Contact Management
- [ ] GET /contact-us
- [ ] GET /contact-us/{id}
- [ ] PUT /contact-us/{id}
- [ ] DELETE /contact-us/{id}
- [ ] POST /contact-us/{id}/messages
- [ ] PUT /messages/{id}/read
- [ ] GET /contact-us/statistics
- [ ] GET /contact-us/statistics/monthly

### Todo Management
- [ ] GET /todos
- [ ] GET /todos/{id}
- [ ] POST /todos
- [ ] PUT /todos/{id}/complete
- [ ] DELETE /todos/{id}

### Audit
- [ ] GET /audit/roles

### Webhooks
- [ ] POST /webhooks/email-reply

---

## 📝 Implementation Notes

1. **All responses follow the standard wrapper format** with `success`, `statusCode`, `message`, `data`, `traceId`, `pagination`, `timestamp`, and `path` fields
2. **Authorization header format:** `Authorization: Bearer {token}`
3. **Date format:** ISO 8601 with timezone (e.g., `2025-10-15T10:30:00Z`)
4. **GUID format:** Standard UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
5. **Phone format:** International format with country code (e.g., `+1234567890`)
6. **HTTP Status Codes:**
   - 200: Success
   - 201: Created
   - 400: Bad Request / Validation Error
   - 401: Unauthorized
   - 404: Not Found
   - 409: Conflict
   - 500: Internal Server Error
7. **Pagination:** Required for list endpoints, included in response wrapper
8. **Trace ID:** Used for error tracking and debugging
