// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor workspace contracts (DECISIONS 2026-09-29h, docs/Three_Dashboards_Plan.md §3).
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Records;
using FamilyVeda.Application.Records;

namespace FamilyVeda.Application.Portal;

public sealed record DoctorPracticeProfileDto(
    Guid Id, string DisplayName, string? Email, string RegistrationNumberLastFour, VerificationStatus VerificationStatus,
    string? Specialty, string? Clinic, string? PhoneNumber, string? District, string? City, string? Languages,
    string? ConsultationModes, bool AcceptingNewFamilies, int SlotMinutes);

public sealed record UpdatePracticeProfileRequest(
    string? Specialty, string? Clinic, string? PhoneNumber, string? District, string? City, string? Languages,
    string? ConsultationModes, bool AcceptingNewFamilies, int SlotMinutes);

public sealed record AvailabilityWindowDto(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);

public sealed record ReplaceAvailabilityRequest(IReadOnlyList<AvailabilityWindowDto> Windows);

public sealed record BlockedTimeDto(Guid Id, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Reason);

public sealed record CreateBlockedTimeRequest(DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Reason);

public sealed record DoctorScheduleDto(int SlotMinutes, IReadOnlyList<AvailabilityWindowDto> Windows, IReadOnlyList<BlockedTimeDto> Blocked);

/// <summary>Free slots for one day. <c>AvailabilityConfigured=false</c> means the doctor has not set hours yet.</summary>
public sealed record DoctorSlotsDto(DateOnly Date, bool AvailabilityConfigured, int SlotMinutes, IReadOnlyList<DateTimeOffset> Slots);

public sealed record RescheduleAppointmentRequest(DateTimeOffset StartsAt, string? Note);

public sealed record FamilyRosterForDoctorDto(Guid FamilyId, string FamilyName, IReadOnlyList<DoctorRosterMemberDto> Members);

/// <summary>Names and roles only. <c>ClinicalAccess</c> says whether a grant is active right now.</summary>
public sealed record DoctorRosterMemberDto(Guid Id, string DisplayName, string Role, bool ClinicalAccess);

public sealed record WorkspaceRecordDto(Guid Id, RecordType RecordType, string Title, string? Summary, DateOnly OccurredOn);

public sealed record WorkspaceLabValueDto(string Analyte, decimal Value, string Unit, decimal? ReferenceLow, decimal? ReferenceHigh,
    LabRangeStatus RangeStatus, bool Confirmed);

public sealed record WorkspaceLabReportDto(Guid Id, string FileName, DateTimeOffset? CollectedAt, IReadOnlyList<WorkspaceLabValueDto> Values, bool HasOriginalFile = false);

/// <summary>
/// A recorded reading with its position against a cited reference interval for the member's age and its
/// direction against earlier readings. Both are deterministic display facts, never a diagnosis.
/// </summary>
public sealed record WorkspaceVitalDto(string VitalType, decimal Value, string Unit, DateTimeOffset MeasuredAt,
    decimal? ReferenceLow = null, decimal? ReferenceHigh = null, LabRangeStatus RangeStatus = LabRangeStatus.RangeUnavailable,
    VitalTrend Trend = VitalTrend.NotEnoughReadings, string? RangeSource = null);

/// <summary>One row of the reference panel: the published interval that applies at the member's age.</summary>
public sealed record VitalReferenceDto(string VitalType, string Label, string Unit, decimal Low, decimal High, string AgeBand, string Source);

public sealed record WorkspaceFlagDto(string ConditionCode, string Finding, bool Confirmed);

public sealed record WorkspaceVisitDto(Guid AppointmentId, DateTimeOffset StartsAt, string Reason, AppointmentStatus Status);

public sealed record ClinicalNoteDto(Guid Id, Guid FamilyId, Guid? MemberId, Guid? AppointmentId, ClinicalNoteType NoteType,
    string Content, int Version, Guid? AmendsNoteId, DateTimeOffset CreatedAt);

public sealed record CreateClinicalNoteRequest(string Content, ClinicalNoteType NoteType, Guid? AppointmentId);

public sealed record AmendClinicalNoteRequest(string Content);

/// <summary>
/// One member as the doctor may see them now. <c>AccessBasis</c> explains why. Each clinical list is
/// null when access or that consent category is missing, so a restricted view never leaks counts.
/// </summary>
public sealed record MemberWorkspaceDto(
    Guid MemberId, string DisplayName, string Role, Guid FamilyId, string FamilyName,
    bool ClinicalAccess, string AccessBasis, DateTimeOffset? AccessExpiresAt,
    IReadOnlyList<string> ConsentedCategories,
    IReadOnlyList<WorkspaceRecordDto>? Records,
    IReadOnlyList<WorkspaceLabReportDto>? LabReports,
    IReadOnlyList<WorkspaceVitalDto>? Vitals,
    IReadOnlyList<WorkspaceFlagDto>? HereditaryFlags,
    IReadOnlyList<WorkspaceVisitDto> Visits,
    IReadOnlyList<ClinicalNoteDto> Notes,
    int? AgeYears = null,
    string? SexForClinicalReference = null,
    IReadOnlyList<VitalReferenceDto>? VitalReferences = null);

public interface IDoctorWorkspaceService
{
    Task<DoctorPracticeProfileDto> GetProfileAsync(CancellationToken cancellationToken);
    Task<DoctorPracticeProfileDto> UpdateProfileAsync(UpdatePracticeProfileRequest request, CancellationToken cancellationToken);
    Task<DoctorScheduleDto> GetScheduleAsync(CancellationToken cancellationToken);
    Task<DoctorScheduleDto> ReplaceAvailabilityAsync(ReplaceAvailabilityRequest request, CancellationToken cancellationToken);
    Task<BlockedTimeDto> AddBlockedTimeAsync(CreateBlockedTimeRequest request, CancellationToken cancellationToken);
    Task RemoveBlockedTimeAsync(Guid id, CancellationToken cancellationToken);
    Task<DoctorSlotsDto> GetFamilyDoctorSlotsAsync(Guid familyId, DateOnly date, CancellationToken cancellationToken);
    Task<FamilyRosterForDoctorDto> GetFamilyRosterAsync(Guid familyId, CancellationToken cancellationToken);
    Task<MemberWorkspaceDto> GetMemberWorkspaceAsync(Guid memberId, CancellationToken cancellationToken);
    Task<LabReportFileDto> GetOriginalReportAsync(Guid memberId, Guid reportId, CancellationToken cancellationToken);
    Task<ClinicalNoteDto> AddNoteAsync(Guid memberId, CreateClinicalNoteRequest request, CancellationToken cancellationToken);
    Task<ClinicalNoteDto> AmendNoteAsync(Guid noteId, AmendClinicalNoteRequest request, CancellationToken cancellationToken);
}
