// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// In-app notifications for SLMC claim disputes. Text is administrative only; never clinical content.
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Clinical;

internal static class ClaimNotifications
{
    public static async Task NotifyAdminsAsync(AppDbContext dbContext, string type, string title, string body, CancellationToken cancellationToken)
    {
        var admins = await dbContext.Users.Where(x => x.UserType == UserType.Admin && x.IsActive).Select(x => x.Id).ToListAsync(cancellationToken);
        foreach (var adminId in admins) Notify(dbContext, adminId, type, title, body, "/doctor-verification");
    }

    public static void Notify(AppDbContext dbContext, Guid userId, string type, string title, string body, string linkPath) =>
        dbContext.PortalNotifications.Add(new PortalNotification { UserId = userId, Type = type, Title = title, Body = body, LinkPath = linkPath });
}
