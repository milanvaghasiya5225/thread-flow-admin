# Complete .NET API Implementation Guide

## 📋 Overview
This document contains EVERYTHING needed to build the complete .NET API for the Contact Management Admin System.

---

## 🗄️ PART 1: Database Schema (SQL Server)

### 1.1 Users Table - UPDATE REQUIRED
```sql
-- Add missing columns to existing Users table
ALTER TABLE [dbo].[Users]
ADD 
    [UserName] [nvarchar](100) NOT NULL DEFAULT '',
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE();

-- Add unique constraint for username
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_UserName] 
ON [dbo].[Users]([UserName] ASC);

-- Make Phone field required if it's nullable
-- (If it's already NOT NULL, skip this)
ALTER TABLE [dbo].[Users]
ALTER COLUMN [Phone] [nvarchar](max) NOT NULL;
```

### 1.2 UserRoles Table - NEW
```sql
CREATE TABLE [dbo].[UserRoles](
    [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [UserId] [uniqueidentifier] NOT NULL,
    [Role] [nvarchar](50) NOT NULL, -- 'user', 'admin', 'super_admin'
    [AssignedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [AssignedBy] [uniqueidentifier] NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY([UserId]) 
        REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_AssignedBy] FOREIGN KEY([AssignedBy]) 
        REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [UQ_UserRoles_UserRole] UNIQUE([UserId], [Role])
);

CREATE INDEX [IX_UserRoles_UserId] ON [dbo].[UserRoles]([UserId]);
CREATE INDEX [IX_UserRoles_Role] ON [dbo].[UserRoles]([Role]);
```

### 1.3 RoleAuditLog Table - NEW
```sql
CREATE TABLE [dbo].[RoleAuditLog](
    [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [UserId] [uniqueidentifier] NOT NULL,
    [Role] [nvarchar](50) NOT NULL,
    [Action] [nvarchar](50) NOT NULL, -- 'assigned', 'removed'
    [PerformedBy] [uniqueidentifier] NULL,
    [Reason] [nvarchar](500) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_RoleAuditLog] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RoleAuditLog_Users] FOREIGN KEY([UserId]) 
        REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_RoleAuditLog_UserId] ON [dbo].[RoleAuditLog]([UserId]);
CREATE INDEX [IX_RoleAuditLog_CreatedAt] ON [dbo].[RoleAuditLog]([CreatedAt] DESC);
```

### 1.4 Profiles Table - NEW
```sql
CREATE TABLE [dbo].[Profiles](
    [Id] [uniqueidentifier] NOT NULL, -- Same as UserId
    [UserName] [nvarchar](100) NULL,
    [AvatarUrl] [nvarchar](500) NULL,
    [Bio] [nvarchar](1000) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Profiles] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Profiles_Users] FOREIGN KEY([Id]) 
        REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);
```

### 1.5 ContactMessages Table - UPDATE REQUIRED
```sql
-- Add missing columns to existing ContactMessages table
ALTER TABLE [dbo].[ContactMessages]
ADD 
    [Status] [nvarchar](50) NOT NULL DEFAULT 'new',
    [AssignedTo] [uniqueidentifier] NULL,
    [DeletedAt] [datetime2](7) NULL,
    [DeletedBy] [uniqueidentifier] NULL,
    [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [CommunicationMethod] [nvarchar](20) NOT NULL DEFAULT 'email';

-- Add foreign key for AssignedTo
ALTER TABLE [dbo].[ContactMessages]
ADD CONSTRAINT [FK_ContactMessages_AssignedTo] 
    FOREIGN KEY([AssignedTo]) REFERENCES [dbo].[Users]([Id]);

-- Add indexes
CREATE INDEX [IX_ContactMessages_Status] ON [dbo].[ContactMessages]([Status]);
CREATE INDEX [IX_ContactMessages_AssignedTo] ON [dbo].[ContactMessages]([AssignedTo]);
CREATE INDEX [IX_ContactMessages_DeletedAt] ON [dbo].[ContactMessages]([DeletedAt]);
CREATE INDEX [IX_ContactMessages_CreatedAtUtc] ON [dbo].[ContactMessages]([CreatedAtUtc] DESC);
```

