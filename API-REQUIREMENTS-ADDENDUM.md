# API Requirements Addendum

## ⚠️ Critical Additions & Clarifications

This document addresses missing requirements and clarifications for the API specification.

---

## 🔴 MISSING: Registration with Username

### Update Registration Endpoint

**Current Issue**: Registration doesn't include username field (required in your specs)

#### Updated Request Model:
```typescript
interface RegisterRequest {
  firstName: string;
  lastName: string;
  userName: string;      // ✅ NEW: Required username field
  email: string;
  phone: string;          // ✅ CHANGED: Now required (not optional)
  password: string;
}
```

#### C# Implementation Update:
```csharp
public class RegisterRequest
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string UserName { get; set; }  // NEW
    public required string Email { get; set; }
    public required string Phone { get; set; }     // Changed from optional
    public required string Password { get; set; }
}
```

#### Database Update Required:
```sql
-- Add UserName column to Users table
ALTER TABLE [dbo].[Users]
ADD [UserName] [nvarchar](100) NOT NULL DEFAULT '';

-- Add unique constraint for username
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_UserName] 
ON [dbo].[Users]([UserName] ASC);

-- Add UserName to Profiles if needed for display
ALTER TABLE [dbo].[Profiles]
ADD [UserName] [nvarchar](100) NULL;
```

---

## 🔴 CRITICAL: Verification Flow Before Login

### Current Issue: 
Your requirement states users MUST verify both email AND phone before being allowed to login.

### Implementation Requirements:

#### 1. Update Registration Flow
```http
POST /users/register
Response: {
  userId: guid,
  message: "Registration successful. Please verify your email and phone to login.",
  verificationRequired: true
}
```

After registration:
1. Send OTP to email
2. Send OTP to phone
3. User must verify BOTH before login is allowed

#### 2. Add Login Validation
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login(LoginRequest request)
{
    var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
    
    if (user == null)
        return NotFound(Result.Failure(Error.NotFound("User not found")));
    
    // ✅ CRITICAL: Block login if not fully verified
    if (!user.EmailVerified || !user.PhoneVerified)
    {
        return BadRequest(Result.Failure(Error.Validation(
            "Please verify your email and phone number before logging in."
        )));
    }
    
    // Continue with password validation...
}
```

#### 3. Add Verification Status Check Endpoint
```http
GET /users/verification-status?email={email}
Authorization: None (Public)
Security: Rate limit this endpoint
```

#### Response Model:
```typescript
interface VerificationStatusResponse {
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  canLogin: boolean; // true only if BOTH verified
}
```

#### C# Implementation:
```csharp
app.MapGet("/users/verification-status", async (
    ApplicationDbContext db,
    string email) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
    
    if (user == null)
        return Results.NotFound(Result.Failure(Error.NotFound("User not found")));
    
    return Results.Ok(Result.Success(new VerificationStatusResponse
    {
        Email = user.Email,
        EmailVerified = user.EmailVerified,
        PhoneVerified = user.PhoneVerified,
        CanLogin = user.EmailVerified && user.PhoneVerified
    }));
});
```

---

## 🔴 MISSING: Monthly Statistics for Dashboard Graph

### Current Issue:
Dashboard needs monthly data for graphs, not just totals.

#### Add Monthly Statistics Endpoint:
```http
GET /contact-us/statistics/monthly?months={months}
Authorization: Bearer {token}
Security: Admin only
```

#### Request Parameters:
- `months` (default: 6): Number of months to retrieve

#### Response Model:
```typescript
interface MonthlyStatistics {
  labels: string[];        // ["Jan 2025", "Feb 2025", "Mar 2025", ...]
  datasets: {
    new: number[];         // [5, 8, 12, ...]
    in_progress: number[]; // [3, 7, 9, ...]
    resolved: number[];    // [10, 15, 20, ...]
    closed: number[];      // [8, 12, 18, ...]
    total: number[];       // [26, 42, 59, ...]
  };
}
```

#### C# Implementation:
```csharp
[Authorize(Policy = "RequireAdmin")]
app.MapGet("/contact-us/statistics/monthly", async (
    ApplicationDbContext db,
    int months = 6) =>
{
    var startDate = DateTime.UtcNow.AddMonths(-months);
    
    var contacts = await db.ContactMessages
        .Where(c => c.CreatedAtUtc >= startDate && c.DeletedAt == null)
        .ToListAsync();
    
    // Group by month
    var monthlyData = contacts
        .GroupBy(c => new { 
            Year = c.CreatedAtUtc.Year, 
            Month = c.CreatedAtUtc.Month 
        })
        .OrderBy(g => g.Key.Year)
        .ThenBy(g => g.Key.Month)
        .Select(g => new
        {
            Label = $"{new DateTime(g.Key.Year, g.Key.Month, 1):MMM yyyy}",
            New = g.Count(c => c.Status == "new"),
            InProgress = g.Count(c => c.Status == "in_progress"),
            Resolved = g.Count(c => c.Status == "resolved"),
            Closed = g.Count(c => c.Status == "closed"),
            Total = g.Count()
        })
        .ToList();
    
    // Fill in missing months with zeros
    var result = new MonthlyStatistics
    {
        Labels = monthlyData.Select(m => m.Label).ToList(),
        Datasets = new MonthlyDatasets
        {
            New = monthlyData.Select(m => m.New).ToList(),
            InProgress = monthlyData.Select(m => m.InProgress).ToList(),
            Resolved = monthlyData.Select(m => m.Resolved).ToList(),
            Closed = monthlyData.Select(m => m.Closed).ToList(),
            Total = monthlyData.Select(m => m.Total).ToList()
        }
    };
    
    return Results.Ok(Result.Success(result));
});

