using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Moc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalLevels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var seedTime = new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            var seedUser = "seed";

            migrationBuilder.CreateTable(
                name: "ApprovalLevels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    RoleKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalLevels", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalLevels_Order",
                table: "ApprovalLevels",
                column: "Order");

            migrationBuilder.InsertData(
                table: "ApprovalLevels",
                columns: new[] { "Id", "Order", "RoleKey", "IsActive", "CreatedAtUtc", "CreatedBy" },
                values: new object[,]
                {
                    { new Guid("88888888-8888-8888-8888-888888888881"), 1, "Supervisor", true, seedTime, seedUser },
                    { new Guid("88888888-8888-8888-8888-888888888882"), 2, "DepartmentManager", true, seedTime, seedUser },
                    { new Guid("88888888-8888-8888-8888-888888888883"), 3, "DivisionManager", true, seedTime, seedUser },
                    { new Guid("88888888-8888-8888-8888-888888888884"), 4, "AVP", true, seedTime, seedUser },
                    { new Guid("88888888-8888-8888-8888-888888888885"), 5, "SuperUser", true, seedTime, seedUser }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ApprovalLevels");
        }
    }
}
