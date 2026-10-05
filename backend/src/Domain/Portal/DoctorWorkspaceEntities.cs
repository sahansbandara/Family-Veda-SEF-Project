// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor workspace (docs/Three_Dashboards_Plan.md §3.3, DECISIONS 2026-09-29h).
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;

namespace FamilyVeda.Domain.Portal;

/// <summary>One weekly working window, e.g. Monday 09:00–16:00. A doctor may have several per day.</summary>
public sealed class DoctorAvailability : Entity
{
    public Guid DoctorId { get; set; }
    public Doctor? Doctor { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}

/// <summary>Blocked time (leave, rounds). Overrides weekly availability.</summary>
public sealed class DoctorUnavailablePeriod : Entity
{
    public Guid DoctorId { get; set; }
    public Doctor? Doctor { get; set; }
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset EndsAt { get; set; }
    public string? Reason { get; set; }
}

/// <summary>
/// Time-bound clinical access for one member, issued when the doctor confirms an appointment
/// (24 h before the start until 24 h after the end). Revoked on cancel or no-show.
/// </summary>
public sealed class VisitAccessGrant : Entity
{
    public Guid AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public Guid DoctorId { get; set; }
    public Doctor? Doctor { get; set; }
    public Guid MemberId { get; set; }
    public Member? Member { get; set; }
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }

    public static readonly TimeSpan Margin = TimeSpan.FromHours(24);

    public bool IsActiveAt(DateTimeOffset now) => RevokedAt is null && StartsAt <= now && now < ExpiresAt;
}

public enum ClinicalNoteType { VisitNote, FamilyNote, FollowUp }

/// <summary>Doctor-only longitudinal note. Append-only: an amendment is a new row pointing at the note it corrects.</summary>
public sealed class ClinicalNote : Entity
{
    public Guid DoctorId { get; set; }
    public Doctor? Doctor { get; set; }
    public Guid FamilyId { get; set; }
    public Family? Family { get; set; }
    public Guid? MemberId { get; set; }
    public Member? Member { get; set; }
    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public ClinicalNoteType NoteType { get; set; } = ClinicalNoteType.VisitNote;
    public required string Content { get; set; }
    public int Version { get; set; } = 1;
    public Guid? AmendsNoteId { get; set; }

    public const int MaxContentLength = 4000;
}
