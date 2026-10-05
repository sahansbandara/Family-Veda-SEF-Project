// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559) — whole-project waiver, DECISIONS 2026-09-28b
// Synthetic demonstration data for the three portal dashboards (RULE 7: synthetic only, example.invalid mail).
// Idempotent: runs once per database, keyed on the sentinel account below. Gated by Seed:Enabled like the base seed.
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Records;
using FamilyVeda.Domain.Triage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Persistence;

public static class DemoDataSeeder
{
    public const string SentinelEmail = "demo-tharushi@example.invalid";

    // Advisory wording stays inside blueprint §7: no diagnosis, no drug, no dosing, defers to in-person care.
    private const string SafeGuidance =
        "Rest, keep drinking fluids and watch how you feel over the next two days. " +
        "If symptoms get worse or new symptoms appear, arrange an in-person visit with your family doctor. " +
        "For any emergency call 1990.";

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher<UserAccount> hasher, string password, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(x => x.Email == SentinelEmail, ct)) return;

        var headUser = await db.Users.SingleOrDefaultAsync(x => x.Email == "demo-head@example.invalid", ct);
        var doctorUser = await db.Users.SingleOrDefaultAsync(x => x.Email == "demo-doctor@example.invalid", ct);
        if (headUser is null || doctorUser is null) return; // base seed has not run on this database

        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);

        UserAccount NewUser(string email, string name, UserType type)
        {
            var user = new UserAccount { Email = email, DisplayName = name, UserType = type, PasswordHash = string.Empty };
            user.PasswordHash = hasher.HashPassword(user, password);
            db.Users.Add(user);
            return user;
        }

        Member NewMember(Family family, UserAccount? user, string name, DateOnly dob, FamilyRole role)
        {
            var member = new Member { Family = family, User = user, DisplayName = name, DateOfBirth = dob, Role = role };
            db.Members.Add(member);
            foreach (var category in Enum.GetValues<ConsentCategory>())
                db.Consents.Add(new Consent { Member = member, Category = category, Status = ConsentStatus.Granted });
            return member;
        }

        // ---- Perera family: rename the base demo family to match the mockups ----
        var family = await db.Families.Include(x => x.Members).SingleAsync(x => x.CreatedByUserId == headUser.Id, ct);
        family.Name = "Perera Family";
        headUser.DisplayName = "Nimal Perera";
        var nimal = family.Members.Single(x => x.Role == FamilyRole.Head);
        nimal.DisplayName = "Nimal Perera";
        var amaya = family.Members.Single(x => x.Role == FamilyRole.AdultMember);
        amaya.DisplayName = "Amaya Perera";
        var adultUser = await db.Users.SingleAsync(x => x.Id == amaya.UserId, ct);
        adultUser.DisplayName = "Amaya Perera";
        var minors = family.Members.Where(x => x.Role == FamilyRole.MinorMember).OrderBy(x => x.DateOfBirth).ToList();
        var kasun = minors[0];
        kasun.DisplayName = "Kasun Perera";
        if (minors.Count > 1) minors[1].DisplayName = "Sanduni Perera";
        var tharushiUser = NewUser(SentinelEmail, "Tharushi Perera", UserType.FamilyUser);
        var tharushi = NewMember(family, tharushiUser, "Tharushi Perera", new DateOnly(1998, 4, 2), FamilyRole.AdultMember);
        foreach (var consent in await db.Consents.Where(x => x.MemberId == nimal.Id || x.MemberId == amaya.Id || x.MemberId == kasun.Id).ToListAsync(ct))
            consent.Status = ConsentStatus.Granted;

        // ---- Doctors ----
        var doctor = await db.Doctors.SingleAsync(x => x.UserId == doctorUser.Id, ct);
        doctorUser.DisplayName = "Dr. Synthetic Perera";
        doctor.Specialty = "General Practice";
        doctor.HospitalClinic = "Family Care Demo Clinic";
        doctor.District = "Gampaha";
        doctor.City = "Negombo";
        doctor.Languages = "Sinhala, English";
        string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        db.Doctors.AddRange(
            new Doctor { User = NewUser("demo-doctor-silva@example.invalid", "Dr. Synthetic Silva", UserType.Doctor), RegistrationNumberHash = Hash("SYNTHETIC-SILVA"), RegistrationNumberLastFour = "0002", VerificationStatus = VerificationStatus.Verified, Specialty = "Family Medicine", HospitalClinic = "Hillside Demo Clinic", District = "Kandy", City = "Kandy", Languages = "Tamil, English" },
            new Doctor { User = NewUser("demo-doctor-fernando@example.invalid", "Dr. Synthetic Fernando", UserType.Doctor), RegistrationNumberHash = Hash("SYNTHETIC-FERNANDO"), RegistrationNumberLastFour = "0003", VerificationStatus = VerificationStatus.Verified, Specialty = "General Practice", HospitalClinic = "Coastal Demo Clinic", District = "Galle", City = "Galle", Languages = "Sinhala, English" },
            new Doctor { User = NewUser("demo-doctor-suspended@example.invalid", "Dr. Synthetic Suspended", UserType.Doctor), RegistrationNumberHash = Hash("SYNTHETIC-SUSPENDED"), RegistrationNumberLastFour = "0004", VerificationStatus = VerificationStatus.Suspended, Specialty = "General Practice", District = "Colombo", City = "Colombo 05", Languages = "English" });
        var assignment = await db.FamilyDoctorAssignments.FirstOrDefaultAsync(x => x.FamilyId == family.Id && x.DoctorId == doctor.Id, ct);
        if (assignment is not null) assignment.CreatedAt = now.AddDays(-4);

        // ---- Other families assigned to the demo doctor ----
        var silvaHead = NewUser("demo-silva@example.invalid", "Ruvini Silva", UserType.FamilyUser);
        var silva = new Family { Name = "Silva Family", CreatedByUser = silvaHead, FamilyCode = "FV-SLV001" };
        db.Families.Add(silva);
        var ruvini = NewMember(silva, silvaHead, "Ruvini Silva", new DateOnly(1982, 2, 11), FamilyRole.Head);
        var amayaSilva = NewMember(silva, null, "Amaya Silva", new DateOnly(2012, 8, 3), FamilyRole.MinorMember);
        NewMember(silva, null, "Dilan Silva", new DateOnly(2016, 1, 19), FamilyRole.MinorMember);

        var fernandoHead = NewUser("demo-fernando@example.invalid", "Chaminda Fernando", UserType.FamilyUser);
        var fernando = new Family { Name = "Fernando Family", CreatedByUser = fernandoHead, FamilyCode = "FV-FRN001" };
        db.Families.Add(fernando);
        NewMember(fernando, fernandoHead, "Chaminda Fernando", new DateOnly(1979, 6, 5), FamilyRole.Head);
        var kasunFernando = NewMember(fernando, null, "Kasun Fernando", new DateOnly(2011, 3, 14), FamilyRole.MinorMember);
        NewMember(fernando, null, "Nadeesha Fernando", new DateOnly(2014, 9, 22), FamilyRole.MinorMember);
        NewMember(fernando, null, "Isuru Fernando", new DateOnly(2017, 12, 1), FamilyRole.MinorMember);
        NewMember(fernando, null, "Hiruni Fernando", new DateOnly(2020, 5, 30), FamilyRole.MinorMember);

        db.FamilyDoctorAssignments.AddRange(
            new FamilyDoctorAssignment { Family = silva, Doctor = doctor, IsPrimary = true, CreatedAt = now.AddDays(-60), UpdatedAt = now.AddDays(-60) },
            new FamilyDoctorAssignment { Family = fernando, Doctor = doctor, IsPrimary = true, CreatedAt = now.AddDays(-45), UpdatedAt = now.AddDays(-45) });

        // ---- Pending family-doctor request (doctor dashboard "Family Requests") ----
        var wijeHead = NewUser("demo-wijesinghe@example.invalid", "Saman Wijesinghe", UserType.FamilyUser);
        var wije = new Family { Name = "Wijesinghe Family", CreatedByUser = wijeHead, FamilyCode = "FV-WJS001" };
        db.Families.Add(wije);
        NewMember(wije, wijeHead, "Saman Wijesinghe", new DateOnly(1976, 10, 9), FamilyRole.Head);
        NewMember(wije, null, "Nethmi Wijesinghe", new DateOnly(2010, 7, 7), FamilyRole.MinorMember);
        NewMember(wije, null, "Pasan Wijesinghe", new DateOnly(2013, 11, 2), FamilyRole.MinorMember);
        NewMember(wije, null, "Senuri Wijesinghe", new DateOnly(2018, 4, 25), FamilyRole.MinorMember);
        db.FamilyDoctorRequests.Add(new FamilyDoctorRequest { Family = wije, DoctorId = doctor.Id, RequestedByUserId = wijeHead.Id, Message = "Looking for a long-term family doctor near Negombo." });

        // ---- Pending join requests to the Perera family (adults without a family) ----
        db.FamilyJoinRequests.AddRange(
            new FamilyJoinRequest { FamilyId = family.Id, RequestingUser = NewUser("demo-ruwan@example.invalid", "Ruwan Perera", UserType.FamilyUser), RelationshipType = "Son", Message = "Joining the family account." },
            new FamilyJoinRequest { FamilyId = family.Id, RequestingUser = NewUser("demo-shalini@example.invalid", "Shalini Perera", UserType.FamilyUser), RelationshipType = "Sister" });

        // ---- Appointments (today's schedule, upcoming, history) ----
        Appointment Appt(Member member, DateTimeOffset startsAt, string reason, AppointmentStatus status, UserAccount bookedBy)
        {
            var appointment = new Appointment { Member = member, DoctorId = doctor.Id, BookedByUserId = bookedBy.Id, StartsAt = startsAt, Reason = reason, Status = status, UpdatedAt = startsAt < now ? startsAt : now.AddMinutes(-30) };
            db.Appointments.Add(appointment);
            return appointment;
        }
        Appt(nimal, today.AddHours(9), "Follow-up", AppointmentStatus.Completed, headUser);
        Appt(amayaSilva, today.AddHours(10).AddMinutes(30), "Lab review", AppointmentStatus.Confirmed, silvaHead);
        Appt(kasunFernando, today.AddHours(14), "Consultation", AppointmentStatus.Requested, fernandoHead);
        Appt(nimal, today.AddDays(4).AddHours(10).AddMinutes(30), "Follow-up", AppointmentStatus.Confirmed, headUser);
        Appt(kasun, today.AddDays(7).AddHours(9), "Review", AppointmentStatus.Requested, headUser);
        Appt(amaya, today.AddDays(4).AddHours(15), "Personal consultation", AppointmentStatus.Confirmed, adultUser);
        Appt(amaya, today.AddDays(20).AddHours(9).AddMinutes(30), "Follow-up", AppointmentStatus.Requested, adultUser);
        Appt(nimal, today.AddDays(-16).AddHours(9), "Follow-up", AppointmentStatus.Completed, headUser);
        Appt(ruvini, today.AddDays(-38).AddHours(11), "Annual review", AppointmentStatus.Completed, silvaHead);
        Appt(kasunFernando, today.AddDays(-25).AddHours(15), "Consultation", AppointmentStatus.Completed, fernandoHead);

        // ---- Lab reports: range status is computed by LabRangeClassifier at read time ----
        LabReport Lab(Member member, string file, int daysAgo, OcrStatus status, bool confirmed, params (string Analyte, decimal Value, string Unit, decimal? Low, decimal? High)[] values)
        {
            var report = new LabReport { Member = member, OriginalFileName = file, StoredFileName = $"synthetic-{Guid.NewGuid():N}.jpg", ContentType = "image/jpeg", SizeBytes = 0, OcrStatus = status, CollectedAt = now.AddDays(-daysAgo), CreatedAt = now.AddDays(-daysAgo), UpdatedAt = now.AddDays(-daysAgo) };
            foreach (var v in values)
                report.Values.Add(new LabValue { Analyte = v.Analyte, Value = v.Value, Unit = v.Unit, ReferenceLow = v.Low, ReferenceHigh = v.High, WasManuallyConfirmed = confirmed });
            db.LabReports.Add(report);
            return report;
        }
        (string, decimal, string, decimal?, decimal?)[] Cbc(decimal hb) =>
            [("Hemoglobin", hb, "g/dL", 12.0m, 15.0m), ("WBC", 7.1m, "x10^9/L", 4.0m, 11.0m), ("Platelets", 245m, "x10^9/L", 150m, 450m)];
        Lab(amaya, "CBC_amaya.jpg", 2, OcrStatus.Completed, true, Cbc(11.2m));
        Lab(amaya, "Lipid_amaya.jpg", 45, OcrStatus.Completed, true, ("Total cholesterol", 182m, "mg/dL", 125m, 200m), ("HDL", 52m, "mg/dL", 40m, 60m));
        Lab(nimal, "CBC_2609.jpg", 2, OcrStatus.Completed, true, Cbc(11.4m));
        Lab(nimal, "FBS_nimal.jpg", 60, OcrStatus.Completed, true, ("Fasting glucose", 104m, "mg/dL", 70m, 100m));
        Lab(kasun, "CBC_kasun.jpg", 5, OcrStatus.ManualEntry, false, ("Hemoglobin", 12.6m, "g/dL", 11.5m, 15.5m), ("WBC", 8.3m, "x10^9/L", null, null));
        Lab(tharushi, "Lipid_tharushi.jpg", 2, OcrStatus.Completed, true, ("Total cholesterol", 176m, "mg/dL", 125m, 200m));

        // ---- Vitals: six months of blood pressure and weight ----
        for (var month = 6; month >= 0; month--)
        {
            var at = now.AddDays(-30 * month - 3);
            db.Vitals.AddRange(
                new Vital { Member = nimal, VitalType = "blood_pressure_systolic", Value = 128 + month, Unit = "mmHg", MeasuredAt = at },
                new Vital { Member = nimal, VitalType = "blood_pressure_diastolic", Value = 82 + month % 3, Unit = "mmHg", MeasuredAt = at },
                new Vital { Member = nimal, VitalType = "weight", Value = 74.5m + month * 0.3m, Unit = "kg", MeasuredAt = at },
                new Vital { Member = amaya, VitalType = "blood_pressure_systolic", Value = 116 + month % 4, Unit = "mmHg", MeasuredAt = at },
                new Vital { Member = kasun, VitalType = "weight", Value = 38m - month * 0.4m, Unit = "kg", MeasuredAt = at });
        }

        // ---- Triage cases in different approval states ----
        TriageCase Case(Member member, string[] symptoms, TriagePriority priority, TriageStatus status, int hoursAgo, bool grant)
        {
            var episode = new Episode { Member = member, SymptomsJson = JsonSerializer.Serialize(symptoms), DurationDays = 2, Severity = priority == TriagePriority.Priority ? 7 : 4, CreatedAt = now.AddHours(-hoursAgo) };
            var draft = JsonSerializer.Serialize(new
            {
                forDoctorReviewOnly = true,
                context = "{\"summary\":\"Synthetic demonstration context\"}",
                analysis = "{\"summary\":\"Symptoms recorded for doctor review. No diagnosis is made.\"}",
                familialRisk = "{\"screeningIndication\":\"none\"}"
            });
            var triageCase = new TriageCase { Episode = episode, Member = member, Priority = priority, Status = status, SubmittedAt = now.AddHours(-hoursAgo), CreatedAt = now.AddHours(-hoursAgo), UpdatedAt = now.AddHours(-hoursAgo / 2.0), DraftAdvisoryJson = draft };
            db.Episodes.Add(episode);
            db.TriageCases.Add(triageCase);
            var step = 1;
            foreach (var agent in new[] { AgentKind.Coordinator, AgentKind.Context, AgentKind.Analysis, AgentKind.FamilialRisk, AgentKind.SafetyValidation })
                db.AgentTraces.Add(new AgentTrace { TriageCase = triageCase, StepNumber = step++, Agent = agent, Status = AgentStepStatus.Completed, InputHash = "SYNTHETIC", ToolsRequestedJson = "[]", ToolsAllowedJson = "[]", ToolsDeniedJson = "[]", OutputSchemaValid = true, Confidence = 0.82m, LatencyMilliseconds = 400 + step * 90, ModelName = "synthetic-demo" });
            if (grant)
                db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCase = triageCase, DoctorId = doctor.Id, ExpiresAt = now.AddDays(7), Reason = "PRIMARY_DOCTOR_ASSIGNMENT" });
            return triageCase;
        }
        Case(amaya, ["Fatigue", "Mild headache"], TriagePriority.Routine, TriageStatus.PendingDoctorReview, 20, true);
        Case(ruvini, ["Persistent cough", "Mild fever"], TriagePriority.Priority, TriageStatus.PendingDoctorReview, 3, true);
        Case(kasunFernando, ["Sore throat"], TriagePriority.Routine, TriageStatus.Claimed, 30, true);
        var approved = Case(kasun, ["Runny nose", "Mild cough"], TriagePriority.Routine, TriageStatus.Approved, 150, true);
        approved.CompletedAt = now.AddDays(-6);
        approved.UpdatedAt = now.AddDays(-6);
        db.Approvals.Add(new Approval { TriageCase = approved, DoctorId = doctor.Id, Action = ApprovalAction.Approve, DoctorNotes = "Synthetic demonstration approval.", FinalAdvisory = SafeGuidance, DecidedAt = now.AddDays(-6) });
        var amayaApproved = Case(amaya, ["Sneezing"], TriagePriority.Routine, TriageStatus.Approved, 200, true);
        amayaApproved.CompletedAt = now.AddDays(-8);
        amayaApproved.UpdatedAt = now.AddDays(-8);
        db.Approvals.Add(new Approval { TriageCase = amayaApproved, DoctorId = doctor.Id, Action = ApprovalAction.Approve, DoctorNotes = "Synthetic demonstration approval.", FinalAdvisory = SafeGuidance, DecidedAt = now.AddDays(-8) });

        // ---- Activity feed rows and notifications ----
        db.AuditLogs.AddRange(
            new AuditLog { ActorUserId = headUser.Id, SubjectMemberId = kasun.Id, EventType = "CASE_STATUS_CHANGED", ResourceType = "TriageCase", ResourceId = approved.Id, Outcome = "Approved", CreatedAt = now.AddDays(-6), UpdatedAt = now.AddDays(-6) },
            new AuditLog { ActorUserId = headUser.Id, SubjectMemberId = nimal.Id, EventType = "LAB_REPORT_MANUAL_REVIEW", ResourceType = "LabReport", Outcome = "Confirmed", CreatedAt = now.AddDays(-2), UpdatedAt = now.AddDays(-2) },
            new AuditLog { ActorUserId = headUser.Id, EventType = "FAMILY_DOCTOR_REQUESTED", ResourceType = "FamilyDoctorRequest", Outcome = "Accepted", CreatedAt = now.AddDays(-4), UpdatedAt = now.AddDays(-4) },
            new AuditLog { ActorUserId = adultUser.Id, SubjectMemberId = amaya.Id, EventType = "LAB_REPORT_MANUAL_REVIEW", ResourceType = "LabReport", Outcome = "Confirmed", CreatedAt = now.AddDays(-2), UpdatedAt = now.AddDays(-2) });
        db.PortalNotifications.AddRange(
            new PortalNotification { UserId = headUser.Id, Type = "JOIN_REQUEST", Title = "New join request", Body = "Ruwan Perera asked to join Perera Family.", LinkPath = "/join-family" },
            new PortalNotification { UserId = headUser.Id, Type = "JOIN_REQUEST", Title = "New join request", Body = "Shalini Perera asked to join Perera Family.", LinkPath = "/join-family" },
            new PortalNotification { UserId = headUser.Id, Type = "GUIDANCE_AVAILABLE", Title = "Guidance available", Body = "Doctor-approved guidance is ready for Kasun.", LinkPath = "/triage" },
            new PortalNotification { UserId = adultUser.Id, Type = "APPOINTMENT_CONFIRMED", Title = "Appointment confirmed", Body = "Your appointment with Dr. Synthetic Perera is confirmed.", LinkPath = "/appointments" },
            new PortalNotification { UserId = adultUser.Id, Type = "GUIDANCE_AVAILABLE", Title = "Guidance available", Body = "Doctor-approved guidance is ready.", LinkPath = "/triage" },
            new PortalNotification { UserId = doctorUser.Id, Type = "FAMILY_DOCTOR_REQUEST", Title = "New family request", Body = "Wijesinghe Family requested you as their family doctor.", LinkPath = "/families" });

        // SaveChanges stamps CreatedAt/UpdatedAt with "now"; capture the intended demo timestamps first.
        var stamps = db.ChangeTracker.Entries<Entity>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
            .Select(e => (e.Entity, e.Entity.CreatedAt, e.Entity.UpdatedAt))
            .Where(x => x.CreatedAt < now.AddMinutes(-1) || x.UpdatedAt < now.AddMinutes(-1))
            .ToList();
        await db.SaveChangesAsync(ct);
        await RestoreTimestampsAsync(db, stamps, ct);
    }

    private static async Task RestoreTimestampsAsync(AppDbContext db, List<(Entity Entity, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)> stamps, CancellationToken ct)
    {
        foreach (var (entity, created, updated) in stamps)
        {
            var id = entity.Id;
            // Rows given only a past UpdatedAt keep it; rows given a past CreatedAt never show an earlier UpdatedAt.
            var updatedAt = updated;
            switch (entity)
            {
                case Appointment:
                    await db.Appointments.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.UpdatedAt, updatedAt), ct); break;
                case AuditLog:
                    await db.AuditLogs.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, created).SetProperty(p => p.UpdatedAt, updatedAt), ct); break;
                case TriageCase:
                    await db.TriageCases.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, created).SetProperty(p => p.UpdatedAt, updatedAt), ct); break;
                case Episode:
                    await db.Episodes.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, created), ct); break;
                case LabReport:
                    await db.LabReports.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, created).SetProperty(p => p.UpdatedAt, updatedAt), ct); break;
                case FamilyDoctorAssignment:
                    await db.FamilyDoctorAssignments.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, created), ct); break;
            }
        }
    }
}
