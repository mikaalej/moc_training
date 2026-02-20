-- Add missing columns to MocRequests (from migration AddActivityLogAndExtendedFields).
-- Run this against your MocDb database if EF migrations were not applied.
-- Safe to run multiple times: only adds columns if they don't exist.

USE MocDb;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MocRequests') AND name = 'MocType')
    ALTER TABLE MocRequests ADD MocType INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MocRequests') AND name = 'ControlNumberYear')
    ALTER TABLE MocRequests ADD ControlNumberYear INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MocRequests') AND name = 'ControlNumberMonth')
    ALTER TABLE MocRequests ADD ControlNumberMonth INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MocRequests') AND name = 'ControlNumberArea')
    ALTER TABLE MocRequests ADD ControlNumberArea NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MocRequests') AND name = 'ControlNumberCategory')
    ALTER TABLE MocRequests ADD ControlNumberCategory NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MocRequests') AND name = 'ControlNumberCode')
    ALTER TABLE MocRequests ADD ControlNumberCode NVARCHAR(50) NULL;

-- Index on ModifiedAtUtc if missing (from same migration)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('MocRequests') AND name = 'IX_MocRequests_ModifiedAtUtc')
    CREATE INDEX IX_MocRequests_ModifiedAtUtc ON MocRequests(ModifiedAtUtc);

PRINT 'MocRequests columns updated.';
GO
