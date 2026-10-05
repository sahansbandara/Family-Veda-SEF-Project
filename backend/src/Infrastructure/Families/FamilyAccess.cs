// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Single definition of "current Family Head" and "my family" (agent/DECISIONS.md 2026-09-29).
// Member.Role == Head is the source of truth. Family.CreatedByUserId is history only; it counts
// solely while the family has no Head member yet (legacy onboarding creates the family first).
using System.Linq.Expressions;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Families;

public static class FamilyAccess
{
    /// <summary>Translatable predicate: <paramref name="userId"/> currently manages the family.</summary>
    public static Expression<Func<Family, bool>> HeadedBy(Guid userId) => family =>
        family.Members.Any(m => m.UserId == userId && m.Role == FamilyRole.Head)
        || (family.CreatedByUserId == userId && !family.Members.Any(m => m.Role == FamilyRole.Head));

    /// <summary>Translatable predicate: the family the user belongs to (or is bootstrapping).</summary>
    public static Expression<Func<Family, bool>> BelongsTo(Guid userId) => family =>
        family.Members.Any(m => m.UserId == userId)
        || (family.CreatedByUserId == userId && !family.Members.Any(m => m.Role == FamilyRole.Head));

    /// <summary>In-memory check on a family loaded with its Members.</summary>
    public static bool IsHead(Family family, Guid userId) => HeadedByCompiled(userId)(family);

    /// <summary>User id of the current Head, for notifications. Falls back to the creator while bootstrapping.</summary>
    public static async Task<Guid> GetHeadUserIdAsync(this AppDbContext dbContext, Guid familyId, CancellationToken cancellationToken)
    {
        var headUserId = await dbContext.Members.AsNoTracking()
            .Where(m => m.FamilyId == familyId && m.Role == FamilyRole.Head && m.UserId != null)
            .Select(m => m.UserId)
            .FirstOrDefaultAsync(cancellationToken);
        return headUserId ?? await dbContext.Families.AsNoTracking()
            .Where(f => f.Id == familyId).Select(f => f.CreatedByUserId).SingleAsync(cancellationToken);
    }

    private static Func<Family, bool> HeadedByCompiled(Guid userId) => family =>
        family.Members.Any(m => m.UserId == userId && m.Role == FamilyRole.Head)
        || (family.CreatedByUserId == userId && family.Members.All(m => m.Role != FamilyRole.Head));
}
