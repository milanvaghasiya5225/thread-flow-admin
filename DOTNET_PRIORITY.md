# .NET API Priority Configuration

This project has been configured to use the .NET API as the primary authentication and data source.

## Changes Made

### Authentication
- **Primary**: DotNetAuthContext for all authentication
- **Login/Register**: DotNetLogin and DotNetRegister pages
- **Routes**: All routes use .NET authentication

### Pages Updated
All pages now use the .NET API client instead of Lovable Cloud (Supabase):

1. **Dashboard** (`/dashboard`)
   - Uses `apiClient.getContactMessages()` for data
   - Uses `useDotNetAuth()` for authentication

2. **ContactsManager** (`/contacts`)
   - Fully integrated with .NET Contact API
   - CRUD operations via apiClient

3. **UsersList** (`/users`)
   - Placeholder: Requires user management endpoints in .NET API
   - Shows "Coming Soon" message

4. **RoleManagement** (`/roles`)
   - Placeholder: Requires role management endpoints in .NET API
   - Shows "Coming Soon" message

5. **ProfileSettings** (`/profile`)
   - Placeholder: Requires profile update endpoints in .NET API
   - Shows "Coming Soon" message

## Lovable Cloud Status

Lovable Cloud (Supabase) infrastructure still exists in the project but is **NOT USED** in any application code:

- Database tables: Still exist but not accessed
- Storage: Still exists but not accessed
- Auth: Not used (using .NET API instead)
- Edge Functions: Not used

**Note**: Lovable Cloud cannot be removed from the project once added, but all application code now exclusively uses the .NET API.

## Required .NET API Endpoints

To fully replace all functionality, your .NET API needs these endpoints:

### User Management
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user profile
- `DELETE /api/users/{id}` - Delete user

### Role Management
- `GET /api/roles` - List all role assignments
- `POST /api/roles` - Assign role to user
- `DELETE /api/roles/{id}` - Remove role assignment

### Profile & Avatar
- `PUT /api/users/me` - Update current user profile
- `POST /api/users/me/avatar` - Upload avatar image

## Environment Configuration

Make sure your `.env` file has the correct API URL:

```env
VITE_API_BASE_URL=https://your-dotnet-api.com
```

## Fallback Strategy

Currently, if the .NET API returns 404, the app will show an error. To implement Lovable Cloud as a fallback:

1. Wrap API calls in try-catch
2. Check for 404 status
3. Fall back to Supabase client calls
4. This would require re-adding Supabase imports to relevant files

This fallback is **NOT currently implemented** - the app exclusively uses .NET API.
