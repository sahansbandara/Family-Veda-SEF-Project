// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Invitations list/resend/cancel, Remove from Family (Head) and Leave / Start My Own Family (adult).
// Every denial for another family's data is a 404 so existence is never confirmed.
using System.Security.Cryptography;
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Families;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Families;

public sealed class FamilyLifecycleService(AppDbContext dbContext, ICurrentUser currentUser) : IFamilyLifecycleService
{
    private readonly FamilyMembershipMover mover = new(dbContext);

    public static readonly TimeSpan InvitationLifetime = TimeSpan.FromHours(48);

    public async Task<IReadOnlyList<RosterMemberDto>> GetRosterAsync(Guid familyId, CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.FamilyUser ||
            !await dbContext.Families.Where(x => x.Id == familyId).AnyAsync(FamilyAccess.BelongsTo(currentUser.UserId), cancellationToken))
            throw new NotFoundException();
        var adultCutoff = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-18);
        return await dbContext.Members.AsNoTracking()
            .Where(x => x.FamilyId == familyId)
            .OrderBy(x => x.Role).ThenBy(x => x.DisplayName)
            .Select(x => new RosterMemberDto(x.Id, x.DisplayName, x.Role.ToString(), x.DateOfBirth > adultCutoff,
                x.UserId == currentUser.UserId, x.UserId != null))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FamilyInvitationSummaryDto>> GetInvitationsAsync(Guid familyId, CancellationToken cancellationToken)
    {
        await RequireHeadAsync(familyId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var invitations = await dbContext.FamilyInvitations.AsNoTracking()
            .Where(x => x.FamilyId == familyId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
        return invitations.Select(x => new FamilyInvitationSummaryDto(
            x.Id, x.InvitedEmailMasked, x.RelationshipType, StatusOf(x, now), x.CreatedAt, x.ExpiresAt)).ToList();
    }

    public async Task<FamilyInvitationDto> ResendInvitationAsync(Guid familyId, Guid invitationId, ResendFamilyInvitationRequest request, CancellationToken cancellationToken)
    {
        await RequireHeadAsync(familyId, cancellationToken);
        var old = await dbContext.FamilyInvitations.SingleOrDefaultAsync(x => x.Id == invitationId && x.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException();
        if (old.AcceptedAt is not null || old.CancelledAt is not null)
            throw new ConflictException("Only a pending or expired invitation can be resent.");
        var email = NormalizeEmail(request.Email);
        if (old.InvitedEmailMasked is not null && old.InvitedEmailMasked != InvitationCrypto.MaskEmail(email))
            throw new ValidationException(new Dictionary<string, string[]> { ["email"] = ["Enter the same email address the invitation was sent to."] });

        // A fresh token replaces the old one; the old invitation stops working immediately.
        old.CancelledAt = DateTimeOffset.UtcNow;
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var invitation = new FamilyInvitation
        {
            FamilyId = familyId,
            InvitedByUserId = currentUser.UserId,
            InvitedEmailHash = InvitationCrypto.HashEmail(email, token),
            InvitedEmailLookupHash = InvitationCrypto.LookupHash(email),
            InvitedEmailMasked = InvitationCrypto.MaskEmail(email),
            RelationshipType = old.RelationshipType,
            TokenHash = InvitationCrypto.Hash(token),
            ExpiresAt = DateTimeOffset.UtcNow.Add(InvitationLifetime)
        };
        dbContext.FamilyInvitations.Add(invitation);
        AddAudit("FAMILY_INVITATION_RESENT", "FamilyInvitation", invitation.Id, null);
        await InvitationCrypto.NotifyExistingInviteeAsync(dbContext, email, familyId, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new FamilyInvitationDto(invitation.Id, token, invitation.ExpiresAt);
    }

    public async Task CancelInvitationAsync(Guid familyId, Guid invitationId, CancellationToken cancellationToken)
    {
        await RequireHeadAsync(familyId, cancellationToken);
        var invitation = await dbContext.FamilyInvitations.SingleOrDefaultAsync(x => x.Id == invitationId && x.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException();
        if (invitation.AcceptedAt is not null) throw new ConflictException("An accepted invitation cannot be cancelled.");
        if (invitation.CancelledAt is not null) return;
        invitation.CancelledAt = DateTimeOffset.UtcNow;
        AddAudit("FAMILY_INVITATION_CANCELLED", "FamilyInvitation", invitation.Id, null);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<MembershipChangeDto> RemoveAdultAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var member = await dbContext.Members.SingleOrDefaultAsync(x => x.Id == memberId, cancellationToken) ?? throw new NotFoundException();
        await RequireHeadAsync(member.FamilyId, cancellationToken);
        if (member.UserId == currentUser.UserId)
            throw new ConflictException("Transfer the Family Head role before leaving the family.");
        if (member.UserId is null || member.Role != FamilyRole.AdultMember)
            throw new ConflictException("Only adult members with their own account can be removed. Minor profiles are managed from Members.");

        var oldFamilyName = await FamilyNameAsync(member.FamilyId, cancellationToken);
        var household = await mover.MoveToOwnHouseholdAsync(member, MembershipChangeReason.RemovedByHead, currentUser.UserId, cancellationToken);
        AddNotification(member.UserId.Value, "FAMILY_MEMBER_REMOVED", "You were removed from a family",
            $"The Family Head removed you from {oldFamilyName}. Your health history is kept in your own household.", "/join-family");
        await dbContext.SaveChangesAsync(cancellationToken);
        // The Head does not learn the adult's new family code.
        return new MembershipChangeDto(member.Id, household.Id, household.Name, null);
    }

    public async Task<MembershipChangeDto> LeaveFamilyAsync(LeaveFamilyRequest request, CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.FamilyUser) throw new NotFoundException();
        var member = await dbContext.Members.SingleOrDefaultAsync(x => x.UserId == currentUser.UserId, cancellationToken) ?? throw new NotFoundException();
        var othersInFamily = await dbContext.Members.AnyAsync(x => x.FamilyId == member.FamilyId && x.Id != member.Id, cancellationToken);
        if (!othersInFamily) throw new ConflictException("You already have your own household.");
        if (member.Role == FamilyRole.Head) throw new ConflictException("Transfer the Family Head role before leaving the family.");

        var oldFamilyId = member.FamilyId;
        var reason = request.StartOwnFamily ? MembershipChangeReason.StartedOwnFamily : MembershipChangeReason.LeftFamily;
        var household = await mover.MoveToOwnHouseholdAsync(member, reason, currentUser.UserId, cancellationToken);
        AddNotification(await dbContext.GetHeadUserIdAsync(oldFamilyId, cancellationToken), "FAMILY_MEMBER_LEFT", "A member left your family",
            $"{member.DisplayName} left the family.", "/family");
        await dbContext.SaveChangesAsync(cancellationToken);
        return new MembershipChangeDto(member.Id, household.Id, household.Name, household.FamilyCode);
    }

    private static string StatusOf(FamilyInvitation invitation, DateTimeOffset now) =>
        invitation.AcceptedAt is not null ? "Accepted"
        : invitation.CancelledAt is not null ? "Cancelled"
        : invitation.ExpiresAt <= now ? "Expired"
        : "Pending";

    private static string NormalizeEmail(string? email)
    {
        var value = (email ?? string.Empty).Trim().ToLowerInvariant();
        if (value.Length is 0 or > 254 || !value.Contains('@'))
            throw new ValidationException(new Dictionary<string, string[]> { ["email"] = ["A valid invitation email is required."] });
        return value;
    }

    private async Task RequireHeadAsync(Guid familyId, CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.FamilyUser ||
            !await dbContext.Families.Where(x => x.Id == familyId).AnyAsync(FamilyAccess.HeadedBy(currentUser.UserId), cancellationToken))
            throw new NotFoundException();
    }

    private Task<string> FamilyNameAsync(Guid familyId, CancellationToken cancellationToken) =>
        dbContext.Families.Where(x => x.Id == familyId).Select(x => x.Name).SingleAsync(cancellationToken);

    private void AddAudit(string eventType, string resourceType, Guid resourceId, Guid? subjectMemberId) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = currentUser.UserId,
            SubjectMemberId = subjectMemberId,
            EventType = eventType,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Outcome = "SUCCESS",
            MetadataJson = "{}"
        });

    private void AddNotification(Guid userId, string type, string title, string body, string? linkPath) =>
        dbContext.PortalNotifications.Add(new PortalNotification { UserId = userId, Type = type, Title = title, Body = body, LinkPath = linkPath });
}
