using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20260928_S4_DoctorAssignmentConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM family_doctor_assignments
                        WHERE is_primary = TRUE AND ended_at IS NULL
                        GROUP BY family_id HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'Cannot add doctor constraints: a family has multiple active primary assignments';
                    END IF;
                    IF EXISTS (
                        SELECT 1 FROM family_doctor_requests
                        WHERE status = 'Pending'
                        GROUP BY family_id HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'Cannot add doctor constraints: a family has multiple pending requests';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropIndex(
                name: "ix_family_doctor_assignments_family_id_doctor_id",
                table: "family_doctor_assignments");

            migrationBuilder.CreateIndex(
                name: "ux_family_doctor_requests_pending",
                table: "family_doctor_requests",
                column: "family_id",
                unique: true,
                filter: "status = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "ix_family_doctor_assignments_family_id_doctor_id",
                table: "family_doctor_assignments",
                columns: new[] { "family_id", "doctor_id" });

            migrationBuilder.CreateIndex(
                name: "ux_family_doctor_assignments_active_primary",
                table: "family_doctor_assignments",
                column: "family_id",
                unique: true,
                filter: "is_primary = TRUE AND ended_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM family_doctor_assignments
                        GROUP BY family_id, doctor_id HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'Cannot revert doctor constraints without losing assignment history';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropIndex(
                name: "ux_family_doctor_requests_pending",
                table: "family_doctor_requests");

            migrationBuilder.DropIndex(
                name: "ix_family_doctor_assignments_family_id_doctor_id",
                table: "family_doctor_assignments");

            migrationBuilder.DropIndex(
                name: "ux_family_doctor_assignments_active_primary",
                table: "family_doctor_assignments");

            migrationBuilder.CreateIndex(
                name: "ix_family_doctor_assignments_family_id_doctor_id",
                table: "family_doctor_assignments",
                columns: new[] { "family_id", "doctor_id" },
                unique: true);
        }
    }
}
