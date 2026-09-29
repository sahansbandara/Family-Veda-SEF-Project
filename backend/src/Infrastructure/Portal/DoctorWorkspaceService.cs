// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor workspace: practice profile, weekly hours, blocked time, free slots, family roster,
// member workspace and clinical notes (DECISIONS 2026-09-29h).
//
// Access chain for clinical reads (DECISIONS 2026-09-28, 2026-09-29h), enforced here and nowhere else:
//   verified doctor → active primary assignment for the member's family (eligibility only)
//   → active visit grant or case grant for THIS member → consent per category → audit row.
using System.Text.Json;
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Portal;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Records;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Portal;

public sealed class DoctorWorkspaceService(AppDbContext dbContext, ICurrentUser currentUser) : IDoctorWorkspaceService
{
    // ---------- Practice profile ----------

    public async Task<DoctorPracticeProfileDto> GetProfileAsync(CancellationToken cancellationToken) =>
        MapProfile(await RequireVerifiedDoctorAsync(cancellationToken, includeUser: true));

    public async Task<DoctorPracticeProfileDto> UpdateProfileAsync(UpdatePracticeProfileRequest request, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken, includeUser: true);
        var errors = new Dictionary<string, string[]>();
        void Max(string key, string? value, int max) { if (value is not null && value.Trim().Length > max) errors[key] = [$"Maximum {max} characters."]; }
        Max("specialty", request.Specialty, 120); Max("clinic", request.Clinic, 120); Max("phoneNumber", request.PhoneNumber, 32);
        Max("district", request.District, 60); Max("city", request.City, 60); Max("languages", request.Languages, 120);
        Max("consultationModes", request.ConsultationModes, 60);
        if (!DoctorSchedule.AllowedSlotMinutes.Contains(request.SlotMinutes)) errors["slotMinutes"] = ["Slot length must be 15, 20, 30, 45 or 60 minutes."];
        if (errors.Count > 0) throw new ValidationException(errors);

