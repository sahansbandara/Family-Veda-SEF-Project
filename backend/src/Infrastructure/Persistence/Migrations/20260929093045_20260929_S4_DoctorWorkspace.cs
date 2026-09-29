using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20260929_S4_DoctorWorkspace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "accepting_new_families",
                table: "doctors",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "consultation_modes",
                table: "doctors",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "slot_minutes",
                table: "doctors",
                type: "integer",
                nullable: false,
                defaultValue: 30);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "rescheduled_from_starts_at",
                table: "appointments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "clinical_notes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    member_id = table.Column<Guid>(type: "uuid", nullable: true),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    note_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    amends_note_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinical_notes", x => x.id);
                    table.ForeignKey(
                        name: "fk_clinical_notes_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_clinical_notes_clinical_notes_amends_note_id",
                        column: x => x.amends_note_id,
                        principalTable: "clinical_notes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_clinical_notes_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_clinical_notes_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_clinical_notes_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "doctor_availability",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doctor_availability", x => x.id);
                    table.ForeignKey(
                        name: "fk_doctor_availability_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "doctor_unavailable_periods",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    reason = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doctor_unavailable_periods", x => x.id);
                    table.ForeignKey(
                        name: "fk_doctor_unavailable_periods_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "visit_access_grants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_visit_access_grants", x => x.id);
                    table.ForeignKey(
                        name: "fk_visit_access_grants_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_visit_access_grants_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_visit_access_grants_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_clinical_notes_amends_note_id",
                table: "clinical_notes",
                column: "amends_note_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_notes_appointment_id",
                table: "clinical_notes",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_notes_doctor_id",
                table: "clinical_notes",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_notes_family_id_member_id_created_at",
                table: "clinical_notes",
                columns: new[] { "family_id", "member_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_clinical_notes_member_id",
                table: "clinical_notes",
                column: "member_id");

            migrationBuilder.CreateIndex(
                name: "ix_doctor_availability_doctor_id_day_of_week",
                table: "doctor_availability",
                columns: new[] { "doctor_id", "day_of_week" });

            migrationBuilder.CreateIndex(
                name: "ix_doctor_unavailable_periods_doctor_id_starts_at",
                table: "doctor_unavailable_periods",
                columns: new[] { "doctor_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_visit_access_grants_appointment_id",
                table: "visit_access_grants",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_visit_access_grants_doctor_id_member_id_expires_at",
                table: "visit_access_grants",
                columns: new[] { "doctor_id", "member_id", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "ix_visit_access_grants_member_id",
                table: "visit_access_grants",
                column: "member_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "clinical_notes");

            migrationBuilder.DropTable(
                name: "doctor_availability");

            migrationBuilder.DropTable(
                name: "doctor_unavailable_periods");

            migrationBuilder.DropTable(
                name: "visit_access_grants");

            migrationBuilder.DropColumn(
                name: "accepting_new_families",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "consultation_modes",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "slot_minutes",
                table: "doctors");

            migrationBuilder.DropColumn(
                name: "rescheduled_from_starts_at",
                table: "appointments");
        }
    }
}
