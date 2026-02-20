using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Moc.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Additive migration: ActivityLog table, MocRequest control-number fields and MocType,
    /// Notification Channel/Recipient/Content/AcknowledgedAt/FollowUpAt, and index on MocRequest.ModifiedAtUtc.
    /// </summary>
    public partial class AddActivityLogAndExtendedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ActivityLogs table
            migrationBuilder.CreateTable(
                name: "ActivityLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MocRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActorEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IPAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DeviceInfo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    BeforeSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AfterSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityLogs_MocRequests_MocRequestId",
                        column: x => x.MocRequestId,
                        principalTable: "MocRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_MocRequestId",
                table: "ActivityLogs",
                column: "MocRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_TimestampUtc",
                table: "ActivityLogs",
                column: "TimestampUtc");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_Action",
                table: "ActivityLogs",
                column: "Action");

            // MocRequests: additive columns (all nullable or safe)
            migrationBuilder.AddColumn<int>(
                name: "MocType",
                table: "MocRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ControlNumberYear",
                table: "MocRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ControlNumberMonth",
                table: "MocRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ControlNumberArea",
                table: "MocRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ControlNumberCategory",
                table: "MocRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ControlNumberCode",
                table: "MocRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MocRequests_ModifiedAtUtc",
                table: "MocRequests",
                column: "ModifiedAtUtc");

            // Notifications: additive columns (all nullable)
            migrationBuilder.AddColumn<int>(
                name: "Channel",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Recipient",
                table: "Notifications",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Notifications",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AcknowledgedAtUtc",
                table: "Notifications",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FollowUpAtUtc",
                table: "Notifications",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Channel",
                table: "Notifications",
                column: "Channel");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_FollowUpAtUtc",
                table: "Notifications",
                column: "FollowUpAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notifications_Channel",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_FollowUpAtUtc",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Channel",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Recipient",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "AcknowledgedAtUtc",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "FollowUpAtUtc",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_MocRequests_ModifiedAtUtc",
                table: "MocRequests");

            migrationBuilder.DropColumn(
                name: "MocType",
                table: "MocRequests");

            migrationBuilder.DropColumn(
                name: "ControlNumberYear",
                table: "MocRequests");

            migrationBuilder.DropColumn(
                name: "ControlNumberMonth",
                table: "MocRequests");

            migrationBuilder.DropColumn(
                name: "ControlNumberArea",
                table: "MocRequests");

            migrationBuilder.DropColumn(
                name: "ControlNumberCategory",
                table: "MocRequests");

            migrationBuilder.DropColumn(
                name: "ControlNumberCode",
                table: "MocRequests");

            migrationBuilder.DropTable(
                name: "ActivityLogs");
        }
    }
}
