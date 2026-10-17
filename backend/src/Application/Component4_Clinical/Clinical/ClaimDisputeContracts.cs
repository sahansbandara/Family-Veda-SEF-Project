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
    DateTimeOffset SubmittedAt);

public sealed record ClaimDisputeDto(
    Guid Id,
    string RegistrationNumberLastFour,
    ClaimDisputeStatus Status,
    string? RegisteredName,
    DateTimeOffset OpenedAt,
    Guid? WinnerDoctorId,
    DateTimeOffset? ResolvedAt,
    string? ResolutionReason,
    IReadOnlyList<ClaimDisputeClaimantDto> Claimants);

public sealed record ResolveClaimDisputeRequest(Guid WinnerDoctorId, string Reason);

public interface IClaimDisputeService
{
    Task<IReadOnlyList<ClaimDisputeDto>> GetDisputesAsync(bool includeResolved, CancellationToken cancellationToken);
    Task<ClaimDisputeDto> ResolveAsync(Guid disputeId, ResolveClaimDisputeRequest request, CancellationToken cancellationToken);
    Task<LicenseDocumentFile> GetLicenseDocumentAsync(Guid doctorId, CancellationToken cancellationToken);
}

public sealed record LicenseDocumentFile(string FileName, string ContentType, byte[] Content);
