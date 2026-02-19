using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Moc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoleKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Divisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Divisions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Manuals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Manuals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Subcategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subcategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subcategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DivisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departments_Divisions_DivisionId",
                        column: x => x.DivisionId,
                        principalTable: "Divisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProcedureNodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ManualId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ParentNodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    NodeType = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcedureNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcedureNodes_Manuals_ManualId",
                        column: x => x.ManualId,
                        principalTable: "Manuals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcedureNodes_ProcedureNodes_ParentNodeId",
                        column: x => x.ParentNodeId,
                        principalTable: "ProcedureNodes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Sections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sections_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MocRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ControlNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RequestType = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Originator = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DivisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubcategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitsAffected = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EquipmentTag = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsTemporary = table.Column<bool>(type: "bit", nullable: false),
                    TargetImplementationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PlannedRestorationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScopeDescription = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    RiskToolUsed = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RiskLevel = table.Column<int>(type: "int", nullable: true),
                    CurrentStage = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    BypassDurationDays = table.Column<int>(type: "int", nullable: true),
                    IsBypassEmergency = table.Column<bool>(type: "bit", nullable: true),
                    BypassType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MarkedInactiveAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MocRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MocRequests_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MocRequests_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MocRequests_Divisions_DivisionId",
                        column: x => x.DivisionId,
                        principalTable: "Divisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MocRequests_Sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "Sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MocRequests_Subcategories_SubcategoryId",
                        column: x => x.SubcategoryId,
                        principalTable: "Subcategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FeedbackEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MocRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsLessonLearned = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbackEntries_MocRequests_MocRequestId",
                        column: x => x.MocRequestId,
                        principalTable: "MocRequests",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MocActionItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MocRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MocActionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MocActionItems_MocRequests_MocRequestId",
                        column: x => x.MocRequestId,
                        principalTable: "MocRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MocApprovers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MocRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    IsApproved = table.Column<bool>(type: "bit", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MocApprovers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MocApprovers_MocRequests_MocRequestId",
                        column: x => x.MocRequestId,
                        principalTable: "MocRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MocDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MocRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentGroup = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsLink = table.Column<bool>(type: "bit", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StoragePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MocDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MocDocuments_MocRequests_MocRequestId",
                        column: x => x.MocRequestId,
                        principalTable: "MocRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    MocRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RecipientRoleKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReadAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_AppUsers_RecipientUserId",
                        column: x => x.RecipientUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Notifications_MocRequests_MocRequestId",
                        column: x => x.MocRequestId,
                        principalTable: "MocRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TaskItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MocRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedRoleKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AssignedUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TaskType = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    DueDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CompletionRemarks = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskItems_AppUsers_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TaskItems_MocRequests_MocRequestId",
                        column: x => x.MocRequestId,
                        principalTable: "MocRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AppRoles",
                columns: new[] { "Id", "CreatedAtUtc", "CreatedBy", "IsActive", "Key", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("77777777-7777-7777-7777-777777777771"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, "Originator", null, null, "Originator" },
                    { new Guid("77777777-7777-7777-7777-777777777772"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, "Supervisor", null, null, "Supervisor" },
                    { new Guid("77777777-7777-7777-7777-777777777773"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, "DepartmentManager", null, null, "Department Manager" },
                    { new Guid("77777777-7777-7777-7777-777777777774"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, "DivisionManager", null, null, "Division Manager" },
                    { new Guid("77777777-7777-7777-7777-777777777775"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, "AVP", null, null, "Assistant Vice President" },
                    { new Guid("77777777-7777-7777-7777-777777777776"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, "SuperUser", null, null, "Super User" }
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Code", "CreatedAtUtc", "CreatedBy", "IsActive", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("55555555-5555-5555-5555-555555555551"), "CAT-PROC", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Process Change" },
                    { new Guid("55555555-5555-5555-5555-555555555552"), "CAT-EQUIP", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Equipment Change" },
                    { new Guid("55555555-5555-5555-5555-555555555553"), "CAT-SAFETY", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Safety Change" }
                });

            migrationBuilder.InsertData(
                table: "Divisions",
                columns: new[] { "Id", "Code", "CreatedAtUtc", "CreatedBy", "IsActive", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "DIV-ENG", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Engineering Division" },
                    { new Guid("11111111-1111-1111-1111-111111111112"), "DIV-OPS", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Operations Division" }
                });

            migrationBuilder.InsertData(
                table: "Units",
                columns: new[] { "Id", "Code", "CreatedAtUtc", "CreatedBy", "IsActive", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("44444444-4444-4444-4444-444444444441"), "U-100", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Unit 100" },
                    { new Guid("44444444-4444-4444-4444-444444444442"), "U-200", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Unit 200" },
                    { new Guid("44444444-4444-4444-4444-444444444443"), "U-300", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Unit 300" }
                });

            migrationBuilder.InsertData(
                table: "Departments",
                columns: new[] { "Id", "Code", "CreatedAtUtc", "CreatedBy", "DivisionId", "IsActive", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("22222222-2222-2222-2222-222222222221"), "DEP-MAINT", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("11111111-1111-1111-1111-111111111111"), true, null, null, "Maintenance Department" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "DEP-PROC", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("11111111-1111-1111-1111-111111111112"), true, null, null, "Process Department" },
                    { new Guid("22222222-2222-2222-2222-222222222223"), "DEP-SAFETY", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("11111111-1111-1111-1111-111111111111"), true, null, null, "Safety Department" }
                });

            migrationBuilder.InsertData(
                table: "Subcategories",
                columns: new[] { "Id", "CategoryId", "Code", "CreatedAtUtc", "CreatedBy", "IsActive", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("66666666-6666-6666-6666-666666666661"), new Guid("55555555-5555-5555-5555-555555555551"), "SUBC-INSTR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Instrumentation" },
                    { new Guid("66666666-6666-6666-6666-666666666662"), new Guid("55555555-5555-5555-5555-555555555552"), "SUBC-PIPING", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Piping" },
                    { new Guid("66666666-6666-6666-6666-666666666663"), new Guid("55555555-5555-5555-5555-555555555552"), "SUBC-VESSEL", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", true, null, null, "Vessel" }
                });

            migrationBuilder.InsertData(
                table: "Sections",
                columns: new[] { "Id", "Code", "CreatedAtUtc", "CreatedBy", "DepartmentId", "IsActive", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("33333333-3333-3333-3333-333333333331"), "SEC-MECH", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("22222222-2222-2222-2222-222222222221"), true, null, null, "Mechanical Section" },
                    { new Guid("33333333-3333-3333-3333-333333333332"), "SEC-ELEC", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("22222222-2222-2222-2222-222222222221"), true, null, null, "Electrical Section" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "SEC-INSTR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("22222222-2222-2222-2222-222222222221"), true, null, null, "Instrumentation Section" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Code",
                table: "Departments",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Departments_DivisionId",
                table: "Departments",
                column: "DivisionId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackEntries_MocRequestId",
                table: "FeedbackEntries",
                column: "MocRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MocActionItems_MocRequestId",
                table: "MocActionItems",
                column: "MocRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MocApprovers_MocRequestId",
                table: "MocApprovers",
                column: "MocRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MocDocuments_MocRequestId",
                table: "MocDocuments",
                column: "MocRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_CategoryId",
                table: "MocRequests",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_ControlNumber",
                table: "MocRequests",
                column: "ControlNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_CurrentStage",
                table: "MocRequests",
                column: "CurrentStage");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_DepartmentId",
                table: "MocRequests",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_DivisionId_DepartmentId_SectionId",
                table: "MocRequests",
                columns: new[] { "DivisionId", "DepartmentId", "SectionId" });

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_EquipmentTag",
                table: "MocRequests",
                column: "EquipmentTag");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_PlannedRestorationDate",
                table: "MocRequests",
                column: "PlannedRestorationDate");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_RequestType",
                table: "MocRequests",
                column: "RequestType");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_RiskLevel",
                table: "MocRequests",
                column: "RiskLevel");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_SectionId",
                table: "MocRequests",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_Status",
                table: "MocRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_SubcategoryId",
                table: "MocRequests",
                column: "SubcategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_TargetImplementationDate",
                table: "MocRequests",
                column: "TargetImplementationDate");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CreatedAtUtc",
                table: "Notifications",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_MocRequestId",
                table: "Notifications",
                column: "MocRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientRoleKey",
                table: "Notifications",
                column: "RecipientRoleKey");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientUserId",
                table: "Notifications",
                column: "RecipientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Status",
                table: "Notifications",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProcedureNodes_ManualId",
                table: "ProcedureNodes",
                column: "ManualId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcedureNodes_ParentNodeId",
                table: "ProcedureNodes",
                column: "ParentNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Sections_Code",
                table: "Sections",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sections_DepartmentId",
                table: "Sections",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Subcategories_CategoryId",
                table: "Subcategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_AssignedRoleKey",
                table: "TaskItems",
                column: "AssignedRoleKey");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_AssignedUserId",
                table: "TaskItems",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_DueDateUtc",
                table: "TaskItems",
                column: "DueDateUtc");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_MocRequestId",
                table: "TaskItems",
                column: "MocRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_Status",
                table: "TaskItems",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppRoles");

            migrationBuilder.DropTable(
                name: "FeedbackEntries");

            migrationBuilder.DropTable(
                name: "MocActionItems");

            migrationBuilder.DropTable(
                name: "MocApprovers");

            migrationBuilder.DropTable(
                name: "MocDocuments");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "ProcedureNodes");

            migrationBuilder.DropTable(
                name: "TaskItems");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "Manuals");

            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropTable(
                name: "MocRequests");

            migrationBuilder.DropTable(
                name: "Sections");

            migrationBuilder.DropTable(
                name: "Subcategories");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Divisions");
        }
    }
}
