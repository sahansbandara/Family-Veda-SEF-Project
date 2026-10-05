// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// "Current Family Head" is Member.Role == Head; CreatedByUserId only counts while bootstrapping.
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Families;
using FamilyVeda.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class FamilyAccessTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static UserAccount User(string name) =>
        new() { Email = $"{name}@example.invalid", PasswordHash = "x", DisplayName = name, UserType = UserType.FamilyUser };

    [Fact]
    public async Task AfterTransfer_CreatorIsNoLongerHead_AndNewHeadIs()
    {
        await using var db = NewDb();
        var creator = User("creator");
        var newHead = User("newhead");
        var family = new Family { Name = "Synthetic", CreatedByUser = creator, FamilyCode = "FV-ACC001" };
        db.AddRange(creator, newHead, family,
            new Member { Family = family, User = creator, DisplayName = "Creator", DateOfBirth = new DateOnly(1970, 1, 1), Role = FamilyRole.AdultMember },
            new Member { Family = family, User = newHead, DisplayName = "New Head", DateOfBirth = new DateOnly(1995, 1, 1), Role = FamilyRole.Head });
        await db.SaveChangesAsync();

        (await db.Families.AnyAsync(FamilyAccess.HeadedBy(creator.Id))).Should().BeFalse();
        (await db.Families.AnyAsync(FamilyAccess.HeadedBy(newHead.Id))).Should().BeTrue();
        (await db.Families.AnyAsync(FamilyAccess.BelongsTo(creator.Id))).Should().BeTrue();
        (await db.GetHeadUserIdAsync(family.Id, CancellationToken.None)).Should().Be(newHead.Id);
        FamilyAccess.IsHead(await db.Families.Include(x => x.Members).SingleAsync(), creator.Id).Should().BeFalse();
    }

    [Fact]
    public async Task WhileBootstrapping_CreatorWithoutHeadMemberManagesTheFamily()
    {
        await using var db = NewDb();
        var creator = User("creator");
        var family = new Family { Name = "Synthetic", CreatedByUser = creator, FamilyCode = "FV-ACC002" };
        db.AddRange(creator, family);
        await db.SaveChangesAsync();

        (await db.Families.AnyAsync(FamilyAccess.HeadedBy(creator.Id))).Should().BeTrue();
        (await db.GetHeadUserIdAsync(family.Id, CancellationToken.None)).Should().Be(creator.Id);
    }

    [Fact]
    public async Task AnotherAdultMember_IsNeverHead()
    {
        await using var db = NewDb();
        var head = User("head");
        var adult = User("adult");
        var family = new Family { Name = "Synthetic", CreatedByUser = head, FamilyCode = "FV-ACC003" };
        db.AddRange(head, adult, family,
            new Member { Family = family, User = head, DisplayName = "Head", DateOfBirth = new DateOnly(1970, 1, 1), Role = FamilyRole.Head },
            new Member { Family = family, User = adult, DisplayName = "Adult", DateOfBirth = new DateOnly(1995, 1, 1), Role = FamilyRole.AdultMember });
        await db.SaveChangesAsync();

        (await db.Families.AnyAsync(FamilyAccess.HeadedBy(adult.Id))).Should().BeFalse();
    }
}