### 1.6 Messages Table - NEW
```sql
CREATE TABLE [dbo].[Messages](
    [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [ContactId] [uniqueidentifier] NOT NULL,
    [SenderId] [uniqueidentifier] NULL, -- NULL for messages from contact
    [SenderType] [nvarchar](20) NOT NULL, -- 'admin', 'contact'
    [Content] [nvarchar](max) NOT NULL,
    [IsRead] [bit] NOT NULL DEFAULT 0,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Messages] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Messages_Contact] FOREIGN KEY([ContactId]) 
        REFERENCES [dbo].[ContactMessages]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Messages_Sender] FOREIGN KEY([SenderId]) 
        REFERENCES [dbo].[Users]([Id])
);

CREATE INDEX [IX_Messages_ContactId] ON [dbo].[Messages]([ContactId]);
CREATE INDEX [IX_Messages_CreatedAt] ON [dbo].[Messages]([CreatedAt] DESC);
CREATE INDEX [IX_Messages_IsRead] ON [dbo].[Messages]([IsRead]);
```

### 1.7 StatusHistory Table - NEW
```sql
CREATE TABLE [dbo].[StatusHistory](
    [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [ContactId] [uniqueidentifier] NOT NULL,
    [OldStatus] [nvarchar](50) NULL,
    [NewStatus] [nvarchar](50) NOT NULL,
    [ChangedBy] [uniqueidentifier] NOT NULL,
    [ChangedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [Comment] [nvarchar](500) NULL,
    CONSTRAINT [PK_StatusHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_StatusHistory_Contact] FOREIGN KEY([ContactId]) 
        REFERENCES [dbo].[ContactMessages]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_StatusHistory_ChangedBy] FOREIGN KEY([ChangedBy]) 
        REFERENCES [dbo].[Users]([Id])
);

CREATE INDEX [IX_StatusHistory_ContactId] ON [dbo].[StatusHistory]([ContactId]);
CREATE INDEX [IX_StatusHistory_ChangedAt] ON [dbo].[StatusHistory]([ChangedAt] DESC);
```

### 1.8 Database Triggers
```sql
-- Trigger: Auto-update UpdatedAt on Users
GO
CREATE TRIGGER [dbo].[TR_Users_UpdatedAt]
ON [dbo].[Users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Users]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [dbo].[Users] u
    INNER JOIN inserted i ON u.[Id] = i.[Id];
END;
GO

-- Trigger: Auto-update UpdatedAt on ContactMessages
GO
CREATE TRIGGER [dbo].[TR_ContactMessages_UpdatedAt]
ON [dbo].[ContactMessages]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[ContactMessages]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [dbo].[ContactMessages] cm
    INNER JOIN inserted i ON cm.[Id] = i.[Id];
END;
GO

-- Trigger: Log status changes to StatusHistory
GO
CREATE TRIGGER [dbo].[TR_ContactMessages_StatusHistory]
ON [dbo].[ContactMessages]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO [dbo].[StatusHistory] ([ContactId], [OldStatus], [NewStatus], [ChangedBy], [Comment])
    SELECT 
        i.[Id],
        d.[Status],
        i.[Status],
        i.[AssignedTo], -- Ideally pass actual user making change
        NULL
    FROM inserted i
    INNER JOIN deleted d ON i.[Id] = d.[Id]
    WHERE i.[Status] <> d.[Status];
END;
GO

-- Trigger: Log role changes to RoleAuditLog
GO
CREATE TRIGGER [dbo].[TR_UserRoles_AuditLog]
ON [dbo].[UserRoles]
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Log assignments
    INSERT INTO [dbo].[RoleAuditLog] ([UserId], [Role], [Action], [PerformedBy], [Reason])
    SELECT i.[UserId], i.[Role], 'assigned', i.[AssignedBy], 'Role assigned'
    FROM inserted i;
    
    -- Log removals
    INSERT INTO [dbo].[RoleAuditLog] ([UserId], [Role], [Action], [PerformedBy])
    SELECT d.[UserId], d.[Role], 'removed', NULL
    FROM deleted d
    WHERE NOT EXISTS (
        SELECT 1 FROM inserted 
        WHERE UserId = d.UserId AND Role = d.Role
    );
END;
GO

-- Trigger: Auto-update UpdatedAt on Profiles
GO
CREATE TRIGGER [dbo].[TR_Profiles_UpdatedAt]
ON [dbo].[Profiles]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Profiles]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [dbo].[Profiles] p
    INNER JOIN inserted i ON p.[Id] = i.[Id];
END;
GO
```

