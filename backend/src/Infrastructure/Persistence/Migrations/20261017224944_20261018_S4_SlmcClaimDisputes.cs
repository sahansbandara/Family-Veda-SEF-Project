using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20261018_S4_SlmcClaimDisputes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_doctors_registration_number_hash",
                table: "doctors");

            migrationBuilder.AddColumn<bool>(
                name: "claim_disputed",
                table: "doctors",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "frozen_at",
                table: "case_access_grants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "doctor_claim_disputes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    registration_number_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    winner_doctor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    resolved_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    resolution_reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doctor_claim_disputes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "slmc_register_entries",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    registration_number_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_slmc_register_entries", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ux_doctors_registration_number_hash_verified",
                table: "doctors",
                column: "registration_number_hash",
                unique: true,
                filter: "verification_status = 'Verified'");

            migrationBuilder.CreateIndex(
                name: "ux_doctor_claim_disputes_open_hash",
                table: "doctor_claim_disputes",
                column: "registration_number_hash",
                unique: true,
                filter: "status = 'Open'");

            migrationBuilder.CreateIndex(
                name: "ix_slmc_register_entries_registration_number_hash",
                table: "slmc_register_entries",
                column: "registration_number_hash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "doctor_claim_disputes");

            migrationBuilder.DropTable(
                name: "slmc_register_entries");

            migrationBuilder.DropIndex(
                name: "ux_doctors_registration_number_hash_verified",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "claim_disputed",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "frozen_at",
                table: "case_access_grants");

            migrationBuilder.CreateIndex(
                name: "ix_doctors_registration_number_hash",
                table: "doctors",
                column: "registration_number_hash",
                unique: true);
        }
    }
}
