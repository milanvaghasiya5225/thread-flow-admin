# API Response Specifications

## Current Implementation Status

### ✅ What's Working
The React app now handles your .NET API's current response format:
- **Login endpoint** returns `{ "token": "jwt_token_string" }`
- JWT token contains user claims that are decoded client-side

### 📋 API Response Format Comparison

#### Current Format (What your API returns)
```json
POST /users/login
Response: 200 OK
{
  "token": "eyJhbGci..."
}
```

#### Recommended Format (For consistency with TypeScript types)
```json
POST /users/login
Response: 200 OK
{
  "isSuccess": true,
  "isFailure": false,
  "value": {
    "token": "eyJhbGci...",
    "user": {
      "id": "ea0e5b76-7a38-46e8-b7bb-14840b4cf10b",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "superadmin@local.com",
      "phone": null,
      "emailVerified": true,
      "phoneVerified": false
    }
  }
}
```

### Error Response Format
```json
Response: 400/401/404/500
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

## JWT Token Structure

Your JWT token contains these claims:
```
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "user-id",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "user@email.com",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "First Last",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "super_admin",
  "exp": 1760598586,
  "iss": "clean-architecture",
  "aud": "developers"
}
```

## Endpoints Status

### ✅ Implemented & Working
- `POST /users/login` - Password login
- Response handling adapted to work with direct token response

### ⚠️ Needs Verification
These endpoints are used but haven't been tested yet:

#### Authentication
- `POST /users/register` - User registration
- `POST /users/login-otp` - Passwordless login (send OTP)
- `POST /users/verify-otp` - Verify OTP code
- `POST /users/resend-otp` - Resend OTP
- `POST /users/verification-status` - Check verification status
- `POST /users/change-password` - Change password
- `POST /users/forgot-password/request` - Request password reset
- `POST /users/forgot-password/confirm` - Confirm password reset

#### User Management
- `GET /users/{userId}` - Get user by ID
- `GET /users/me` - Get current user (recommended to add)

## Recommendations

### 1. Add `/users/me` Endpoint
```csharp
[HttpGet("me")]
[Authorize]
public async Task<ActionResult<ApiResult<UserResponse>>> GetCurrentUser()
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    // ... fetch and return user
}
```

### 2. Standardize All Responses with ApiResult Wrapper
Wrap all responses in the ApiResult structure for consistency:
```csharp
public class ApiResult<T>
{
    public bool IsSuccess { get; set; }
    public bool IsFailure => !IsSuccess;
    public T Value { get; set; }
    public ApiError Error { get; set; }
}
```

### 3. Include User Data in Login Response
Instead of requiring a second API call, include user data in login response:
```csharp
return Ok(new ApiResult<LoginResponse>
{
    IsSuccess = true,
    Value = new LoginResponse
    {
        Token = token,
        User = userDto
    }
});
```

## Testing Checklist

- [x] Login with password
- [ ] Register new user
- [ ] Login with OTP (email)
- [ ] Login with OTP (phone)
- [ ] Verify OTP
- [ ] Resend OTP
- [ ] Change password
- [ ] Forgot password flow
- [ ] Get current user info
- [ ] Update user profile
