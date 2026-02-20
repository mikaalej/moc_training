# Database scripts

## Create ActivityLogs table (if missing)

If you see **Invalid object name 'ActivityLogs'** when using "Reset all to pending" or the activity log:

### Option A: Run the SQL script

1. Open SQL Server Management Studio (or Azure Data Studio) and connect to your MOC database.
2. Open `CreateActivityLogsTable.sql` and execute it against that database.

Or from command line (replace server and database name):

```bash
sqlcmd -S localhost -d MocDb -i CreateActivityLogsTable.sql
```

### Option B: Apply all migrations with EF

From the **solution root** (`MocSolution`):

```bash
dotnet ef database update --project backend\src\Moc.Infrastructure --startup-project backend\src\Moc.Api
```

If `dotnet ef` is not installed:

```bash
dotnet tool install --global dotnet-ef
```

Then run the `database update` command again.
