// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Access;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Triage;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Clinical;

/// <summary>
/// The one gate for a doctor's follow-up on an emergency referral they acknowledged: a verified
/// doctor, an escalated case, an active case grant held by that doctor, and a referral not yet closed.
/// Anything else answers 404 so the endpoint never confirms a case exists.
/// </summary>
internal static class EmergencyCaseAccess
{
    public sealed record Access(Doctor Doctor, TriageCase Case);

    public static async Task<Access> RequireAsync(AppDbContext dbContext, ICurrentUser currentUser, Guid caseId, CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.Doctor) throw new ForbiddenException();
        var doctor = await dbContext.Doctors.Include(x => x.User)
            .SingleOrDefaultAsync(x => x.UserId == currentUser.UserId && x.VerificationStatus == VerificationStatus.Verified, cancellationToken)
            ?? throw new ForbiddenException();
        var triageCase = await dbContext.TriageCases
            .SingleOrDefaultAsync(x => x.Id == caseId && x.Status == TriageStatus.Escalated, cancellationToken)
            ?? throw new NotFoundException();
        var grant = await dbContext.CaseAccessGrants.AsNoTracking()
            .Where(x => x.TriageCaseId == caseId && x.DoctorId == doctor.Id)
            .OrderByDescending(x => x.ExpiresAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (grant is null || !CaseGrantPolicy.HasAccess(grant.ExpiresAt, grant.RevokedAt, DateTimeOffset.UtcNow))
        {
            throw new NotFoundException();
        }
        if (await IsClosedAsync(dbContext, caseId, cancellationToken))
        {
            throw new ConflictException("This referral is already closed.");
        }
        return new Access(doctor, triageCase);
    }

    public static Task<bool> IsClosedAsync(AppDbContext dbContext, Guid caseId, CancellationToken cancellationToken) =>
        dbContext.Approvals.AnyAsync(x => x.TriageCaseId == caseId && x.Action == ApprovalAction.CloseReferral, cancellationToken);

    /// <summary>The patient's own account, plus the family head when the patient is a minor.</summary>
    public static async Task<IReadOnlyList<Guid>> PatientRecipientsAsync(AppDbContext dbContext, Guid memberId, CancellationToken cancellationToken)
    {
        var member = await dbContext.Members.AsNoTracking()
            .Where(x => x.Id == memberId)
            .Select(x => new
            {
                x.UserId,
                x.DateOfBirth,
                HeadUserId = x.Family!.Members.Where(m => m.Role == FamilyRole.Head).Select(m => m.UserId).FirstOrDefault() ?? x.Family.CreatedByUserId
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (member is null) return [];
        var isMinor = member.DateOfBirth.AddYears(18) > DateOnly.FromDateTime(DateTime.UtcNow);
        return new Guid?[] { member.UserId, isMinor ? member.HeadUserId : null }
            .Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();
    }
}
