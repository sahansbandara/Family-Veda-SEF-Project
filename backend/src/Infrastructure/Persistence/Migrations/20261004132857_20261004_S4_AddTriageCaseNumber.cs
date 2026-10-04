using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20261004_S4_AddTriageCaseNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "case_number",
                table: "triage_cases",
                type: "integer",
                nullable: false)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            // Existing cases are renumbered in creation order, then the sequence continues after them.
            migrationBuilder.Sql("""
                WITH ordered AS (
                    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS position FROM triage_cases
                )
                UPDATE triage_cases AS target SET case_number = -ordered.position
                FROM ordered WHERE target.id = ordered.id;
                UPDATE triage_cases SET case_number = -case_number WHERE case_number < 0;
                SELECT setval(pg_get_serial_sequence('triage_cases', 'case_number'),
                    COALESCE((SELECT MAX(case_number) FROM triage_cases), 0) + 1, false);
                """);

            migrationBuilder.CreateIndex(
                name: "ix_triage_cases_case_number",
                table: "triage_cases",
                column: "case_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_triage_cases_case_number",
                table: "triage_cases");

            migrationBuilder.DropColumn(
                name: "case_number",
                table: "triage_cases");
        }
    }
}
