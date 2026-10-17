// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
using FamilyVeda.Domain.Common;

namespace FamilyVeda.Application.Clinical;

public sealed record ClaimDisputeClaimantDto(
    Guid DoctorId,
    Guid UserId,
    string? DisplayName,
    string? Email,
    VerificationStatus VerificationStatus,
    RegisterMatch RegisterMatch,
    bool HasLicenseDocument,
    DateTimeOffset SubmittedAt,
    bool OwnershipConfirmed = false,
    IReadOnlyList<EvidenceRequestDto>? EvidenceRequests = null);

public sealed record EvidenceFileDto(Guid Id, EvidenceKind Kind, string FileName, string ContentType, long SizeBytes, DateTimeOffset UploadedAt);

public sealed record EvidenceRequestDto(
    Guid Id,
    Guid DisputeId,
    IReadOnlyList<EvidenceKind> RequestedItems,
    string? Note,
    bool IsChallenge,
    DateTimeOffset RequestedAt,
    DateTimeOffset DueAt,
    EvidenceRequestStatus Status,
    DateTimeOffset? SubmittedAt,
    IReadOnlyList<EvidenceFileDto> Files);

public sealed record CreateEvidenceRequest(Guid DoctorId, IReadOnlyList<EvidenceKind> Items, string? Note, bool IsChallenge);

public sealed record EvidenceUpload(EvidenceKind Kind, string FileName, string ContentType, long Length, Stream Content);

public sealed record ClaimDisputeDto(
    Guid Id,
    string RegistrationNumberLastFour,
    ClaimDisputeStatus Status,
    string? RegisteredName,
    DateTimeOffset OpenedAt,
    Guid? WinnerDoctorId,
    DateTimeOffset? ResolvedAt,
    string? ResolutionReason,
    IReadOnlyList<ClaimDisputeClaimantDto> Claimants,
    bool DuplicateLicenseFile = false);

public sealed record ResolveClaimDisputeRequest(Guid WinnerDoctorId, string Reason);

public interface IClaimDisputeService
{
    Task<IReadOnlyList<ClaimDisputeDto>> GetDisputesAsync(bool includeResolved, CancellationToken cancellationToken);
    Task<ClaimDisputeDto> ResolveAsync(Guid disputeId, ResolveClaimDisputeRequest request, CancellationToken cancellationToken);
    Task<LicenseDocumentFile> GetLicenseDocumentAsync(Guid doctorId, CancellationToken cancellationToken);
    Task<EvidenceRequestDto> RequestEvidenceAsync(Guid disputeId, CreateEvidenceRequest request, CancellationToken cancellationToken);
    Task<LicenseDocumentFile> GetEvidenceFileAsync(Guid fileId, CancellationToken cancellationToken);
}

/// <summary>Doctor side: see and answer the evidence requests addressed to the signed-in doctor.</summary>
public interface IClaimEvidenceService
{
    Task<IReadOnlyList<EvidenceRequestDto>> GetMyOpenRequestsAsync(CancellationToken cancellationToken);
    Task<EvidenceRequestDto> UploadAsync(Guid requestId, EvidenceUpload upload, CancellationToken cancellationToken);
}

/// <summary>Server job: a claimant who misses the evidence deadline is suspended automatically and admins are told.</summary>
public interface IClaimEvidenceDeadlineProcessor
{
    Task<int> ProcessExpiredAsync(CancellationToken cancellationToken);
}

public enum ClaimOutcome { None, Disputed, AutoRejected }

public sealed record LicenseDocumentFile(string FileName, string ContentType, byte[] Content);
