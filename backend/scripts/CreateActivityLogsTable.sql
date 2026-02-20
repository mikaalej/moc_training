-- Create ActivityLogs table if it does not exist.
-- Run this against your MOC database if you get "Invalid object name 'ActivityLogs'".
-- You can run in SSMS or: sqlcmd -S your_server -d your_database -i CreateActivityLogsTable.sql

IF OBJECT_ID(N'dbo.ActivityLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ActivityLogs (
        Id                UNIQUEIDENTIFIER NOT NULL,
        MocRequestId      UNIQUEIDENTIFIER NOT NULL,
        Action            NVARCHAR(100)    NOT NULL,
        ActorUserId       UNIQUEIDENTIFIER NULL,
        ActorEmail        NVARCHAR(256)    NULL,
        TimestampUtc      DATETIME2        NOT NULL,
        IPAddress         NVARCHAR(50)     NULL,
        DeviceInfo        NVARCHAR(500)    NULL,
        BeforeSnapshot    NVARCHAR(MAX)    NULL,
        AfterSnapshot     NVARCHAR(MAX)    NULL,
        CreatedAtUtc      DATETIME2        NOT NULL,
        CreatedBy         NVARCHAR(MAX)    NOT NULL,
        ModifiedAtUtc     DATETIME2        NULL,
        ModifiedBy        NVARCHAR(MAX)    NULL,
        CONSTRAINT PK_ActivityLogs PRIMARY KEY (Id),
        CONSTRAINT FK_ActivityLogs_MocRequests_MocRequestId
            FOREIGN KEY (MocRequestId) REFERENCES dbo.MocRequests (Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_ActivityLogs_MocRequestId ON dbo.ActivityLogs (MocRequestId);
    CREATE INDEX IX_ActivityLogs_TimestampUtc ON dbo.ActivityLogs (TimestampUtc);
    CREATE INDEX IX_ActivityLogs_Action ON dbo.ActivityLogs (Action);

    PRINT 'ActivityLogs table created.';
END
ELSE
    PRINT 'ActivityLogs table already exists.';
