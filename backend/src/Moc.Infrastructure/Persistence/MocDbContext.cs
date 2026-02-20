using Microsoft.EntityFrameworkCore;
using Moc.Domain.Entities;

namespace Moc.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for the MOC system, mapping domain entities to SQL Server tables.
/// This context is scoped per request and is accessed via repositories or services in the Application layer.
/// </summary>
public class MocDbContext : DbContext
{
    /// <summary>
    /// Constructs the DbContext using DI-provided options containing the connection string and provider configuration.
    /// </summary>
    public MocDbContext(DbContextOptions<MocDbContext> options)
        : base(options)
    {
    }

    // Lookup tables (List of Values)
    /// <summary>
    /// DbSet for organizational divisions, used for filtering and classification.
    /// </summary>
    public DbSet<Division> Divisions => Set<Division>();

    /// <summary>
    /// DbSet for departments, organized under divisions.
    /// </summary>
    public DbSet<Department> Departments => Set<Department>();

    /// <summary>
    /// DbSet for sections, organized under departments.
    /// </summary>
    public DbSet<Section> Sections => Set<Section>();

    /// <summary>
    /// DbSet for units (plant/process units), used for filtering and classification.
    /// </summary>
    public DbSet<Unit> Units => Set<Unit>();

    /// <summary>
    /// DbSet for change categories.
    /// </summary>
    public DbSet<Category> Categories => Set<Category>();

    /// <summary>
    /// DbSet for change subcategories, organized under categories.
    /// </summary>
    public DbSet<Subcategory> Subcategories => Set<Subcategory>();

    // Core MOC entities
    /// <summary>
    /// DbSet for all MOC requests (Standard EMOC, Bypass EMOC, OMOC, DMOC).
    /// </summary>
    public DbSet<MocRequest> MocRequests => Set<MocRequest>();

    /// <summary>
    /// DbSet for action items associated with requests.
    /// </summary>
    public DbSet<MocActionItem> MocActionItems => Set<MocActionItem>();

    /// <summary>
    /// DbSet for documents (uploads/links) associated with requests.
    /// </summary>
    public DbSet<MocDocument> MocDocuments => Set<MocDocument>();

    /// <summary>
    /// DbSet for approver chain slots for requests.
    /// </summary>
    public DbSet<MocApprover> MocApprovers => Set<MocApprover>();

    /// <summary>
    /// DbSet for MOC request activity/audit log entries.
    /// </summary>
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    /// <summary>
    /// DbSet for DMOC (Departmental Management of Change) requests. Isolated from MocRequests.
    /// </summary>
    public DbSet<DmocRequest> DmocRequests => Set<DmocRequest>();

    // Workflow and task management
    /// <summary>
    /// DbSet for workflow tasks that appear in "My Tasks" screens.
    /// </summary>
    public DbSet<TaskItem> TaskItems => Set<TaskItem>();

    /// <summary>
    /// DbSet for in-app notifications (bell icon, notifications list).
    /// </summary>
    public DbSet<Notification> Notifications => Set<Notification>();

    // User and role management (stub auth)
    /// <summary>
    /// DbSet for application roles used in workflow routing.
    /// </summary>
    public DbSet<AppRole> AppRoles => Set<AppRole>();

    /// <summary>
    /// DbSet for demo users (lightweight, not a full identity implementation).
    /// </summary>
    public DbSet<AppUser> AppUsers => Set<AppUser>();

    /// <summary>
    /// DbSet for configurable approval chain levels. Admin maintains order and role per level.
    /// </summary>
    public DbSet<ApprovalLevel> ApprovalLevels => Set<ApprovalLevel>();

    // Manuals and Procedures
    /// <summary>
    /// DbSet for manuals in the Manuals and Procedures module.
    /// </summary>
    public DbSet<Manual> Manuals => Set<Manual>();

    /// <summary>
    /// DbSet for procedure nodes (hierarchical content under manuals).
    /// </summary>
    public DbSet<ProcedureNode> ProcedureNodes => Set<ProcedureNode>();