---

## 🔧 PART 2: Entity Framework Core Models

### 2.1 User Entity
```csharp
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string UserName { get; set; } = null!;  // NEW
    public string PasswordHash { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public bool PhoneVerified { get; set; }
    public bool EmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public Profile? Profile { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<ContactMessage> AssignedContacts { get; set; } = new List<ContactMessage>();
}
```

### 2.2 UserRole Entity
```csharp
public class UserRole
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = null!; // "user", "admin", "super_admin"
    public DateTime AssignedAt { get; set; }
    public Guid? AssignedBy { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public User? AssignedByUser { get; set; }
}
```

### 2.3 Profile Entity
```csharp
public class Profile
{
    public Guid Id { get; set; } // Same as UserId
    public string? UserName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation property
    public User User { get; set; } = null!;
}
```

### 2.4 ContactMessage Entity
```csharp
public class ContactMessage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string Subject { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Status { get; set; } = "new"; // NEW
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAt { get; set; } // NEW
    public bool IsResolved { get; set; }
    public Guid? AssignedTo { get; set; } // NEW
    public DateTime? DeletedAt { get; set; } // NEW
    public Guid? DeletedBy { get; set; } // NEW
    public string CommunicationMethod { get; set; } = "email"; // NEW
    
    // Navigation properties
    public User? AssignedToUser { get; set; }
    public User? DeletedByUser { get; set; }
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<StatusHistory> StatusHistory { get; set; } = new List<StatusHistory>();
}
```

### 2.5 Message Entity
```csharp
public class Message
{
    public Guid Id { get; set; }
    public Guid ContactId { get; set; }
    public Guid? SenderId { get; set; } // NULL for client messages
    public string SenderType { get; set; } = null!; // "admin" or "contact"
    public string Content { get; set; } = null!;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public ContactMessage Contact { get; set; } = null!;
    public User? Sender { get; set; }
}
```

### 2.6 StatusHistory Entity
```csharp
public class StatusHistory
{
    public Guid Id { get; set; }
    public Guid ContactId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = null!;
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Comment { get; set; }
    
    // Navigation properties
    public ContactMessage Contact { get; set; } = null!;
    public User ChangedByUser { get; set; } = null!;
}
```

### 2.7 RoleAuditLog Entity
```csharp
public class RoleAuditLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = null!;
    public string Action { get; set; } = null!; // "assigned" or "removed"
    public Guid? PerformedBy { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public User? PerformedByUser { get; set; }
}
```

### 2.8 DbContext Update
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
    public DbSet<OtpCode> OtpCodes { get; set; } // Existing
    
    // Configure relationships in OnModelCreating...
}
```

---

## 🔐 PART 3: Authentication & Authorization

### 3.1 JWT Configuration
```csharp
// In appsettings.json
{
  "Jwt": {
    "Key": "your-super-secret-key-minimum-32-characters-long",
    "Issuer": "YourAppName",
    "Audience": "YourAppName",
    "ExpiryInHours": 24
  }
}
```

### 3.2 Authorization Policies
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

### 3.3 JWT Token Generation with Roles
```csharp
public class TokenService
{
    public async Task<string> GenerateTokenAsync(User user, ApplicationDbContext db)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };
        
        // ✅ CRITICAL: Add role claims
        var roles = await db.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role)
            .ToListAsync();
        
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }
        
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
        );
        var credentials = new SigningCredentials(
            key, 
            SecurityAlgorithms.HmacSha256
        );
        
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

---

## 🌐 PART 4: API Endpoints (Complete List)

### 4.1 Authentication Endpoints

#### POST /users/register
**Request:**
```csharp
public class RegisterRequest
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string UserName { get; set; }  // NEW
    public required string Email { get; set; }
    public required string Phone { get; set; }     // Required, not optional
    public required string Password { get; set; }
}
```

**Response:**
```csharp
public class RegisterResponse
{
    public Guid UserId { get; set; }
    public string Message { get; set; } = 
        "Registration successful. Please verify your email and phone to login.";
    public bool VerificationRequired { get; set; } = true;
}
```

