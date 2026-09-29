using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyVeda.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class _20260929_S1_FamilyLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_family_invitations_family_id",
                table: "family_invitations");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "cancelled_at",
                table: "family_invitations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invited_email_masked",
                table: "family_invitations",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "relationship_type",
                table: "family_invitations",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "family_head_transfers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    to_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    responded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_family_head_transfers", x => x.id);
                    table.ForeignKey(
                        name: "fk_family_head_transfers_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "family_membership_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    to_family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    previous_role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_family_membership_events", x => x.id);
                    table.ForeignKey(
                        name: "fk_family_membership_events_members_member_id",
                        column: x => x.member_id,
                        principalTable: "members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_family_invitations_family_id_created_at",
                table: "family_invitations",
                columns: new[] { "family_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_family_head_transfers_family_id_status",
                table: "family_head_transfers",
                columns: new[] { "family_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_family_head_transfers_to_member_id_status",
                table: "family_head_transfers",
                columns: new[] { "to_member_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_family_membership_events_from_family_id",
                table: "family_membership_events",
                column: "from_family_id");

            migrationBuilder.CreateIndex(
                name: "ix_family_membership_events_member_id",
                table: "family_membership_events",
                column: "member_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "family_head_transfers");

            migrationBuilder.DropTable(
                name: "family_membership_events");

            migrationBuilder.DropIndex(
                name: "ix_family_invitations_family_id_created_at",
                table: "family_invitations");

            migrationBuilder.DropColumn(
                name: "cancelled_at",
                table: "family_invitations");

            migrationBuilder.DropColumn(
                name: "invited_email_masked",
                table: "family_invitations");

            migrationBuilder.DropColumn(
                name: "relationship_type",
                table: "family_invitations");

            migrationBuilder.CreateIndex(
                name: "ix_family_invitations_family_id",
                table: "family_invitations",
                column: "family_id");
        }
    }
}
