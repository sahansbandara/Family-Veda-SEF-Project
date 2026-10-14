// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// FH-3 two-person Head transfer (blueprint "Transfer Family Head"): the current Head proposes, the adult
// accepts or declines. Acceptance swaps the two Member.Role values in one SaveChanges (one transaction).
// Family.CreatedByUserId is never changed; it is history (DECISIONS 2026-09-29b).
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Families;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Families;

public sealed class FamilyHeadTransferService(AppDbContext dbContext, ICurrentUser currentUser) : IFamilyHeadTransferService
{
    public async Task<HeadTransferDto> ProposeAsync(Guid familyId, CreateHeadTransferRequest request, CancellationToken cancellationToken)
    {
        await RequireHeadAsync(familyId, cancellationToken);
        var from = await dbContext.Members.SingleAsync(x => x.FamilyId == familyId && x.UserId == currentUser.UserId, cancellationToken);
        var to = await dbContext.Members.SingleOrDefaultAsync(x => x.Id == request.ToMemberId && x.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException();
        if (to.Id == from.Id) throw new ConflictException("You are already the Family Head.");
        if (to.Role != FamilyRole.AdultMember || to.UserId is null || to.DateOfBirth.AddYears(18) > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ConflictException("The Family Head role can only go to an adult member with their own account.");
        if (await dbContext.FamilyHeadTransfers.AnyAsync(x => x.FamilyId == familyId && x.Status == PortalRequestStatus.Pending, cancellationToken))
            throw new ConflictException("A transfer is already waiting for an answer. Cancel it first.");

        var transfer = new FamilyHeadTransfer
        {
            FamilyId = familyId,
            FromMemberId = from.Id,
            ToMemberId = to.Id,
            RequestedByUserId = currentUser.UserId
        };
        dbContext.FamilyHeadTransfers.Add(transfer);
        AddAudit("FAMILY_HEAD_TRANSFER_PROPOSED", transfer.Id, to.Id);
        AddNotification(to.UserId.Value, "FAMILY_HEAD_TRANSFER_REQUESTED", "Family Head role offered",
            $"{from.DisplayName} asked you to become the Family Head.", "/dashboard");
        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapAsync(transfer, cancellationToken);
    }

    public async Task<HeadTransferDto?> GetPendingForFamilyAsync(Guid familyId, CancellationToken cancellationToken)
    {
        await RequireHeadAsync(familyId, cancellationToken);
        var transfer = await dbContext.FamilyHeadTransfers.AsNoTracking()
            .SingleOrDefaultAsync(x => x.FamilyId == familyId && x.Status == PortalRequestStatus.Pending, cancellationToken);
        return transfer is null ? null : await MapAsync(transfer, cancellationToken);
    }

    public async Task<HeadTransferDto?> GetIncomingAsync(CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.FamilyUser) return null;
        var memberId = await dbContext.Members.Where(x => x.UserId == currentUser.UserId).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(cancellationToken);
        if (memberId is null) return null;
        var transfer = await dbContext.FamilyHeadTransfers.AsNoTracking()
            .SingleOrDefaultAsync(x => x.ToMemberId == memberId && x.Status == PortalRequestStatus.Pending, cancellationToken);
        return transfer is null ? null : await MapAsync(transfer, cancellationToken);
    }

    public async Task<HeadTransferDto> AcceptAsync(Guid transferId, CancellationToken cancellationToken)
    {
        var (transfer, target) = await RequireTargetAsync(transferId, cancellationToken);
        var from = await dbContext.Members.SingleOrDefaultAsync(x => x.Id == transfer.FromMemberId && x.FamilyId == transfer.FamilyId, cancellationToken);
        // The proposer must still be Head and the target still an adult member of this family.
        if (from is null || from.Role != FamilyRole.Head || target.FamilyId != transfer.FamilyId || target.Role != FamilyRole.AdultMember)
        {
            transfer.Status = PortalRequestStatus.Cancelled;
            transfer.RespondedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new ConflictException("The family changed since this was proposed. Ask the Family Head to propose again.");
        }

        from.Role = FamilyRole.AdultMember;
        target.Role = FamilyRole.Head;
        transfer.Status = PortalRequestStatus.Accepted;
        transfer.RespondedAt = DateTimeOffset.UtcNow;
        AddAudit("FAMILY_HEAD_TRANSFERRED", transfer.Id, target.Id);
        if (from.UserId is { } oldHeadUserId)
            AddNotification(oldHeadUserId, "FAMILY_HEAD_TRANSFER_ACCEPTED", "Family Head role transferred",
                $"{target.DisplayName} is now the Family Head. You are an Adult Member.", "/dashboard");
        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapAsync(transfer, cancellationToken);
    }

    public async Task<HeadTransferDto> DeclineAsync(Guid transferId, CancellationToken cancellationToken)
    {
        var (transfer, target) = await RequireTargetAsync(transferId, cancellationToken);
        transfer.Status = PortalRequestStatus.Declined;
        transfer.RespondedAt = DateTimeOffset.UtcNow;
        AddAudit("FAMILY_HEAD_TRANSFER_DECLINED", transfer.Id, target.Id);
        AddNotification(transfer.RequestedByUserId, "FAMILY_HEAD_TRANSFER_DECLINED", "Family Head transfer declined",
            $"{target.DisplayName} declined the Family Head role.", "/family?tab=settings");
        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapAsync(transfer, cancellationToken);
    }

    public async Task<HeadTransferDto> CancelAsync(Guid transferId, CancellationToken cancellationToken)
    {
        var transfer = await dbContext.FamilyHeadTransfers.SingleOrDefaultAsync(x => x.Id == transferId, cancellationToken) ?? throw new NotFoundException();
        await RequireHeadAsync(transfer.FamilyId, cancellationToken);
        if (transfer.Status != PortalRequestStatus.Pending) throw new ConflictException("This transfer has already been answered.");
        transfer.Status = PortalRequestStatus.Cancelled;
        transfer.RespondedAt = DateTimeOffset.UtcNow;
        AddAudit("FAMILY_HEAD_TRANSFER_CANCELLED", transfer.Id, transfer.ToMemberId);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapAsync(transfer, cancellationToken);
    }

    /// <summary>Only the proposed adult may answer. Anyone else gets 404; an answered transfer is a 409.</summary>
    private async Task<(FamilyHeadTransfer Transfer, Member Target)> RequireTargetAsync(Guid transferId, CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.FamilyUser) throw new NotFoundException();
        var transfer = await dbContext.FamilyHeadTransfers.SingleOrDefaultAsync(x => x.Id == transferId, cancellationToken) ?? throw new NotFoundException();
        var target = await dbContext.Members.SingleOrDefaultAsync(x => x.Id == transfer.ToMemberId, cancellationToken);
        if (target is null || target.UserId != currentUser.UserId) throw new NotFoundException();
        if (transfer.Status != PortalRequestStatus.Pending) throw new ConflictException("This transfer is no longer open.");
        return (transfer, target);
    }

