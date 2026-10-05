// Dashboard coverage seed — fills every dashboard widget (Head, Adult, Doctor, Admin) with varied states for testing.
// Ownership waived for whole-project completion, DECISIONS 2026-09-28b.
// RULE 7: synthetic only, @example.invalid mail. RULE 6: no drug names, no dosing (no Medication records).
// RULE 5: family history yields a screening indication only. RULE 10: emergency case ends FailedSafe with a referral.
// Additive: runs after DemoDataSeeder and Phase1bSeeder. Idempotent via SentinelEmail.
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

namespace FamilyVeda.Infrastructure.Persistence.Seed;

public static class DashboardCoverageSeeder
{
    public const string SentinelEmail = "coverage-deactivated@example.invalid";

    private const string SafeGuidance =
        "Keep resting and drinking fluids, and note any change over the next two days. " +
        "Arrange an in-person visit with your family doctor if anything worsens. For any emergency call 1990.";

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher<UserAccount> hasher, string password, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(x => x.Email == SentinelEmail, ct)) return;
        var headUser = await db.Users.SingleOrDefaultAsync(x => x.Email == "demo-head@example.invalid", ct);
        var adultUser = await db.Users.SingleOrDefaultAsync(x => x.Email == "demo-member@example.invalid", ct);
        var doctorUser = await db.Users.SingleOrDefaultAsync(x => x.Email == "demo-doctor@example.invalid", ct);
        var adminUser = await db.Users.SingleOrDefaultAsync(x => x.Email == "demo-admin@example.invalid", ct);
        if (headUser is null || adultUser is null || doctorUser is null || adminUser is null) return;
        if (!await db.Users.AnyAsync(x => x.Email == DemoDataSeeder.SentinelEmail, ct)) return;

        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var stamps = new List<(Entity Entity, DateTimeOffset At)>();
        T At<T>(T entity, DateTimeOffset at) where T : Entity { stamps.Add((entity, at)); return entity; }

        UserAccount NewUser(string email, string name, UserType type, bool active = true)
        {
            var user = new UserAccount { Email = email, DisplayName = name, UserType = type, PasswordHash = string.Empty, IsActive = active };
            user.PasswordHash = hasher.HashPassword(user, password);
            db.Users.Add(user);
            return user;
        }

        var family = await db.Families.Include(x => x.Members).SingleAsync(x => x.CreatedByUserId == headUser.Id, ct);
        Member M(string name) => family.Members.Single(x => x.DisplayName == name);
        var nimal = M("Nimal Perera");
        var amaya = M("Amaya Perera");
        var tharushi = M("Tharushi Perera");
        var kasun = M("Kasun Perera");
        var sanduni = family.Members.FirstOrDefault(x => x.DisplayName == "Sanduni Perera") ?? kasun;
        var tharushiUserId = tharushi.UserId!.Value;
        var doctor = await db.Doctors.SingleAsync(x => x.UserId == doctorUser.Id, ct);
        var otherMembers = await db.Members.Include(x => x.Family)
            .Where(x => x.DisplayName == "Dilan Silva" || x.DisplayName == "Nadeesha Fernando" || x.DisplayName == "Isuru Fernando"
                        || x.DisplayName == "Chaminda Fernando" || x.DisplayName == "Hiruni Fernando")
            .ToDictionaryAsync(x => x.DisplayName, ct);

        // ================= Health records: every non-drug record type, private and shared =================
        HealthRecord Record(Member member, RecordType type, string title, string summary, DateOnly on, bool shared = false)
        {
            var record = new HealthRecord { Member = member, RecordType = type, Title = title, Summary = summary, OccurredOn = on, SharedWithFamilyHead = shared };
            db.HealthRecords.Add(record);
            return record;
        }
        Record(nimal, RecordType.Condition, "Synthetic raised blood pressure readings", "Home readings logged for doctor review.", new DateOnly(2024, 2, 10));
        Record(nimal, RecordType.Allergy, "Synthetic dust allergy", "Sneezing in dusty rooms. Demonstration record.", new DateOnly(2019, 5, 1));
        Record(nimal, RecordType.Surgery, "Synthetic knee arthroscopy", "Past procedure, recovered. Demonstration record.", new DateOnly(2017, 8, 22));
        Record(kasun, RecordType.Allergy, "Synthetic pollen allergy", "Seasonal symptoms in spring. Demonstration record.", new DateOnly(2023, 3, 14));
        Record(kasun, RecordType.Note, "Synthetic school sports clearance note", "Guardian-recorded note.", new DateOnly(2026, 1, 20));
        Record(sanduni, RecordType.Condition, "Synthetic childhood eczema history", "Demonstration condition record.", new DateOnly(2022, 6, 2));
        var amayaShared = Record(amaya, RecordType.Allergy, "Synthetic shellfish sensitivity", "Shared with the family head.", new DateOnly(2021, 4, 9), shared: true);
        Record(amaya, RecordType.Condition, "Synthetic migraine history", "Private to Amaya.", new DateOnly(2022, 10, 3));
        Record(amaya, RecordType.Surgery, "Synthetic appendectomy", "Past procedure. Private to Amaya.", new DateOnly(2015, 12, 11));
        Record(amaya, RecordType.Note, "Synthetic travel health note", "Private to Amaya.", new DateOnly(2026, 6, 18));
        var tharushiShared = Record(tharushi, RecordType.Condition, "Synthetic low iron history", "Shared with the family head.", new DateOnly(2025, 9, 1), shared: true);

        // Share Amaya's lipid report with the head; Tharushi's lipid report too (adult privacy opt-in).
        var amayaLipid = await db.LabReports.SingleAsync(x => x.MemberId == amaya.Id && x.OriginalFileName == "Lipid_amaya.jpg", ct);
        amayaLipid.SharedWithFamilyHead = true;
        var tharushiLipid = await db.LabReports.SingleAsync(x => x.MemberId == tharushi.Id && x.OriginalFileName == "Lipid_tharushi.jpg", ct);
        tharushiLipid.SharedWithFamilyHead = true;

        // Extra lab reports: pending OCR, failed OCR, above range for the adult, a thyroid panel for Kasun.
        LabReport Lab(Member member, string file, int daysAgo, OcrStatus status, params (string Analyte, decimal Value, string Unit, decimal? Low, decimal? High)[] values)
        {
            var report = new LabReport { Member = member, OriginalFileName = file, StoredFileName = $"coverage-{Guid.NewGuid():N}.jpg", ContentType = "image/jpeg", SizeBytes = 0, OcrStatus = status, CollectedAt = now.AddDays(-daysAgo) };
            foreach (var v in values)
                report.Values.Add(new LabValue { Analyte = v.Analyte, Value = v.Value, Unit = v.Unit, ReferenceLow = v.Low, ReferenceHigh = v.High, WasManuallyConfirmed = status == OcrStatus.Completed });
            db.LabReports.Add(report);
            return At(report, now.AddDays(-daysAgo));
        }
        Lab(amaya, "Glucose_amaya.jpg", 20, OcrStatus.Completed, ("Fasting glucose", 108m, "mg/dL", 70m, 100m));
        Lab(amaya, "Thyroid_amaya_pending.jpg", 0, OcrStatus.Pending);
        Lab(nimal, "Renal_nimal_failed.jpg", 12, OcrStatus.Failed);
        Lab(kasun, "Thyroid_kasun.jpg", 30, OcrStatus.Completed, ("TSH", 2.1m, "mIU/L", 0.5m, 4.5m), ("Free T4", 1.2m, "ng/dL", 0.8m, 1.8m));

        // Vitals for the adult and the second adult so each "latest vital" card has data.
        for (var month = 6; month >= 0; month--)
        {
            var at = now.AddDays(-30 * month - 1);
            db.Vitals.AddRange(
                new Vital { Member = amaya, VitalType = "weight", Value = 61m + month * 0.2m, Unit = "kg", MeasuredAt = at },
                new Vital { Member = amaya, VitalType = "heart_rate", Value = 72 + month % 3, Unit = "bpm", MeasuredAt = at },
                new Vital { Member = tharushi, VitalType = "blood_pressure_systolic", Value = 112 + month % 4, Unit = "mmHg", MeasuredAt = at },
                new Vital { Member = nimal, VitalType = "heart_rate", Value = 76 + month % 4, Unit = "bpm", MeasuredAt = at });
        }

        // ================= Appointments: cancelled / no-show today, and history for the adult =================
        Appointment Appt(Member member, DateTimeOffset startsAt, string reason, AppointmentStatus status, Guid bookedBy, string? note = null)
        {
            var a = new Appointment { Member = member, DoctorId = doctor.Id, BookedByUserId = bookedBy, StartsAt = startsAt, Reason = reason, Status = status, DoctorNote = note };
            db.Appointments.Add(a);
            return a;
        }
        var chaminda = otherMembers["Chaminda Fernando"];
        var todayCancelled = Appt(otherMembers["Dilan Silva"], today.AddHours(11).AddMinutes(30), "Check-up", AppointmentStatus.Cancelled, chaminda.UserId ?? headUser.Id);
        var todayNoShow = Appt(otherMembers["Nadeesha Fernando"], today.AddHours(8), "Review", AppointmentStatus.NoShow, chaminda.UserId ?? headUser.Id);
        Appt(otherMembers["Isuru Fernando"], today.AddHours(16), "Consultation", AppointmentStatus.Confirmed, chaminda.UserId ?? headUser.Id);
        Appt(otherMembers["Hiruni Fernando"], today.AddDays(2).AddHours(10), "Vaccination record review", AppointmentStatus.Requested, chaminda.UserId ?? headUser.Id);
        var amayaCancelled = Appt(amaya, today.AddDays(-12).AddHours(14), "Personal consultation", AppointmentStatus.Cancelled, adultUser.Id);
        var amayaCompleted = Appt(amaya, today.AddDays(-30).AddHours(10), "Annual review", AppointmentStatus.Completed, adultUser.Id, "Synthetic visit note. Routine follow-up in six months.");
        var sanduniNext = Appt(sanduni, today.AddDays(9).AddHours(8).AddMinutes(30), "Growth review", AppointmentStatus.Confirmed, headUser.Id);
        Appt(tharushi, today.AddDays(6).AddHours(17), "Personal consultation", AppointmentStatus.Requested, tharushiUserId);

        // ================= Triage cases: every status the dashboards count, granted to the demo doctor =================
        TriageCase Case(Member member, string[] symptoms, TriagePriority priority, TriageStatus status, int hoursAgo, bool grant = true)
        {
            var episode = new Episode { Member = member, SymptomsJson = JsonSerializer.Serialize(symptoms), DurationDays = 2, Severity = priority switch { TriagePriority.Emergency => 9, TriagePriority.Priority => 6, _ => 3 } };
            var draft = JsonSerializer.Serialize(new { forDoctorReviewOnly = true, summary = "Synthetic demonstration draft. No diagnosis is made." });
            var c = new TriageCase { Episode = episode, Member = member, Priority = priority, Status = status, SubmittedAt = now.AddHours(-hoursAgo), DraftAdvisoryJson = draft };
            db.Episodes.Add(At(episode, now.AddHours(-hoursAgo)));
            db.TriageCases.Add(At(c, now.AddHours(-hoursAgo)));
            var step = 1;
            foreach (var agent in new[] { AgentKind.Coordinator, AgentKind.Context, AgentKind.Analysis, AgentKind.FamilialRisk, AgentKind.SafetyValidation })
                db.AgentTraces.Add(new AgentTrace { TriageCase = c, StepNumber = step++, Agent = agent, Status = AgentStepStatus.Completed, InputHash = "SYNTHETIC", ToolsRequestedJson = "[]", ToolsAllowedJson = "[]", ToolsDeniedJson = "[]", OutputSchemaValid = true, Confidence = status == TriageStatus.LowConfidence ? 0.41m : 0.8m, LatencyMilliseconds = 380 + step * 85, ModelName = "synthetic-demo" });
            if (grant)
                db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCase = c, DoctorId = doctor.Id, ExpiresAt = now.AddDays(7), Reason = "PRIMARY_DOCTOR_ASSIGNMENT" });
            return c;
        }
        Case(sanduni, ["Itchy skin patches"], TriagePriority.Routine, TriageStatus.PendingDoctorReview, 5);
        var nimalLow = Case(nimal, ["Occasional dizziness on standing"], TriagePriority.Routine, TriageStatus.LowConfidence, 14);
        db.Approvals.Add(new Approval { TriageCase = nimalLow, DoctorId = doctor.Id, Action = ApprovalAction.RequestInformation, DoctorNotes = "Please add home blood pressure readings.", DecidedAt = now.AddHours(-10) });
        Case(tharushi, ["Tiredness", "Pale skin"], TriagePriority.Priority, TriageStatus.PendingDoctorReview, 2);
        var revised = Case(kasun, ["Ear discomfort"], TriagePriority.Routine, TriageStatus.ApprovedRevised, 60);
        revised.CompletedAt = now.AddDays(-2);
        db.Approvals.Add(new Approval { TriageCase = revised, DoctorId = doctor.Id, Action = ApprovalAction.ReviseAndApprove, DoctorNotes = "Synthetic revision of the draft wording.", FinalAdvisory = SafeGuidance, DecidedAt = now.AddDays(-2) });
        var rejected = Case(amaya, ["Unclear intermittent symptoms"], TriagePriority.Routine, TriageStatus.Rejected, 90);
        rejected.CompletedAt = now.AddDays(-3);
        db.Approvals.Add(new Approval { TriageCase = rejected, DoctorId = doctor.Id, Action = ApprovalAction.Reject, DoctorNotes = "Synthetic rejection. Please book an in-person visit.", DecidedAt = now.AddDays(-3) });
        var escalated = Case(chaminda, ["Symptoms worsening over several days"], TriagePriority.Priority, TriageStatus.Escalated, 26);
        db.Approvals.Add(new Approval { TriageCase = escalated, DoctorId = doctor.Id, Action = ApprovalAction.Escalate, DoctorNotes = "Synthetic escalation to in-person review.", DecidedAt = now.AddHours(-24) });
        var emergency = Case(otherMembers["Isuru Fernando"], ["Severe breathing difficulty"], TriagePriority.Emergency, TriageStatus.FailedSafe, 40);
        emergency.FailureCode = "EMERGENCY_RED_FLAG_REFERRAL";

        // ================= Family requests and join outcomes =================
        var alphaFamily = await db.Families.SingleOrDefaultAsync(x => x.FamilyCode == "FV-P1BALP", ct);
        if (alphaFamily is not null)
        {
            var alphaHeadId = await db.Users.Where(x => x.Email == "phase1b-alpha-head@example.invalid").Select(x => x.Id).SingleAsync(ct);
            db.FamilyDoctorRequests.Add(new FamilyDoctorRequest { FamilyId = alphaFamily.Id, DoctorId = doctor.Id, RequestedByUserId = alphaHeadId, Message = "We moved closer to Negombo and would like to join your practice." });
        }
        var acceptedJoiner = NewUser("coverage-joined@example.invalid", "Coverage Joined Cousin", UserType.FamilyUser);
        var declinedJoiner = NewUser("coverage-declined@example.invalid", "Coverage Declined Applicant", UserType.FamilyUser);
        db.FamilyJoinRequests.AddRange(
            new FamilyJoinRequest { FamilyId = family.Id, RequestingUser = acceptedJoiner, RelationshipType = "Cousin", Status = PortalRequestStatus.Accepted },
            new FamilyJoinRequest { FamilyId = family.Id, RequestingUser = declinedJoiner, RelationshipType = "Unknown", Status = PortalRequestStatus.Declined });

        // ================= Admin: every verification state and deactivated accounts =================
        string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        var moreInfoUser = NewUser("coverage-doctor-moreinfo@example.invalid", "Dr. Coverage More Info", UserType.Doctor);
        var rejectedDocUser = NewUser("coverage-doctor-rejected@example.invalid", "Dr. Coverage Rejected", UserType.Doctor);
        var pendingTwoUser = NewUser("coverage-doctor-pending@example.invalid", "Dr. Coverage Pending", UserType.Doctor);
        db.Doctors.AddRange(
            new Doctor { User = moreInfoUser, RegistrationNumberHash = Hash("COVERAGE-MOREINFO"), RegistrationNumberLastFour = "2001", VerificationStatus = VerificationStatus.MoreInformationRequired, Specialty = "Family Medicine", District = "Kalutara", City = "Panadura", Languages = "Sinhala, English" },
            new Doctor { User = rejectedDocUser, RegistrationNumberHash = Hash("COVERAGE-REJECTED"), RegistrationNumberLastFour = "2002", VerificationStatus = VerificationStatus.Rejected, Specialty = "General Practice", District = "Ratnapura", City = "Ratnapura", Languages = "Sinhala" },
            new Doctor { User = pendingTwoUser, RegistrationNumberHash = Hash("COVERAGE-PENDING"), RegistrationNumberLastFour = "2003", VerificationStatus = VerificationStatus.Pending, Specialty = "Paediatrics", HospitalClinic = "Lakeside Demo Clinic", District = "Anuradhapura", City = "Anuradhapura", Languages = "Sinhala, Tamil" });
        NewUser(SentinelEmail, "Coverage Deactivated Family User", UserType.FamilyUser, active: false);
        NewUser("coverage-deactivated-doctor@example.invalid", "Dr. Coverage Deactivated", UserType.Doctor, active: false);

        // ================= Audit trail: feeds Head/Adult activity and the admin Recent Activity =================
        AuditLog Audit(Guid? actor, Guid? subject, string type, string resourceType, Guid? resourceId, string outcome, DateTimeOffset at)
        {
            var row = new AuditLog { ActorUserId = actor, SubjectMemberId = subject, EventType = type, ResourceType = resourceType, ResourceId = resourceId, Outcome = outcome, MetadataJson = "{}" };
            db.AuditLogs.Add(row);
            return At(row, at);
        }
        await db.SaveChangesAsync(ct); // generate ids for resource references below

        Audit(adultUser.Id, amaya.Id, "ADULT_ITEM_SHARED_WITH_HEAD", "LabReport", amayaLipid.Id, "SUCCESS", now.AddHours(-30));
        Audit(adultUser.Id, amaya.Id, "ADULT_ITEM_SHARED_WITH_HEAD", "HealthRecord", amayaShared.Id, "SUCCESS", now.AddHours(-29));
        Audit(tharushiUserId, tharushi.Id, "ADULT_ITEM_SHARED_WITH_HEAD", "HealthRecord", tharushiShared.Id, "SUCCESS", now.AddHours(-20));
        Audit(tharushiUserId, tharushi.Id, "ADULT_ITEM_SHARED_WITH_HEAD", "LabReport", tharushiLipid.Id, "SUCCESS", now.AddHours(-19));
        Audit(headUser.Id, null, "APPOINTMENT_REQUESTED", "Appointment", sanduniNext.Id, "SUCCESS", now.AddHours(-9));
        Audit(doctorUser.Id, null, "APPOINTMENT_STATUS_CHANGED", "Appointment", sanduniNext.Id, "Confirmed", now.AddHours(-7));
        Audit(adultUser.Id, null, "APPOINTMENT_STATUS_CHANGED", "Appointment", amayaCancelled.Id, "Cancelled", now.AddDays(-12));
        Audit(doctorUser.Id, null, "APPOINTMENT_STATUS_CHANGED", "Appointment", amayaCompleted.Id, "Completed", now.AddDays(-30));
        Audit(adultUser.Id, amaya.Id, "CASE_STATUS_CHANGED", "TriageCase", rejected.Id, "Rejected", now.AddDays(-3));
        Audit(headUser.Id, kasun.Id, "CASE_STATUS_CHANGED", "TriageCase", revised.Id, "ApprovedRevised", now.AddDays(-2));
        Audit(headUser.Id, null, "FAMILY_JOIN_ACCEPTED", "FamilyJoinRequest", null, "Accepted", now.AddDays(-5));
        Audit(headUser.Id, null, "FAMILY_JOIN_DECLINED", "FamilyJoinRequest", null, "Declined", now.AddDays(-5).AddHours(1));
        Audit(doctorUser.Id, null, "APPOINTMENT_STATUS_CHANGED", "Appointment", todayNoShow.Id, "NoShow", now.AddHours(-1));
        Audit(doctorUser.Id, null, "APPOINTMENT_STATUS_CHANGED", "Appointment", todayCancelled.Id, "Cancelled", now.AddHours(-3));
        Audit(adminUser.Id, null, "DOCTOR_VERIFICATION_CHANGED", "Doctor", null, "MoreInformationRequired", now.AddHours(-4));
        Audit(adminUser.Id, null, "DOCTOR_VERIFICATION_CHANGED", "Doctor", null, "Rejected", now.AddHours(-6));
        Audit(adminUser.Id, null, "USER_DEACTIVATED", "UserAccount", null, "SUCCESS", now.AddHours(-8));
        Audit(null, null, "LOGIN_FAILED", "UserAccount", null, "DENIED", now.AddMinutes(-40));
        Audit(doctorUser.Id, nimal.Id, "CASE_ACCESS_DENIED", "TriageCase", null, "DENIED", now.AddMinutes(-90));

        // ================= Notifications: unread and read, for every dashboard user =================
        PortalNotification Note(Guid userId, string type, string title, string body, string link, int hoursAgo, bool read)
        {
            var n = new PortalNotification { UserId = userId, Type = type, Title = title, Body = body, LinkPath = link, ReadAt = read ? now.AddHours(-hoursAgo + 1) : null };
            db.PortalNotifications.Add(n);
            return At(n, now.AddHours(-hoursAgo));
        }
        Note(headUser.Id, "ITEM_SHARED", "Amaya shared an item", "Amaya Perera shared a lab report with you.", "/records", 30, true);
        Note(headUser.Id, "ITEM_SHARED", "Tharushi shared an item", "Tharushi Perera shared a health record with you.", "/records", 20, false);
        Note(headUser.Id, "APPOINTMENT_CONFIRMED", "Appointment confirmed", "Sanduni's growth review is confirmed.", "/appointments", 7, false);
        Note(headUser.Id, "INFO_REQUESTED", "Doctor needs more information", "Please add home blood pressure readings to your case.", "/triage", 10, false);
        Note(headUser.Id, "GUIDANCE_AVAILABLE", "Guidance available", "Doctor-approved guidance is ready for Kasun.", "/triage", 48, true);
        Note(adultUser.Id, "CASE_REJECTED", "Case update", "Your doctor asked you to book an in-person visit.", "/triage", 72, true);
        Note(adultUser.Id, "APPOINTMENT_CANCELLED", "Appointment cancelled", "Your personal consultation was cancelled.", "/appointments", 288, true);
        Note(adultUser.Id, "LAB_PROCESSING", "Lab report processing", "Your uploaded report is waiting for text extraction.", "/records", 1, false);
        Note(doctorUser.Id, "CASE_PRIORITY", "Priority case waiting", "A priority case needs your review.", "/cases", 2, false);
        Note(doctorUser.Id, "FAMILY_DOCTOR_REQUEST", "New family request", "Phase1b Alpha Family requested you as their family doctor.", "/families", 5, false);
        Note(doctorUser.Id, "APPOINTMENT_CANCELLED", "Appointment cancelled", "Today's 11:30 check-up was cancelled.", "/appointments", 3, true);
        Note(adminUser.Id, "DOCTOR_APPLICATION", "New doctor application", "Dr. Coverage Pending applied for verification.", "/doctor-verification", 6, false);
        Note(adminUser.Id, "DOCTOR_APPLICATION", "Information received", "Dr. Coverage More Info replied to your request.", "/doctor-verification", 3, false);

        await db.SaveChangesAsync(ct);
        await RestoreTimestampsAsync(db, stamps, ct);
    }

    // SaveChanges stamps CreatedAt with "now"; put the intended demo times back so feeds sort realistically.
    private static async Task RestoreTimestampsAsync(AppDbContext db, List<(Entity Entity, DateTimeOffset At)> stamps, CancellationToken ct)
    {
        foreach (var (entity, at) in stamps)
        {
            var id = entity.Id;
            switch (entity)
            {
                case AuditLog:
                    await db.AuditLogs.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, at).SetProperty(p => p.UpdatedAt, at), ct); break;
                case PortalNotification:
                    await db.PortalNotifications.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, at).SetProperty(p => p.UpdatedAt, at), ct); break;
                case TriageCase:
                    await db.TriageCases.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, at).SetProperty(p => p.UpdatedAt, at), ct); break;
                case Episode:
                    await db.Episodes.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, at), ct); break;
                case LabReport:
                    await db.LabReports.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedAt, at).SetProperty(p => p.UpdatedAt, at), ct); break;
            }
        }
    }
}