    // Feedback
    /// <summary>
    /// DbSet for feedback entries and lessons learned.
    /// </summary>
    public DbSet<FeedbackEntry> FeedbackEntries => Set<FeedbackEntry>();

    /// <summary>
    /// Configures the EF Core model by applying entity configurations and seeding lookup data.
    /// This method is called once when the model is being created.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly (IEntityTypeConfiguration classes).
        // This keeps mapping logic organized per entity.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MocDbContext).Assembly);

        // Seed static lookup data using HasData for deterministic IDs.
        // This ensures dev environments share the same base lookup values.
        SeedLookupData(modelBuilder);
    }

    /// <summary>
    /// Seeds static lookup data (divisions, departments, sections, units, categories, subcategories, roles).
    /// Uses HasData so the same IDs are generated every time, making demo data seeding reliable.
    /// </summary>
    private static void SeedLookupData(ModelBuilder modelBuilder)
    {
        var seedTime = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var seedUser = "seed";

        // Divisions
        var divEngId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var divOpsId = Guid.Parse("11111111-1111-1111-1111-111111111112");

        modelBuilder.Entity<Division>().HasData(
            new Division
            {
                Id = divEngId,
                Code = "DIV-ENG",
                Name = "Engineering Division",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Division
            {
                Id = divOpsId,
                Code = "DIV-OPS",
                Name = "Operations Division",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            }
        );

        // Departments
        var deptMaintId = Guid.Parse("22222222-2222-2222-2222-222222222221");
        var deptProcId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var deptSafetyId = Guid.Parse("22222222-2222-2222-2222-222222222223");

        modelBuilder.Entity<Department>().HasData(
            new Department
            {
                Id = deptMaintId,
                DivisionId = divEngId,
                Code = "DEP-MAINT",
                Name = "Maintenance Department",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Department
            {
                Id = deptProcId,
                DivisionId = divOpsId,
                Code = "DEP-PROC",
                Name = "Process Department",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Department
            {
                Id = deptSafetyId,
                DivisionId = divEngId,
                Code = "DEP-SAFETY",
                Name = "Safety Department",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            }
        );

        // Sections (Process and Safety sections are added by migration AddSectionsForProcessAndSafety)
        var secMechId = Guid.Parse("33333333-3333-3333-3333-333333333331");
        var secElecId = Guid.Parse("33333333-3333-3333-3333-333333333332");
        var secInstrId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        modelBuilder.Entity<Section>().HasData(
            new Section
            {
                Id = secMechId,
                DepartmentId = deptMaintId,
                Code = "SEC-MECH",
                Name = "Mechanical Section",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Section
            {
                Id = secElecId,
                DepartmentId = deptMaintId,
                Code = "SEC-ELEC",
                Name = "Electrical Section",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Section
            {
                Id = secInstrId,
                DepartmentId = deptMaintId,
                Code = "SEC-INSTR",
                Name = "Instrumentation Section",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            }
        );

        // Units
        var unit100Id = Guid.Parse("44444444-4444-4444-4444-444444444441");
        var unit200Id = Guid.Parse("44444444-4444-4444-4444-444444444442");
        var unit300Id = Guid.Parse("44444444-4444-4444-4444-444444444443");

        modelBuilder.Entity<Unit>().HasData(
            new Unit
            {
                Id = unit100Id,
                Code = "U-100",
                Name = "Unit 100",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Unit
            {
                Id = unit200Id,
                Code = "U-200",
                Name = "Unit 200",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Unit
            {
                Id = unit300Id,
                Code = "U-300",
                Name = "Unit 300",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            }
        );

        // Categories
        var catProcId = Guid.Parse("55555555-5555-5555-5555-555555555551");
        var catEquipId = Guid.Parse("55555555-5555-5555-5555-555555555552");
        var catSafetyId = Guid.Parse("55555555-5555-5555-5555-555555555553");

        modelBuilder.Entity<Category>().HasData(
            new Category
            {
                Id = catProcId,
                Code = "CAT-PROC",
                Name = "Process Change",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Category
            {
                Id = catEquipId,
                Code = "CAT-EQUIP",
                Name = "Equipment Change",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Category
            {
                Id = catSafetyId,
                Code = "CAT-SAFETY",
                Name = "Safety Change",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            }
        );

        // Subcategories
        var subcatInstrId = Guid.Parse("66666666-6666-6666-6666-666666666661");
        var subcatPipingId = Guid.Parse("66666666-6666-6666-6666-666666666662");
        var subcatVesselId = Guid.Parse("66666666-6666-6666-6666-666666666663");

        modelBuilder.Entity<Subcategory>().HasData(
            new Subcategory
            {
                Id = subcatInstrId,
                CategoryId = catProcId,
                Code = "SUBC-INSTR",
                Name = "Instrumentation",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Subcategory
            {
                Id = subcatPipingId,
                CategoryId = catEquipId,
                Code = "SUBC-PIPING",
                Name = "Piping",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new Subcategory
            {
                Id = subcatVesselId,
                CategoryId = catEquipId,
                Code = "SUBC-VESSEL",
                Name = "Vessel",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            }
        );

        // Roles
        var roleOriginatorId = Guid.Parse("77777777-7777-7777-7777-777777777771");
        var roleSupervisorId = Guid.Parse("77777777-7777-7777-7777-777777777772");
        var roleDeptMgrId = Guid.Parse("77777777-7777-7777-7777-777777777773");
        var roleDivMgrId = Guid.Parse("77777777-7777-7777-7777-777777777774");
        var roleAvpId = Guid.Parse("77777777-7777-7777-7777-777777777775");
        var roleSuperUserId = Guid.Parse("77777777-7777-7777-7777-777777777776");

        modelBuilder.Entity<AppRole>().HasData(
            new AppRole
            {
                Id = roleOriginatorId,
                Key = "Originator",
                Name = "Originator",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new AppRole
            {
                Id = roleSupervisorId,
                Key = "Supervisor",
                Name = "Supervisor",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new AppRole
            {
                Id = roleDeptMgrId,
                Key = "DepartmentManager",
                Name = "Department Manager",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new AppRole
            {
                Id = roleDivMgrId,
                Key = "DivisionManager",
                Name = "Division Manager",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new AppRole
            {
                Id = roleAvpId,
                Key = "AVP",
                Name = "Assistant Vice President",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            },
            new AppRole
            {
                Id = roleSuperUserId,
                Key = "SuperUser",
                Name = "Super User",
                IsActive = true,
                CreatedAtUtc = seedTime,
                CreatedBy = seedUser
            }
        );

        // Default approval levels (1–5). Admin can add/remove/reorder and assign role per level.
        var level1Id = Guid.Parse("88888888-8888-8888-8888-888888888881");
        var level2Id = Guid.Parse("88888888-8888-8888-8888-888888888882");
        var level3Id = Guid.Parse("88888888-8888-8888-8888-888888888883");
        var level4Id = Guid.Parse("88888888-8888-8888-8888-888888888884");
        var level5Id = Guid.Parse("88888888-8888-8888-8888-888888888885");

        modelBuilder.Entity<ApprovalLevel>().HasData(
            new ApprovalLevel { Id = level1Id, Order = 1, RoleKey = "Supervisor", IsActive = true, CreatedAtUtc = seedTime, CreatedBy = seedUser },
            new ApprovalLevel { Id = level2Id, Order = 2, RoleKey = "DepartmentManager", IsActive = true, CreatedAtUtc = seedTime, CreatedBy = seedUser },
            new ApprovalLevel { Id = level3Id, Order = 3, RoleKey = "DivisionManager", IsActive = true, CreatedAtUtc = seedTime, CreatedBy = seedUser },
            new ApprovalLevel { Id = level4Id, Order = 4, RoleKey = "AVP", IsActive = true, CreatedAtUtc = seedTime, CreatedBy = seedUser },
            new ApprovalLevel { Id = level5Id, Order = 5, RoleKey = "SuperUser", IsActive = true, CreatedAtUtc = seedTime, CreatedBy = seedUser }
        );
    }
}
