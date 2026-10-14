// Owner: S3 · Triage & Agent Orchestration
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Triage;

public static class CaseLifecycle
{
    public const string Submitted = "CASE_SUBMITTED";
    public const string Received = "CASE_DOCTOR_RECEIVED";
    public const string ReviewStarted = "CASE_DOCTOR_REVIEW_STARTED";
    public static bool IsProcessing(TriageStatus status) => status is TriageStatus.Submitted or TriageStatus.Planning or TriageStatus.ContextReady or TriageStatus.Analysed or TriageStatus.RiskAssessed or TriageStatus.Validated;
    public static bool CanChange(TriageStatus status) => IsProcessing(status) || status is TriageStatus.PendingDoctorReview or TriageStatus.LowConfidence or TriageStatus.FailedSafe;
    public static bool IsAbandoned(TriageStatus status) => status is TriageStatus.Withdrawn or TriageStatus.Superseded;
    public static async Task<bool> ReviewHasStartedAsync(AppDbContext db, Guid caseId, CancellationToken ct)
    {
        if (await db.AuditLogs.AnyAsync(x => x.ResourceId == caseId && x.EventType == ReviewStarted, ct)) return true;
        // Old DOCTOR_CASE_READ combined metadata and full review. Fail closed for historical reads.
        return !await db.AuditLogs.AnyAsync(x => x.ResourceId == caseId && x.EventType == Submitted, ct) &&
            await db.AuditLogs.AnyAsync(x => x.ResourceId == caseId && x.EventType == "DOCTOR_CASE_READ", ct);
    }

    public static async Task MarkReviewAsync(AppDbContext db, Guid caseId, Guid memberId, Guid actorId, CancellationToken ct)
    {
        if (!await db.AuditLogs.AnyAsync(x => x.ResourceId == caseId && x.EventType == ReviewStarted, ct))
            db.AuditLogs.Add(new AuditLog { ActorUserId = actorId, SubjectMemberId = memberId, EventType = ReviewStarted, ResourceType = "TriageCase", ResourceId = caseId, Outcome = "SUCCESS" });
    }
}
