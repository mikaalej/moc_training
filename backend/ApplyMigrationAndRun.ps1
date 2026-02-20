# Run this script to apply the PasswordHash migration and start the API in Development.
# IMPORTANT: Stop any running Moc.Api instance first (e.g. stop debugging in Visual Studio or close the terminal where it is running).

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Applying EF migration (AddAppUserPasswordHash)..." -ForegroundColor Cyan
dotnet ef database update --project src/Moc.Infrastructure --startup-project src/Moc.Api
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting API in Development (test approver users will be seeded on startup)..." -ForegroundColor Cyan
dotnet run --project src/Moc.Api --no-build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
