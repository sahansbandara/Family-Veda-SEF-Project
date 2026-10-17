// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// SLMC contested claims. A duplicate registration number opens a dispute instead of a permanent 409;
// an admin decides the winner. Every step is audited (Rule 8) and decided by a human, never an LLM (Rule 4).
using System.Text.Json;
using FamilyVeda.Application.Clinical;
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Records;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Clinical;

public sealed class ClaimDisputeService(AppDbContext dbContext, ICurrentUser currentUser, IExternalReportFileStore? fileStore = null) : IClaimDisputeService
{
    public const string FraudulentClaimReason = "FraudulentClaim";

    /// <summary>
    /// Called while staging a new doctor. The incumbent keeps working: nothing is frozen.
    /// A number whose owner an admin already confirmed auto-rejects the new claim; otherwise a dispute opens
    /// for admin review and an identical licence file is flagged. Caller commits.
    /// </summary>
    public static async Task<ClaimOutcome> StageClaimAsync(AppDbContext dbContext, Doctor newDoctor, Guid actorUserId, CancellationToken cancellationToken, string? licenseSha256 = null)
    {
        var existing = await dbContext.Doctors
            .Where(x => x.RegistrationNumberHash == newDoctor.RegistrationNumberHash && x.Id != newDoctor.Id
                && x.VerificationStatus != VerificationStatus.Rejected && x.VerificationStatus != VerificationStatus.Suspended)
            .ToListAsync(cancellationToken);
        if (existing.Count == 0) return ClaimOutcome.None;

        if (existing.Any(x => x.VerificationStatus == VerificationStatus.Verified && x.OwnershipConfirmedAt != null))
        {
            newDoctor.VerificationStatus = VerificationStatus.Rejected;
            newDoctor.ClaimDisputed = false;
            Audit(dbContext, actorUserId, "SLMC_CLAIM_AUTO_REJECTED", newDoctor.Id, "REJECTED", new { Reason = "OwnershipAlreadyConfirmed" });
            await ClaimNotifications.NotifyAdminsAsync(dbContext, "SLMC_CLAIM_AUTO_REJECTED", "SLMC claim auto-rejected",
                $"A new registration claimed SLMC ••••{newDoctor.RegistrationNumberLastFour}, whose owner is already confirmed. It was rejected automatically; reopen it if it looks genuine.", cancellationToken);
            return ClaimOutcome.AutoRejected;
        }

        newDoctor.VerificationStatus = VerificationStatus.Pending;
        newDoctor.ClaimDisputed = true;
        var dispute = await dbContext.DoctorClaimDisputes
            .SingleOrDefaultAsync(x => x.RegistrationNumberHash == newDoctor.RegistrationNumberHash && x.Status == ClaimDisputeStatus.Open, cancellationToken);
        if (dispute is null)
        {
            dispute = new DoctorClaimDispute { RegistrationNumberHash = newDoctor.RegistrationNumberHash };
            dbContext.DoctorClaimDisputes.Add(dispute);
        }
        if (licenseSha256 is not null)
        {
            var ids = existing.Select(x => x.Id).ToList();
            if (await dbContext.DoctorLicenseDocuments.AnyAsync(x => ids.Contains(x.DoctorId) && x.Sha256 == licenseSha256, cancellationToken))
                dispute.DuplicateLicenseFile = true;
        }

        foreach (var claimant in existing)
        {
            claimant.ClaimDisputed = true;
            Audit(dbContext, actorUserId, "SLMC_CLAIM_DISPUTED", claimant.Id, "FLAGGED", new { DisputeId = dispute.Id });
        }
        Audit(dbContext, actorUserId, "SLMC_CLAIM_DISPUTED", newDoctor.Id, "PENDING",
            new { DisputeId = dispute.Id, ExistingClaimants = existing.Count, dispute.DuplicateLicenseFile });
        await ClaimNotifications.NotifyAdminsAsync(dbContext, "SLMC_CLAIM_DISPUTED", "New SLMC claim dispute",
            $"Another account claims SLMC ••••{newDoctor.RegistrationNumberLastFour}." + (dispute.DuplicateLicenseFile ? " The licence file is identical to an existing claimant's." : ""), cancellationToken);
        return ClaimOutcome.Disputed;
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
            loser.AccessFrozen = false;
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
        winner.AccessFrozen = false;
        winner.OwnershipConfirmedAt = now;
        var openRequests = await dbContext.ClaimEvidenceRequests
            .Where(x => x.DisputeId == dispute.Id && x.Status == EvidenceRequestStatus.Open).ToListAsync(cancellationToken);
        foreach (var open in openRequests) open.Status = EvidenceRequestStatus.Cancelled;
        if (winner.User is not null)
            ClaimNotifications.Notify(dbContext, winner.UserId, "SLMC_OWNERSHIP_CONFIRMED", "SLMC ownership confirmed",
                "An administrator confirmed you hold this SLMC number. No further action is needed.", "/dashboard");
        if (winner.User is not null) winner.User.IsActive = true;
        var unfrozen = 0;
        // Only still-live grants come back; a case closed during the dispute had its grant revoked already.
        foreach (var grant in grants.Where(x => x.DoctorId == winner.Id && x.FrozenAt != null && x.ExpiresAt > now))
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

    public async Task<EvidenceRequestDto> RequestEvidenceAsync(Guid disputeId, CreateEvidenceRequest request, CancellationToken cancellationToken)
    {
        RequireAdmin();
        var items = (request.Items ?? []).Distinct().ToList();
        if (items.Count == 0)
            throw new ValidationException(new Dictionary<string, string[]> { ["items"] = ["Choose at least one kind of evidence."] });
        var dispute = await dbContext.DoctorClaimDisputes.SingleOrDefaultAsync(x => x.Id == disputeId, cancellationToken) ?? throw new NotFoundException();
        if (dispute.Status != ClaimDisputeStatus.Open) throw new ConflictException("This dispute is already resolved.");
        var doctor = await dbContext.Doctors.SingleOrDefaultAsync(
            x => x.Id == request.DoctorId && x.RegistrationNumberHash == dispute.RegistrationNumberHash && x.ClaimDisputed, cancellationToken)
            ?? throw new ValidationException(new Dictionary<string, string[]> { ["doctorId"] = ["The doctor must be one of the dispute's claimants."] });

        var now = DateTimeOffset.UtcNow;
        var previous = await dbContext.ClaimEvidenceRequests
            .Where(x => x.DisputeId == dispute.Id && x.DoctorId == doctor.Id && x.Status == EvidenceRequestStatus.Open).ToListAsync(cancellationToken);
        foreach (var old in previous) old.Status = EvidenceRequestStatus.Cancelled;

        var evidence = new ClaimEvidenceRequest
        {
            DisputeId = dispute.Id, DoctorId = doctor.Id, RequestedByUserId = currentUser.UserId,
            RequestedItems = string.Join(',', items), Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            IsChallenge = request.IsChallenge, DueAt = now.Add(request.IsChallenge ? ChallengeWindow : StandardWindow)
        };
        dbContext.ClaimEvidenceRequests.Add(evidence);
        ClaimNotifications.Notify(dbContext, doctor.UserId, "SLMC_EVIDENCE_REQUESTED",
            request.IsChallenge ? "Someone has claimed your SLMC number" : "Evidence needed for your SLMC number",
            request.IsChallenge
                ? "Upload evidence within 3 days that you hold this SLMC number, or your account will be suspended."
                : "Upload the requested evidence within 30 days, or your account will be suspended.",
            "/dashboard");
        Audit(dbContext, currentUser.UserId, "SLMC_EVIDENCE_REQUESTED", doctor.Id, "OPEN",
            new { DisputeId = dispute.Id, Items = items.Select(x => x.ToString()), request.IsChallenge, DueAt = evidence.DueAt });
        await dbContext.SaveChangesAsync(cancellationToken);
        return ClaimEvidenceService.Map(evidence, []);
    }

    public async Task<LicenseDocumentFile> GetEvidenceFileAsync(Guid fileId, CancellationToken cancellationToken)
    {
        RequireAdmin();
        var file = await dbContext.ClaimEvidenceFiles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == fileId, cancellationToken) ?? throw new NotFoundException();
        var content = file.Content;
        if (content is null && file.StorageKey is not null && fileStore is not null && fileStore.Owns(file.StorageKey))
            content = await fileStore.ReadAsync(file.StorageKey, cancellationToken);
        if (content is null) throw new NotFoundException();
        Audit(dbContext, currentUser.UserId, "SLMC_EVIDENCE_FILE_READ", file.Id, "SUCCESS", new { file.RequestId, Kind = file.Kind.ToString() }, "ClaimEvidenceFile");
        await dbContext.SaveChangesAsync(cancellationToken);
        return new LicenseDocumentFile(file.FileName, file.ContentType, content);
    }

