using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20261005_S2_AddLabReportSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: DatabaseInitializer may already have added these columns on a database
            // that was bootstrapped without migrations.
            migrationBuilder.Sql("""
                ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
                ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS deleted_by_user_id uuid;
                CREATE INDEX IF NOT EXISTS ix_lab_reports_member_id_deleted_at ON lab_reports (member_id, deleted_at);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_lab_reports_member_id_deleted_at",
                table: "lab_reports");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "lab_reports");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "lab_reports");
        }
    }
}
