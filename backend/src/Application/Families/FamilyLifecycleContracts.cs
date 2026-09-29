// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family lifecycle: invitations list/resend/cancel, remove adult, leave / start own family.
namespace FamilyVeda.Application.Families;

/// <summary>Status is derived: Accepted, Cancelled, Expired or Pending.</summary>
public sealed record FamilyInvitationSummaryDto(Guid Id, string? EmailMasked, string? RelationshipType, string Status,
    DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);

/// <summary>The full email is needed again because only a keyed hash of it is stored.</summary>
public sealed record ResendFamilyInvitationRequest(string Email);

public sealed record LeaveFamilyRequest(bool StartOwnFamily);

/// <summary>Where the moved member now lives. Family code is returned only to the member who moved.</summary>
public sealed record MembershipChangeDto(Guid MemberId, Guid FamilyId, string FamilyName, string? FamilyCode);

public interface IFamilyLifecycleService
{
    Task<IReadOnlyList<FamilyInvitationSummaryDto>> GetInvitationsAsync(Guid familyId, CancellationToken cancellationToken);
    Task<FamilyInvitationDto> ResendInvitationAsync(Guid familyId, Guid invitationId, ResendFamilyInvitationRequest request, CancellationToken cancellationToken);
    Task CancelInvitationAsync(Guid familyId, Guid invitationId, CancellationToken cancellationToken);
    Task<MembershipChangeDto> RemoveAdultAsync(Guid memberId, CancellationToken cancellationToken);
    Task<MembershipChangeDto> LeaveFamilyAsync(LeaveFamilyRequest request, CancellationToken cancellationToken);
}
