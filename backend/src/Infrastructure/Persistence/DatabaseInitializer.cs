// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
using System.Security.Cryptography;
using System.Text;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Records;
using FamilyVeda.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FamilyVeda.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (configuration.GetValue<bool>("Database:MigrateOnStartup")) await dbContext.Database.MigrateAsync(cancellationToken);
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(
                """
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hospital_clinic character varying(200);
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone_number character varying(50);
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS district character varying(60);
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS city character varying(60);
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages character varying(120);
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS accepting_new_families boolean NOT NULL DEFAULT true;
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_modes character varying(60);
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS slot_minutes integer NOT NULL DEFAULT 30;
                ALTER TABLE families ADD COLUMN IF NOT EXISTS family_code character varying(9);
                ALTER TABLE members ADD COLUMN IF NOT EXISTS sex_for_clinical_reference character varying(16) NOT NULL DEFAULT 'NotSpecified';
                ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS shared_with_family_head boolean NOT NULL DEFAULT false;
                ALTER TABLE health_records ADD COLUMN IF NOT EXISTS shared_with_family_head boolean NOT NULL DEFAULT false;
                ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rescheduled_from_starts_at timestamp with time zone;
                ALTER TABLE family_invitations ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
                ALTER TABLE family_invitations ADD COLUMN IF NOT EXISTS invited_email_masked character varying(254);
                ALTER TABLE family_invitations ADD COLUMN IF NOT EXISTS relationship_type character varying(40);

                CREATE TABLE IF NOT EXISTS doctor_license_documents (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    doctor_id uuid NOT NULL,
                    file_name character varying(255) NOT NULL,
                    content_type character varying(64) NOT NULL,
                    size_bytes bigint NOT NULL,
                    content bytea NOT NULL,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_doctor_license_documents PRIMARY KEY (id),
                    CONSTRAINT fk_doctor_license_documents_doctors_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS user_profiles (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    user_id uuid NOT NULL,
                    phone_number character varying(16) NOT NULL,
                    date_of_birth date,
                    sex_for_clinical_reference character varying(16) NOT NULL DEFAULT 'NotSpecified',
                    address_line1 character varying(120),
                    address_line2 character varying(120),
                    city character varying(80),
                    district character varying(40),
                    postal_code character varying(5),
                    national_id_hash character varying(64),
                    national_id_last_four character varying(4),
                    terms_accepted_at timestamp with time zone NOT NULL,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_user_profiles PRIMARY KEY (id),
                    CONSTRAINT fk_user_profiles_users_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS family_head_transfers (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    family_id uuid NOT NULL,
                    from_member_id uuid NOT NULL,
                    to_member_id uuid NOT NULL,
                    requested_by_user_id uuid NOT NULL,
                    status character varying(20) NOT NULL,
                    responded_at timestamp with time zone,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_family_head_transfers PRIMARY KEY (id),
                    CONSTRAINT fk_family_head_transfers_families_family_id FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS family_membership_events (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    family_id uuid NOT NULL,
                    member_id uuid,
                    actor_user_id uuid NOT NULL,
                    event_type character varying(40) NOT NULL,
                    details_json character varying(1000),
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_family_membership_events PRIMARY KEY (id),
                    CONSTRAINT fk_family_membership_events_families_family_id FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS family_join_requests (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    family_id uuid NOT NULL,
                    user_id uuid NOT NULL,
                    relationship_type character varying(40) NOT NULL,
                    message character varying(280),
                    status character varying(20) NOT NULL,
                    responded_at timestamp with time zone,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_family_join_requests PRIMARY KEY (id),
                    CONSTRAINT fk_family_join_requests_families_family_id FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                    CONSTRAINT fk_family_join_requests_users_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS family_doctor_requests (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    family_id uuid NOT NULL,
                    doctor_id uuid NOT NULL,
                    requested_by_user_id uuid NOT NULL,
                    message character varying(280),
                    status character varying(20) NOT NULL,
                    responded_at timestamp with time zone,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_family_doctor_requests PRIMARY KEY (id),
                    CONSTRAINT fk_family_doctor_requests_doctors_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                    CONSTRAINT fk_family_doctor_requests_families_family_id FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS appointments (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    member_id uuid NOT NULL,
                    doctor_id uuid NOT NULL,
                    booked_by_user_id uuid NOT NULL,
                    starts_at timestamp with time zone NOT NULL,
                    duration_minutes integer NOT NULL,
                    reason character varying(200) NOT NULL,
                    status character varying(20) NOT NULL,
                    doctor_note character varying(500),
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_appointments PRIMARY KEY (id),
                    CONSTRAINT fk_appointments_doctors_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                    CONSTRAINT fk_appointments_members_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS doctor_availability (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    doctor_id uuid NOT NULL,
                    day_of_week character varying(12) NOT NULL,
                    start_time time without time zone NOT NULL,
                    end_time time without time zone NOT NULL,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_doctor_availability PRIMARY KEY (id),
                    CONSTRAINT fk_doctor_availability_doctors_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS doctor_unavailable_periods (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    doctor_id uuid NOT NULL,
                    starts_at timestamp with time zone NOT NULL,
                    ends_at timestamp with time zone NOT NULL,
                    reason character varying(120),
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_doctor_unavailable_periods PRIMARY KEY (id),
                    CONSTRAINT fk_doctor_unavailable_periods_doctors_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS visit_access_grants (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    appointment_id uuid NOT NULL,
                    doctor_id uuid NOT NULL,
                    member_id uuid NOT NULL,
                    starts_at timestamp with time zone NOT NULL,
                    expires_at timestamp with time zone NOT NULL,
                    revoked_at timestamp with time zone,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_visit_access_grants PRIMARY KEY (id),
                    CONSTRAINT fk_visit_access_grants_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
                    CONSTRAINT fk_visit_access_grants_doctors_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                    CONSTRAINT fk_visit_access_grants_members_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS clinical_notes (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    doctor_id uuid NOT NULL,
                    family_id uuid NOT NULL,
                    member_id uuid,
                    appointment_id uuid,
                    note_type character varying(20) NOT NULL,
                    content character varying(4000) NOT NULL,
                    version integer NOT NULL DEFAULT 1,
                    amends_note_id uuid,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_clinical_notes PRIMARY KEY (id),
                    CONSTRAINT fk_clinical_notes_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
                    CONSTRAINT fk_clinical_notes_clinical_notes_amends_note_id FOREIGN KEY (amends_note_id) REFERENCES clinical_notes(id) ON DELETE RESTRICT,
                    CONSTRAINT fk_clinical_notes_doctors_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
                    CONSTRAINT fk_clinical_notes_families_family_id FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE RESTRICT,
                    CONSTRAINT fk_clinical_notes_members_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
                );

                CREATE TABLE IF NOT EXISTS notifications (
                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                    user_id uuid NOT NULL,
                    type character varying(60) NOT NULL,
                    title character varying(120) NOT NULL,
                    body character varying(400) NOT NULL,
                    link_path character varying(200),
                    read_at timestamp with time zone,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_notifications PRIMARY KEY (id),
                    CONSTRAINT fk_notifications_users_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """,
                cancellationToken);
        }
        catch { }
        if (!configuration.GetValue<bool>("Seed:Enabled")) return;
        var password = configuration["Seed:DefaultPassword"];
        if (string.IsNullOrWhiteSpace(password) || password.Length < 12)
            throw new InvalidOperationException("Seed:DefaultPassword must contain at least 12 characters when synthetic seed is enabled.");
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<UserAccount>>();
        // ===== S4 — dashboard demo data (DemoDataSeeder, idempotent) =====
        if (await dbContext.Users.AnyAsync(x => x.Email == "demo-head@example.invalid", cancellationToken))
        {
            await DemoDataSeeder.SeedAsync(dbContext, hasher, password, cancellationToken);
            // ===== Phase 1b — synthetic test data, agent/TODO.md "Phase 1b" (ownership waived, DECISIONS 2026-09-28b) =====
            await Phase1bSeeder.SeedAsync(dbContext, hasher, password, cancellationToken);
            await DashboardCoverageSeeder.SeedAsync(dbContext, hasher, password, cancellationToken);
            // ===== end Phase 1b =====
            return;
        }
        // ===== end S4 =====
        UserAccount User(string email, string name, UserType type)
        {
            var user = new UserAccount { Email = email, DisplayName = name, UserType = type, PasswordHash = string.Empty };
            user.PasswordHash = hasher.HashPassword(user, password);
            return user;
        }
        var head = User("demo-head@example.invalid", "Synthetic Family Head", UserType.FamilyUser);
        var adult = User("demo-member@example.invalid", "Synthetic Adult Member", UserType.FamilyUser);
        var doctorUser = User("demo-doctor@example.invalid", "Synthetic Verified Doctor", UserType.Doctor);
        var pendingUser = User("demo-pending@example.invalid", "Synthetic Pending Doctor", UserType.Doctor);
        var admin = User("demo-admin@example.invalid", "Synthetic Clinic Admin", UserType.Admin);
        dbContext.Users.AddRange(head, adult, doctorUser, pendingUser, admin);
        var family = new Family { Name = "Synthetic Demonstration Family", CreatedByUser = head, FamilyCode = "FV-DEMO01" };
        var headMember = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1985, 1, 15), Role = FamilyRole.Head };
        var adultMember = new Member { Family = family, User = adult, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(2000, 6, 10), Role = FamilyRole.AdultMember };
        var minorMember = new Member { Family = family, DisplayName = "Synthetic Minor", DateOfBirth = new DateOnly(2015, 3, 20), Role = FamilyRole.MinorMember };
        var secondMinorMember = new Member { Family = family, DisplayName = "Synthetic Younger Minor", DateOfBirth = new DateOnly(2019, 9, 12), Role = FamilyRole.MinorMember };
        dbContext.Families.Add(family); dbContext.Members.AddRange(headMember, adultMember, minorMember, secondMinorMember);
        foreach (var member in new[] { headMember, adultMember, minorMember, secondMinorMember })
            foreach (var category in Enum.GetValues<ConsentCategory>())
                dbContext.Consents.Add(new Consent { Member = member, Category = category, Status = ConsentStatus.NotSet });
        dbContext.Relationships.AddRange(
            new Relationship { Member = headMember, RelatedMember = minorMember, RelationshipType = "guardian", IsBiological = true },
            new Relationship { Member = minorMember, RelatedMember = headMember, RelationshipType = "parent", IsBiological = true },
            new Relationship { Member = headMember, RelatedMember = secondMinorMember, RelationshipType = "guardian", IsBiological = true },
            new Relationship { Member = secondMinorMember, RelatedMember = headMember, RelationshipType = "parent", IsBiological = true });
        // ===== S2 — Health Records & Extraction =====
        var baselineNote = new HealthRecord { Member = headMember, RecordType = RecordType.Note, Title = "Synthetic baseline note", Summary = "Demonstration data only.", OccurredOn = new DateOnly(2026, 1, 15) };
        var laterNote = new HealthRecord { Member = headMember, RecordType = RecordType.Note, Title = "Synthetic follow-up note", Summary = "Later demonstration row for newest/oldest sort.", OccurredOn = new DateOnly(2026, 7, 1) };
        dbContext.HealthRecords.AddRange(baselineNote, laterNote);
        dbContext.Vitals.AddRange(
            new Vital { Member = headMember, VitalType = "synthetic_metric", Value = 1m, Unit = "demo", MeasuredAt = DateTimeOffset.UtcNow.AddDays(-14) },
            new Vital { Member = headMember, VitalType = "synthetic_metric", Value = 1.2m, Unit = "demo", MeasuredAt = DateTimeOffset.UtcNow.AddDays(-7) },
            new Vital { Member = headMember, VitalType = "synthetic_metric", Value = 1.1m, Unit = "demo", MeasuredAt = DateTimeOffset.UtcNow.AddDays(-1) });
        dbContext.HereditaryFlags.Add(new HereditaryFlag
        {
            Member = headMember,
            HealthRecord = laterNote,
            ConditionCode = "SYNTH-DEMO",
            Finding = "Explicit synthetic screening marker",
            Confidence = 0.6m,
            ManuallyConfirmed = false
        });
        // ===== end S2 =====
        string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        var verifiedDoctor = new Doctor { User = doctorUser, RegistrationNumberHash = Hash("SYNTHETIC-VERIFIED"), RegistrationNumberLastFour = "DEMO", VerificationStatus = VerificationStatus.Verified, Specialty = "Synthetic demonstration", District = "Colombo", City = "Colombo 07", Languages = "English, Sinhala" };
        var pendingDoctor = new Doctor { User = pendingUser, RegistrationNumberHash = Hash("SYNTHETIC-PENDING"), RegistrationNumberLastFour = "TEST", VerificationStatus = VerificationStatus.Pending, Specialty = "Synthetic demonstration" };
        dbContext.Doctors.AddRange(verifiedDoctor, pendingDoctor);
        dbContext.FamilyDoctorAssignments.Add(new FamilyDoctorAssignment { Family = family, Doctor = verifiedDoctor, IsPrimary = true });
        await dbContext.SaveChangesAsync(cancellationToken);
        // ===== S4 — dashboard demo data =====
        await DemoDataSeeder.SeedAsync(dbContext, hasher, password, cancellationToken);
        // ===== end S4 =====
        // ===== Phase 1b — synthetic test data, agent/TODO.md "Phase 1b" (ownership waived, DECISIONS 2026-09-28b) =====
        await Phase1bSeeder.SeedAsync(dbContext, hasher, password, cancellationToken);
        await DashboardCoverageSeeder.SeedAsync(dbContext, hasher, password, cancellationToken);
        // ===== end Phase 1b =====
    }
}
