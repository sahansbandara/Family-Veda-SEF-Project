using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20260929_S4_MemberClinicalSexAndSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "sex_for_clinical_reference",
                table: "members",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "NotSpecified");

            migrationBuilder.AddColumn<bool>(
                name: "shared_with_family_head",
                table: "lab_reports",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "shared_with_family_head",
                table: "health_records",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "sex_for_clinical_reference",
                table: "members");

            migrationBuilder.DropColumn(
                name: "shared_with_family_head",
                table: "lab_reports");

            migrationBuilder.DropColumn(
                name: "shared_with_family_head",
                table: "health_records");
        }
    }
}