    public static readonly TimeSpan ChallengeWindow = TimeSpan.FromDays(3);
    public static readonly TimeSpan StandardWindow = TimeSpan.FromDays(30);

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
        var requests = await dbContext.ClaimEvidenceRequests.AsNoTracking()
            .Where(x => x.DisputeId == dispute.Id).OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        var requestIds = requests.Select(x => x.Id).ToList();
        var files = await dbContext.ClaimEvidenceFiles.AsNoTracking().Where(x => requestIds.Contains(x.RequestId)).ToListAsync(cancellationToken);
        return new ClaimDisputeDto(dispute.Id, lastFour, dispute.Status, register, dispute.CreatedAt, dispute.WinnerDoctorId,
            dispute.ResolvedAt, dispute.ResolutionReason,
            claimants.Select(x => new ClaimDisputeClaimantDto(x.Id, x.UserId, x.User?.DisplayName, x.User?.Email, x.VerificationStatus,
                SlmcNameMatcher.Classify(x.User?.DisplayName, register), withDocs.Contains(x.Id), x.CreatedAt,
                x.OwnershipConfirmedAt != null,
                requests.Where(r => r.DoctorId == x.Id).Select(r => ClaimEvidenceService.Map(r, files.Where(f => f.RequestId == r.Id))).ToList())).ToList(),
            dispute.DuplicateLicenseFile);
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
