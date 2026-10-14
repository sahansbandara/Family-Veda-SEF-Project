using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "data_protection_keys",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    friendly_name = table.Column<string>(type: "text", nullable: true),
                    xml = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_data_protection_keys", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    display_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    user_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    refresh_token_hash = table.Column<string>(type: "text", nullable: true),
                    refresh_token_expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    refresh_token_revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    device_token = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    device_platform = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "doctors",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    registration_number_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    registration_number_last_four = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    verification_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    specialty = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doctors", x => x.id);
                    table.ForeignKey(
                        name: "fk_doctors_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "families",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_families", x => x.id);
                    table.ForeignKey(
                        name: "fk_families_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notification_subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    protected_token = table.Column<string>(type: "character varying(4096)", maxLength: 4096, nullable: false),
                    platform = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_seen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_notification_subscriptions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "doctor_verification_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    admin_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    to_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doctor_verification_log", x => x.id);
                    table.ForeignKey(
                        name: "fk_doctor_verification_log_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_doctor_verification_log_users_admin_user_id",
                        column: x => x.admin_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "family_doctor_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    ended_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_family_doctor_assignments", x => x.id);
                    table.ForeignKey(
                        name: "fk_family_doctor_assignments_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_family_doctor_assignments_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "family_invitations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invited_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invited_email_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    accepted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_family_invitations", x => x.id);
                    table.ForeignKey(
                        name: "fk_family_invitations_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_family_invitations_users_accepted_by_user_id",
                        column: x => x.accepted_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_family_invitations_users_invited_by_user_id",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    display_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    date_of_birth = table.Column<DateOnly>(type: "date", nullable: false),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_members", x => x.id);
                    table.CheckConstraint("ck_member_birth_date", "date_of_birth <= CURRENT_DATE");
                    table.ForeignKey(
                        name: "fk_members_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_members_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "consents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    granted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    granted_by_guardian = table.Column<bool>(type: "boolean", nullable: false),
                    granted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consents", x => x.id);
                    table.UniqueConstraint("ak_consents_id_member_id", x => new { x.id, x.member_id });
                    table.ForeignKey(
                        name: "fk_consents_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_consents_users_granted_by_user_id",
                        column: x => x.granted_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "episodes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    symptoms_json = table.Column<string>(type: "jsonb", nullable: false),
                    duration_days = table.Column<int>(type: "integer", nullable: false),
                    severity = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_episodes", x => x.id);
                    table.ForeignKey(
                        name: "fk_episodes_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "health_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    record_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    occurred_on = table.Column<DateOnly>(type: "date", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_health_records", x => x.id);
                    table.UniqueConstraint("ak_health_records_id_member_id", x => new { x.id, x.member_id });
                    table.ForeignKey(
                        name: "fk_health_records_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lab_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    original_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    stored_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    ocr_status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ocr_error_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    collected_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lab_reports", x => x.id);
                    table.UniqueConstraint("ak_lab_reports_id_member_id", x => new { x.id, x.member_id });
                    table.ForeignKey(
                        name: "fk_lab_reports_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "relationships",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    related_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    relationship_type = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    is_biological = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_relationships", x => x.id);
                    table.CheckConstraint("ck_relationship_not_self", "member_id <> related_member_id");
                    table.ForeignKey(
                        name: "fk_relationships_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_relationships_members_related_member_id",
                        column: x => x.related_member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vitals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vital_type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    value = table.Column<decimal>(type: "numeric", nullable: false),
                    unit = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    measured_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vitals", x => x.id);
                    table.ForeignKey(
                        name: "fk_vitals_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    subject_member_id = table.Column<Guid>(type: "uuid", nullable: true),
                    consent_ref_id = table.Column<Guid>(type: "uuid", nullable: true),
                    event_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    resource_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    resource_id = table.Column<Guid>(type: "uuid", nullable: true),
                    outcome = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    metadata_json = table.Column<string>(type: "jsonb", nullable: true),
                    correlation_id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_log", x => x.id);
                    table.ForeignKey(
                        name: "fk_audit_log_consents_consent_ref_id_subject_member_id",
                        columns: x => new { x.consent_ref_id, x.subject_member_id },
                        principalTable: "consents",
                        principalColumns: new[] { "id", "member_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_audit_log_members_subject_member_id",
                        column: x => x.subject_member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_audit_log_users_actor_user_id",
                        column: x => x.actor_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "triage_cases",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    episode_id = table.Column<Guid>(type: "uuid", nullable: false),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    priority = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    context_output_json = table.Column<string>(type: "jsonb", nullable: true),
                    analysis_output_json = table.Column<string>(type: "jsonb", nullable: true),
                    familial_risk_output_json = table.Column<string>(type: "jsonb", nullable: true),
                    draft_advisory_json = table.Column<string>(type: "jsonb", nullable: true),
                    failure_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_triage_cases", x => x.id);
                    table.ForeignKey(
                        name: "fk_triage_cases_episodes_episode_id",
                        column: x => x.episode_id,
                        principalTable: "episodes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_triage_cases_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "hereditary_flags",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    condition_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    finding = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    confidence = table.Column<decimal>(type: "numeric", nullable: false),
                    lab_report_id = table.Column<Guid>(type: "uuid", nullable: true),
                    health_record_id = table.Column<Guid>(type: "uuid", nullable: true),
                    manually_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hereditary_flags", x => x.id);
                    table.CheckConstraint("ck_hereditary_flag_one_evidence", "(lab_report_id IS NOT NULL AND health_record_id IS NULL) OR (lab_report_id IS NULL AND health_record_id IS NOT NULL)");
                    table.ForeignKey(
                        name: "fk_hereditary_flags_health_records_health_record_id_member_id",
                        columns: x => new { x.health_record_id, x.member_id },
                        principalTable: "health_records",
                        principalColumns: new[] { "id", "member_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hereditary_flags_lab_reports_lab_report_id_member_id",
                        columns: x => new { x.lab_report_id, x.member_id },
                        principalTable: "lab_reports",
                        principalColumns: new[] { "id", "member_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hereditary_flags_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lab_report_files",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    lab_report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<byte[]>(type: "bytea", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lab_report_files", x => x.id);
                    table.ForeignKey(
                        name: "fk_lab_report_files_lab_reports_lab_report_id",
                        column: x => x.lab_report_id,
                        principalTable: "lab_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lab_values",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    lab_report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    analyte = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    value = table.Column<decimal>(type: "numeric", nullable: false),
                    unit = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    reference_low = table.Column<decimal>(type: "numeric", nullable: true),
                    reference_high = table.Column<decimal>(type: "numeric", nullable: true),
                    was_manually_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lab_values", x => x.id);
                    table.ForeignKey(
                        name: "fk_lab_values_lab_reports_lab_report_id",
                        column: x => x.lab_report_id,
                        principalTable: "lab_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agent_traces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    triage_case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_number = table.Column<int>(type: "integer", nullable: false),
                    agent = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    input_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    tools_requested_json = table.Column<string>(type: "jsonb", nullable: false),
                    tools_allowed_json = table.Column<string>(type: "jsonb", nullable: false),
                    tools_denied_json = table.Column<string>(type: "jsonb", nullable: false),
                    output_json = table.Column<string>(type: "jsonb", nullable: true),
                    output_schema_valid = table.Column<bool>(type: "boolean", nullable: false),
                    confidence = table.Column<decimal>(type: "numeric", nullable: false),
                    latency_milliseconds = table.Column<long>(type: "bigint", nullable: false),
                    input_tokens = table.Column<int>(type: "integer", nullable: true),
                    output_tokens = table.Column<int>(type: "integer", nullable: true),
                    model_name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    error_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_agent_traces", x => x.id);
                    table.ForeignKey(
                        name: "fk_agent_traces_triage_cases_triage_case_id",
                        column: x => x.triage_case_id,
                        principalTable: "triage_cases",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "approvals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    triage_case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    doctor_notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    final_advisory = table.Column<string>(type: "character varying(6000)", maxLength: 6000, nullable: true),
                    decided_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_approvals", x => x.id);
                    table.ForeignKey(
                        name: "fk_approvals_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_approvals_triage_cases_triage_case_id",
                        column: x => x.triage_case_id,
                        principalTable: "triage_cases",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "case_access_grants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    triage_case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    reason = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_case_access_grants", x => x.id);
                    table.ForeignKey(
                        name: "fk_case_access_grants_doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_case_access_grants_triage_cases_triage_case_id",
                        column: x => x.triage_case_id,
                        principalTable: "triage_cases",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_agent_traces_triage_case_id_step_number",
                table: "agent_traces",
                columns: new[] { "triage_case_id", "step_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_approvals_doctor_id",
                table: "approvals",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "ix_approvals_triage_case_id_decided_at",
                table: "approvals",
                columns: new[] { "triage_case_id", "decided_at" });

            migrationBuilder.CreateIndex(
                name: "ix_audit_log_actor_user_id",
                table: "audit_log",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_audit_log_consent_ref_id_subject_member_id",
                table: "audit_log",
                columns: new[] { "consent_ref_id", "subject_member_id" });

            migrationBuilder.CreateIndex(
                name: "ix_audit_log_event_type_created_at",
                table: "audit_log",
                columns: new[] { "event_type", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_audit_log_subject_member_id_created_at",
                table: "audit_log",
                columns: new[] { "subject_member_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_case_access_grants_doctor_id",
                table: "case_access_grants",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "ix_case_access_grants_expires_at",
                table: "case_access_grants",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_case_access_grants_triage_case_id",
                table: "case_access_grants",
                column: "triage_case_id",
                unique: true,
                filter: "revoked_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_case_access_grants_triage_case_id_doctor_id",
                table: "case_access_grants",
                columns: new[] { "triage_case_id", "doctor_id" });

            migrationBuilder.CreateIndex(
                name: "ix_consents_granted_by_user_id",
                table: "consents",
                column: "granted_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_consents_member_id_category",
                table: "consents",
                columns: new[] { "member_id", "category" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_doctor_verification_log_admin_user_id",
                table: "doctor_verification_log",
                column: "admin_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_doctor_verification_log_doctor_id_created_at",
                table: "doctor_verification_log",
                columns: new[] { "doctor_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_doctors_registration_number_hash",
                table: "doctors",
                column: "registration_number_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_doctors_user_id",
                table: "doctors",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_episodes_member_id_created_at",
                table: "episodes",
                columns: new[] { "member_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_families_created_by_user_id",
                table: "families",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_family_doctor_assignments_doctor_id",
                table: "family_doctor_assignments",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "ix_family_doctor_assignments_family_id_doctor_id",
                table: "family_doctor_assignments",
                columns: new[] { "family_id", "doctor_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_family_invitations_accepted_by_user_id",
                table: "family_invitations",
                column: "accepted_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_family_invitations_family_id",
                table: "family_invitations",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "ix_family_invitations_invited_by_user_id",
                table: "family_invitations",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_family_invitations_token_hash",
                table: "family_invitations",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_health_records_member_id_occurred_on",
                table: "health_records",
                columns: new[] { "member_id", "occurred_on" });

            migrationBuilder.CreateIndex(
                name: "ix_hereditary_flags_health_record_id_member_id",
                table: "hereditary_flags",
                columns: new[] { "health_record_id", "member_id" });

            migrationBuilder.CreateIndex(
                name: "ix_hereditary_flags_lab_report_id_member_id",
                table: "hereditary_flags",
                columns: new[] { "lab_report_id", "member_id" });

            migrationBuilder.CreateIndex(
                name: "ix_hereditary_flags_member_id_condition_code",
                table: "hereditary_flags",
                columns: new[] { "member_id", "condition_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_lab_report_files_lab_report_id",
                table: "lab_report_files",
                column: "lab_report_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_lab_reports_member_id_collected_at",
                table: "lab_reports",
                columns: new[] { "member_id", "collected_at" });

            migrationBuilder.CreateIndex(
                name: "ix_lab_values_lab_report_id_analyte",
                table: "lab_values",
                columns: new[] { "lab_report_id", "analyte" });

            migrationBuilder.CreateIndex(
                name: "ix_members_family_id_display_name",
                table: "members",
                columns: new[] { "family_id", "display_name" });

            migrationBuilder.CreateIndex(
                name: "ix_members_user_id",
                table: "members",
                column: "user_id",
                unique: true,
                filter: "user_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_notification_subscriptions_token_hash",
                table: "notification_subscriptions",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_subscriptions_user_id_is_active",
                table: "notification_subscriptions",
                columns: new[] { "user_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_relationships_member_id_related_member_id",
                table: "relationships",
                columns: new[] { "member_id", "related_member_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_relationships_related_member_id",
                table: "relationships",
                column: "related_member_id");

            migrationBuilder.CreateIndex(
                name: "ix_triage_cases_episode_id",
                table: "triage_cases",
                column: "episode_id");

            migrationBuilder.CreateIndex(
                name: "ix_triage_cases_member_id",
                table: "triage_cases",
                column: "member_id");

            migrationBuilder.CreateIndex(
                name: "ix_triage_cases_status_priority_created_at",
                table: "triage_cases",
                columns: new[] { "status", "priority", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vitals_member_id_vital_type_measured_at",
                table: "vitals",
                columns: new[] { "member_id", "vital_type", "measured_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "agent_traces");

            migrationBuilder.DropTable(
                name: "approvals");

            migrationBuilder.DropTable(
                name: "audit_log");

            migrationBuilder.DropTable(
                name: "case_access_grants");

            migrationBuilder.DropTable(
                name: "data_protection_keys");

            migrationBuilder.DropTable(
                name: "doctor_verification_log");

            migrationBuilder.DropTable(
                name: "family_doctor_assignments");

            migrationBuilder.DropTable(
                name: "family_invitations");

            migrationBuilder.DropTable(
                name: "hereditary_flags");

            migrationBuilder.DropTable(
                name: "lab_report_files");

            migrationBuilder.DropTable(
                name: "lab_values");

            migrationBuilder.DropTable(
                name: "notification_subscriptions");

            migrationBuilder.DropTable(
                name: "relationships");

            migrationBuilder.DropTable(
                name: "vitals");

            migrationBuilder.DropTable(
                name: "consents");

            migrationBuilder.DropTable(
                name: "triage_cases");

            migrationBuilder.DropTable(
                name: "doctors");

            migrationBuilder.DropTable(
                name: "health_records");

            migrationBuilder.DropTable(
                name: "lab_reports");

            migrationBuilder.DropTable(
                name: "episodes");

            migrationBuilder.DropTable(
                name: "members");

            migrationBuilder.DropTable(
                name: "families");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
