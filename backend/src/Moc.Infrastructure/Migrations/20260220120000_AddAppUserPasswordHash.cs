using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Moc.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Adds optional PasswordHash to AppUsers for stub login (e.g. test approver accounts).
    /// </summary>
    public partial class AddAppUserPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "AppUsers",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "AppUsers");
        }
    }
}
