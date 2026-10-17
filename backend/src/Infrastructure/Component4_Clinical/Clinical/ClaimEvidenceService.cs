// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Doctor side of SLMC evidence requests, plus the deadline job that suspends a claimant who never answers.
// Uploads are validated by size and magic bytes; bytes go to Google Drive when configured (ADR-014), else the database.
using System.Security.Cryptography;
using System.Text.Json;
using FamilyVeda.Application.Clinical;
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Records;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Clinical;

public sealed class ClaimEvidenceService(AppDbContext dbContext, ICurrentUser currentUser, IExternalReportFileStore? fileStore = null)
    : IClaimEvidenceService, IClaimEvidenceDeadlineProcessor
{
    public const long MaxBytes = 5 * 1024 * 1024;
    public const string DeadlineMissedReason = "EvidenceDeadlineMissed";

    private static readonly Dictionary<string, (string Extension, byte[] Magic)> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        ["application/pdf"] = (".pdf", [0x25, 0x50, 0x44, 0x46]),
        ["image/png"] = (".png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        ["image/jpeg"] = (".jpg", [0xFF, 0xD8, 0xFF])
    };

    public async Task<IReadOnlyList<EvidenceRequestDto>> GetMyOpenRequestsAsync(CancellationToken cancellationToken)
    {
        var doctor = await RequireDoctorAsync(cancellationToken);
        var requests = await dbContext.ClaimEvidenceRequests.AsNoTracking()
            .Where(x => x.DoctorId == doctor.Id && x.Status == EvidenceRequestStatus.Open)
            .OrderBy(x => x.DueAt).ToListAsync(cancellationToken);
        var ids = requests.Select(x => x.Id).ToList();
        var files = await dbContext.ClaimEvidenceFiles.AsNoTracking().Where(x => ids.Contains(x.RequestId)).ToListAsync(cancellationToken);
        return requests.Select(r => Map(r, files.Where(f => f.RequestId == r.Id))).ToList();
    }

    public async Task<EvidenceRequestDto> UploadAsync(Guid requestId, EvidenceUpload upload, CancellationToken cancellationToken)
    {
        var doctor = await RequireDoctorAsync(cancellationToken);
        var request = await dbContext.ClaimEvidenceRequests.SingleOrDefaultAsync(x => x.Id == requestId && x.DoctorId == doctor.Id, cancellationToken)
            ?? throw new NotFoundException();
        if (request.Status != EvidenceRequestStatus.Open || request.DueAt <= DateTimeOffset.UtcNow)
            throw new ConflictException("This evidence request is closed.");
        var requested = Items(request);
        if (!requested.Contains(upload.Kind)) throw Invalid("kind", "This kind of evidence was not requested.");
        if (upload.Length <= 0 || upload.Length > MaxBytes) throw Invalid("file", "Upload a file up to 5 MB.");
        if (!Allowed.TryGetValue(upload.ContentType, out var type)) throw Invalid("file", "Upload a PDF, PNG or JPEG file.");

        using var buffer = new MemoryStream();
        await upload.Content.CopyToAsync(buffer, cancellationToken);
        var content = buffer.ToArray();
        if (content.Length > MaxBytes || !content.AsSpan().StartsWith(type.Magic)) throw Invalid("file", "The file content does not match its type.");

        string? storageKey = null;
        if (fileStore is { IsEnabled: true }) storageKey = await fileStore.SaveAsync(type.Extension, upload.ContentType.ToLowerInvariant(), content, cancellationToken);
        var file = new ClaimEvidenceFile
        {
            RequestId = request.Id, Kind = upload.Kind, FileName = Path.GetFileName(upload.FileName),
            ContentType = upload.ContentType.ToLowerInvariant(), SizeBytes = content.Length,
            Sha256 = Convert.ToHexString(SHA256.HashData(content)), StorageKey = storageKey,
            Content = storageKey is null ? content : null
        };
        dbContext.ClaimEvidenceFiles.Add(file);

        var uploadedKinds = await dbContext.ClaimEvidenceFiles.Where(x => x.RequestId == request.Id).Select(x => x.Kind).ToListAsync(cancellationToken);
        uploadedKinds.Add(upload.Kind);
        if (requested.All(uploadedKinds.Contains))
        {
            request.Status = EvidenceRequestStatus.Submitted;
            request.SubmittedAt = DateTimeOffset.UtcNow;
            await ClaimNotifications.NotifyAdminsAsync(dbContext, "SLMC_EVIDENCE_SUBMITTED", "SLMC evidence submitted",
                $"A claimant for SLMC ••••{doctor.RegistrationNumberLastFour} uploaded all requested evidence. Review the dispute.", cancellationToken);
        }
        Audit(currentUser.UserId, "SLMC_EVIDENCE_UPLOADED", doctor.Id, "SUCCESS",
            new { RequestId = request.Id, Kind = upload.Kind.ToString(), Storage = storageKey is null ? "Database" : "GoogleDrive" });
        await dbContext.SaveChangesAsync(cancellationToken);
        var files = await dbContext.ClaimEvidenceFiles.AsNoTracking().Where(x => x.RequestId == request.Id).ToListAsync(cancellationToken);
        return Map(request, files);
    }

    public async Task<int> ProcessExpiredAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var expired = await dbContext.ClaimEvidenceRequests.Include(x => x.Doctor).ThenInclude(x => x!.User)
            .Where(x => x.Status == EvidenceRequestStatus.Open && x.DueAt <= now).ToListAsync(cancellationToken);
        foreach (var request in expired)
        {
            request.Status = EvidenceRequestStatus.Expired;
            var doctor = request.Doctor!;
            if (doctor.VerificationStatus is VerificationStatus.Suspended or VerificationStatus.Rejected) continue;
            var previous = doctor.VerificationStatus;
            doctor.VerificationStatus = VerificationStatus.Suspended;
            doctor.ClaimDisputed = false;
            doctor.AccessFrozen = false;
            if (doctor.User is not null)
            {
                doctor.User.IsActive = false;
                doctor.User.RefreshTokenRevokedAt = now;
            }
            var grants = await dbContext.CaseAccessGrants.IgnoreQueryFilters()
                .Where(x => x.DoctorId == doctor.Id && x.RevokedAt == null).ToListAsync(cancellationToken);
            foreach (var grant in grants) grant.RevokedAt = now;
            dbContext.DoctorVerificationLogs.Add(new DoctorVerificationLog
            {
                DoctorId = doctor.Id, AdminUserId = request.RequestedByUserId, FromStatus = previous,
                ToStatus = VerificationStatus.Suspended, Reason = $"{DeadlineMissedReason}: no evidence by {request.DueAt:u}"
            });
            Audit(null, "SLMC_EVIDENCE_DEADLINE_MISSED", doctor.Id, "SUSPENDED",
                new { RequestId = request.Id, request.DisputeId, request.IsChallenge, RevokedGrants = grants.Count });
            await ClaimNotifications.NotifyAdminsAsync(dbContext, "SLMC_EVIDENCE_DEADLINE_MISSED", "Doctor suspended: evidence deadline missed",
                $"{doctor.User?.DisplayName ?? "A claimant"} (SLMC ••••{doctor.RegistrationNumberLastFour}) did not upload evidence in time and was suspended automatically.", cancellationToken);
        }
        if (expired.Count > 0) await dbContext.SaveChangesAsync(cancellationToken);
        return expired.Count;
    }

    internal static EvidenceRequestDto Map(ClaimEvidenceRequest r, IEnumerable<ClaimEvidenceFile> files) =>
        new(r.Id, r.DisputeId, Items(r), r.Note, r.IsChallenge, r.CreatedAt, r.DueAt, r.Status, r.SubmittedAt,
            files.OrderBy(f => f.CreatedAt).Select(f => new EvidenceFileDto(f.Id, f.Kind, f.FileName, f.ContentType, f.SizeBytes, f.CreatedAt)).ToList());

    private static List<EvidenceKind> Items(ClaimEvidenceRequest r) =>
        r.RequestedItems.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Enum.Parse<EvidenceKind>).ToList();

    private async Task<Doctor> RequireDoctorAsync(CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.Doctor) throw new ForbiddenException();
        return await dbContext.Doctors.SingleOrDefaultAsync(x => x.UserId == currentUser.UserId, cancellationToken) ?? throw new ForbiddenException();
    }

    private static ValidationException Invalid(string field, string message) => new(new Dictionary<string, string[]> { [field] = [message] });

    private void Audit(Guid? actor, string eventType, Guid resourceId, string outcome, object metadata) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = actor, EventType = eventType, ResourceType = "Doctor", ResourceId = resourceId,
            Outcome = outcome, MetadataJson = JsonSerializer.Serialize(metadata)
        });
}
