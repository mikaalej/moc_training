using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moc.Domain.Entities;
using Moc.Domain.Enums;
using Moc.Domain;

namespace Moc.Infrastructure.Persistence;

/// <summary>
/// Database initializer that seeds demo transactional data in Development environment.
/// This runs on startup and checks if tables are empty before seeding, ensuring idempotency.
/// Static lookup data is seeded via HasData in OnModelCreating; this class handles dynamic demo data.
/// </summary>
public class MocDbInitializer
{
    private readonly MocDbContext _context;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<MocDbInitializer> _logger;

    /// <summary>
    /// Constructs the initializer with required dependencies.
    /// </summary>
    public MocDbInitializer(
        MocDbContext context,
        IHostEnvironment environment,
        ILogger<MocDbInitializer> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Initializes the database by running migrations and seeding demo data if in Development.
    /// This method is called from Program.cs on startup.
    /// </summary>
    public async Task InitializeAsync()
    {
        try
        {
            // Always ensure database is created and migrations are applied
            await _context.Database.MigrateAsync();

            // Only seed demo data in Development environment
            if (_environment.IsDevelopment())
            {
                await EnsureApproverTestUsersAsync();
                await SeedDemoDataAsync();
            }
        }
        catch (Exception ex)
        {
            // Log to console only; avoid ILogger (e.g. EventLog) which can throw and crash the process (0xe0434352).
            Console.WriteLine("Database initialization failed: " + ex.Message);
            // Do not rethrow so the API still starts; data endpoints will fail until the database is available.
        }
    }

    /// <summary>
    /// Ensures five approver-role test users exist with a known password (Test123!) for testing approval levels.
    /// Idempotent: creates users only if missing; updates PasswordHash if user exists but has no password.
    /// </summary>
    private async Task EnsureApproverTestUsersAsync()
    {
        const string TestPassword = "Test123!";
        var passwordHash = PasswordHelper.Hash(TestPassword);
        var approverRoles = new[] { "Supervisor", "DepartmentManager", "DivisionManager", "AVP", "SuperUser" };
        var roleDisplayNames = new Dictionary<string, string>
        {
            ["Supervisor"] = "Supervisor (Test)",
            ["DepartmentManager"] = "Department Manager (Test)",
            ["DivisionManager"] = "Division Manager (Test)",
            ["AVP"] = "AVP (Test)",
            ["SuperUser"] = "Super User (Test)"
        };
        var utcNow = DateTime.UtcNow;
        var createdBy = "system";

        foreach (var roleKey in approverRoles)
        {
            var userName = "approver_" + roleKey.ToLowerInvariant();
            var existing = await _context.AppUsers.FirstOrDefaultAsync(u => u.UserName == userName);
            if (existing != null)
            {
                if (string.IsNullOrEmpty(existing.PasswordHash))
                {
                    existing.PasswordHash = passwordHash;
                    existing.ModifiedAtUtc = utcNow;
                    existing.ModifiedBy = createdBy;
                    _logger.LogInformation("Set password for existing test user {UserName}.", userName);
                }
                continue;
            }

            var roleExists = await _context.AppRoles.AnyAsync(r => r.Key == roleKey && r.IsActive);
            if (!roleExists)
            {
                _logger.LogWarning("Approval role {RoleKey} not found; skipping test user.", roleKey);
                continue;
            }

            _context.AppUsers.Add(new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = userName,
                DisplayName = roleDisplayNames.GetValueOrDefault(roleKey, roleKey + " (Test)"),
                RoleKey = roleKey,
                IsActive = true,
                PasswordHash = passwordHash,
                CreatedAtUtc = utcNow,
                CreatedBy = createdBy
            });
            _logger.LogInformation("Created test approver user {UserName} ({RoleKey}).", userName, roleKey);
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds demo transactional data (requests, tasks, notifications, manuals, feedback).
    /// This method is idempotent: it checks if data already exists before seeding.
    /// </summary>
    private async Task SeedDemoDataAsync()
    {
        // Check if demo data already exists
        if (await _context.MocRequests.AnyAsync())
        {
            _logger.LogInformation("Demo data already exists. Skipping seed.");
            return;
        }

        _logger.LogInformation("Seeding demo data...");

        var seedTime = DateTime.UtcNow.AddDays(-90); // Start seeding from 90 days ago for realistic timelines
        var seedUser = "system";

        // Get seeded lookup values (these were seeded via HasData)
        var divisions = await _context.Divisions.ToListAsync();
        var departments = await _context.Departments.ToListAsync();
        var sections = await _context.Sections.ToListAsync();
        var categories = await _context.Categories.ToListAsync();
        var subcategories = await _context.Subcategories.ToListAsync();
        var roles = await _context.AppRoles.ToListAsync();

        // Create demo users for each role
        var demoUsers = new List<AppUser>();
        foreach (var role in roles)
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = role.Key.ToLower(),
                DisplayName = $"{role.Name} User",
                RoleKey = role.Key,
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            };
            demoUsers.Add(user);
        }
        _context.AppUsers.AddRange(demoUsers);
        await _context.SaveChangesAsync();

        // Seed 10 Standard EMOC requests across different stages and statuses
        var standardEmocs = new List<MocRequest>();
        var controlNumberBase = 1000;

        for (int i = 0; i < 10; i++)
        {
            var request = new MocRequest
            {
                Id = Guid.NewGuid(),
                ControlNumber = $"EMOC-{controlNumberBase + i}",
                RequestType = MocRequestType.StandardEmoc,
                Title = $"Standard EMOC Request {i + 1}: Process Improvement",
                Originator = demoUsers.First(u => u.RoleKey == "Originator").UserName,
                DivisionId = divisions[i % divisions.Count].Id,
                DepartmentId = departments[i % departments.Count].Id,
                SectionId = sections[i % sections.Count].Id,
                CategoryId = categories[i % categories.Count].Id,
                SubcategoryId = subcategories[i % subcategories.Count].Id,
                UnitsAffected = $"U-{(i % 3) + 1}00",
                EquipmentTag = $"EQ-{controlNumberBase + i}",
                IsTemporary = i % 3 == 0, // Every third request is temporary
                TargetImplementationDate = seedTime.AddDays(30 + (i * 5)),
                PlannedRestorationDate = i % 3 == 0 ? seedTime.AddDays(60 + (i * 5)) : null,
                ScopeDescription = $"This is a demo Standard EMOC request #{i + 1} for testing the MOC system workflow.",
                RiskToolUsed = i % 2 == 0 ? "HAZOP" : "JSA",
                RiskLevel = (RiskLevel)((i % 3) + 1), // Rotate Green, Yellow, Red
                CurrentStage = (MocStage)((i % 7) + 1), // Spread across all stages
                Status = i switch
                {
                    0 => MocStatus.Draft,
                    1 => MocStatus.Submitted,
                    2 => MocStatus.Active,
                    3 => MocStatus.Active,
                    4 => MocStatus.Active,
                    5 => MocStatus.Approved,
                    6 => MocStatus.ForRestoration,
                    7 => MocStatus.Restored,
                    8 => MocStatus.Closed,
                    _ => MocStatus.Active
                },
                CreatedAtUtc = seedTime.AddDays(-(10 - i)),
                CreatedBy = seedUser
            };

            // Add some action items for active requests
            if (request.Status == MocStatus.Active || request.Status == MocStatus.Submitted)
            {
                request.ActionItems.Add(new MocActionItem
                {
                    Id = Guid.NewGuid(),
                    Description = $"Action item for {request.ControlNumber}",
                    DueDate = seedTime.AddDays(20 + i),
                    IsCompleted = i % 2 == 0,
                    CompletedAtUtc = i % 2 == 0 ? seedTime.AddDays(15 + i) : null,
                    CreatedAtUtc = seedTime.AddDays(-(10 - i)),
                    CreatedBy = seedUser
                });
            }

            standardEmocs.Add(request);
        }

        _context.MocRequests.AddRange(standardEmocs);
        await _context.SaveChangesAsync();

        // Seed 5 Bypass EMOC requests including overdue and restoration scenarios
        var bypassEmocs = new List<MocRequest>();
        for (int i = 0; i < 5; i++)
        {
            var isOverdue = i == 0; // First one is overdue
            var isForRestoration = i == 1; // Second one is for restoration
            var isRestored = i == 2; // Third one is restored

            var request = new MocRequest
            {
                Id = Guid.NewGuid(),
                ControlNumber = $"BYPASS-{2000 + i}",
                RequestType = MocRequestType.BypassEmoc,
                Title = $"Bypass EMOC Request {i + 1}: Emergency Bypass",
                Originator = demoUsers.First(u => u.RoleKey == "Originator").UserName,
                DivisionId = divisions[i % divisions.Count].Id,
                DepartmentId = departments[i % departments.Count].Id,
                SectionId = sections[i % sections.Count].Id,
                CategoryId = categories[i % categories.Count].Id,
                SubcategoryId = subcategories[i % subcategories.Count].Id,
                UnitsAffected = $"U-{(i % 3) + 1}00",
                EquipmentTag = $"EQ-BYPASS-{2000 + i}",
                IsTemporary = true, // Bypass EMOCs are always temporary
                TargetImplementationDate = isOverdue ? seedTime.AddDays(-10) : seedTime.AddDays(10 + (i * 5)),
                PlannedRestorationDate = isOverdue ? seedTime.AddDays(-5) : seedTime.AddDays(25 + (i * 5)),
                ScopeDescription = $"This is a demo Bypass EMOC request #{i + 1}.",
                RiskLevel = RiskLevel.Yellow,
                CurrentStage = isRestored ? MocStage.RestorationOrCloseout : (isForRestoration ? MocStage.RestorationOrCloseout : MocStage.Implementation),
                Status = isRestored ? MocStatus.Restored : (isForRestoration ? MocStatus.ForRestoration : (isOverdue ? MocStatus.Active : MocStatus.Active)),
                BypassDurationDays = 30,
                IsBypassEmergency = i % 2 == 0,
                BypassType = i % 2 == 0 ? "Emergency" : "Normal",
                CreatedAtUtc = seedTime.AddDays(-(15 - i)),
                CreatedBy = seedUser
            };

            bypassEmocs.Add(request);
        }

        _context.MocRequests.AddRange(bypassEmocs);
        await _context.SaveChangesAsync();

        // Create tasks for various requests
        var allRequests = standardEmocs.Concat(bypassEmocs).ToList();
        var tasks = new List<TaskItem>();

        foreach (var request in allRequests.Take(8)) // Create tasks for first 8 requests
        {
            var taskType = (TaskType)((tasks.Count % 6) + 1);
            var assignedRole = roles[Math.Min(tasks.Count % roles.Count, roles.Count - 1)];

            var task = new TaskItem
            {
                Id = Guid.NewGuid(),
                MocRequestId = request.Id,
                AssignedRoleKey = assignedRole.Key,
                AssignedUserId = demoUsers.FirstOrDefault(u => u.RoleKey == assignedRole.Key)?.Id,
                TaskType = taskType,
                Title = $"{taskType} task for {request.ControlNumber}",
                Description = $"This is a {taskType} task related to {request.Title}",
                DueDateUtc = seedTime.AddDays(20 + tasks.Count),
                Status = tasks.Count % 3 == 0 ? MocTaskStatus.Completed : MocTaskStatus.Open,
                CompletedAtUtc = tasks.Count % 3 == 0 ? seedTime.AddDays(15 + tasks.Count) : null,
                CompletedBy = tasks.Count % 3 == 0 ? demoUsers.First(u => u.RoleKey == assignedRole.Key).UserName : null,
                CreatedAtUtc = seedTime.AddDays(-(10 - tasks.Count)),
                CreatedBy = seedUser
            };

            tasks.Add(task);
        }

        _context.TaskItems.AddRange(tasks);
        await _context.SaveChangesAsync();

        // Create notifications (including inactivity notifications)
        var notifications = new List<Notification>();

        // Inactivity notifications (30, 45, 60 days)
        foreach (var request in allRequests.Where(r => r.Status == MocStatus.Active).Take(3))
        {
            notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                Type = "Inactivity30Days",
                Message = $"Request {request.ControlNumber} has been inactive for 30 days.",
                MocRequestId = request.Id,
                RecipientRoleKey = "DepartmentManager",
                RecipientUserId = demoUsers.FirstOrDefault(u => u.RoleKey == "DepartmentManager")?.Id,
                Status = NotificationStatus.Unread,
                CreatedAtUtc = seedTime.AddDays(-30),
                CreatedBy = seedUser
            });
        }

        // Overdue restoration notification
        var overdueBypass = bypassEmocs.FirstOrDefault(r => r.PlannedRestorationDate < DateTime.UtcNow);
        if (overdueBypass != null)
        {
            notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                Type = "OverdueRestoration",
                Message = $"Bypass EMOC {overdueBypass.ControlNumber} is past its restoration date.",
                MocRequestId = overdueBypass.Id,
                RecipientRoleKey = "DivisionManager",
                RecipientUserId = demoUsers.FirstOrDefault(u => u.RoleKey == "DivisionManager")?.Id,
                Status = NotificationStatus.Unread,
                CreatedAtUtc = seedTime.AddDays(-5),
                CreatedBy = seedUser
            });
        }

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        // Seed a few manuals and procedures
        var manuals = new List<Manual>();
        var procedureNodes = new List<ProcedureNode>();

        for (int i = 0; i < 3; i++)
        {
            var manual = new Manual
            {
                Id = Guid.NewGuid(),
                Title = $"Safety Manual {i + 1}",
                Code = $"MAN-{3000 + i}",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            };

            manuals.Add(manual);

            // Create procedure nodes separately (will be linked after manual is saved)
            procedureNodes.Add(new ProcedureNode
            {
                Id = Guid.NewGuid(),
                ManualId = manual.Id,
                NodeType = ProcedureNodeType.Procedure,
                Title = $"Procedure {i + 1}.1",
                Url = $"https://example.com/procedure-{i + 1}-1",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            });
        }

        _context.Manuals.AddRange(manuals);
        await _context.SaveChangesAsync();

        _context.ProcedureNodes.AddRange(procedureNodes);
        await _context.SaveChangesAsync();

        // Seed feedback entries
        var feedbackEntries = new List<FeedbackEntry>();
        for (int i = 0; i < 3; i++)
        {
            var feedback = new FeedbackEntry
            {
                Id = Guid.NewGuid(),
                MocRequestId = i < 2 ? allRequests[i].Id : null, // First two linked to requests, third is general
                Title = $"Feedback Entry {i + 1}",
                Message = $"This is demo feedback #{i + 1}. " + (i == 2 ? "This is a general feedback not linked to a specific request." : $"Related to {allRequests[i].ControlNumber}"),
                IsLessonLearned = i == 1, // Second one is a lesson learned
                CreatedAtUtc = seedTime.AddDays(-(5 - i)),
                CreatedBy = seedUser
            };

            feedbackEntries.Add(feedback);
        }

        _context.FeedbackEntries.AddRange(feedbackEntries);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Demo data seeding completed successfully.");
    }
}