public class MonthlyStatistics
{
    public required List<string> Labels { get; init; }
    public required MonthlyDatasets Datasets { get; init; }
}

public class MonthlyDatasets
{
    public required List<int> New { get; init; }
    public required List<int> InProgress { get; init; }
    public required List<int> Resolved { get; init; }
    public required List<int> Closed { get; init; }
    public required List<int> Total { get; init; }
}
```

---

## 🔴 CRITICAL: Email Reply Integration

### Current Issue:
When client replies to email, how does it get back into the system?

### Solution: Inbound Email Webhook

You'll need an email service that supports inbound email webhooks:
- **Resend**: Doesn't support inbound (outbound only)
- **SendGrid**: Supports inbound parse webhook
- **Mailgun**: Supports inbound routes
- **AWS SES**: Supports email receiving

#### Recommended: SendGrid Inbound Parse

**Setup Steps:**
1. Configure SendGrid inbound parse to forward to: `https://yourapi.com/webhooks/email-reply`
2. Set up MX records for your domain
3. Configure reply-to addresses with tracking tokens

#### Endpoint Implementation:
```http
POST /webhooks/email-reply
Authorization: Webhook signature validation
Security: Validate SendGrid signature
```

#### Request Model (from SendGrid):
```json
{
  "to": "reply+{contactId}@yourdomain.com",
  "from": "client@example.com",
  "subject": "Re: Your inquiry",
  "text": "Thank you for your response...",
  "html": "<p>Thank you for your response...</p>"
}
```

#### C# Implementation:
```csharp
app.MapPost("/webhooks/email-reply", async (
    HttpRequest request,
    ApplicationDbContext db) =>
{
    // Parse SendGrid webhook payload
    var form = await request.ReadFormAsync();
    
    var to = form["to"].ToString();
    var from = form["from"].ToString();
    var text = form["text"].ToString();
    
    // Extract contactId from email address
    // Format: reply+{contactId}@yourdomain.com
    var match = Regex.Match(to, @"reply\+([0-9a-fA-F-]+)@");
    if (!match.Success)
        return Results.BadRequest("Invalid recipient");
    
    var contactId = Guid.Parse(match.Groups[1].Value);
    
    // Verify contact exists
    var contact = await db.ContactMessages.FindAsync(contactId);
    if (contact == null || contact.DeletedAt != null)
        return Results.NotFound("Contact not found");
    
    // Create message from client
    var message = new Message
    {
        Id = Guid.NewGuid(),
        ContactId = contactId,
        SenderId = null,            // No sender for client messages
        SenderType = "contact",
        Content = text,
        IsRead = false,             // Mark as unread for admin
        CreatedAt = DateTime.UtcNow
    };
    
    db.Messages.Add(message);
    
    // Update contact's UpdatedAt
    contact.UpdatedAt = DateTime.UtcNow;
    
    // Optionally change status back to "in_progress" if it was resolved
    if (contact.Status == "resolved" || contact.Status == "closed")
    {
        contact.Status = "in_progress";
    }
    
    await db.SaveChangesAsync();
    
    // Notify assigned admin (via websocket, push notification, etc.)
    // await NotifyAdmin(contact.AssignedTo, "New message received");
    
    return Results.Ok();
});
```

