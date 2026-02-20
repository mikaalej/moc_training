-- Add PasswordHash to AppUsers if missing (e.g. migration not in history)
USE MocDb;
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[AppUsers]') AND name = 'PasswordHash'
)
BEGIN
    ALTER TABLE [dbo].[AppUsers] ADD [PasswordHash] nvarchar(256) NULL;
END
GO