        static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        doctor.Specialty = Clean(request.Specialty);
        doctor.HospitalClinic = Clean(request.Clinic);
        doctor.PhoneNumber = Clean(request.PhoneNumber);
        doctor.District = Clean(request.District);
        doctor.City = Clean(request.City);
        doctor.Languages = Clean(request.Languages);
        doctor.ConsultationModes = Clean(request.ConsultationModes);
        doctor.AcceptingNewFamilies = request.AcceptingNewFamilies;
        doctor.SlotMinutes = request.SlotMinutes;
        doctor.UpdatedAt = DateTimeOffset.UtcNow;
        Audit("DOCTOR_PROFILE_UPDATED", "Doctor", doctor.Id, null);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapProfile(doctor);
    }

    // ---------- Weekly hours and blocked time ----------

    public async Task<DoctorScheduleDto> GetScheduleAsync(CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        return await LoadScheduleAsync(doctor, cancellationToken);
    }

    public async Task<DoctorScheduleDto> ReplaceAvailabilityAsync(ReplaceAvailabilityRequest request, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        var windows = (request.Windows ?? []).Select(w => new DoctorSchedule.Window(w.DayOfWeek, w.StartTime, w.EndTime)).ToList();
        if (windows.Count > 50 || !DoctorSchedule.AreValid(windows))
        {
            throw new ValidationException(new Dictionary<string, string[]> { ["windows"] = ["Each window must end after it starts, and windows on the same day must not overlap."] });
        }
        var existing = await dbContext.DoctorAvailability.Where(x => x.DoctorId == doctor.Id).ToListAsync(cancellationToken);
        dbContext.DoctorAvailability.RemoveRange(existing);
        dbContext.DoctorAvailability.AddRange(windows.Select(w => new DoctorAvailability { DoctorId = doctor.Id, DayOfWeek = w.Day, StartTime = w.Start, EndTime = w.End }));
        Audit("DOCTOR_AVAILABILITY_UPDATED", "Doctor", doctor.Id, null);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await LoadScheduleAsync(doctor, cancellationToken);
    }

    public async Task<BlockedTimeDto> AddBlockedTimeAsync(CreateBlockedTimeRequest request, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        if (request.EndsAt <= request.StartsAt || request.EndsAt - request.StartsAt > TimeSpan.FromDays(60))
        {
            throw new ValidationException(new Dictionary<string, string[]> { ["endsAt"] = ["Blocked time must end after it starts and last at most 60 days."] });
        }
        if (request.Reason is not null && request.Reason.Trim().Length > 120)
        {
            throw new ValidationException(new Dictionary<string, string[]> { ["reason"] = ["Maximum 120 characters."] });
        }
        var block = new DoctorUnavailablePeriod { DoctorId = doctor.Id, StartsAt = request.StartsAt, EndsAt = request.EndsAt, Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim() };
        dbContext.DoctorUnavailablePeriods.Add(block);
        Audit("DOCTOR_TIME_BLOCKED", "Doctor", doctor.Id, null);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new BlockedTimeDto(block.Id, block.StartsAt, block.EndsAt, block.Reason);
    }

    public async Task RemoveBlockedTimeAsync(Guid id, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        var block = await dbContext.DoctorUnavailablePeriods.SingleOrDefaultAsync(x => x.Id == id && x.DoctorId == doctor.Id, cancellationToken) ?? throw new NotFoundException();
        dbContext.DoctorUnavailablePeriods.Remove(block);
        Audit("DOCTOR_TIME_UNBLOCKED", "Doctor", doctor.Id, null);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Free slots of the family's primary doctor. Only members of that family may ask.</summary>
    public async Task<DoctorSlotsDto> GetFamilyDoctorSlotsAsync(Guid familyId, DateOnly date, CancellationToken cancellationToken)
    {
        var isMember = await dbContext.Members.AnyAsync(x => x.FamilyId == familyId && x.UserId == currentUser.UserId, cancellationToken);
        if (!isMember) throw new NotFoundException();
        var assignment = await dbContext.FamilyDoctorAssignments.AsNoTracking()
            .FirstOrDefaultAsync(x => x.FamilyId == familyId && x.IsPrimary && x.EndedAt == null, cancellationToken)
            ?? throw new ConflictException("This family does not have a primary doctor yet.");
        var doctor = await dbContext.Doctors.AsNoTracking().SingleAsync(x => x.Id == assignment.DoctorId, cancellationToken);

        var windows = await dbContext.DoctorAvailability.AsNoTracking().Where(x => x.DoctorId == doctor.Id)
            .Select(x => new DoctorSchedule.Window(x.DayOfWeek, x.StartTime, x.EndTime)).ToListAsync(cancellationToken);
        if (windows.Count == 0) return new DoctorSlotsDto(date, false, doctor.SlotMinutes, []);

        var dayStart = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), DoctorSchedule.ClinicOffset);
        var dayEnd = dayStart.AddDays(1);
        var appointments = await dbContext.Appointments.AsNoTracking()
            .Where(x => x.DoctorId == doctor.Id && (x.Status == AppointmentStatus.Requested || x.Status == AppointmentStatus.Confirmed)
                        && x.StartsAt < dayEnd && x.StartsAt > dayStart.AddHours(-3))
            .Select(x => new { x.StartsAt, x.DurationMinutes }).ToListAsync(cancellationToken);
        var blocked = await dbContext.DoctorUnavailablePeriods.AsNoTracking()
            .Where(x => x.DoctorId == doctor.Id && x.StartsAt < dayEnd && dayStart < x.EndsAt)
            .Select(x => new DoctorSchedule.Busy(x.StartsAt, x.EndsAt)).ToListAsync(cancellationToken);
        var busy = appointments.Select(a => new DoctorSchedule.Busy(a.StartsAt, a.StartsAt.AddMinutes(a.DurationMinutes))).Concat(blocked).ToList();
        return new DoctorSlotsDto(date, true, doctor.SlotMinutes, DoctorSchedule.FreeSlots(date, doctor.SlotMinutes, windows, busy, DateTimeOffset.UtcNow));
    }

    // ---------- Family roster and member workspace ----------

    public async Task<FamilyRosterForDoctorDto> GetFamilyRosterAsync(Guid familyId, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        await RequireAssignmentAsync(doctor.Id, familyId, cancellationToken);
        var family = await dbContext.Families.AsNoTracking().SingleAsync(x => x.Id == familyId, cancellationToken);
        var members = await dbContext.Members.AsNoTracking().Where(x => x.FamilyId == familyId).OrderBy(x => x.DisplayName).ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var withAccess = new HashSet<Guid>();
        foreach (var member in members)
        {
            if ((await FindActiveGrantAsync(doctor.Id, member.Id, now, cancellationToken)).Basis is not null) withAccess.Add(member.Id);
        }
        return new FamilyRosterForDoctorDto(family.Id, family.Name,
            members.Select(m => new DoctorRosterMemberDto(m.Id, m.DisplayName, m.Role.ToString(), withAccess.Contains(m.Id))).ToList());
    }

    public async Task<MemberWorkspaceDto> GetMemberWorkspaceAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        var member = await dbContext.Members.AsNoTracking().SingleOrDefaultAsync(x => x.Id == memberId, cancellationToken) ?? throw new NotFoundException();
        await RequireAssignmentAsync(doctor.Id, member.FamilyId, cancellationToken);
        var family = await dbContext.Families.AsNoTracking().SingleAsync(x => x.Id == member.FamilyId, cancellationToken);

        var visits = await dbContext.Appointments.AsNoTracking()
            .Where(x => x.MemberId == memberId && x.DoctorId == doctor.Id).OrderByDescending(x => x.StartsAt)
            .Select(x => new WorkspaceVisitDto(x.Id, x.StartsAt, x.Reason, x.Status)).ToListAsync(cancellationToken);
        var notes = await NotesForAsync(doctor.Id, memberId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var (basis, expiresAt) = await FindActiveGrantAsync(doctor.Id, memberId, now, cancellationToken);
        if (basis is null)
        {
            Audit("DOCTOR_MEMBER_WORKSPACE_READ", "Member", memberId, memberId, outcome: "RESTRICTED");
            await dbContext.SaveChangesAsync(cancellationToken);
            return new MemberWorkspaceDto(member.Id, member.DisplayName, member.Role.ToString(), family.Id, family.Name,
                false, "Family doctor assignment only. Clinical details open during a confirmed visit or a shared case.", null,
                [], null, null, null, null, visits, notes);
        }

        var consented = await dbContext.Consents.AsNoTracking()
            .Where(x => x.MemberId == memberId && x.Status == ConsentStatus.Granted)
            .Select(x => x.Category).ToListAsync(cancellationToken);
        var conditions = consented.Contains(ConsentCategory.Conditions);
        var vitalsAllowed = consented.Contains(ConsentCategory.VitalsSummary);
        var flagsAllowed = consented.Contains(ConsentCategory.HereditaryFlags);

        IReadOnlyList<WorkspaceRecordDto>? records = null;
        IReadOnlyList<WorkspaceLabReportDto>? labs = null;
        IReadOnlyList<WorkspaceVitalDto>? vitals = null;
        IReadOnlyList<WorkspaceFlagDto>? flags = null;
        if (conditions)
        {
            records = await dbContext.HealthRecords.AsNoTracking().Where(x => x.MemberId == memberId).OrderByDescending(x => x.OccurredOn)
                .Select(x => new WorkspaceRecordDto(x.Id, x.RecordType, x.Title, x.Summary, x.OccurredOn)).ToListAsync(cancellationToken);
            var reports = await dbContext.LabReports.AsNoTracking().Include(x => x.Values).Where(x => x.MemberId == memberId)
                .OrderByDescending(x => x.CollectedAt ?? x.CreatedAt).ToListAsync(cancellationToken);
            // Only values the member confirmed are clinical data; unconfirmed OCR output stays out (RULE 4).
            labs = reports.Select(r => new WorkspaceLabReportDto(r.Id, r.OriginalFileName, r.CollectedAt,
                r.Values.Where(v => v.WasManuallyConfirmed).Select(v => new WorkspaceLabValueDto(v.Analyte, v.Value, v.Unit, v.ReferenceLow, v.ReferenceHigh,
                    LabRangeClassifier.Classify(v.Value, v.ReferenceLow, v.ReferenceHigh), v.WasManuallyConfirmed)).ToList())).ToList();
        }
        if (vitalsAllowed)
        {
            vitals = await dbContext.Vitals.AsNoTracking().Where(x => x.MemberId == memberId).OrderByDescending(x => x.MeasuredAt).Take(50)
                .Select(x => new WorkspaceVitalDto(x.VitalType, x.Value, x.Unit, x.MeasuredAt)).ToListAsync(cancellationToken);
        }
        if (flagsAllowed)
        {
            flags = await dbContext.HereditaryFlags.AsNoTracking().Where(x => x.MemberId == memberId && x.ManuallyConfirmed)
                .Select(x => new WorkspaceFlagDto(x.ConditionCode, x.Finding, x.ManuallyConfirmed)).ToListAsync(cancellationToken);
        }

        Audit("DOCTOR_MEMBER_WORKSPACE_READ", "Member", memberId, memberId, metadata: new { Basis = basis, Categories = consented.Select(c => c.ToString()) });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new MemberWorkspaceDto(member.Id, member.DisplayName, member.Role.ToString(), family.Id, family.Name,
            true, basis, expiresAt, consented.Select(c => c.ToString()).ToList(), records, labs, vitals, flags, visits, notes);
    }

    // ---------- Clinical notes (append-only) ----------

    public async Task<ClinicalNoteDto> AddNoteAsync(Guid memberId, CreateClinicalNoteRequest request, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        var member = await dbContext.Members.AsNoTracking().SingleOrDefaultAsync(x => x.Id == memberId, cancellationToken) ?? throw new NotFoundException();
        await RequireAssignmentAsync(doctor.Id, member.FamilyId, cancellationToken);
        if ((await FindActiveGrantAsync(doctor.Id, memberId, DateTimeOffset.UtcNow, cancellationToken)).Basis is null)
        {
            throw new ForbiddenException();
        }
        var content = RequireContent(request.Content);
        if (request.AppointmentId is { } appointmentId &&
            !await dbContext.Appointments.AnyAsync(x => x.Id == appointmentId && x.MemberId == memberId && x.DoctorId == doctor.Id, cancellationToken))
        {
            throw new ValidationException(new Dictionary<string, string[]> { ["appointmentId"] = ["The visit does not belong to this member and doctor."] });
        }
        var note = new ClinicalNote
        {
            DoctorId = doctor.Id, FamilyId = member.FamilyId, MemberId = memberId, AppointmentId = request.AppointmentId,
            NoteType = request.NoteType, Content = content
        };
        dbContext.ClinicalNotes.Add(note);
        Audit("CLINICAL_NOTE_CREATED", "ClinicalNote", note.Id, memberId);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapNote(note);
    }

    public async Task<ClinicalNoteDto> AmendNoteAsync(Guid noteId, AmendClinicalNoteRequest request, CancellationToken cancellationToken)
    {
        var doctor = await RequireVerifiedDoctorAsync(cancellationToken);
        var original = await dbContext.ClinicalNotes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == noteId && x.DoctorId == doctor.Id, cancellationToken)
            ?? throw new NotFoundException();
        await RequireAssignmentAsync(doctor.Id, original.FamilyId, cancellationToken);
        var latestVersion = await dbContext.ClinicalNotes.Where(x => x.Id == noteId || x.AmendsNoteId == noteId).MaxAsync(x => x.Version, cancellationToken);
        var amendment = new ClinicalNote
        {
            DoctorId = doctor.Id, FamilyId = original.FamilyId, MemberId = original.MemberId, AppointmentId = original.AppointmentId,
            NoteType = original.NoteType, Content = RequireContent(request.Content), Version = latestVersion + 1, AmendsNoteId = noteId
        };
        dbContext.ClinicalNotes.Add(amendment);
        Audit("CLINICAL_NOTE_AMENDED", "ClinicalNote", amendment.Id, original.MemberId);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapNote(amendment);
    }

    // ---------- Helpers ----------

    private async Task<Doctor> RequireVerifiedDoctorAsync(CancellationToken cancellationToken, bool includeUser = false)
    {
        var query = dbContext.Doctors.AsQueryable();
        if (includeUser) query = query.Include(x => x.User);
        return await query.SingleOrDefaultAsync(x => x.UserId == currentUser.UserId && x.VerificationStatus == VerificationStatus.Verified, cancellationToken)
            ?? throw new ForbiddenException();
    }

    /// <summary>No active assignment → 404, so a doctor cannot probe other families.</summary>
    private async Task RequireAssignmentAsync(Guid doctorId, Guid familyId, CancellationToken cancellationToken)
    {
        var assigned = await dbContext.FamilyDoctorAssignments.AnyAsync(x => x.DoctorId == doctorId && x.FamilyId == familyId && x.IsPrimary && x.EndedAt == null, cancellationToken);
        if (!assigned) throw new NotFoundException();
    }

    private async Task<(string? Basis, DateTimeOffset? ExpiresAt)> FindActiveGrantAsync(Guid doctorId, Guid memberId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var visit = await dbContext.VisitAccessGrants.AsNoTracking()
            .Where(x => x.DoctorId == doctorId && x.MemberId == memberId && x.RevokedAt == null && x.StartsAt <= now && now < x.ExpiresAt)
            .OrderByDescending(x => x.ExpiresAt).FirstOrDefaultAsync(cancellationToken);
        if (visit is not null) return ("Confirmed visit (access from 24 h before to 24 h after the visit) + member consent", visit.ExpiresAt);

        var caseGrant = await dbContext.CaseAccessGrants.AsNoTracking()
            .Where(x => x.DoctorId == doctorId && x.RevokedAt == null && x.ExpiresAt > now && x.TriageCase!.MemberId == memberId)
            .OrderByDescending(x => x.ExpiresAt).FirstOrDefaultAsync(cancellationToken);
        return caseGrant is null ? (null, null) : ("Shared triage case + member consent", caseGrant.ExpiresAt);
    }

    private async Task<IReadOnlyList<ClinicalNoteDto>> NotesForAsync(Guid doctorId, Guid memberId, CancellationToken cancellationToken) =>
        (await dbContext.ClinicalNotes.AsNoTracking().Where(x => x.DoctorId == doctorId && x.MemberId == memberId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken)).Select(MapNote).ToList();

    private static string RequireContent(string? content)
    {
        var text = content?.Trim() ?? "";
        if (text.Length == 0 || text.Length > ClinicalNote.MaxContentLength)
        {
            throw new ValidationException(new Dictionary<string, string[]> { ["content"] = [$"A note needs 1–{ClinicalNote.MaxContentLength} characters."] });
        }
        return text;
    }

    private async Task<DoctorScheduleDto> LoadScheduleAsync(Doctor doctor, CancellationToken cancellationToken)
    {
        var windows = await dbContext.DoctorAvailability.AsNoTracking().Where(x => x.DoctorId == doctor.Id)
            .OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime)
            .Select(x => new AvailabilityWindowDto(x.DayOfWeek, x.StartTime, x.EndTime)).ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var blocked = await dbContext.DoctorUnavailablePeriods.AsNoTracking().Where(x => x.DoctorId == doctor.Id && x.EndsAt > now)
            .OrderBy(x => x.StartsAt).Select(x => new BlockedTimeDto(x.Id, x.StartsAt, x.EndsAt, x.Reason)).ToListAsync(cancellationToken);
        return new DoctorScheduleDto(doctor.SlotMinutes, windows, blocked);
    }

    private static DoctorPracticeProfileDto MapProfile(Doctor d) => new(
        d.Id, d.User?.DisplayName ?? "Doctor", d.User?.Email, d.RegistrationNumberLastFour, d.VerificationStatus,
        d.Specialty, d.HospitalClinic, d.PhoneNumber, d.District, d.City, d.Languages, d.ConsultationModes, d.AcceptingNewFamilies, d.SlotMinutes);

    private static ClinicalNoteDto MapNote(ClinicalNote n) =>
        new(n.Id, n.FamilyId, n.MemberId, n.AppointmentId, n.NoteType, n.Content, n.Version, n.AmendsNoteId, n.CreatedAt);

    private void Audit(string eventType, string resourceType, Guid resourceId, Guid? subjectMemberId, string outcome = "SUCCESS", object? metadata = null) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = currentUser.UserId,
            SubjectMemberId = subjectMemberId,
            EventType = eventType,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Outcome = outcome,
            MetadataJson = metadata is null ? "{}" : JsonSerializer.Serialize(metadata)
        });
}
