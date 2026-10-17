// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// SLMC contested claims. A duplicate registration number opens a dispute instead of a permanent 409;
// an admin decides the winner. Every step is audited (Rule 8) and decided by a human, never an LLM (Rule 4).
using System.Text.Json;
using FamilyVeda.Application.Clinical;
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Clinical;

public sealed class ClaimDisputeService(AppDbContext dbContext, ICurrentUser currentUser) : IClaimDisputeService
{
    public const string FraudulentClaimReason = "FraudulentClaim";

    /// <summary>
    /// Called while staging a new doctor. If live claimants already hold this hash, the new doctor joins
    /// (or opens) a dispute, every live claimant is flagged, and a Verified claimant's case grants are frozen.
    /// Returns true when the claim is disputed. Caller commits.
    /// </summary>
    public static async Task<bool> StageClaimAsync(AppDbContext dbContext, Doctor newDoctor, Guid actorUserId, CancellationToken cancellationToken)
    {
        var existing = await dbContext.Doctors
            .Where(x => x.RegistrationNumberHash == newDoctor.RegistrationNumberHash && x.Id != newDoctor.Id
                && x.VerificationStatus != VerificationStatus.Rejected && x.VerificationStatus != VerificationStatus.Suspended)
            .ToListAsync(cancellationToken);
        if (existing.Count == 0) return false;

        var now = DateTimeOffset.UtcNow;
        newDoctor.VerificationStatus = VerificationStatus.Pending;
        newDoctor.ClaimDisputed = true;
        var dispute = await dbContext.DoctorClaimDisputes
            .SingleOrDefaultAsync(x => x.RegistrationNumberHash == newDoctor.RegistrationNumberHash && x.Status == ClaimDisputeStatus.Open, cancellationToken);
        if (dispute is null)
        {
            dispute = new DoctorClaimDispute { RegistrationNumberHash = newDoctor.RegistrationNumberHash };
            dbContext.DoctorClaimDisputes.Add(dispute);
        }

        foreach (var claimant in existing)
        {
            claimant.ClaimDisputed = true;
            var frozen = 0;
            if (claimant.VerificationStatus == VerificationStatus.Verified)
            {
                var grants = await dbContext.CaseAccessGrants
                    .Where(x => x.DoctorId == claimant.Id && x.RevokedAt == null && x.ExpiresAt > now)
                    .ToListAsync(cancellationToken);
                foreach (var grant in grants) grant.FrozenAt = now;
                frozen = grants.Count;
            }
            Audit(dbContext, actorUserId, "SLMC_CLAIM_DISPUTED", claimant.Id, "FLAGGED", new { DisputeId = dispute.Id, FrozenGrants = frozen });
        }
        Audit(dbContext, actorUserId, "SLMC_CLAIM_DISPUTED", newDoctor.Id, "PENDING", new { DisputeId = dispute.Id, ExistingClaimants = existing.Count });
        return true;
    }

    public async Task<IReadOnlyList<ClaimDisputeDto>> GetDisputesAsync(bool includeResolved, CancellationToken cancellationToken)
    {
        RequireAdmin();
        var disputes = await dbContext.DoctorClaimDisputes.AsNoTracking()
            .Where(x => includeResolved || x.Status == ClaimDisputeStatus.Open)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var result = new List<ClaimDisputeDto>(disputes.Count);
        foreach (var dispute in disputes) result.Add(await MapAsync(dispute, cancellationToken));
        return result;
    }

    public async Task<ClaimDisputeDto> ResolveAsync(Guid disputeId, ResolveClaimDisputeRequest request, CancellationToken cancellationToken)
    {
        RequireAdmin();
        var reason = request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ValidationException(new Dictionary<string, string[]> { ["reason"] = ["A reason is required to resolve a claim dispute."] });
        }

        var dispute = await dbContext.DoctorClaimDisputes.SingleOrDefaultAsync(x => x.Id == disputeId, cancellationToken)
            ?? throw new NotFoundException();
        if (dispute.Status != ClaimDisputeStatus.Open) throw new ConflictException("This dispute is already resolved.");

        var claimants = await dbContext.Doctors.Include(x => x.User)
            .Where(x => x.RegistrationNumberHash == dispute.RegistrationNumberHash && x.ClaimDisputed)
            .ToListAsync(cancellationToken);
        var winner = claimants.SingleOrDefault(x => x.Id == request.WinnerDoctorId)
            ?? throw new ValidationException(new Dictionary<string, string[]> { ["winnerDoctorId"] = ["The winner must be one of the dispute's claimants."] });

        var now = DateTimeOffset.UtcNow;
        var claimantIds = claimants.Select(x => x.Id).ToList();
        var grants = await dbContext.CaseAccessGrants.IgnoreQueryFilters()
            .Where(x => claimantIds.Contains(x.DoctorId) && x.RevokedAt == null)
            .ToListAsync(cancellationToken);