**Business Logic:**
1. Validate all fields (username must be unique)
2. Hash password
3. Create user with `EmailVerified = false, PhoneVerified = false`
4. Create profile record
5. Assign default "user" role
6. Send OTP to email
7. Send OTP to phone (SMS)
8. Return success with userId

#### POST /users/login
**Request:**
```csharp
public class LoginRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}
```

**Response:**
```csharp
public class LoginResponse
{
    public string Token { get; set; } = null!;
    public UserResponse User { get; set; } = null!;
}
```

**Business Logic:**
1. Find user by email
2. ✅ **CRITICAL: Check if both EmailVerified AND PhoneVerified are true**
3. If not verified, return error: "Please verify your email and phone number"
4. Verify password hash
5. Generate JWT token with roles
6. Return token and user data

#### POST /users/login-otp
*(Already exists - no changes)*

#### POST /users/verify-otp
*(Already exists - update to set EmailVerified or PhoneVerified)*

#### POST /users/resend-otp
*(Already exists - no changes)*

#### GET /users/verification-status
**Request:** Query param `email`

**Response:**
```csharp
public class VerificationStatusResponse
{
    public string Email { get; set; } = null!;
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
    public bool CanLogin { get; set; } // true only if BOTH verified
}
```

**Business Logic:**
1. Find user by email
2. Return verification status
3. `CanLogin = EmailVerified && PhoneVerified`

---

### 4.2 User Profile Endpoints

#### GET /users/me
**Authorization:** Bearer token (any authenticated user)

**Response:**
```csharp
public class CurrentUserResponse
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = null!;
    public string LastName { get; init; } = null!;
    public string UserName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string Phone { get; init; } = null!;
    public bool EmailVerified { get; init; }
    public bool PhoneVerified { get; init; }
    public List<string> Roles { get; init; } = new();
    public ProfileDto Profile { get; init; } = null!;
}

public class ProfileDto
{
    public string? AvatarUrl { get; init; }
    public string? Bio { get; init; }
}
```

**Business Logic:**
1. Extract userId from JWT token (ClaimTypes.NameIdentifier)
2. Get user with profile and roles
3. Return full user data

#### PUT /users/me
**Authorization:** Bearer token

**Request:**
```csharp
public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
}
```

**Business Logic:**
1. Extract userId from JWT
2. Update only provided fields
3. Update profile bio if provided
4. Return success

#### POST /users/me/avatar
**Authorization:** Bearer token  
**Content-Type:** multipart/form-data

**Business Logic:**
1. Validate file (max 5MB, only images)
2. Save file to storage (local/Azure/AWS)
3. Update profile.AvatarUrl
4. Return new avatar URL

#### POST /users/change-password
*(Already exists - no changes)*

---

### 4.3 Contact Management Endpoints

#### GET /contact-us/statistics
**Authorization:** Bearer token (Admin only)

**Response:**
```csharp
public class ContactStatistics
{
    public int Total { get; set; }
    public StatusBreakdown ByStatus { get; set; } = null!;
    public List<ContactMessageResponse> RecentContacts { get; set; } = new();
    public int UnassignedCount { get; set; }
    public int MyAssignedCount { get; set; }
}

public class StatusBreakdown
{
    public int New { get; set; }
    public int InProgress { get; set; }
    public int OnHold { get; set; }
    public int Resolved { get; set; }
    public int Closed { get; set; }
}
```

**Business Logic:**
1. Count all non-deleted contacts
2. Group by status
3. Get last 5 contacts
4. Count unassigned
5. Count assigned to current admin

#### GET /contact-us/statistics/monthly
**Authorization:** Bearer token (Admin only)  
**Query Params:** `months` (default: 6)

**Response:**
```csharp
public class MonthlyStatistics
{
    public List<string> Labels { get; init; } = new(); // ["Jan 2025", "Feb 2025", ...]
    public MonthlyDatasets Datasets { get; init; } = null!;
}

public class MonthlyDatasets
{
    public List<int> New { get; init; } = new();
    public List<int> InProgress { get; init; } = new();
    public List<int> Resolved { get; init; } = new();
    public List<int> Closed { get; init; } = new();
    public List<int> Total { get; init; } = new();
}
```

**Business Logic:**
1. Get contacts from last N months
2. Group by month
3. Count by status for each month
4. Fill missing months with zeros
5. Return formatted for charts

