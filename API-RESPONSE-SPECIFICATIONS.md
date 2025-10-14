# API Response Specifications for Frontend Pages

## 🔐 Security Levels Overview

| Level | Role Required | Access Scope |
|-------|--------------|--------------|
| **Public** | None | Accessible to anyone |
| **Authenticated** | Any logged-in user | Own data only |
| **Admin** | admin, super_admin | All data |
| **Super Admin** | super_admin | System configuration |

---

## 📄 Page-by-Page API Requirements

### 1. **Dashboard Layout** (All Pages Header/Sidebar)
**File**: `src/components/DashboardLayout.tsx`

#### Required Endpoint:
```http
GET /users/me
Authorization: Bearer {token}
Security: Authenticated
```

#### Response Model:
```typescript
interface CurrentUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[]; // ["user"] or ["admin"] or ["super_admin"]
  profile: {
    avatarUrl: string | null;
    bio: string | null;
  };
}
```

#### C# Implementation:
```csharp
public class CurrentUserResponse
{
    public required Guid Id { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Email { get; init; }
    public required string Phone { get; init; }
    public required bool EmailVerified { get; init; }
    public required bool PhoneVerified { get; init; }
    public required List<string> Roles { get; init; }
    public required ProfileDto Profile { get; init; }
}

public class ProfileDto
{
    public string? AvatarUrl { get; init; }
    public string? Bio { get; init; }
}
```

#### Security Rules:
- ✅ User can only access their own data
- ✅ Extract user ID from JWT token (never from request body)
- ✅ Include user roles for frontend authorization

---

### 2. **Dashboard** (Statistics Page)
**File**: `src/pages/Dashboard.tsx`

#### Required Endpoints:

**A. Contact Statistics**
```http
GET /contact-us/statistics
Authorization: Bearer {token}
Security: Admin only
```

#### Response Model:
```typescript
interface ContactStatistics {
  total: number;
  byStatus: {
    new: number;
    in_progress: number;
    on_hold: number;
    resolved: number;
    closed: number;
  };
  recentContacts: ContactMessage[]; // Last 5
  unassignedCount: number;
  myAssignedCount: number; // Assigned to current admin
}
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireAdmin")]
app.MapGet("/contact-us/statistics", async (
    ApplicationDbContext db,
    HttpContext httpContext) =>
{
    var userId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    var contacts = await db.ContactMessages
        .Where(c => c.DeletedAt == null)
        .ToListAsync();
    
    var statistics = new ContactStatistics
    {
        Total = contacts.Count,
        ByStatus = new StatusBreakdown
        {
            New = contacts.Count(c => c.Status == "new"),
            InProgress = contacts.Count(c => c.Status == "in_progress"),
            OnHold = contacts.Count(c => c.Status == "on_hold"),
            Resolved = contacts.Count(c => c.Status == "resolved"),
            Closed = contacts.Count(c => c.Status == "closed")
        },
        RecentContacts = contacts
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(5)
            .Select(c => MapToContactMessageResponse(c))
            .ToList(),
        UnassignedCount = contacts.Count(c => c.AssignedTo == null),
        MyAssignedCount = contacts.Count(c => c.AssignedTo == userId)
    };
    
    return Results.Ok(Result.Success(statistics));
});
```

#### Security Rules:
- ✅ Admin role required
- ✅ Only show non-deleted contacts
- ✅ Filter "myAssignedCount" by current admin user

---

### 3. **Contacts Manager** (Contact List & Details)
**File**: `src/pages/ContactsManager.tsx`

#### Required Endpoints:

**A. List Contacts with Filtering**
```http
GET /contact-us?status={status}&assignedTo={userId}&search={keyword}&page={page}&pageSize={size}
Authorization: Bearer {token}
Security: Admin only
```

#### Response Model:
```typescript
interface PagedContactsResponse {
  items: ContactMessage[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "on_hold" | "resolved" | "closed";
  createdAtUtc: string;
  updatedAt: string;
  isResolved: boolean; // Deprecated but keep for backward compatibility
  assignedTo: string | null;
  assignedToName: string | null; // Admin's full name
  unreadMessagesCount: number; // Count of unread messages in conversation
  communicationMethod: "email" | "phone" | "both";
}
```

