-- Creates ApprovalLevels table and seed data (from migration AddApprovalLevels).
-- Run against your MocDb database if the table is missing (e.g. migration not applied).
-- Safe to run: only creates table and inserts data if table does not exist.

USE MocDb;
GO

IF OBJECT_ID(N'dbo.ApprovalLevels', N'U') IS NULL
BEGIN
    CREATE TABLE ApprovalLevels (
        Id UNIQUEIDENTIFIER NOT NULL,
        [Order] INT NOT NULL,
        RoleKey NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL,
        CreatedBy NVARCHAR(MAX) NOT NULL,
        ModifiedAtUtc DATETIME2 NULL,
        ModifiedBy NVARCHAR(MAX) NULL,
        CONSTRAINT PK_ApprovalLevels PRIMARY KEY (Id)
    );

    CREATE INDEX IX_ApprovalLevels_Order ON ApprovalLevels([Order]);

    INSERT INTO ApprovalLevels (Id, [Order], RoleKey, IsActive, CreatedAtUtc, CreatedBy)
    VALUES
        ('88888888-8888-8888-8888-888888888881', 1, 'Supervisor', 1, '2024-01-01T00:00:00', 'seed'),
        ('88888888-8888-8888-8888-888888888882', 2, 'DepartmentManager', 1, '2024-01-01T00:00:00', 'seed'),
        ('88888888-8888-8888-8888-888888888883', 3, 'DivisionManager', 1, '2024-01-01T00:00:00', 'seed'),
        ('88888888-8888-8888-8888-888888888884', 4, 'AVP', 1, '2024-01-01T00:00:00', 'seed'),
        ('88888888-8888-8888-8888-888888888885', 5, 'SuperUser', 1, '2024-01-01T00:00:00', 'seed');

    PRINT 'ApprovalLevels table created and seeded.';
END
ELSE
BEGIN
    PRINT 'ApprovalLevels table already exists.';
END
GO