#### GET /contact-us
**Authorization:** Bearer token (Admin only)  
**Query Params:** `status`, `assignedTo`, `search`, `page`, `pageSize`

**Response:**
```csharp
public class PagedContactsResponse
{
    public List<ContactMessageResponse> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class ContactMessageResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string? Phone { get; init; }
    public string Subject { get; init; } = null!;
    public string Message { get; init; } = null!;
    public string Status { get; init; } = null!;
    public DateTime CreatedAtUtc { get; init; }
    public DateTime UpdatedAt { get; init; }
    public bool IsResolved { get; init; }
    public Guid? AssignedTo { get; init; }
    public string? AssignedToName { get; init; }
    public int UnreadMessagesCount { get; init; }
    public string CommunicationMethod { get; init; } = null!;
}
```

**Business Logic:**
1. Query non-deleted contacts
2. Apply filters (status, assignedTo, search)
3. Count total for pagination
4. Include assigned admin name
5. Count unread messages
6. Order by CreatedAtUtc DESC

#### GET /contact-us/{id}
**Authorization:** Bearer token (Admin only)

**Response:**
```csharp
public class ContactDetailResponse
{
    public ContactMessageResponse Contact { get; init; } = null!;
    public List<MessageResponse> Messages { get; init; } = new();
    public List<StatusHistoryResponse> StatusHistory { get; init; } = new();
}

public class MessageResponse
{
    public Guid Id { get; init; }
    public Guid ContactId { get; init; }
    public Guid? SenderId { get; init; }
    public string SenderName { get; init; } = null!;
    public string SenderType { get; init; } = null!;
    public string Content { get; init; } = null!;
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
}

public class StatusHistoryResponse
{
    public Guid Id { get; init; }
    public string? OldStatus { get; init; }
    public string NewStatus { get; init; } = null!;
    public string ChangedByName { get; init; } = null!;
    public DateTime ChangedAt { get; init; }
    public string? Comment { get; init; }
}
```

**Business Logic:**
1. Get contact by id (non-deleted)
2. Get all messages ordered by CreatedAt
3. Get status history ordered by ChangedAt DESC
4. Include sender names for messages
5. Include changed-by names for history

#### PUT /contact-us/{id}
**Authorization:** Bearer token (Admin only)

**Request:**
```csharp
public class UpdateContactRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }
    public string? Status { get; set; }
    public string? StatusComment { get; set; }
    public Guid? AssignedTo { get; set; }
}
```

**Business Logic:**
1. Get contact (must not be deleted)
2. ✅ **CRITICAL: If status is changing to "on_hold", "resolved", or "closed":**
   - Validate StatusComment is provided
   - Return validation error if missing
3. Update fields if provided
4. If status changed, create StatusHistory entry
5. Update IsResolved flag (true if resolved or closed)
6. Save changes

#### DELETE /contact-us/{id}
**Authorization:** Bearer token (Admin only)

**Business Logic:**
1. Get contact by id
2. ✅ **Soft delete only:**
   - Set DeletedAt = DateTime.UtcNow
   - Set DeletedBy = current userId
3. Don't actually delete the record
4. Return success

#### POST /contact-us/{id}/messages
**Authorization:** Bearer token (Admin only)

**Request:**
```csharp
public class SendMessageRequest
{
    public required string Content { get; set; }
    public bool SendEmail { get; set; }
    public bool SendSms { get; set; }
}
```

**Business Logic:**
1. Get contact (must not be deleted)
2. Create message with SenderType = "admin"
3. Set SenderId = current userId
4. Set IsRead = true (admin sent it)
5. Update contact.UpdatedAt
6. If SendEmail = true:
   - Send email to contact with reply-to tracking
   - Reply-to format: `reply+{contactId}@yourdomain.com`
7. If SendSms = true && contact has phone:
   - Send SMS notification
8. Return message id

#### PUT /messages/{id}/read
**Authorization:** Bearer token (Admin only)

**Business Logic:**
1. Find message
2. Set IsRead = true
3. Save changes

---

### 4.4 User Management Endpoints (Super Admin Only)

#### GET /users
**Authorization:** Bearer token (Admin only)  
**Query Params:** `role`, `search`, `page`, `pageSize`

