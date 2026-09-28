// Phase 1b — health records, vitals, lab reports, triage cases, appointments and notifications.
// See Phase1bSeeder.cs for the sentinel/idempotency contract and RULE 7 scope.
using System.Text.Json;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Records;
using FamilyVeda.Domain.Triage;

namespace FamilyVeda.Infrastructure.Persistence.Seed;

public static class Phase1bClinicalSeed
{
    // RULE 6: no drug names, no dosing, no prescriptions, no meal plans. RULE 5: screening indication only.
    private const string SafeGuidance =
        "Continue routine self-care and monitor how symptoms change over the next few days. " +
        "Arrange an in-person visit with your family doctor if anything worsens. For any emergency call 1990.";

    public static void Seed(Phase1bSeedContext ctx, IReadOnlyList<Phase1bFamily> families, Phase1bDoctors doctors)
    {
        var db = ctx.Db;
        var now = ctx.Now;
        var alpha = families.Single(f => f.Key == "alpha");
        var beta = families.Single(f => f.Key == "beta");
        var gamma = families.Single(f => f.Key == "gamma");

        // ---- Conditions (health records) — one per adult, synthetic wording only ----
        foreach (var f in families)
        {
            db.HealthRecords.Add(new HealthRecord { Member = f.Head, RecordType = RecordType.Condition, Title = "Synthetic seasonal allergy", Summary = "Reported by family head for demonstration.", OccurredOn = new DateOnly(2025, 3, 1) });
            db.HealthRecords.Add(new HealthRecord { Member = f.AdultOne, RecordType = RecordType.Condition, Title = "Synthetic mild asthma history", Summary = "Demonstration condition record.", OccurredOn = new DateOnly(2024, 11, 12) });
        }

        // ---- Vitals — six-month monthly series per head and one adult per family ----
        foreach (var f in families)
        {
            for (var monthsAgo = 6; monthsAgo >= 0; monthsAgo--)
            {
                var at = now.AddDays(-30 * monthsAgo - 5);
                db.Vitals.Add(new Vital { Member = f.Head, VitalType = "blood_pressure_systolic", Value = 122 + monthsAgo % 5, Unit = "mmHg", MeasuredAt = at });
                db.Vitals.Add(new Vital { Member = f.Head, VitalType = "weight", Value = 70m + monthsAgo * 0.2m, Unit = "kg", MeasuredAt = at });
                db.Vitals.Add(new Vital { Member = f.AdultOne, VitalType = "blood_pressure_systolic", Value = 118 + monthsAgo % 4, Unit = "mmHg", MeasuredAt = at });
            }
        }

        // ---- Lab reports: below / within / above range, and one with no reference range ----
        LabReport Lab(Member member, string file, int daysAgo, params (string Analyte, decimal Value, string Unit, decimal? Low, decimal? High)[] values)
        {
            var report = new LabReport { Member = member, OriginalFileName = file, StoredFileName = $"phase1b-{Guid.NewGuid():N}.jpg", ContentType = "image/jpeg", SizeBytes = 0, OcrStatus = OcrStatus.Completed, CollectedAt = now.AddDays(-daysAgo) };
            foreach (var v in values)
                report.Values.Add(new LabValue { Analyte = v.Analyte, Value = v.Value, Unit = v.Unit, ReferenceLow = v.Low, ReferenceHigh = v.High, WasManuallyConfirmed = true });
            db.LabReports.Add(report);
            return report;
        }
        Lab(alpha.Head, "Phase1b_hemoglobin_below.jpg", 3, ("Hemoglobin", 10.8m, "g/dL", 12.0m, 15.0m));
        Lab(alpha.AdultOne, "Phase1b_glucose_within.jpg", 5, ("Fasting glucose", 92m, "mg/dL", 70m, 100m));
        Lab(beta.Head, "Phase1b_cholesterol_above.jpg", 4, ("Total cholesterol", 238m, "mg/dL", 125m, 200m));
        Lab(gamma.Head, "Phase1b_novel_marker_no_range.jpg", 2, ("Synthetic novel marker", 4.4m, "U/L", null, null));

        // ---- Family history: hereditary flags tied to a health record ----
        var alphaHistoryRecord = new HealthRecord { Member = alpha.Head, RecordType = RecordType.Note, Title = "Synthetic family history note", Summary = "Recorded for hereditary-flag demonstration.", OccurredOn = new DateOnly(2025, 6, 1) };
        db.HealthRecords.Add(alphaHistoryRecord);
        db.HereditaryFlags.Add(new HereditaryFlag { Member = alpha.Head, HealthRecord = alphaHistoryRecord, ConditionCode = "PHASE1B-HYPERTENSION", Finding = "Synthetic hereditary screening flag — hypertension pattern", Confidence = 0.55m, ManuallyConfirmed = true });
        var gammaHistoryRecord = new HealthRecord { Member = gamma.Head, RecordType = RecordType.Note, Title = "Synthetic family history note", Summary = "Recorded for hereditary-flag demonstration.", OccurredOn = new DateOnly(2025, 8, 1) };
        db.HealthRecords.Add(gammaHistoryRecord);
        db.HereditaryFlags.Add(new HereditaryFlag { Member = gamma.Head, HealthRecord = gammaHistoryRecord, ConditionCode = "PHASE1B-DIABETES", Finding = "Synthetic hereditary screening flag — glucose pattern", Confidence = 0.48m, ManuallyConfirmed = false });

        // ---- Triage cases: one of each priority, and one case in every approval state ----
        TriageCase Case(Member member, string[] symptoms, TriagePriority priority, TriageStatus status, int hoursAgo)
        {
            var episode = new Episode { Member = member, SymptomsJson = JsonSerializer.Serialize(symptoms), DurationDays = 1, Severity = priority switch { TriagePriority.Emergency => 9, TriagePriority.Priority => 6, _ => 3 } };
            var draft = JsonSerializer.Serialize(new { forDoctorReviewOnly = true, summary = "Synthetic demonstration draft — no diagnosis." });
            var triageCase = new TriageCase { Episode = episode, Member = member, Priority = priority, Status = status, SubmittedAt = now.AddHours(-hoursAgo), DraftAdvisoryJson = draft };
            db.Episodes.Add(episode);
            db.TriageCases.Add(triageCase);
            return triageCase;
        }

        // Priority spread: routine, priority, and one emergency red-flag case.
        Case(alpha.AdultTwo, ["Mild fatigue"], TriagePriority.Routine, TriageStatus.PendingDoctorReview, 6);
        Case(beta.AdultOne, ["Persistent cough", "Low-grade fever"], TriagePriority.Priority, TriageStatus.PendingDoctorReview, 4);
        var emergencyCase = Case(gamma.AdultOne, ["Severe chest pain", "Shortness of breath"], TriagePriority.Emergency, TriageStatus.FailedSafe, 1);
        emergencyCase.FailureCode = "EMERGENCY_RED_FLAG_REFERRAL";

        // Approval-state spread — one case per state the approval workflow supports.
        var pendingCase = Case(alpha.Head, ["Sore throat"], TriagePriority.Routine, TriageStatus.PendingDoctorReview, 8);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCase = pendingCase, DoctorId = doctors.VerifiedOne.Id, ExpiresAt = now.AddDays(7), Reason = "PRIMARY_DOCTOR_ASSIGNMENT" });

        var approvedCase = Case(beta.Head, ["Mild headache"], TriagePriority.Routine, TriageStatus.Approved, 72);
        approvedCase.CompletedAt = now.AddDays(-3);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCase = approvedCase, DoctorId = doctors.VerifiedTwo.Id, ExpiresAt = now.AddDays(4), Reason = "PRIMARY_DOCTOR_ASSIGNMENT" });
        db.Approvals.Add(new Approval { TriageCase = approvedCase, DoctorId = doctors.VerifiedTwo.Id, Action = ApprovalAction.Approve, DoctorNotes = "Synthetic approval.", FinalAdvisory = SafeGuidance, DecidedAt = now.AddDays(-3) });

        var infoCase = Case(gamma.Head, ["Recurring dizziness"], TriagePriority.Routine, TriageStatus.LowConfidence, 30);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCase = infoCase, DoctorId = doctors.VerifiedThree.Id, ExpiresAt = now.AddDays(6), Reason = "PRIMARY_DOCTOR_ASSIGNMENT" });
        db.Approvals.Add(new Approval { TriageCase = infoCase, DoctorId = doctors.VerifiedThree.Id, Action = ApprovalAction.RequestInformation, DoctorNotes = "Synthetic request for more information from the family.", DecidedAt = now.AddDays(-1) });

        var rejectedCase = Case(alpha.AdultOne, ["Fatigue", "Unclear symptoms"], TriagePriority.Routine, TriageStatus.Rejected, 96);
        rejectedCase.CompletedAt = now.AddDays(-4);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCase = rejectedCase, DoctorId = doctors.VerifiedOne.Id, ExpiresAt = now.AddDays(3), Reason = "PRIMARY_DOCTOR_ASSIGNMENT" });
        db.Approvals.Add(new Approval { TriageCase = rejectedCase, DoctorId = doctors.VerifiedOne.Id, Action = ApprovalAction.Reject, DoctorNotes = "Synthetic rejection — insufficient information to proceed.", DecidedAt = now.AddDays(-4) });

        var escalatedCase = Case(beta.AdultTwo, ["Worsening symptoms over several days"], TriagePriority.Priority, TriageStatus.Escalated, 12);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCase = escalatedCase, DoctorId = doctors.VerifiedTwo.Id, ExpiresAt = now.AddDays(5), Reason = "PRIMARY_DOCTOR_ASSIGNMENT" });
        db.Approvals.Add(new Approval { TriageCase = escalatedCase, DoctorId = doctors.VerifiedTwo.Id, Action = ApprovalAction.Escalate, DoctorNotes = "Synthetic escalation for in-person emergency-adjacent review.", DecidedAt = now.AddHours(-11) });

        // ---- Appointments in every status ----
        void Appt(Member member, Doctor doctor, DateTimeOffset startsAt, string reason, FamilyVeda.Domain.Portal.AppointmentStatus status, Guid bookedByUserId, string? doctorNote = null)
        {
            db.Appointments.Add(new Appointment { Member = member, DoctorId = doctor.Id, BookedByUserId = bookedByUserId, StartsAt = startsAt, Reason = reason, Status = status, DoctorNote = doctorNote });
        }
        var today = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        Appt(alpha.Head, doctors.VerifiedOne, today.AddDays(5).AddHours(9), "Phase1b requested consultation", FamilyVeda.Domain.Portal.AppointmentStatus.Requested, alpha.HeadUser.Id);
        Appt(alpha.AdultOne, doctors.VerifiedOne, today.AddDays(2).AddHours(11), "Phase1b confirmed follow-up", FamilyVeda.Domain.Portal.AppointmentStatus.Confirmed, alpha.AdultOneUser.Id);
        Appt(beta.Head, doctors.VerifiedTwo, today.AddDays(-10).AddHours(10), "Phase1b completed review", FamilyVeda.Domain.Portal.AppointmentStatus.Completed, beta.HeadUser.Id, "Synthetic completed visit note.");
        Appt(beta.AdultOne, doctors.VerifiedTwo, today.AddDays(-3).AddHours(15), "Phase1b cancelled visit", FamilyVeda.Domain.Portal.AppointmentStatus.Cancelled, beta.AdultOneUser.Id);
        Appt(gamma.Head, doctors.VerifiedOne, today.AddDays(-6).AddHours(9), "Phase1b missed appointment", FamilyVeda.Domain.Portal.AppointmentStatus.NoShow, gamma.HeadUser.Id);

        // ---- Unread notifications ----
        db.PortalNotifications.AddRange(
            new PortalNotification { UserId = alpha.HeadUser.Id, Type = "JOIN_REQUEST", Title = "New join request", Body = "Beta Adult Two asked to join Alpha Family.", LinkPath = "/join-family" },
            new PortalNotification { UserId = beta.HeadUser.Id, Type = "FAMILY_DOCTOR_REQUEST", Title = "Family doctor request sent", Body = "Your request to Dr. Phase1b Badulla is pending.", LinkPath = "/doctors" },
            new PortalNotification { UserId = gamma.HeadUser.Id, Type = "CASE_ESCALATED", Title = "Case escalated", Body = "A triage case for your family was escalated for review.", LinkPath = "/triage" },
            new PortalNotification { UserId = alpha.AdultOneUser.Id, Type = "CASE_REJECTED", Title = "Case update", Body = "A triage case needs to be resubmitted.", LinkPath = "/triage" });
    }
}