#### C# Implementation:
```csharp
public class PagedContactsResponse
{
    public required List<ContactMessageResponse> Items { get; init; }
    public required int TotalCount { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class ContactMessageResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public required string Subject { get; init; }
    public required string Message { get; init; }
    public required string Status { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public required bool IsResolved { get; init; }
    public Guid? AssignedTo { get; init; }
    public string? AssignedToName { get; init; }
    public required int UnreadMessagesCount { get; init; }
    public required string CommunicationMethod { get; init; }
}

[Authorize(Policy = "RequireAdmin")]
app.MapGet("/contact-us", async (
    ApplicationDbContext db,
    string? status,
    Guid? assignedTo,
    string? search,
    int page = 1,
    int pageSize = 20) =>
{
    var query = db.ContactMessages
        .Where(c => c.DeletedAt == null);
    
    // Apply filters
    if (!string.IsNullOrEmpty(status))
        query = query.Where(c => c.Status == status);
    
    if (assignedTo.HasValue)
        query = query.Where(c => c.AssignedTo == assignedTo);
    
    if (!string.IsNullOrEmpty(search))
    {
        var searchLower = search.ToLower();
        query = query.Where(c => 
            c.Name.ToLower().Contains(searchLower) ||
            c.Email.ToLower().Contains(searchLower) ||
            c.Subject.ToLower().Contains(searchLower) ||
            (c.Phone != null && c.Phone.Contains(searchLower)));
    }
    
    var totalCount = await query.CountAsync();
    
    var items = await query
        .OrderByDescending(c => c.CreatedAtUtc)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(c => new ContactMessageResponse
        {
            Id = c.Id,
            Name = c.Name,
            Email = c.Email,
            Phone = c.Phone,
            Subject = c.Subject,
            Message = c.Message,
            Status = c.Status,
            CreatedAtUtc = c.CreatedAtUtc,
            UpdatedAt = c.UpdatedAt,
            IsResolved = c.IsResolved,
            AssignedTo = c.AssignedTo,
            AssignedToName = c.AssignedTo != null 
                ? db.Users.Where(u => u.Id == c.AssignedTo)
                    .Select(u => u.FirstName + " " + u.LastName)
                    .FirstOrDefault()
                : null,
            UnreadMessagesCount = db.Messages
                .Count(m => m.ContactId == c.Id && !m.IsRead && m.SenderType == "contact"),
            CommunicationMethod = c.CommunicationMethod
        })
        .ToListAsync();
    
    return Results.Ok(Result.Success(new PagedContactsResponse
    {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize
    }));
});
```

**B. Update Contact (with Status Management)**
```http
PUT /contact-us/{id}
Authorization: Bearer {token}
Security: Admin only
```

#### Request Model:
```typescript
interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  status?: "new" | "in_progress" | "on_hold" | "resolved" | "closed";
  statusComment?: string; // Required when changing status
  assignedTo?: string | null;
}
```

#### C# Implementation:
```csharp
public class UpdateContactCommand
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }
    public string? Status { get; set; }
    public string? StatusComment { get; set; }
    public Guid? AssignedTo { get; set; }
}

[Authorize(Policy = "RequireAdmin")]
app.MapPut("/contact-us/{id}", async (
    Guid id,
    UpdateContactCommand command,
    ApplicationDbContext db,
    HttpContext httpContext) =>
{
    var contact = await db.ContactMessages.FindAsync(id);
    if (contact == null || contact.DeletedAt != null)
        return Results.NotFound(Result.Failure(Error.NotFound("Contact not found")));
    
    var userId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var oldStatus = contact.Status;
    
    // Update fields if provided
    if (command.Name != null) contact.Name = command.Name;
    if (command.Email != null) contact.Email = command.Email;
    if (command.Phone != null) contact.Phone = command.Phone;
    if (command.Subject != null) contact.Subject = command.Subject;
    if (command.Message != null) contact.Message = command.Message;
    if (command.AssignedTo.HasValue) contact.AssignedTo = command.AssignedTo;
    
    // Handle status change
    if (command.Status != null && command.Status != oldStatus)
    {
        // Validate status comment required for certain changes
        if (string.IsNullOrEmpty(command.StatusComment) && 
            (command.Status == "closed" || command.Status == "on_hold"))
        {
            return Results.BadRequest(Result.Failure(
                Error.Validation("StatusComment is required when changing to closed or on_hold")));
        }
        
        contact.Status = command.Status;
        contact.IsResolved = command.Status is "resolved" or "closed";
        
        // StatusHistory will be auto-created by trigger, but you can also do it manually:
        db.StatusHistory.Add(new StatusHistory
        {
            Id = Guid.NewGuid(),
            ContactId = id,
            OldStatus = oldStatus,
            NewStatus = command.Status,
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow,
            Comment = command.StatusComment
        });
    }
    
    contact.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    
    return Results.Ok(Result.Success());
});
```

