using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20260930_S1_InvitationEmailLookup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "invited_email_lookup_hash",
                table: "family_invitations",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_family_invitations_invited_email_lookup_hash",
                table: "family_invitations",
                column: "invited_email_lookup_hash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_family_invitations_invited_email_lookup_hash",
                table: "family_invitations");

            migrationBuilder.DropColumn(
                name: "invited_email_lookup_hash",
                table: "family_invitations");
        }
    }
}
