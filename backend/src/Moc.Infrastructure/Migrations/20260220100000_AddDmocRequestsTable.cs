using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Moc.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Additive migration: creates DmocRequests table for DMOC (Departmental Management of Change).
    /// No changes to existing tables.
    /// </summary>
    public partial class AddDmocRequestsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DmocRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DmocNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ChangeOriginatorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ChangeOriginatorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OriginatorPosition = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AreaOrDepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AreaOrDepartmentName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    NatureOfChange = table.Column<int>(type: "int", nullable: false),
                    TargetImplementationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PlannedEndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DescriptionOfChange = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReasonForChange = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AffectedEquipment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AttachmentsOrReferenceLinks = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AdditionalRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DmocRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DmocRequests_Departments_AreaOrDepartmentId",
                        column: x => x.AreaOrDepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DmocRequests_AreaOrDepartmentId",
                table: "DmocRequests",
                column: "AreaOrDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DmocRequests_ChangeOriginatorUserId",
                table: "DmocRequests",
                column: "ChangeOriginatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DmocRequests_CreatedAtUtc",
                table: "DmocRequests",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_DmocRequests_Status",
                table: "DmocRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_DmocRequests_DmocNumber",
                table: "DmocRequests",
                column: "DmocNumber",
                unique: true,
                filter: "[DmocNumber] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DmocRequests");
        }
    }
}
