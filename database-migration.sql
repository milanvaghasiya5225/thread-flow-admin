-- =============================================
-- Database Enhancement Migration Script
-- Add role management, messaging, and audit trails
-- =============================================

-- 1. Create UserRoles table for RBAC
CREATE TABLE [dbo].[UserRoles](
    [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [UserId] [uniqueidentifier] NOT NULL,
    [Role] [nvarchar](50) NOT NULL, -- 'user', 'admin', 'super_admin'
    [AssignedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [AssignedBy] [uniqueidentifier] NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_AssignedBy] FOREIGN KEY([AssignedBy]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [UQ_UserRoles_UserRole] UNIQUE([UserId], [Role])
);

CREATE INDEX [IX_UserRoles_UserId] ON [dbo].[UserRoles]([UserId]);
CREATE INDEX [IX_UserRoles_Role] ON [dbo].[UserRoles]([Role]);

-- 2. Create RoleAuditLog for tracking role changes
CREATE TABLE [dbo].[RoleAuditLog](
    [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [UserId] [uniqueidentifier] NOT NULL,
    [Role] [nvarchar](50) NOT NULL,
    [Action] [nvarchar](50) NOT NULL, -- 'assigned', 'removed'
    [PerformedBy] [uniqueidentifier] NULL,
    [Reason] [nvarchar](500) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_RoleAuditLog] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RoleAuditLog_Users] FOREIGN KEY([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_RoleAuditLog_UserId] ON [dbo].[RoleAuditLog]([UserId]);
CREATE INDEX [IX_RoleAuditLog_CreatedAt] ON [dbo].[RoleAuditLog]([CreatedAt] DESC);

-- 3. Enhance ContactMessages table
ALTER TABLE [dbo].[ContactMessages] 
ADD 
    [Status] [nvarchar](50) NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'on_hold', 'resolved', 'closed'
    [AssignedTo] [uniqueidentifier] NULL,
    [DeletedAt] [datetime2](7) NULL,
    [DeletedBy] [uniqueidentifier] NULL,
    [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [CommunicationMethod] [nvarchar](20) NOT NULL DEFAULT 'email'; -- 'email', 'phone', 'both'

-- Add foreign key for AssignedTo
ALTER TABLE [dbo].[ContactMessages]
ADD CONSTRAINT [FK_ContactMessages_AssignedTo] FOREIGN KEY([AssignedTo]) 
    REFERENCES [dbo].[Users]([Id]);

-- Add indexes for better query performance
CREATE INDEX [IX_ContactMessages_Status] ON [dbo].[ContactMessages]([Status]);
CREATE INDEX [IX_ContactMessages_AssignedTo] ON [dbo].[ContactMessages]([AssignedTo]);
CREATE INDEX [IX_ContactMessages_DeletedAt] ON [dbo].[ContactMessages]([DeletedAt]);
CREATE INDEX [IX_ContactMessages_CreatedAt] ON [dbo].[ContactMessages]([CreatedAt] DESC);

-- 4. Create Messages table for conversation threads
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

-- 5. Create StatusHistory table for audit trail
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

-- 6. Create Profiles table for extended user information
CREATE TABLE [dbo].[Profiles](
    [Id] [uniqueidentifier] NOT NULL, -- Same as UserId
    [AvatarUrl] [nvarchar](500) NULL,
    [Bio] [nvarchar](1000) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Profiles] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Profiles_Users] FOREIGN KEY([Id]) 
        REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);

-- 7. Add CreatedAt and UpdatedAt to Users table
ALTER TABLE [dbo].[Users]
ADD 
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE();

-- 8. Create trigger for UserRoles audit logging
GO
CREATE TRIGGER [dbo].[TR_UserRoles_AuditLog]
ON [dbo].[UserRoles]
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Log role assignments
    INSERT INTO [dbo].[RoleAuditLog] ([UserId], [Role], [Action], [PerformedBy], [Reason])
    SELECT 
        i.[UserId], 
        i.[Role], 
        'assigned', 
        i.[AssignedBy],
        'Role assigned'
    FROM inserted i;
    
    -- Log role removals
    INSERT INTO [dbo].[RoleAuditLog] ([UserId], [Role], [Action], [PerformedBy])
    SELECT 
        d.[UserId], 
        d.[Role], 
        'removed',
        NULL -- Can't track who deleted in this trigger
    FROM deleted d
    WHERE NOT EXISTS (SELECT 1 FROM inserted WHERE UserId = d.UserId AND Role = d.Role);
END;
GO

-- 9. Create trigger for StatusHistory tracking
GO
CREATE TRIGGER [dbo].[TR_ContactMessages_StatusHistory]
ON [dbo].[ContactMessages]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only log if status actually changed
    INSERT INTO [dbo].[StatusHistory] ([ContactId], [OldStatus], [NewStatus], [ChangedBy])
    SELECT 
        i.[Id],
        d.[Status],
        i.[Status],
        i.[AssignedTo] -- You may want to pass the actual user making the change
    FROM inserted i
    INNER JOIN deleted d ON i.[Id] = d.[Id]
    WHERE i.[Status] <> d.[Status];
END;
GO

-- 10. Create trigger for UpdatedAt on ContactMessages
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

-- 11. Create trigger for UpdatedAt on Profiles
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

-- 12. Create trigger for UpdatedAt on Users
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

-- 13. Create stored procedure for assigning default user role on registration
GO
CREATE PROCEDURE [dbo].[SP_CreateUserWithDefaultRole]
    @UserId UNIQUEIDENTIFIER,
    @Email NVARCHAR(450),
    @FirstName NVARCHAR(MAX),
    @LastName NVARCHAR(MAX),
    @PasswordHash NVARCHAR(MAX),
    @Phone NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insert user
        INSERT INTO [dbo].[Users] ([Id], [Email], [FirstName], [LastName], [PasswordHash], [Phone])
        VALUES (@UserId, @Email, @FirstName, @LastName, @PasswordHash, @Phone);
        
        -- Assign default 'user' role
        INSERT INTO [dbo].[UserRoles] ([UserId], [Role])
        VALUES (@UserId, 'user');
        
        -- Create profile
        INSERT INTO [dbo].[Profiles] ([Id])
        VALUES (@UserId);
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- IMPORTANT NOTES:
-- =============================================
-- 1. Run this script in a TEST environment first
-- 2. Backup your database before running
-- 3. Update your EF Core DbContext to include these new entities
-- 4. Run Add-Migration to generate EF migration
-- 5. Update your API endpoints to support new features
-- =============================================

PRINT 'Migration completed successfully!';
PRINT 'Next steps:';
PRINT '1. Update your .NET entities to match new schema';
PRINT '2. Add API endpoints for: /users/me, /users/me/roles, /contact-us/{id}/messages';
PRINT '3. Implement authorization policies based on UserRoles';
PRINT '4. Update ContactUs endpoints to support status management';
