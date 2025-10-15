# API Integration Summary

## Authentication Flow

### Routes
- **Login**: `/login` - Password and OTP login options
- **Register**: `/register` - User registration
- **OTP Verification**: `/otp-verification` - Verify OTP codes

### Authentication Context
- Located at: `src/contexts/DotNetAuthContext.tsx`
- Provides: `login`, `loginWithOtp`, `register`, `logout`, `user`, `isAuthenticated`

## Current API Endpoints Used

### Authentication
- `POST /users/register` - Register new user
- `POST /users/login` - Login with email/password
- `POST /users/login-otp` - Request OTP for passwordless login
- `POST /users/verify-otp` - Verify OTP code
- `POST /users/resend-otp` - Resend OTP

### Users
- `GET /users/{userId}` - Get user by ID

### Products
- `GET /products` - Get all products
- `GET /products/{id}` - Get product by ID
- `POST /products` - Create product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Contact Messages
- `GET /contact-us` - Get all contact messages
- `GET /contact-us/{id}` - Get contact message by ID
- `POST /contact-us` - Create contact message
- `PUT /contact-us/{id}` - Update contact message
- `DELETE /contact-us/{id}` - Delete contact message

## Missing API Endpoints (Needed for Full Functionality)

### 1. Get Current User
```http
GET /users/me
Authorization: Bearer {token}
```
**Purpose**: Get currently authenticated user's profile
**Returns**: `UserResponse`

### 2. Update User Profile
```http
PUT /users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  "phone": "string"
}
```
**Purpose**: Update current user's profile information

### 3. Change Password
```http
POST /users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string"
}
```
**Purpose**: Change authenticated user's password

### 4. User Management (Admin)
```http
GET /users
Authorization: Bearer {token}
```
**Purpose**: List all users (admin only)
**Returns**: `Array<UserResponse>`

```http
PUT /users/{userId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "isActive": boolean
}
```
**Purpose**: Activate/deactivate user accounts

### 5. Role Management (Admin)
```http
GET /roles
Authorization: Bearer {token}
```
**Purpose**: List all available roles

```http
GET /users/{userId}/roles
Authorization: Bearer {token}
```
**Purpose**: Get user's assigned roles

```http
POST /users/{userId}/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "roleId": "string"
}
```
**Purpose**: Assign role to user

```http
DELETE /users/{userId}/roles/{roleId}
Authorization: Bearer {token}
```
**Purpose**: Remove role from user

## API Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:5000
```

### CORS Configuration
Your .NET API should allow requests from the frontend origin:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite dev server
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

## Testing Checklist

### Authentication Flow
- [ ] Register new user
- [ ] Login with email/password
- [ ] Login with OTP (email)
- [ ] Login with OTP (phone)
- [ ] OTP verification
- [ ] Token stored in localStorage
- [ ] Protected routes redirect to login
- [ ] Logout clears token

### User Management
- [ ] View profile
- [ ] Update profile (when endpoint added)
- [ ] Change password (when endpoint added)

### Admin Features (when endpoints added)
- [ ] List all users
- [ ] Manage user roles
- [ ] Activate/deactivate users

### Contact Messages
- [ ] Create contact message
- [ ] View contact messages (admin)
- [ ] Update contact message status (admin)

## Response Format

All API responses should follow the `ApiResult<T>` format:

```typescript
interface ApiResult<T> {
  isSuccess: boolean;
  isFailure: boolean;
  error?: {
    code: string | null;
    description: string | null;
    type: 'Failure' | 'Validation' | 'Problem' | 'NotFound' | 'Conflict';
  };
  value?: T;
}
```

## Error Handling

The API client automatically:
1. Injects JWT token in Authorization header
2. Parses error responses
3. Throws errors with descriptive messages

Handle errors in components:
```typescript
try {
  const result = await apiClient.someMethod();
  if (!result.isSuccess) {
    throw new Error(result.error?.description || 'Operation failed');
  }
  // Use result.value
} catch (error) {
  toast({
    title: 'Error',
    description: error instanceof Error ? error.message : 'Something went wrong',
    variant: 'destructive',
  });
}
```

## Security Notes

1. **JWT Token Storage**: Currently stored in localStorage. Consider using httpOnly cookies for production.
2. **Role-Based Access**: Currently hardcoded. Implement proper role checking once role endpoints are added.
3. **Token Refresh**: Not implemented. Add refresh token endpoint and logic.
4. **API Rate Limiting**: Should be implemented on the backend for OTP endpoints.

## Next Steps

1. Implement missing API endpoints (see section above)
2. Add role-based authorization in .NET API
3. Test all authentication flows
4. Implement proper error handling
5. Add API documentation (Swagger)
6. Set up proper CORS policies
7. Add rate limiting for sensitive endpoints