        // Losers first, so the partial unique index (one Verified doctor per hash) holds when the winner is saved.
        foreach (var loser in claimants.Where(x => x.Id != winner.Id))
        {
            var previous = loser.VerificationStatus;
            loser.VerificationStatus = VerificationStatus.Suspended;
            loser.ClaimDisputed = false;
            if (loser.User is not null)
            {
                loser.User.IsActive = false;
                loser.User.RefreshTokenRevokedAt = now;
            }
            var revoked = 0;
            foreach (var grant in grants.Where(x => x.DoctorId == loser.Id))
            {
                grant.RevokedAt = now;
                revoked++;
            }
            dbContext.DoctorVerificationLogs.Add(new DoctorVerificationLog
            {
                DoctorId = loser.Id, AdminUserId = currentUser.UserId, FromStatus = previous,
                ToStatus = VerificationStatus.Suspended, Reason = $"{FraudulentClaimReason}: {reason}"
            });
            Audit(dbContext, currentUser.UserId, "SLMC_CLAIM_DISPUTE_LOST", loser.Id, "SUSPENDED",
                new { DisputeId = dispute.Id, SuspensionReason = FraudulentClaimReason, RevokedGrants = revoked });
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        var winnerPrevious = winner.VerificationStatus;
        winner.VerificationStatus = VerificationStatus.Verified;
        winner.ClaimDisputed = false;
        if (winner.User is not null) winner.User.IsActive = true;
        var unfrozen = 0;
        foreach (var grant in grants.Where(x => x.DoctorId == winner.Id && x.FrozenAt != null))
        {
            grant.FrozenAt = null;
            unfrozen++;
        }
        dbContext.DoctorVerificationLogs.Add(new DoctorVerificationLog
        {
            DoctorId = winner.Id, AdminUserId = currentUser.UserId, FromStatus = winnerPrevious,
            ToStatus = VerificationStatus.Verified, Reason = reason
        });
        dispute.Status = ClaimDisputeStatus.Resolved;
        dispute.WinnerDoctorId = winner.Id;
        dispute.ResolvedByUserId = currentUser.UserId;
        dispute.ResolvedAt = now;
        dispute.ResolutionReason = reason;
        Audit(dbContext, currentUser.UserId, "SLMC_CLAIM_DISPUTE_RESOLVED", dispute.Id, "SUCCESS",
            new { WinnerDoctorId = winner.Id, Claimants = claimants.Count, UnfrozenGrants = unfrozen }, "DoctorClaimDispute");
        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapAsync(dispute, cancellationToken);
    }

    public async Task<LicenseDocumentFile> GetLicenseDocumentAsync(Guid doctorId, CancellationToken cancellationToken)
    {
        RequireAdmin();
        var document = await dbContext.DoctorLicenseDocuments.AsNoTracking()
            .Where(x => x.DoctorId == doctorId).OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken) ?? throw new NotFoundException();
        Audit(dbContext, currentUser.UserId, "DOCTOR_LICENSE_DOCUMENT_READ", doctorId, "SUCCESS", new { document.ContentType });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new LicenseDocumentFile(document.FileName, document.ContentType, document.Content);
    }

    private async Task<ClaimDisputeDto> MapAsync(DoctorClaimDispute dispute, CancellationToken cancellationToken)
    {
        var register = await dbContext.SlmcRegisterEntries.AsNoTracking()
            .Where(x => x.RegistrationNumberHash == dispute.RegistrationNumberHash && x.Status == SlmcRegisterStatus.Active)
            .Select(x => x.FullName).FirstOrDefaultAsync(cancellationToken);
        var claimants = await dbContext.Doctors.AsNoTracking().Include(x => x.User)
            .Where(x => x.RegistrationNumberHash == dispute.RegistrationNumberHash
                && (dispute.Status == ClaimDisputeStatus.Open ? x.ClaimDisputed : x.CreatedAt <= dispute.ResolvedAt))
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var ids = claimants.Select(x => x.Id).ToList();
        var withDocs = await dbContext.DoctorLicenseDocuments.AsNoTracking()
            .Where(x => ids.Contains(x.DoctorId)).Select(x => x.DoctorId).Distinct().ToListAsync(cancellationToken);
        var lastFour = claimants.FirstOrDefault()?.RegistrationNumberLastFour ?? "";
        return new ClaimDisputeDto(dispute.Id, lastFour, dispute.Status, register, dispute.CreatedAt, dispute.WinnerDoctorId,
            dispute.ResolvedAt, dispute.ResolutionReason,
            claimants.Select(x => new ClaimDisputeClaimantDto(x.Id, x.UserId, x.User?.DisplayName, x.User?.Email, x.VerificationStatus,
                SlmcNameMatcher.Classify(x.User?.DisplayName, register), withDocs.Contains(x.Id), x.CreatedAt)).ToList());
    }

    private void RequireAdmin()
    {
        if (currentUser.UserType != UserType.Admin) throw new ForbiddenException();
    }

    private static void Audit(AppDbContext dbContext, Guid actorUserId, string eventType, Guid resourceId, string outcome, object metadata, string resourceType = "Doctor") =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = actorUserId,
            EventType = eventType,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Outcome = outcome,
            MetadataJson = JsonSerializer.Serialize(metadata)
        });
}
