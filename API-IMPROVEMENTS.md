# .NET API Improvements & Required Endpoints

## 🔴 Critical Missing Endpoints

### 1. **User Profile Management**
```csharp
// GET /users/me - Get current user with roles
GET /users/me
Response: {
  id: guid,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  emailVerified: boolean,
  phoneVerified: boolean,
  roles: ["user", "admin"],
  avatarUrl: string,
  bio: string
}

// PUT /users/me - Update current user profile
PUT /users/me
Request: {
  firstName: string,
  lastName: string,
  phone: string,
  bio: string
}

// POST /users/me/avatar - Upload avatar
POST /users/me/avatar
Content-Type: multipart/form-data
Request: { file: File }
```

### 2. **Role Management (Admin Only)**
```csharp
// GET /users/{userId}/roles - Get user's roles
GET /users/{userId}/roles
Response: ["user", "admin"]

// POST /users/{userId}/roles - Assign role
POST /users/{userId}/roles
Request: {
  role: "admin" | "user" | "super_admin",
  reason: string
}

// DELETE /users/{userId}/roles/{role} - Remove role
DELETE /users/{userId}/roles/{role}

// GET /users - List all users (with pagination)
GET /users?page=1&pageSize=20&search=john
Response: {
  items: UserResponse[],
  totalCount: number,
  page: number,
  pageSize: number
}
```

### 3. **Contact Messaging System**
```csharp
// GET /contact-us/{id}/messages - Get conversation thread
GET /contact-us/{id}/messages
Response: [
  {
    id: guid,
    contactId: guid,
    senderId: guid?,
    senderType: "admin" | "contact",
    content: string,
    isRead: boolean,
    createdAt: datetime
  }
]

// POST /contact-us/{id}/messages - Reply to contact
POST /contact-us/{id}/messages
Request: {
  content: string,
  sendEmail: boolean // Trigger email notification
}

// PUT /messages/{id}/read - Mark as read
PUT /messages/{id}/read
```

### 4. **Enhanced Contact Management**
```csharp
// Update existing PUT /contact-us/{id}
PUT /contact-us/{id}
Request: {
  name?: string,
  email?: string,
  phone?: string,
  subject?: string,
  message?: string,
  isResolved?: boolean,
  status?: "new" | "in_progress" | "on_hold" | "resolved" | "closed",
  statusComment?: string, // Required when changing status
  assignedTo?: guid
}

// GET /contact-us/{id}/status-history
GET /contact-us/{id}/status-history
Response: [
  {
    id: guid,
    oldStatus: string,
    newStatus: string,
    changedBy: guid,
    changedAt: datetime,
    comment: string
  }
]

// POST /contact-us/{id}/assign - Assign to admin
POST /contact-us/{id}/assign
Request: {
  adminUserId: guid
}
```

### 5. **Role Audit Trail (Super Admin)**
```csharp
// GET /audit/roles - View role changes
GET /audit/roles?userId={guid}&page=1&pageSize=20
Response: {
  items: [
    {
      userId: guid,
      role: string,
      action: "assigned" | "removed",
      performedBy: guid,
      reason: string,
      createdAt: datetime
    }
  ],
  totalCount: number
}
```

## 🔒 Authorization Requirements

### Update your Authorization Policies:
```csharp
// In Program.cs or Startup.cs
builder.Services.AddAuthorization(options =>
{
    // Require authenticated user
    options.AddPolicy("RequireUser", policy => 
        policy.RequireAuthenticatedUser());
    
    // Require admin role
    options.AddPolicy("RequireAdmin", policy => 
        policy.RequireRole("admin", "super_admin"));
    
    // Require super admin role
    options.AddPolicy("RequireSuperAdmin", policy => 
        policy.RequireRole("super_admin"));
});
```

### Apply policies to endpoints:
```csharp
// Example endpoint with authorization
app.MapGet("/users", [Authorize(Policy = "RequireAdmin")] 
    async (IMediator mediator) => { ... });

app.MapPost("/users/{userId}/roles", [Authorize(Policy = "RequireSuperAdmin")]
    async (Guid userId, AssignRoleRequest request, IMediator mediator) => { ... });
```

## 🔧 Entity Framework Updates Required

### Add new DbSets to your DbContext:
```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<RoleAuditLog> RoleAuditLog { get; set; }
    public DbSet<Profile> Profiles { get; set; }
    public DbSet<ContactMessage> ContactMessages { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<StatusHistory> StatusHistory { get; set; }
    public DbSet<OtpCode> OtpCodes { get; set; }
}
```