**Response:**
```csharp
public class PagedUsersResponse
{
    public List<UserWithRolesResponse> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public class UserWithRolesResponse
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = null!;
    public string LastName { get; init; } = null!;
    public string UserName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string Phone { get; init; } = null!;
    public bool EmailVerified { get; init; }
    public bool PhoneVerified { get; init; }
    public List<string> Roles { get; init; } = new();
    public string? AvatarUrl { get; init; }
    public DateTime CreatedAt { get; init; }
}
```

**Business Logic:**
1. Query users with filters
2. Include roles for each user
3. Include avatar from profile
4. Paginate results

---

### 4.5 Role Management Endpoints (Super Admin Only)

#### GET /users/{userId}/roles
**Authorization:** Bearer token (Admin only)

**Response:**
```csharp
public class UserRolesResponse
{
    public Guid UserId { get; init; }
    public List<RoleAssignment> Roles { get; init; } = new();
}

public class RoleAssignment
{
    public Guid Id { get; init; }
    public string Role { get; init; } = null!;
    public DateTime AssignedAt { get; init; }
    public Guid? AssignedBy { get; init; }
    public string? AssignedByName { get; init; }
}
```

#### POST /users/{userId}/roles
**Authorization:** Bearer token (Super Admin only)

**Request:**
```csharp
public class AssignRoleRequest
{
    public required string Role { get; set; } // "user", "admin", "super_admin"
    public required string Reason { get; set; }
}
```

**Business Logic:**
1. Validate role is valid
2. Check user doesn't already have role
3. Create UserRole record
4. Set AssignedBy = current userId
5. Create audit log entry
6. Return success

#### DELETE /users/{userId}/roles/{role}
**Authorization:** Bearer token (Super Admin only)

**Business Logic:**
1. ✅ **CRITICAL: If removing super_admin:**
   - Count total super_admins
   - If count <= 1, reject with error
   - Don't allow removing last super_admin
2. Find and delete UserRole
3. Create audit log entry
4. Return success

#### GET /audit/roles
**Authorization:** Bearer token (Super Admin only)  
**Query Params:** `userId`, `page`, `pageSize`

**Response:**
```csharp
public class PagedAuditLogResponse
{
    public List<RoleAuditEntry> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public class RoleAuditEntry
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = null!;
    public string Role { get; init; } = null!;
    public string Action { get; init; } = null!;
    public Guid? PerformedBy { get; init; }
    public string? PerformedByName { get; init; }
    public string? Reason { get; init; }
    public DateTime CreatedAt { get; init; }
}
```

---

### 4.6 Webhook Endpoints

#### POST /webhooks/email-reply
**Authorization:** Webhook signature validation (SendGrid/Mailgun)  
**Purpose:** Receive inbound email replies from clients

**Request (from SendGrid):**
```csharp
// Form data
- to: "reply+{contactId}@yourdomain.com"
- from: "client@example.com"
- subject: "Re: Your inquiry"
- text: "Email body text"
- html: "<p>Email body html</p>"
```

**Business Logic:**
1. Validate webhook signature (SendGrid/Mailgun)
2. Extract contactId from "to" address using regex
3. Parse contactId from format: `reply+{guid}@domain.com`
4. Verify contact exists and not deleted
5. Create Message with SenderType = "contact"
6. Set IsRead = false (unread for admin)
7. Update contact.UpdatedAt
8. If contact status was "resolved" or "closed":
   - Change back to "in_progress"
9. Notify assigned admin (optional)
10. Return 200 OK

---

## 🔒 PART 5: Security Requirements

### 5.1 Input Validation
```csharp
// Registration validation
- FirstName: Required, max 100 chars
- LastName: Required, max 100 chars
- UserName: Required, alphanumeric + underscore, 3-30 chars, unique
- Email: Required, valid email format, unique
- Phone: Required, valid E.164 format, unique
- Password: Min 8 chars, must contain: uppercase, lowercase, number, special char

// Contact update validation
- Status: Must be one of: new, in_progress, on_hold, resolved, closed
- StatusComment: Required if status is on_hold, resolved, or closed
- StatusComment: Max 500 chars
```

### 5.2 Rate Limiting (Apply to these endpoints)
```csharp
- POST /users/register         → 5 requests per IP per hour
- POST /users/login           → 10 requests per IP per 15 minutes
- POST /users/login-otp       → 5 requests per email per hour
- POST /users/resend-otp      → 3 requests per email per hour
- GET /users/verification-status → 10 requests per IP per minute
```