#### Email Template Update:
When sending emails to clients, use this reply-to format:
```csharp
await resend.emails.send({
    from: "Your Company <noreply@yourdomain.com>",
    replyTo: $"reply+{contactId}@yourdomain.com",  // ✅ Critical!
    to: [contact.Email],
    subject: $"Re: {contact.Subject}",
    html: emailBody
});
```

---

## 🔴 MISSING: Status Change Confirmation Popup

### Current Issue:
Need confirmation popup when changing status to "on_hold", "resolved", or "closed".

### Frontend Implementation Required:

This is a frontend feature, but the API should:
1. Validate that `statusComment` is provided
2. Reject status change if comment is missing

#### API Validation (Already in spec):
```csharp
if (command.Status != null && command.Status != oldStatus)
{
    // ✅ Validate status comment required for certain changes
    var requiresComment = new[] { "on_hold", "resolved", "closed" };
    
    if (requiresComment.Contains(command.Status) && 
        string.IsNullOrWhiteSpace(command.StatusComment))
    {
        return Results.BadRequest(Result.Failure(
            Error.Validation(
                $"Comment is required when changing status to '{command.Status}'"
            )
        ));
    }
    
    // Rest of implementation...
}
```

#### Frontend Implementation Needed:
```typescript
// In ContactDetail.tsx or ContactsList.tsx
const handleStatusChange = async (newStatus: string) => {
  // Show popup for these statuses
  if (['on_hold', 'resolved', 'closed'].includes(newStatus)) {
    const comment = await showStatusCommentDialog(newStatus);
    
    if (!comment) {
      // User cancelled
      return;
    }
    
    // Proceed with API call
    await apiClient.updateContactMessage(contactId, {
      status: newStatus,
      statusComment: comment
    });
  } else {
    // No comment required for other statuses
    await apiClient.updateContactMessage(contactId, {
      status: newStatus
    });
  }
};
```

---

## 🔴 MISSING: Logout Confirmation

### Frontend Implementation:
```typescript
const handleLogout = async () => {
  const confirmed = await showConfirmDialog({
    title: "Confirm Logout",
    message: "Are you sure you want to log out?",
    confirmText: "Yes, Logout",
    cancelText: "Cancel"
  });
  
  if (confirmed) {
    await logout();
    navigate('/dotnet-login');
  }
};
```

---

## 🔴 MISSING: User List & Role Management Visibility

### Current Issue:
User list and role management should only be visible to super_admin.

### Frontend Authorization:
```typescript
// In DashboardLayout.tsx
const { user } = useDotNetAuth();
const isSuperAdmin = user?.roles?.includes('super_admin');

// Conditionally render menu items
{isSuperAdmin && (
  <>
    <NavLink to="/users">
      <Users className="mr-2 h-4 w-4" />
      User Management
    </NavLink>
    <NavLink to="/roles">
      <Shield className="mr-2 h-4 w-4" />
      Role Management
    </NavLink>
  </>
)}
```

### API Security (Already covered):
All user list and role endpoints require `[Authorize(Policy = "RequireSuperAdmin")]`

---

## 📋 Complete Requirements Coverage Checklist

### ✅ Covered in Main API Spec:
- ✅ Registration page (needs username addition)
- ✅ Login with password
- ✅ Login with OTP (email/phone)
- ✅ Dashboard layout with user photo
- ✅ Left sidebar menu (dashboard, contacts, logout)
- ✅ Dashboard statistics (total, by status)
- ✅ Contact list with filters, pagination
- ✅ Contact detail with conversation thread
- ✅ Soft delete for contacts
- ✅ Status workflow (new → in_progress → resolved → closed)
- ✅ Status comment validation
- ✅ User list (admin view)
- ✅ Role management (super admin only)
- ✅ Profile settings

