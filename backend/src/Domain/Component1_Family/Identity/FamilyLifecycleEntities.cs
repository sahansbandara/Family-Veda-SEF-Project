// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family lifecycle history (agent/DECISIONS.md 2026-09-29c). Rows are append-only history.
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Portal;

namespace FamilyVeda.Domain.Identity;

public enum MembershipChangeReason { RemovedByHead, LeftFamily, StartedOwnFamily, JoinedFamily }

/// <summary>A member row moved between families. The member keeps its id, so all health history moves with it.</summary>
public sealed class FamilyMembershipEvent : Entity
{
    public Guid MemberId { get; set; }
    public Member? Member { get; set; }
    public Guid FromFamilyId { get; set; }
    public Guid ToFamilyId { get; set; }
    public MembershipChangeReason Reason { get; set; }
    public FamilyRole PreviousRole { get; set; }
    public Guid ActorUserId { get; set; }
}

/// <summary>Two-person Head transfer: the current Head proposes, the adult accepts or declines.</summary>
public sealed class FamilyHeadTransfer : Entity
{
    public Guid FamilyId { get; set; }
    public Family? Family { get; set; }
    public Guid FromMemberId { get; set; }
    public Guid ToMemberId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public PortalRequestStatus Status { get; set; } = PortalRequestStatus.Pending;
    public DateTimeOffset? RespondedAt { get; set; }
}