    private async Task RequireHeadAsync(Guid familyId, CancellationToken cancellationToken)
    {
        if (currentUser.UserType != UserType.FamilyUser ||
            !await dbContext.Families.Where(x => x.Id == familyId).AnyAsync(FamilyAccess.HeadedBy(currentUser.UserId), cancellationToken))
            throw new NotFoundException();
    }

    private async Task<HeadTransferDto> MapAsync(FamilyHeadTransfer transfer, CancellationToken cancellationToken)
    {
        var names = await dbContext.Members.AsNoTracking()
            .Where(x => x.Id == transfer.FromMemberId || x.Id == transfer.ToMemberId)
            .ToDictionaryAsync(x => x.Id, x => x.DisplayName, cancellationToken);
        var familyName = await dbContext.Families.AsNoTracking().Where(x => x.Id == transfer.FamilyId).Select(x => x.Name).SingleAsync(cancellationToken);
        return new HeadTransferDto(transfer.Id, transfer.FamilyId, familyName,
            transfer.FromMemberId, names.GetValueOrDefault(transfer.FromMemberId, "Former member"),
            transfer.ToMemberId, names.GetValueOrDefault(transfer.ToMemberId, "Former member"),
            transfer.Status.ToString(), transfer.CreatedAt, transfer.RespondedAt);
    }

    private void AddAudit(string eventType, Guid transferId, Guid subjectMemberId) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = currentUser.UserId,
            SubjectMemberId = subjectMemberId,
            EventType = eventType,
            ResourceType = "FamilyHeadTransfer",
            ResourceId = transferId,
            Outcome = "SUCCESS",
            MetadataJson = "{}"
        });

    private void AddNotification(Guid userId, string type, string title, string body, string? linkPath) =>
        dbContext.PortalNotifications.Add(new PortalNotification { UserId = userId, Type = type, Title = title, Body = body, LinkPath = linkPath });
}
