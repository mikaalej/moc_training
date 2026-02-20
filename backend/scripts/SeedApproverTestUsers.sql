-- Seed five approver test users with password Test123! (SHA256 hash below).
-- Run against MocDb. Idempotent: only inserts if username does not exist.
USE MocDb;
GO
DECLARE @Hash nvarchar(256) = N'54DE7F606F2523CBA8EFAC173FAB42FB7F59D56CEFF974C8FDB7342CF2CFE345';
DECLARE @Now datetime2 = SYSUTCDATETIME();
DECLARE @By nvarchar(max) = N'system';

IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE UserName = N'approver_supervisor')
INSERT INTO AppUsers (Id, UserName, DisplayName, RoleKey, IsActive, PasswordHash, CreatedAtUtc, CreatedBy)
VALUES (NEWID(), N'approver_supervisor', N'Supervisor (Test)', N'Supervisor', 1, @Hash, @Now, @By);

IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE UserName = N'approver_departmentmanager')
INSERT INTO AppUsers (Id, UserName, DisplayName, RoleKey, IsActive, PasswordHash, CreatedAtUtc, CreatedBy)
VALUES (NEWID(), N'approver_departmentmanager', N'Department Manager (Test)', N'DepartmentManager', 1, @Hash, @Now, @By);

IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE UserName = N'approver_divisionmanager')
INSERT INTO AppUsers (Id, UserName, DisplayName, RoleKey, IsActive, PasswordHash, CreatedAtUtc, CreatedBy)
VALUES (NEWID(), N'approver_divisionmanager', N'Division Manager (Test)', N'DivisionManager', 1, @Hash, @Now, @By);

IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE UserName = N'approver_avp')
INSERT INTO AppUsers (Id, UserName, DisplayName, RoleKey, IsActive, PasswordHash, CreatedAtUtc, CreatedBy)
VALUES (NEWID(), N'approver_avp', N'AVP (Test)', N'AVP', 1, @Hash, @Now, @By);

IF NOT EXISTS (SELECT 1 FROM AppUsers WHERE UserName = N'approver_superuser')
INSERT INTO AppUsers (Id, UserName, DisplayName, RoleKey, IsActive, PasswordHash, CreatedAtUtc, CreatedBy)
VALUES (NEWID(), N'approver_superuser', N'Super User (Test)', N'SuperUser', 1, @Hash, @Now, @By);

-- Update existing approver_* users to set password if they had none
UPDATE AppUsers SET PasswordHash = @Hash, ModifiedAtUtc = @Now, ModifiedBy = @By
WHERE UserName IN (N'approver_supervisor', N'approver_departmentmanager', N'approver_divisionmanager', N'approver_avp', N'approver_superuser')
  AND (PasswordHash IS NULL OR PasswordHash = N'');
GO
