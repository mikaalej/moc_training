using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Moc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSectionsForProcessAndSafety : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add one section per department that had none, so Section dropdown always has options.
            // Process Department = 22222222-2222-2222-2222-222222222222
            // Safety Department = 22222222-2222-2222-2222-222222222223
            migrationBuilder.InsertData(
                table: "Sections",
                columns: new[] { "Id", "Code", "CreatedAtUtc", "CreatedBy", "DepartmentId", "IsActive", "ModifiedAtUtc", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { new Guid("33333333-3333-3333-3333-333333333334"), "SEC-PROC", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("22222222-2222-2222-2222-222222222222"), true, null, null, "Process Section" },
                    { new Guid("33333333-3333-3333-3333-333333333335"), "SEC-SAFETY", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seed", new Guid("22222222-2222-2222-2222-222222222223"), true, null, null, "Safety Section" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Sections",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("33333333-3333-3333-3333-333333333334"),
                    new Guid("33333333-3333-3333-3333-333333333335")
                });
        }
    }
}
