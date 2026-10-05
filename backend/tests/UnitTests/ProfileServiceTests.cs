// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Profile settings return only the caller's own account and rename both the account and member profile.
using FamilyVeda.Application.Auth;
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Auth;
using FamilyVeda.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class ProfileServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static async Task<(UserAccount User, Member Member)> SeedAsync(AppDbContext db)
    {
        var user = new UserAccount { Email = "head@example.invalid", PasswordHash = "x", DisplayName = "Synthetic Head", UserType = UserType.FamilyUser };
        var family = new Family { Name = "Synthetic Family", CreatedByUser = user, FamilyCode = "FV-PRO001" };
        var member = new Member { Family = family, User = user, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1980, 1, 1), Role = FamilyRole.Head };
        db.AddRange(user, family, member);
        await db.SaveChangesAsync();
        return (user, member);
    }

    [Fact]
    public async Task GetMine_ReturnsAccountAndFamilyDetails()
    {
        await using var db = NewDb();
        var (user, _) = await SeedAsync(db);

        var profile = await new ProfileService(db, new StubCurrentUser(user.Id)).GetMineAsync(CancellationToken.None);

        profile.Email.Should().Be("head@example.invalid");
        profile.FamilyRole.Should().Be("Head");
        profile.FamilyCode.Should().Be("FV-PRO001");
        profile.DateOfBirth.Should().Be(new DateOnly(1980, 1, 1));
    }

    [Fact]
    public async Task UpdateMine_RenamesAccountAndMember_AndRejectsBlankNames()
    {
        await using var db = NewDb();
        var (user, member) = await SeedAsync(db);
        var service = new ProfileService(db, new StubCurrentUser(user.Id));

        var profile = await service.UpdateMineAsync(new UpdateMyProfileRequest("  Synthetic Renamed "), CancellationToken.None);

        profile.DisplayName.Should().Be("Synthetic Renamed");
        (await db.Members.SingleAsync(x => x.Id == member.Id)).DisplayName.Should().Be("Synthetic Renamed");
        (await db.AuditLogs.SingleAsync()).EventType.Should().Be("PROFILE_UPDATED");
        await FluentActions.Awaiting(() => service.UpdateMineAsync(new UpdateMyProfileRequest(" "), CancellationToken.None))
            .Should().ThrowAsync<ValidationException>();
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.FamilyUser;
    }
}
