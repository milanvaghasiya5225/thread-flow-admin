# .NET API Integration Guide

This document explains how to integrate your .NET 9 API with this React frontend.

## Overview

I've created the complete integration layer for your .NET API. Here's what was added:

### 1. Type Definitions (`src/types/api.ts`)
- All TypeScript interfaces generated from your Swagger specification
- Includes types for Users, Products, and Contact Messages
- Proper enum definitions for OtpPurpose and ErrorType

### 2. API Client (`src/services/apiClient.ts`)
- Complete API client with all endpoints from your Swagger spec
- JWT token management (stored in localStorage)
- Automatic authorization header injection
- Error handling and response parsing

### 3. Authentication Context (`src/contexts/DotNetAuthContext.tsx`)
- React context for managing authentication state
- Login, register, and logout functionality
- Token persistence across page reloads

### 4. UI Components
- **DotNetLogin** (`src/pages/DotNetLogin.tsx`) - Login page
- **DotNetRegister** (`src/pages/DotNetRegister.tsx`) - Registration page

## Setup Instructions

### 1. Configure API Base URL

Create or update your `.env` file:

\`\`\`env
VITE_API_BASE_URL=https://localhost:5001
\`\`\`

For production:
\`\`\`env
VITE_API_BASE_URL=https://your-production-api.com
\`\`\`

### 2. Update Routes in App.tsx

Add the new routes to your `src/App.tsx`:

\`\`\`tsx
import { DotNetAuthProvider } from "./contexts/DotNetAuthContext";
import DotNetLogin from "./pages/DotNetLogin";
import DotNetRegister from "./pages/DotNetRegister";

// Wrap your app with DotNetAuthProvider
<DotNetAuthProvider>
  <Routes>
    <Route path="/dotnet-login" element={<DotNetLogin />} />
    <Route path="/dotnet-register" element={<DotNetRegister />} />
    {/* ... existing routes */}
  </Routes>
</DotNetAuthProvider>
\`\`\`

### 3. Using the API Client

Import and use the API client in your components:

\`\`\`tsx
import { apiClient } from '@/services/apiClient';

// Get products
const result = await apiClient.getProducts('search query');
if (result.isSuccess && result.value) {
  console.log(result.value); // Product[]
}

// Create contact message
const contactResult = await apiClient.createContactMessage({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Question',
  message: 'Hello!'
});
\`\`\`

### 4. Using Authentication

\`\`\`tsx
import { useDotNetAuth } from '@/contexts/DotNetAuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useDotNetAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Hello {user?.firstName}!</div>;
}
\`\`\`

## API Suggestions & Improvements

Based on reviewing your Swagger spec, here are my suggestions:

### 1. **Add a "Get Current User" Endpoint**
Add `GET /users/me` to get the currently authenticated user without needing their ID.

\`\`\`csharp
[HttpGet("me")]
public async Task<Result<UserResponse>> GetCurrentUser()
{
    var userId = GetUserIdFromToken();
    return await GetUserById(userId);
}
\`\`\`

### 2. **Standardize Response Format**
Some endpoints return `Result<T>`, others return just `T`. Consider standardizing all responses to use `Result<T>` for consistency.

### 3. **Add Pagination**
For endpoints that return lists (products, contact messages), add pagination:

\`\`\`csharp
public class PagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
\`\`\`

### 4. **CORS Configuration**
Ensure your API has CORS properly configured for the React app:

\`\`\`csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins("http://localhost:8080", "https://your-production-url.com")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

app.UseCors("AllowReactApp");
\`\`\`

### 5. **Add Refresh Token Endpoint**
Add token refresh functionality for better security:

\`\`\`csharp
[HttpPost("refresh-token")]
public async Task<Result<LoginResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
{
    // Validate and issue new token
}
\`\`\`

### 6. **Contact Us Status Codes**
The GET `/contact-us` endpoint should return 200 with empty array instead of 404 when no messages exist.

### 7. **Product Search Enhancement**
Add more filter options to products:

\`\`\`csharp
GET /products?q=search&minPrice=10&maxPrice=100&inStock=true
\`\`\`

### 8. **Validation Error Details**
Return field-specific validation errors:

\`\`\`csharp
public class ValidationError : Error
{
    public Dictionary<string, string[]> Errors { get; set; }
}
\`\`\`

### 9. **Rate Limiting**
Add rate limiting headers to API responses for OTP endpoints:

\`\`\`
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640000000
\`\`\`

### 10. **API Versioning**
Consider adding API versioning:

\`\`\`
/api/v1/users/login
\`\`\`

## Testing the Integration

1. Start your .NET API: `dotnet run`
2. Start the React app: `npm run dev`
3. Navigate to `/dotnet-login` to test authentication
4. Check browser console and network tab for any CORS or connection issues

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] JWT token expiration time set appropriately
- [ ] Password requirements enforced on backend
- [ ] Rate limiting enabled for sensitive endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (use parameterized queries)
- [ ] XSS protection headers configured

## Next Steps

1. Replace Supabase auth with .NET API auth in existing components
2. Create Product management pages
3. Create Contact message management UI
4. Add error boundary components
5. Implement loading states
6. Add form validation with zod
7. Create protected route wrapper
8. Add password reset flow UI

## Support

If you need help with any specific integration or have questions about the API structure, let me know!