### 5.3 Security Logging (Log these events)
```csharp
- Failed login attempts (after 3 failures)
- Successful logins
- Role assignments/removals
- Contact deletions
- Status changes to resolved/closed
- OTP generations and validations
```

### 5.4 Error Handling
```csharp
// Consistent error response format
public class ApiResult
{
    public bool IsSuccess { get; set; }
    public bool IsFailure => !IsSuccess;
    public Error? Error { get; set; }
    public object? Value { get; set; }
}

public class Error
{
    public string Code { get; set; } = null!;
    public string Description { get; set; } = null!;
    public ErrorType Type { get; set; }
}

public enum ErrorType
{
    Failure,
    Validation,
    NotFound,
    Conflict,
    Unauthorized
}
```

---

## 📧 PART 6: Email & SMS Integration

### 6.1 Outbound Email (Resend)
```csharp
// Email service interface
public interface IEmailService
{
    Task SendOtpEmail(string to, string name, string code);
    Task SendReplyNotification(
        string to, 
        string contactName, 
        string adminName, 
        string message, 
        string subject,
        Guid contactId
    );
}

// Implementation
public class ResendEmailService : IEmailService
{
    public async Task SendReplyNotification(
        string to, 
        string contactName, 
        string adminName, 
        string message, 
        string subject,
        Guid contactId)
    {
        await _resend.SendAsync(new SendEmailRequest
        {
            From = "Your Company <noreply@yourdomain.com>",
            To = new[] { to },
            ReplyTo = $"reply+{contactId}@yourdomain.com", // ✅ CRITICAL
            Subject = $"Re: {subject}",
            Html = $@"
                <p>Hi {contactName},</p>
                <p>{adminName} replied to your inquiry:</p>
                <blockquote>{message}</blockquote>
                <p>Reply to this email to continue the conversation.</p>
            "
        });
    }
}
```

### 6.2 SMS Service (Twilio)
```csharp
public interface ISmsService
{
    Task SendOtpSms(string to, string code);
    Task SendReplyNotification(string to, string adminName, string message);
}

public class TwilioSmsService : ISmsService
{
    public async Task SendOtpSms(string to, string code)
    {
        await _twilioClient.Messages.CreateAsync(
            to: to,
            from: _twilioPhoneNumber,
            body: $"Your verification code is: {code}. Valid for 10 minutes."
        );
    }
    
    public async Task SendReplyNotification(
        string to, 
        string adminName, 
        string message)
    {
        var truncated = message.Length > 100 
            ? message.Substring(0, 97) + "..." 
            : message;
            
        await _twilioClient.Messages.CreateAsync(
            to: to,
            from: _twilioPhoneNumber,
            body: $"{adminName} replied: {truncated}"
        );
    }
}
```

### 6.3 Inbound Email Setup (SendGrid Parse)
```csharp
// Required setup:
1. Add MX records to your domain DNS
2. Configure SendGrid Inbound Parse:
   - Hostname: yourdomain.com
   - URL: https://yourapi.com/webhooks/email-reply
   - POST raw data: No
3. Validate webhook signature in endpoint
```

---

## 🧪 PART 7: Testing Requirements

### 7.1 Critical Test Scenarios
```csharp
Authentication:
✅ Register with username, email, phone
✅ Both email and phone must verify before login allowed
✅ Login blocked if EmailVerified = false
✅ Login blocked if PhoneVerified = false
✅ JWT token contains user roles
✅ Password login works after verification
✅ OTP login works (email and phone)

Authorization:
✅ Non-admin cannot access /contact-us endpoints
✅ Non-super-admin cannot access /users/{id}/roles
✅ Super admin can assign/remove roles
✅ Cannot remove last super_admin

Contact Management:
✅ Contacts list shows assigned admin names
✅ Filtering by status works
✅ Pagination works correctly
✅ Status change requires comment for on_hold/resolved/closed
✅ Soft delete works (DeletedAt set, not removed)
✅ Messages show correct sender type
✅ Unread count updates correctly
✅ Email replies create new messages

Monthly Statistics:
✅ Returns data for last 6 months
✅ Missing months filled with zeros
✅ Data grouped correctly by status
```

---

## 📦 PART 8: External Dependencies

