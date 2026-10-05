// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Reads and renames the signed-in user's own account. Email, role and clinical fields are read-only here.
using FamilyVeda.Application.Auth;
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Auth;

public sealed class ProfileService(AppDbContext dbContext, ICurrentUser currentUser) : IProfileService
{
    public async Task<MyProfileDto> GetMineAsync(CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException();
        var member = await dbContext.Members.AsNoTracking()
            .Where(x => x.UserId == user.Id)
            .Select(x => new { x.Role, x.DateOfBirth, x.SexForClinicalReference, FamilyName = x.Family!.Name, x.Family.FamilyCode })
            .SingleOrDefaultAsync(cancellationToken);
        return new MyProfileDto(user.Id, user.Email, user.DisplayName, user.UserType.ToString(), user.CreatedAt,
            member?.Role.ToString(), member?.FamilyName, member?.FamilyCode, member?.DateOfBirth, member?.SexForClinicalReference.ToString());
    }

    public async Task<MyProfileDto> UpdateMineAsync(UpdateMyProfileRequest request, CancellationToken cancellationToken)
    {
        var name = (request.DisplayName ?? string.Empty).Trim();
        if (name.Length is < 2 or > 120)
            throw new ValidationException(new Dictionary<string, string[]> { ["displayName"] = ["Enter a name between 2 and 120 characters."] });
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == currentUser.UserId, cancellationToken) ?? throw new NotFoundException();
        user.DisplayName = name;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        var member = await dbContext.Members.SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        if (member is not null) { member.DisplayName = name; member.UpdatedAt = DateTimeOffset.UtcNow; }
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = user.Id,
            EventType = "PROFILE_UPDATED",
            ResourceType = "UserAccount",
            ResourceId = user.Id,
            Outcome = "SUCCESS",
            MetadataJson = "{}"
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetMineAsync(cancellationToken);
    }
}