### Example Entity Classes:
```csharp
public class UserRole
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } // "user", "admin", "super_admin"
    public DateTime AssignedAt { get; set; }
    public Guid? AssignedBy { get; set; }
    
    // Navigation properties
    public User User { get; set; }
    public User? AssignedByUser { get; set; }
}

public class Profile
{
    public Guid Id { get; set; } // Same as UserId
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation property
    public User User { get; set; }
}

public class Message
{
    public Guid Id { get; set; }
    public Guid ContactId { get; set; }
    public Guid? SenderId { get; set; }
    public string SenderType { get; set; } // "admin" or "contact"
    public string Content { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public ContactMessage Contact { get; set; }
    public User? Sender { get; set; }
}

public class StatusHistory
{
    public Guid Id { get; set; }
    public Guid ContactId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Comment { get; set; }
    
    // Navigation properties
    public ContactMessage Contact { get; set; }
    public User ChangedByUser { get; set; }
}
```

## 🚀 Priority Implementation Order

### Phase 1: Core User Management (Week 1)
1. ✅ Run database migration script
2. 🔴 Add `GET /users/me` endpoint
3. 🔴 Add `PUT /users/me` endpoint
4. 🔴 Update JWT token to include roles
5. 🔴 Implement role-based authorization

### Phase 2: Role Management (Week 2)
6. 🔴 Add `GET /users/{userId}/roles`
7. 🔴 Add `POST /users/{userId}/roles`
8. 🔴 Add `DELETE /users/{userId}/roles/{role}`
9. 🔴 Add `GET /audit/roles`
10. 🔴 Add `GET /users` with pagination

### Phase 3: Contact Management Enhancement (Week 3)
11. 🔴 Update `PUT /contact-us/{id}` with status management
12. 🔴 Add `GET /contact-us/{id}/status-history`
13. 🔴 Add `POST /contact-us/{id}/assign`
14. 🔴 Update `GET /contact-us` with filtering (status, assignedTo, date range)

### Phase 4: Messaging System (Week 4)
15. 🔴 Add `GET /contact-us/{id}/messages`
16. 🔴 Add `POST /contact-us/{id}/messages`
17. 🔴 Add `PUT /messages/{id}/read`
18. 🔴 Integrate email/SMS notifications for replies

## 📝 JWT Token Enhancement

Your JWT token should include user roles:
```csharp
// In your TokenService or wherever you generate JWT
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
};

// Add role claims
var roles = await GetUserRoles(user.Id);
foreach (var role in roles)
{
    claims.Add(new Claim(ClaimTypes.Role, role));
}

var token = new JwtSecurityToken(
    issuer: _configuration["Jwt:Issuer"],
    audience: _configuration["Jwt:Audience"],
    claims: claims,
    expires: DateTime.UtcNow.AddHours(24),
    signingCredentials: credentials
);
```

## 🔔 Notification System

Consider adding email/SMS notifications for:
- New contact message received → Notify admins
- Admin replies to contact → Notify contact via email/SMS
- Contact status changed → Notify assigned admin
- Role assigned/removed → Notify affected user

## 📊 Recommended Query Enhancements

Add pagination, filtering, and sorting to list endpoints:
```csharp
// Enhanced query parameters
GET /contact-us?
    status=new&
    assignedTo={guid}&
    dateFrom=2024-01-01&
    dateTo=2024-12-31&
    search=keyword&
    page=1&
    pageSize=20&
    sortBy=createdAt&
    sortOrder=desc

GET /users?
    role=admin&
    search=john@example.com&
    page=1&
    pageSize=20
```

## 🛡️ Security Checklist

- ✅ All endpoints require JWT authentication
- ✅ Role-based authorization on admin endpoints
- ✅ Super admin required for role management
- ✅ Validate user owns resource before allowing access
- ✅ Sanitize input to prevent SQL injection
- ✅ Rate limiting on sensitive endpoints
- ✅ Audit trail for role changes
- ✅ Soft delete for contacts (don't permanently delete)

## 📦 Response Models to Add

```csharp
public class UserWithRolesResponse
{
    public Guid Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
    public List<string> Roles { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
}

public class MessageResponse
{
    public Guid Id { get; set; }
    public Guid ContactId { get; set; }
    public Guid? SenderId { get; set; }
    public string SenderName { get; set; }
    public string SenderType { get; set; }
    public string Content { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StatusHistoryResponse
{
    public Guid Id { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; }
    public string ChangedByName { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Comment { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
```