### 8.1 NuGet Packages Required
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="9.0.0" />
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="Twilio" Version="7.0.0" />
<PackageReference Include="Resend" Version="1.0.0" />
```

### 8.2 External Services Required
```csharp
1. Email Service:
   - Resend (for outbound)
   - SendGrid Parse (for inbound replies)
   
2. SMS Service:
   - Twilio (recommended)
   - Or MessageBird / AWS SNS
   
3. File Storage (for avatars):
   - Azure Blob Storage
   - Or AWS S3
   - Or Local storage (development)
```

---

## 🚀 PART 9: Implementation Checklist

### Phase 1: Database & Models (Day 1-2)
- [ ] Run all SQL migration scripts
- [ ] Create all Entity Framework models
- [ ] Update DbContext with new DbSets
- [ ] Run Add-Migration and Update-Database
- [ ] Verify all tables created correctly
- [ ] Test triggers work

### Phase 2: Authentication (Day 3-4)
- [ ] Update registration with username
- [ ] Implement verification-before-login check
- [ ] Update JWT token generation with roles
- [ ] Add verification status endpoint
- [ ] Set up Twilio for SMS
- [ ] Test full registration → verification → login flow

### Phase 3: User Profile (Day 5)
- [ ] Implement GET /users/me
- [ ] Implement PUT /users/me
- [ ] Implement POST /users/me/avatar
- [ ] Set up file storage (Azure/AWS/Local)
- [ ] Test profile updates

### Phase 4: Contact Management (Day 6-8)
- [ ] Implement GET /contact-us/statistics
- [ ] Implement GET /contact-us/statistics/monthly
- [ ] Update GET /contact-us with new filters
- [ ] Update GET /contact-us/{id} with messages
- [ ] Update PUT /contact-us/{id} with status validation
- [ ] Implement POST /contact-us/{id}/messages
- [ ] Implement PUT /messages/{id}/read
- [ ] Implement soft DELETE
- [ ] Test all contact endpoints

### Phase 5: Email Integration (Day 9-10)
- [ ] Set up Resend for outbound emails
- [ ] Update email templates with reply-to tracking
- [ ] Set up SendGrid Inbound Parse
- [ ] Implement POST /webhooks/email-reply
- [ ] Configure DNS MX records
- [ ] Test full email conversation flow

### Phase 6: User & Role Management (Day 11-12)
- [ ] Implement GET /users
- [ ] Implement GET /users/{userId}/roles
- [ ] Implement POST /users/{userId}/roles
- [ ] Implement DELETE /users/{userId}/roles/{role}
- [ ] Implement GET /audit/roles
- [ ] Test role assignment/removal
- [ ] Test audit logging

### Phase 7: Security & Polish (Day 13-14)
- [ ] Add rate limiting middleware
- [ ] Implement security logging
- [ ] Add input validation
- [ ] Test all authorization policies
- [ ] Write unit tests for critical paths
- [ ] Load test with sample data
- [ ] Security audit

---

## 🎯 Priority Order Summary

**Must Have (Week 1):**
1. Database schema updates
2. Registration with username
3. Verification before login
4. JWT with roles
5. GET /users/me

**Should Have (Week 2):**
6. Monthly statistics
7. Contact list enhancements
8. Status validation
9. Profile updates

**Nice to Have (Week 3+):**
10. Email reply webhook
11. SMS notifications
12. Role audit logs
13. Advanced filtering

---

## 📝 Notes for ChatGPT

When implementing this API:
1. Use minimal API style or controllers (your choice)
2. Follow CQRS pattern if preferred (recommended)
3. Use MediatR for clean architecture (optional)
4. Implement repository pattern (optional)
5. Add Swagger documentation
6. Use consistent naming conventions
7. Follow C# coding standards
8. Add XML comments for documentation
9. Implement proper exception handling
10. Use dependency injection throughout

**Environment Configuration:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=pocCA;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-secret-key-here-minimum-32-characters",
    "Issuer": "YourApp",
    "Audience": "YourApp"
  },
  "Twilio": {
    "AccountSid": "your-account-sid",
    "AuthToken": "your-auth-token",
    "PhoneNumber": "+1234567890"
  },
  "Resend": {
    "ApiKey": "your-resend-api-key"
  }
}
```

---

This document contains everything needed to build a complete, production-ready .NET API. Good luck! 🚀