**C. Delete Contact (Soft Delete)**
```http
DELETE /contact-us/{id}
Authorization: Bearer {token}
Security: Admin only
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireAdmin")]
app.MapDelete("/contact-us/{id}", async (
    Guid id,
    ApplicationDbContext db,
    HttpContext httpContext) =>
{
    var contact = await db.ContactMessages.FindAsync(id);
    if (contact == null || contact.DeletedAt != null)
        return Results.NotFound(Result.Failure(Error.NotFound("Contact not found")));
    
    var userId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    // Soft delete
    contact.DeletedAt = DateTime.UtcNow;
    contact.DeletedBy = userId;
    
    await db.SaveChangesAsync();
    return Results.Ok(Result.Success());
});
```

#### Security Rules:
- ✅ Admin role required for all operations
- ✅ Only show non-deleted contacts
- ✅ Soft delete (don't permanently remove data)
- ✅ Track who deleted the contact and when
- ✅ Validate status comment for certain status changes
- ✅ Log all status changes in StatusHistory table

---

### 4. **Contact Detail** (Conversation Thread)
**File**: `src/components/ContactDetail.tsx`

#### Required Endpoints:

**A. Get Contact with Messages**
```http
GET /contact-us/{id}
Authorization: Bearer {token}
Security: Admin only
```

#### Response Model:
```typescript
interface ContactDetailResponse {
  contact: ContactMessage;
  messages: MessageResponse[];
  statusHistory: StatusHistoryResponse[];
}

interface MessageResponse {
  id: string;
  contactId: string;
  senderId: string | null;
  senderName: string;
  senderType: "admin" | "contact";
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface StatusHistoryResponse {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedByName: string;
  changedAt: string;
  comment: string | null;
}
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireAdmin")]
app.MapGet("/contact-us/{id}", async (
    Guid id,
    ApplicationDbContext db) =>
{
    var contact = await db.ContactMessages
        .Where(c => c.Id == id && c.DeletedAt == null)
        .FirstOrDefaultAsync();
    
    if (contact == null)
        return Results.NotFound(Result.Failure(Error.NotFound("Contact not found")));
    
    var messages = await db.Messages
        .Where(m => m.ContactId == id)
        .OrderBy(m => m.CreatedAt)
        .Select(m => new MessageResponse
        {
            Id = m.Id,
            ContactId = m.ContactId,
            SenderId = m.SenderId,
            SenderName = m.SenderType == "admin"
                ? db.Users.Where(u => u.Id == m.SenderId)
                    .Select(u => u.FirstName + " " + u.LastName)
                    .FirstOrDefault() ?? "Unknown Admin"
                : contact.Name,
            SenderType = m.SenderType,
            Content = m.Content,
            IsRead = m.IsRead,
            CreatedAt = m.CreatedAt
        })
        .ToListAsync();
    
    var statusHistory = await db.StatusHistory
        .Where(sh => sh.ContactId == id)
        .OrderByDescending(sh => sh.ChangedAt)
        .Select(sh => new StatusHistoryResponse
        {
            Id = sh.Id,
            OldStatus = sh.OldStatus,
            NewStatus = sh.NewStatus,
            ChangedByName = db.Users.Where(u => u.Id == sh.ChangedBy)
                .Select(u => u.FirstName + " " + u.LastName)
                .FirstOrDefault() ?? "Unknown",
            ChangedAt = sh.ChangedAt,
            Comment = sh.Comment
        })
        .ToListAsync();
    
    return Results.Ok(Result.Success(new ContactDetailResponse
    {
        Contact = MapToContactMessageResponse(contact),
        Messages = messages,
        StatusHistory = statusHistory
    }));
});
```

**B. Send Reply to Contact**
```http
POST /contact-us/{id}/messages
Authorization: Bearer {token}
Security: Admin only
```

#### Request Model:
```typescript
interface SendMessageRequest {
  content: string;
  sendEmail: boolean; // Trigger email notification to contact
  sendSms: boolean; // Trigger SMS notification if phone exists
}
```

#### C# Implementation:
```csharp
public class SendMessageCommand
{
    public required string Content { get; set; }
    public bool SendEmail { get; set; }
    public bool SendSms { get; set; }
}

[Authorize(Policy = "RequireAdmin")]
app.MapPost("/contact-us/{id}/messages", async (
    Guid id,
    SendMessageCommand command,
    ApplicationDbContext db,
    HttpContext httpContext,
    IEmailService emailService,
    ISmsService smsService) =>
{
    var contact = await db.ContactMessages.FindAsync(id);
    if (contact == null || contact.DeletedAt != null)
        return Results.NotFound(Result.Failure(Error.NotFound("Contact not found")));
    
    var userId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var admin = await db.Users.FindAsync(userId);
    
    // Create message
    var message = new Message
    {
        Id = Guid.NewGuid(),
        ContactId = id,
        SenderId = userId,
        SenderType = "admin",
        Content = command.Content,
        IsRead = true,
        CreatedAt = DateTime.UtcNow
    };
    
    db.Messages.Add(message);
    
    // Update contact's UpdatedAt
    contact.UpdatedAt = DateTime.UtcNow;
    
    await db.SaveChangesAsync();
    
    // Send notifications
    if (command.SendEmail)
    {
        await emailService.SendReplyNotification(
            contact.Email,
            contact.Name,
            admin!.FirstName + " " + admin.LastName,
            command.Content,
            contact.Subject
        );
    }
    
    if (command.SendSms && !string.IsNullOrEmpty(contact.Phone))
    {
        await smsService.SendReplyNotification(
            contact.Phone,
            admin!.FirstName,
            command.Content
        );
    }
    
    return Results.Ok(Result.Success(message.Id));
});
```

**C. Mark Message as Read**
```http
PUT /messages/{id}/read
Authorization: Bearer {token}
Security: Admin only
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireAdmin")]
app.MapPut("/messages/{id}/read", async (
    Guid id,
    ApplicationDbContext db) =>
{
    var message = await db.Messages.FindAsync(id);
    if (message == null)
        return Results.NotFound(Result.Failure(Error.NotFound("Message not found")));
    
    message.IsRead = true;
    await db.SaveChangesAsync();
    
    return Results.Ok(Result.Success());
});
```

#### Security Rules:
- ✅ Admin role required
- ✅ Don't expose deleted contacts
- ✅ Track who sent each message
- ✅ Validate contact exists before creating message
- ✅ Only send notifications if explicitly requested

---

### 5. **Profile Settings**
**File**: `src/pages/ProfileSettings.tsx`

#### Required Endpoints:

**A. Get Current User Profile**
```http
GET /users/me
Authorization: Bearer {token}
Security: Authenticated
```
*(Same as Dashboard Layout - already defined above)*

**B. Update Profile**
```http
PUT /users/me
Authorization: Bearer {token}
Security: Authenticated
```

#### Request Model:
```typescript
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
}
```

#### C# Implementation:
```csharp
public class UpdateProfileCommand
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
}

[Authorize]
app.MapPut("/users/me", async (
    UpdateProfileCommand command,
    ApplicationDbContext db,
    HttpContext httpContext) =>
{
    var userId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var user = await db.Users.FindAsync(userId);
    
    if (user == null)
        return Results.NotFound(Result.Failure(Error.NotFound("User not found")));
    
    // Update user fields
    if (command.FirstName != null) user.FirstName = command.FirstName;
    if (command.LastName != null) user.LastName = command.LastName;
    if (command.Phone != null) user.Phone = command.Phone;
    
    // Update profile
    var profile = await db.Profiles.FindAsync(userId);
    if (profile != null && command.Bio != null)
    {
        profile.Bio = command.Bio;
    }
    
    await db.SaveChangesAsync();
    return Results.Ok(Result.Success());
});
```

**C. Upload Avatar**
```http
POST /users/me/avatar
Authorization: Bearer {token}
Security: Authenticated
Content-Type: multipart/form-data
```

#### C# Implementation:
```csharp
[Authorize]
app.MapPost("/users/me/avatar", async (
    HttpRequest request,
    ApplicationDbContext db,
    HttpContext httpContext,
    IFileStorageService fileStorage) =>
{
    var userId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    if (!request.HasFormContentType || request.Form.Files.Count == 0)
        return Results.BadRequest(Result.Failure(Error.Validation("No file uploaded")));
    
    var file = request.Form.Files[0];
    
    // Validate file
    if (file.Length > 5 * 1024 * 1024) // 5MB max
        return Results.BadRequest(Result.Failure(Error.Validation("File too large (max 5MB)")));
    
    var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
    if (!allowedTypes.Contains(file.ContentType))
        return Results.BadRequest(Result.Failure(Error.Validation("Invalid file type")));
    
    // Upload to storage (Azure Blob, AWS S3, or local storage)
    var avatarUrl = await fileStorage.UploadAvatarAsync(userId, file);
    
    // Update profile
    var profile = await db.Profiles.FindAsync(userId);
    if (profile == null)
    {
        profile = new Profile { Id = userId };
        db.Profiles.Add(profile);
    }
    
    profile.AvatarUrl = avatarUrl;
    await db.SaveChangesAsync();
    
    return Results.Ok(Result.Success(new { avatarUrl }));
});
```

**D. Change Password**
```http
POST /users/change-password
Authorization: Bearer {token}
Security: Authenticated
```
*(Already exists in your API - no changes needed)*

#### Security Rules:
- ✅ User can only update their own profile
- ✅ Never allow changing email directly (requires verification)
- ✅ Validate file size and type for avatars
- ✅ Store avatars in secure location with unique filenames
- ✅ Require current password for password changes

---

### 6. **Users List** (Admin User Management)
**File**: `src/pages/UsersList.tsx`

#### Required Endpoints:

**A. List All Users**
```http
GET /users?role={role}&search={keyword}&page={page}&pageSize={size}
Authorization: Bearer {token}
Security: Admin only
```

#### Response Model:
```typescript
interface PagedUsersResponse {
  items: UserWithRolesResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UserWithRolesResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null; // If you track this
}
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireAdmin")]
app.MapGet("/users", async (
    ApplicationDbContext db,
    string? role,
    string? search,
    int page = 1,
    int pageSize = 20) =>
{
    var query = db.Users.AsQueryable();
    
    // Filter by role
    if (!string.IsNullOrEmpty(role))
    {
        var userIdsWithRole = db.UserRoles
            .Where(ur => ur.Role == role)
            .Select(ur => ur.UserId);
        query = query.Where(u => userIdsWithRole.Contains(u.Id));
    }
    
    // Search filter
    if (!string.IsNullOrEmpty(search))
    {
        var searchLower = search.ToLower();
        query = query.Where(u =>
            u.FirstName.ToLower().Contains(searchLower) ||
            u.LastName.ToLower().Contains(searchLower) ||
            u.Email.ToLower().Contains(searchLower) ||
            u.Phone.Contains(searchLower));
    }
    
    var totalCount = await query.CountAsync();
    
    var users = await query
        .OrderByDescending(u => u.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(u => new UserWithRolesResponse
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            Phone = u.Phone,
            EmailVerified = u.EmailVerified,
            PhoneVerified = u.PhoneVerified,
            Roles = db.UserRoles
                .Where(ur => ur.UserId == u.Id)
                .Select(ur => ur.Role)
                .ToList(),
            AvatarUrl = db.Profiles
                .Where(p => p.Id == u.Id)
                .Select(p => p.AvatarUrl)
                .FirstOrDefault(),
            CreatedAt = u.CreatedAt
        })
        .ToListAsync();
    
    return Results.Ok(Result.Success(new PagedUsersResponse
    {
        Items = users,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize
    }));
});
```

#### Security Rules:
- ✅ Admin role required
- ✅ Don't expose password hashes
- ✅ Include role information for each user
- ✅ Support filtering by role and search term

---

### 7. **Role Management** (Super Admin Only)
**File**: `src/pages/RoleManagement.tsx`

#### Required Endpoints:

**A. Get User's Roles**
```http
GET /users/{userId}/roles
Authorization: Bearer {token}
Security: Admin only
```

#### Response Model:
```typescript
interface UserRolesResponse {
  userId: string;
  roles: RoleAssignment[];
}

interface RoleAssignment {
  id: string;
  role: string;
  assignedAt: string;
  assignedBy: string | null;
  assignedByName: string | null;
}
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireAdmin")]
app.MapGet("/users/{userId}/roles", async (
    Guid userId,
    ApplicationDbContext db) =>
{
    var user = await db.Users.FindAsync(userId);
    if (user == null)
        return Results.NotFound(Result.Failure(Error.NotFound("User not found")));
    
    var roles = await db.UserRoles
        .Where(ur => ur.UserId == userId)
        .Select(ur => new RoleAssignment
        {
            Id = ur.Id,
            Role = ur.Role,
            AssignedAt = ur.AssignedAt,
            AssignedBy = ur.AssignedBy,
            AssignedByName = ur.AssignedBy != null
                ? db.Users.Where(u => u.Id == ur.AssignedBy)
                    .Select(u => u.FirstName + " " + u.LastName)
                    .FirstOrDefault()
                : null
        })
        .ToListAsync();
    
    return Results.Ok(Result.Success(new UserRolesResponse
    {
        UserId = userId,
        Roles = roles
    }));
});
```

**B. Assign Role to User**
```http
POST /users/{userId}/roles
Authorization: Bearer {token}
Security: Super Admin only
```

#### Request Model:
```typescript
interface AssignRoleRequest {
  role: "user" | "admin" | "super_admin";
  reason: string;
}
```

#### C# Implementation:
```csharp
public class AssignRoleCommand
{
    public required string Role { get; set; }
    public required string Reason { get; set; }
}

[Authorize(Policy = "RequireSuperAdmin")]
app.MapPost("/users/{userId}/roles", async (
    Guid userId,
    AssignRoleCommand command,
    ApplicationDbContext db,
    HttpContext httpContext) =>
{
    var user = await db.Users.FindAsync(userId);
    if (user == null)
        return Results.NotFound(Result.Failure(Error.NotFound("User not found")));
    
    var performedBy = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    // Validate role
    var validRoles = new[] { "user", "admin", "super_admin" };
    if (!validRoles.Contains(command.Role))
        return Results.BadRequest(Result.Failure(Error.Validation("Invalid role")));
    
    // Check if user already has this role
    var existingRole = await db.UserRoles
        .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.Role == command.Role);
    
    if (existingRole != null)
        return Results.BadRequest(Result.Failure(Error.Conflict("User already has this role")));
    
    // Assign role
    var userRole = new UserRole
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Role = command.Role,
        AssignedAt = DateTime.UtcNow,
        AssignedBy = performedBy
    };
    
    db.UserRoles.Add(userRole);
    
    // Log to audit trail (trigger will handle this, but you can also do manually)
    db.RoleAuditLog.Add(new RoleAuditLog
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Role = command.Role,
        Action = "assigned",
        PerformedBy = performedBy,
        Reason = command.Reason,
        CreatedAt = DateTime.UtcNow
    });
    
    await db.SaveChangesAsync();
    
    return Results.Ok(Result.Success());
});
```

**C. Remove Role from User**
```http
DELETE /users/{userId}/roles/{role}
Authorization: Bearer {token}
Security: Super Admin only
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireSuperAdmin")]
app.MapDelete("/users/{userId}/roles/{role}", async (
    Guid userId,
    string role,
    ApplicationDbContext db,
    HttpContext httpContext) =>
{
    var performedBy = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    // Prevent removing the last super_admin
    if (role == "super_admin")
    {
        var superAdminCount = await db.UserRoles
            .CountAsync(ur => ur.Role == "super_admin");
        
        if (superAdminCount <= 1)
            return Results.BadRequest(Result.Failure(
                Error.Validation("Cannot remove the last super admin")));
    }
    
    var userRole = await db.UserRoles
        .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.Role == role);
    
    if (userRole == null)
        return Results.NotFound(Result.Failure(Error.NotFound("Role assignment not found")));
    
    db.UserRoles.Remove(userRole);
    
    // Log to audit trail
    db.RoleAuditLog.Add(new RoleAuditLog
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Role = role,
        Action = "removed",
        PerformedBy = performedBy,
        CreatedAt = DateTime.UtcNow
    });
    
    await db.SaveChangesAsync();
    
    return Results.Ok(Result.Success());
});
```

**D. View Role Audit Log**
```http
GET /audit/roles?userId={userId}&page={page}&pageSize={size}
Authorization: Bearer {token}
Security: Super Admin only
```

#### Response Model:
```typescript
interface PagedAuditLogResponse {
  items: RoleAuditEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface RoleAuditEntry {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: "assigned" | "removed";
  performedBy: string | null;
  performedByName: string | null;
  reason: string | null;
  createdAt: string;
}
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireSuperAdmin")]
app.MapGet("/audit/roles", async (
    ApplicationDbContext db,
    Guid? userId,
    int page = 1,
    int pageSize = 50) =>
{
    var query = db.RoleAuditLog.AsQueryable();
    
    if (userId.HasValue)
        query = query.Where(ral => ral.UserId == userId);
    
    var totalCount = await query.CountAsync();
    
    var items = await query
        .OrderByDescending(ral => ral.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(ral => new RoleAuditEntry
        {
            Id = ral.Id,
            UserId = ral.UserId,
            UserName = db.Users.Where(u => u.Id == ral.UserId)
                .Select(u => u.FirstName + " " + u.LastName)
                .FirstOrDefault() ?? "Unknown User",
            Role = ral.Role,
            Action = ral.Action,
            PerformedBy = ral.PerformedBy,
            PerformedByName = ral.PerformedBy != null
                ? db.Users.Where(u => u.Id == ral.PerformedBy)
                    .Select(u => u.FirstName + " " + u.LastName)
                    .FirstOrDefault()
                : null,
            Reason = ral.Reason,
            CreatedAt = ral.CreatedAt
        })
        .ToListAsync();
    
    return Results.Ok(Result.Success(new PagedAuditLogResponse
    {
        Items = items,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize
    }));
});
```

#### Security Rules:
- ✅ Super Admin role required for role assignment/removal
- ✅ Prevent removing the last super_admin
- ✅ Log all role changes to audit trail
- ✅ Include reason for role changes
- ✅ Track who performed each action

---

## 🔒 JWT Token Enhancement

Your JWT token MUST include roles for frontend authorization:

```csharp
// Token generation service
public async Task<string> GenerateTokenAsync(User user)
{
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Email, user.Email),
        new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
    };
    
    // Add role claims
    var roles = await _db.UserRoles
        .Where(ur => ur.UserId == user.Id)
        .Select(ur => ur.Role)
        .ToListAsync();
    
    foreach (var role in roles)
    {
        claims.Add(new Claim(ClaimTypes.Role, role));
    }
    
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    
    var token = new JwtSecurityToken(
        issuer: _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(24),
        signingCredentials: credentials
    );
    
    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

---

## 🛡️ Critical Security Checklist

### For ALL Endpoints:
- ✅ Require JWT authentication (except login/register)
- ✅ Extract user ID from JWT claims (NEVER from request body)
- ✅ Validate user exists before processing
- ✅ Use parameterized queries (EF Core handles this)
- ✅ Sanitize user input
- ✅ Return consistent error format
- ✅ Log security-relevant events

### For Admin Endpoints:
- ✅ Check `[Authorize(Policy = "RequireAdmin")]`
- ✅ Verify user has admin or super_admin role
- ✅ Don't expose sensitive user data unnecessarily

### For Super Admin Endpoints:
- ✅ Check `[Authorize(Policy = "RequireSuperAdmin")]`
- ✅ Prevent removing last super_admin
- ✅ Log all role changes to audit trail

### Data Protection:
- ✅ Never return password hashes
- ✅ Use soft delete for contacts
- ✅ Track who deleted/modified records
- ✅ Encrypt sensitive data at rest
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on auth endpoints

---

## 📝 Authorization Policies Setup

```csharp
// In Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireUser", policy =>
        policy.RequireAuthenticatedUser());
    
    options.AddPolicy("RequireAdmin", policy =>
        policy.RequireRole("admin", "super_admin"));
    
    options.AddPolicy("RequireSuperAdmin", policy =>
        policy.RequireRole("super_admin"));
});
```

---

## 🚀 Implementation Priority

1. **Week 1**: User profile & roles
   - `GET /users/me`
   - JWT token with roles
   - Authorization policies

2. **Week 2**: Contact management
   - Enhanced filtering on `GET /contact-us`
   - Status management on `PUT /contact-us/{id}`
   - `GET /contact-us/statistics`

3. **Week 3**: Messaging system
   - `GET /contact-us/{id}` with messages
   - `POST /contact-us/{id}/messages`
   - Email/SMS notifications

4. **Week 4**: Admin features
   - `GET /users` list
   - `POST /users/{userId}/roles`
   - `GET /audit/roles`

---

This specification should give you everything you need to implement secure, production-ready endpoints! 🎯
