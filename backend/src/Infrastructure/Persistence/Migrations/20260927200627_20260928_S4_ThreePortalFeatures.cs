using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20260928_S4_ThreePortalFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "family_code",
                table: "families",
                type: "character varying(9)",
                maxLength: 9,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "city",
                table: "doctors",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "district",
                table: "doctors",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "hospital_clinic",
                table: "doctors",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "languages",
                table: "doctors",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone_number",
                table: "doctors",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "appointments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    booked_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    doctor_note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointments", x => x.id);
                    table.ForeignKey(
                        name: "fk_appointments_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_appointments_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "family_doctor_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    message = table.Column<string>(type: "character varying(280)", maxLength: 280, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    responded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_family_doctor_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_family_doctor_requests_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_family_doctor_requests_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "family_join_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requesting_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    relationship_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    message = table.Column<string>(type: "character varying(280)", maxLength: 280, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    responded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    responded_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_family_join_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_family_join_requests_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_family_join_requests_users_requesting_user_id",
                        column: x => x.requesting_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    body = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    link_path = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                    table.ForeignKey(
                        name: "fk_notifications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // S4 — backfill FamilyCode for families created before this migration (synthetic data only).
            migrationBuilder.Sql(@"
                UPDATE families
                SET family_code = 'FV-' || upper(substr(md5(random()::text || id::text), 1, 6))
                WHERE family_code IS NULL;
            ");

            migrationBuilder.CreateIndex(
                name: "ix_families_family_code",
                table: "families",
                column: "family_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_appointments_doctor_id_starts_at",
                table: "appointments",
                columns: new[] { "doctor_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_appointments_member_id_starts_at",
                table: "appointments",
                columns: new[] { "member_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_family_doctor_requests_doctor_id_status",
                table: "family_doctor_requests",
                columns: new[] { "doctor_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_family_doctor_requests_family_id_status",
                table: "family_doctor_requests",
                columns: new[] { "family_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_family_join_requests_family_id_status",
                table: "family_join_requests",
                columns: new[] { "family_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_family_join_requests_requesting_user_id_created_at",
                table: "family_join_requests",
                columns: new[] { "requesting_user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_notifications_user_id_created_at",
                table: "notifications",
                columns: new[] { "user_id", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropTable(
                name: "family_doctor_requests");

            migrationBuilder.DropTable(
                name: "family_join_requests");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropIndex(
                name: "ix_families_family_code",
                table: "families");

            migrationBuilder.DropColumn(
                name: "family_code",
                table: "families");

            migrationBuilder.DropColumn(
                name: "city",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "district",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "hospital_clinic",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "languages",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "phone_number",
                table: "doctors");
        }
    }
}
