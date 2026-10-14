// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// FH-3: two-person Family Head transfer. The Head proposes, the adult accepts or declines,
// and acceptance swaps the two Member.Role values in one SaveChanges.
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Families;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Families;
using FamilyVeda.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class FamilyHeadTransferServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed record Seeded(Family Family, UserAccount Head, UserAccount Adult, UserAccount Other,
        Member HeadMember, Member AdultMember, Member OtherAdult, Member Minor);

    private static UserAccount User(string name) =>
        new() { Email = $"{name}@example.invalid", PasswordHash = "x", DisplayName = $"Synthetic {name}", UserType = UserType.FamilyUser };

    private static async Task<Seeded> SeedAsync(AppDbContext db)
    {
        var head = User("head");
        var adult = User("adult");
        var other = User("other");
        var family = new Family { Name = "Synthetic Family", CreatedByUser = head, FamilyCode = "FV-HTX001" };
        var headMember = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1970, 1, 1), Role = FamilyRole.Head };
        var adultMember = new Member { Family = family, User = adult, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(1995, 1, 1), Role = FamilyRole.AdultMember };
        var otherAdult = new Member { Family = family, User = other, DisplayName = "Synthetic Other", DateOfBirth = new DateOnly(1997, 1, 1), Role = FamilyRole.AdultMember };
        var minor = new Member { Family = family, DisplayName = "Synthetic Minor", DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-7), Role = FamilyRole.MinorMember };
        db.AddRange(head, adult, other, family, headMember, adultMember, otherAdult, minor);
        await db.SaveChangesAsync();
        return new Seeded(family, head, adult, other, headMember, adultMember, otherAdult, minor);
    }

    private static FamilyHeadTransferService As(AppDbContext db, Guid userId) => new(db, new StubCurrentUser(userId));

    [Fact]
    public async Task Accept_SwapsRolesInOneStep_AndKeepsTheCreatorAsHistory()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var proposal = await As(db, s.Head.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.AdultMember.Id), CancellationToken.None);

        var accepted = await As(db, s.Adult.Id).AcceptAsync(proposal.Id, CancellationToken.None);

        accepted.Status.Should().Be("Accepted");
        (await db.Members.SingleAsync(x => x.Id == s.HeadMember.Id)).Role.Should().Be(FamilyRole.AdultMember);
        (await db.Members.SingleAsync(x => x.Id == s.AdultMember.Id)).Role.Should().Be(FamilyRole.Head);
        (await db.Members.CountAsync(x => x.FamilyId == s.Family.Id && x.Role == FamilyRole.Head)).Should().Be(1);
        (await db.Families.SingleAsync()).CreatedByUserId.Should().Be(s.Head.Id);
        (await db.Families.AnyAsync(FamilyAccess.HeadedBy(s.Adult.Id))).Should().BeTrue();
        (await db.Families.AnyAsync(FamilyAccess.HeadedBy(s.Head.Id))).Should().BeFalse();
        (await db.AuditLogs.CountAsync(x => x.EventType == "FAMILY_HEAD_TRANSFERRED")).Should().Be(1);
        (await db.PortalNotifications.CountAsync(x => x.UserId == s.Head.Id)).Should().Be(1);
    }

    [Fact]
    public async Task Propose_IsHeadOnly_AndTargetsAnAdultWithAnAccount()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);

        await FluentActions.Awaiting(() => As(db, s.Adult.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.OtherAdult.Id), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
        await FluentActions.Awaiting(() => As(db, s.Head.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.Minor.Id), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
        await FluentActions.Awaiting(() => As(db, s.Head.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.HeadMember.Id), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task OnlyOnePendingProposal_AndOnlyTheTargetCanRespond()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var proposal = await As(db, s.Head.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.AdultMember.Id), CancellationToken.None);

        await FluentActions.Awaiting(() => As(db, s.Head.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.OtherAdult.Id), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
        await FluentActions.Awaiting(() => As(db, s.Other.Id).AcceptAsync(proposal.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
        await FluentActions.Awaiting(() => As(db, s.Head.Id).AcceptAsync(proposal.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
        (await As(db, s.Adult.Id).GetIncomingAsync(CancellationToken.None))!.Id.Should().Be(proposal.Id);
        (await As(db, s.Other.Id).GetIncomingAsync(CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task Decline_AndCancel_LeaveRolesUnchanged_AndCannotBeAcceptedLater()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var first = await As(db, s.Head.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.AdultMember.Id), CancellationToken.None);
        (await As(db, s.Adult.Id).DeclineAsync(first.Id, CancellationToken.None)).Status.Should().Be("Declined");

        var second = await As(db, s.Head.Id).ProposeAsync(s.Family.Id, new CreateHeadTransferRequest(s.OtherAdult.Id), CancellationToken.None);
        (await As(db, s.Head.Id).CancelAsync(second.Id, CancellationToken.None)).Status.Should().Be("Cancelled");

        await FluentActions.Awaiting(() => As(db, s.Other.Id).AcceptAsync(second.Id, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
        (await db.Members.SingleAsync(x => x.Id == s.HeadMember.Id)).Role.Should().Be(FamilyRole.Head);
        (await As(db, s.Head.Id).GetPendingForFamilyAsync(s.Family.Id, CancellationToken.None)).Should().BeNull();
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.FamilyUser;
    }
}
