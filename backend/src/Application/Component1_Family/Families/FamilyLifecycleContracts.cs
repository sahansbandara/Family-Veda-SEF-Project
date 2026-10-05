// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family lifecycle: invitations list/resend/cancel, remove adult, leave / start own family.
namespace FamilyVeda.Application.Families;

/// <summary>Status is derived: Accepted, Cancelled, Expired or Pending.</summary>
public sealed record FamilyInvitationSummaryDto(Guid Id, string? EmailMasked, string? RelationshipType, string Status,
    DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);

/// <summary>The full email is needed again because only a keyed hash of it is stored.</summary>
public sealed record ResendFamilyInvitationRequest(string Email);

public sealed record LeaveFamilyRequest(bool StartOwnFamily);

/// <summary>Family-level roster: no date of birth, clinical sex or health data for other adults.</summary>
public sealed record RosterMemberDto(Guid Id, string DisplayName, string Role, bool IsMinor, bool IsSelf, bool HasAccount);

/// <summary>Where the moved member now lives. Family code is returned only to the member who moved.</summary>
public sealed record MembershipChangeDto(Guid MemberId, Guid FamilyId, string FamilyName, string? FamilyCode);

public interface IFamilyLifecycleService
{
    Task<IReadOnlyList<RosterMemberDto>> GetRosterAsync(Guid familyId, CancellationToken cancellationToken);
    Task<IReadOnlyList<FamilyInvitationSummaryDto>> GetInvitationsAsync(Guid familyId, CancellationToken cancellationToken);
    Task<FamilyInvitationDto> ResendInvitationAsync(Guid familyId, Guid invitationId, ResendFamilyInvitationRequest request, CancellationToken cancellationToken);
    Task CancelInvitationAsync(Guid familyId, Guid invitationId, CancellationToken cancellationToken);
    Task<MembershipChangeDto> RemoveAdultAsync(Guid memberId, CancellationToken cancellationToken);
    Task<MembershipChangeDto> LeaveFamilyAsync(LeaveFamilyRequest request, CancellationToken cancellationToken);
}

// ===== Family Head transfer (FH-3): two-person approval =====
public sealed record CreateHeadTransferRequest(Guid ToMemberId);

/// <summary>Visible to the current Head (outgoing) and to the proposed adult (incoming) only.</summary>
public sealed record HeadTransferDto(Guid Id, Guid FamilyId, string FamilyName, Guid FromMemberId, string FromDisplayName,
    Guid ToMemberId, string ToDisplayName, string Status, DateTimeOffset CreatedAt, DateTimeOffset? RespondedAt);

public interface IFamilyHeadTransferService
{
    Task<HeadTransferDto> ProposeAsync(Guid familyId, CreateHeadTransferRequest request, CancellationToken cancellationToken);
    Task<HeadTransferDto?> GetPendingForFamilyAsync(Guid familyId, CancellationToken cancellationToken);
    Task<HeadTransferDto?> GetIncomingAsync(CancellationToken cancellationToken);
    Task<HeadTransferDto> AcceptAsync(Guid transferId, CancellationToken cancellationToken);
    Task<HeadTransferDto> DeclineAsync(Guid transferId, CancellationToken cancellationToken);
    Task<HeadTransferDto> CancelAsync(Guid transferId, CancellationToken cancellationToken);
}

// ===== Incoming invitations: the signed-in invitee approves or rejects without a token =====
/// <summary>An invitation addressed to the caller's own email. <c>CanApprove</c> is false while they share another family.</summary>
public sealed record IncomingInvitationDto(Guid Id, string FamilyName, string InvitedByName, string? RelationshipType,
    DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt, bool CanApprove, string? BlockedReason);

public interface IIncomingInvitationService
{
    Task<IReadOnlyList<IncomingInvitationDto>> GetMineAsync(CancellationToken cancellationToken);
    Task<MembershipChangeDto> ApproveAsync(Guid invitationId, CancellationToken cancellationToken);
    Task RejectAsync(Guid invitationId, CancellationToken cancellationToken);
}
