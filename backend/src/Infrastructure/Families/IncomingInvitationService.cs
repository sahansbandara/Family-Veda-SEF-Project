// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Invitations addressed to the signed-in user's own email. The user approves or rejects in-app, so no token
// has to travel outside the system. Matching uses InvitedEmailLookupHash; the full email is never stored.
// Every mismatch is a 404 so another person's invitation is never confirmed to exist.
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Families;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Families;

public sealed class IncomingInvitationService(AppDbContext dbContext, ICurrentUser currentUser) : IIncomingInvitationService
{
    private readonly FamilyMembershipMover mover = new(dbContext);

    public async Task<IReadOnlyList<IncomingInvitationDto>> GetMineAsync(CancellationToken cancellationToken)
    {
        var lookup = await LookupHashAsync(cancellationToken);
        if (lookup is null) return [];
        var now = DateTimeOffset.UtcNow;
        var ownFamilyId = await dbContext.Members.AsNoTracking().Where(x => x.UserId == currentUser.UserId).Select(x => (Guid?)x.FamilyId).SingleOrDefaultAsync(cancellationToken);

        var rows = await dbContext.FamilyInvitations.AsNoTracking()
            .Where(x => x.InvitedEmailLookupHash == lookup && x.AcceptedAt == null && x.CancelledAt == null && x.ExpiresAt > now
                        && x.FamilyId != ownFamilyId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new { x.Id, FamilyName = x.Family!.Name, InvitedBy = x.InvitedByUser!.DisplayName, x.RelationshipType, x.CreatedAt, x.ExpiresAt })
            .ToListAsync(cancellationToken);
        if (rows.Count == 0) return [];

        var blockedReason = await BlockedReasonAsync(cancellationToken);
        return rows.Select(x => new IncomingInvitationDto(x.Id, x.FamilyName, x.InvitedBy, x.RelationshipType, x.CreatedAt, x.ExpiresAt,
            blockedReason is null, blockedReason)).ToList();
    }

    public async Task<MembershipChangeDto> ApproveAsync(Guid invitationId, CancellationToken cancellationToken)
    {
        var invitation = await RequirePendingMineAsync(invitationId, cancellationToken);
        var user = await dbContext.Users.SingleAsync(x => x.Id == currentUser.UserId, cancellationToken);
        var existing = await dbContext.Members.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken)
            ?? throw new ConflictException("Complete your profile first, or register with the invitation token from your Family Head.");
        if (existing.FamilyId == invitation.FamilyId) throw new ConflictException("You are already a member of this family.");
        if (existing.DateOfBirth.AddYears(18) > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ConflictException("Adult family invitations require an age of at least 18 years.");
        await mover.RequireCanJoinAnotherFamilyAsync(user.Id, cancellationToken);

        // A user alone in their own household moves in with their history (DECISIONS 2026-09-29c).
        var member = await mover.AttachAdultAsync(user, invitation.FamilyId, existing.DateOfBirth, existing.SexForClinicalReference, cancellationToken);
        invitation.AcceptedAt = DateTimeOffset.UtcNow;
        invitation.AcceptedByUserId = user.Id;
        AddAudit("FAMILY_INVITATION_ACCEPTED", invitation.Id, member.Id);
        var family = await dbContext.Families.SingleAsync(x => x.Id == invitation.FamilyId, cancellationToken);
        Notify(await dbContext.GetHeadUserIdAsync(invitation.FamilyId, cancellationToken), "FAMILY_INVITATION_ACCEPTED",
            "Invitation accepted", $"{user.DisplayName} accepted your invitation and joined the family.", "/family?tab=members");
        await dbContext.SaveChangesAsync(cancellationToken);
        return new MembershipChangeDto(member.Id, family.Id, family.Name, null);
    }

    public async Task RejectAsync(Guid invitationId, CancellationToken cancellationToken)
    {
        var invitation = await RequirePendingMineAsync(invitationId, cancellationToken);
        invitation.CancelledAt = DateTimeOffset.UtcNow;
        AddAudit("FAMILY_INVITATION_DECLINED", invitation.Id, null);
        Notify(invitation.InvitedByUserId, "FAMILY_INVITATION_DECLINED", "Invitation declined",
            $"The invitation sent to {invitation.InvitedEmailMasked ?? "an adult"} was declined.", "/family?tab=invitations");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<FamilyInvitation> RequirePendingMineAsync(Guid invitationId, CancellationToken cancellationToken)
    {
        var lookup = await LookupHashAsync(cancellationToken) ?? throw new NotFoundException();
        var invitation = await dbContext.FamilyInvitations.SingleOrDefaultAsync(x => x.Id == invitationId && x.InvitedEmailLookupHash == lookup, cancellationToken);
        if (invitation is null || invitation.AcceptedAt is not null || invitation.CancelledAt is not null || invitation.ExpiresAt <= DateTimeOffset.UtcNow)
            throw new NotFoundException();
        return invitation;
    }

    private async Task<string?> LookupHashAsync(CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.FamilyUser) return null;
        var email = await dbContext.Users.AsNoTracking().Where(x => x.Id == currentUser.UserId).Select(x => x.Email).SingleOrDefaultAsync(cancellationToken);
        return email is null ? null : InvitationCrypto.LookupHash(email);
    }

    private async Task<string?> BlockedReasonAsync(CancellationToken cancellationToken)
    {
        var member = await dbContext.Members.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == currentUser.UserId, cancellationToken);
        if (member is null) return "Complete your profile first, or register with the invitation token.";
        if (!await dbContext.Members.AnyAsync(x => x.FamilyId == member.FamilyId && x.Id != member.Id, cancellationToken)) return null;
        return member.Role == FamilyRole.Head
            ? "Transfer the Family Head role and leave your current family before joining another one."
            : "Leave your current family before joining another one.";
    }

    private void AddAudit(string eventType, Guid invitationId, Guid? subjectMemberId) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = currentUser.UserId,
            SubjectMemberId = subjectMemberId,
            EventType = eventType,
            ResourceType = "FamilyInvitation",
            ResourceId = invitationId,
            Outcome = "SUCCESS",
            MetadataJson = "{}"
        });

    private void Notify(Guid userId, string type, string title, string body, string linkPath) =>
        dbContext.PortalNotifications.Add(new PortalNotification { UserId = userId, Type = type, Title = title, Body = body, LinkPath = linkPath });
}