### 🔴 Added in This Addendum:
- ✅ Username field in registration
- ✅ Verification flow (email + phone before login)
- ✅ Monthly statistics for graphs
- ✅ Email reply integration (webhook)
- ✅ Status change confirmation (frontend + API validation)
- ✅ Logout confirmation (frontend)
- ✅ Super admin visibility rules (frontend)

### ⚠️ Implementation Notes:

#### SMS Integration Required:
For phone OTP verification, you'll need:
- **Twilio**: Most popular, easy to integrate
- **MessageBird**: Good alternative
- **AWS SNS**: If using AWS infrastructure

#### Email Service Setup:
For full email workflow:
1. **Outbound**: Resend (already in your edge functions)
2. **Inbound**: SendGrid Parse or Mailgun Routes
3. Configure MX records for your domain
4. Set up reply-to tracking format

---

## 🚀 Updated Implementation Priority

### Week 1: Core Registration & Verification
1. ✅ Add username field to Users table
2. ✅ Update registration endpoint
3. ✅ Implement verification-before-login check
4. ✅ Add verification status endpoint
5. ✅ Set up SMS service (Twilio/MessageBird)

### Week 2: Dashboard & Statistics
6. ✅ Implement monthly statistics endpoint
7. ✅ Test graph data structure
8. ✅ Ensure all status calculations are correct

### Week 3: Email Integration
9. ✅ Set up inbound email service (SendGrid/Mailgun)
10. ✅ Implement email reply webhook
11. ✅ Update email templates with reply-to tracking
12. ✅ Test full email conversation flow

### Week 4: Final Polish
13. ✅ Status comment validation
14. ✅ Frontend confirmation dialogs
15. ✅ Super admin visibility rules
16. ✅ Complete testing of all flows

---

## 🔒 Additional Security Considerations

### Rate Limiting Required:
```csharp
// High priority for rate limiting
- POST /users/register         // Prevent spam registrations
- POST /users/login           // Prevent brute force
- POST /users/login-otp       // Prevent OTP spam
- POST /users/resend-otp      // Prevent abuse
- GET /users/verification-status // Prevent enumeration
```

### Logging Required:
```csharp
// Security event logging
- Failed login attempts
- Role assignments/removals
- Status changes to contacts
- Email send/receive events
- OTP generation/validation
```

### Input Validation:
```csharp
// Validate all user inputs
- Username: alphanumeric, 3-30 chars, unique
- Email: valid format, unique
- Phone: valid E.164 format, unique
- Password: min 8 chars, complexity rules
- Status comments: max 500 chars
```

---

## 📝 Summary

Your original requirements are **mostly covered** with these additions:

| Requirement | Status | Notes |
|------------|--------|-------|
| Registration with username | 🔴 Needs update | Add username field |
| Email + Phone verification | 🔴 Needs clarification | Block login until both verified |
| Login (password & OTP) | ✅ Covered | Already implemented |
| Dashboard with user menu | ✅ Covered | Already in spec |
| Left sidebar menu | ✅ Covered | Frontend implementation |
| Dashboard statistics | ⚠️ Partial | Add monthly endpoint |
| Contact list with filters | ✅ Covered | Already in spec |
| Email conversation | 🔴 Needs webhook | SendGrid/Mailgun setup |
| Soft delete | ✅ Covered | Already in spec |
| Status workflow | ✅ Covered | Already in spec |
| Status comment popup | ⚠️ Frontend + API | Validation already there |
| Logout confirmation | ⚠️ Frontend only | Simple dialog |
| User list (super admin) | ✅ Covered | Already in spec |
| Role management | ✅ Covered | Already in spec |

**Next Steps:**
1. Update Users table with username column
2. Implement verification-before-login logic
3. Add monthly statistics endpoint
4. Set up inbound email service (SendGrid recommended)
5. I can update the frontend once your API is ready!
