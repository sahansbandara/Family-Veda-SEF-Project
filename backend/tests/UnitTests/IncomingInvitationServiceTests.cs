// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Invitations addressed to the signed-in user's email: listed, approved and rejected in-app without a token.
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Families;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Families;
using FamilyVeda.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class IncomingInvitationServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static UserAccount User(string name) =>
        new() { Email = $"{name}@example.invalid", PasswordHash = "x", DisplayName = $"Synthetic {name}", UserType = UserType.FamilyUser };

    private sealed record Seeded(Family Inviting, UserAccount Head, UserAccount Invitee, Member InviteeMember, FamilyInvitation Invitation);

    private static async Task<Seeded> SeedAsync(AppDbContext db, bool inviteeSharesFamily = false)
    {
        var head = User("head");
        var invitee = User("invitee");
        var inviting = new Family { Name = "Synthetic Inviting Family", CreatedByUser = head, FamilyCode = "FV-INV001" };
        var own = new Family { Name = "Synthetic Own Family", CreatedByUser = invitee, FamilyCode = "FV-OWN001" };
        var inviteeMember = new Member { Family = own, User = invitee, DisplayName = "Synthetic Invitee", DateOfBirth = new DateOnly(1995, 1, 1), Role = FamilyRole.Head };
        db.AddRange(head, invitee, inviting, own, inviteeMember,
            new Member { Family = inviting, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1970, 1, 1), Role = FamilyRole.Head });
        if (inviteeSharesFamily)
            db.Add(new Member { Family = own, DisplayName = "Synthetic Minor", DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-8), Role = FamilyRole.MinorMember });
        var invitation = new FamilyInvitation
        {
            Family = inviting,
            InvitedByUser = head,
            InvitedEmailHash = "x",
            InvitedEmailLookupHash = InvitationCrypto.LookupHash("Invitee@Example.invalid"),
            InvitedEmailMasked = "i***@example.invalid",
            TokenHash = "t",
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(48)
        };
        db.Add(invitation);
        await db.SaveChangesAsync();
        return new Seeded(inviting, head, invitee, inviteeMember, invitation);
    }

    private static IncomingInvitationService Service(AppDbContext db, Guid userId) => new(db, new StubCurrentUser(userId));

    [Fact]
    public async Task GetMine_ListsOnlyInvitationsForTheCallersEmail()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);

        var mine = await Service(db, s.Invitee.Id).GetMineAsync(CancellationToken.None);
        var headSees = await Service(db, s.Head.Id).GetMineAsync(CancellationToken.None);

        mine.Should().ContainSingle().Which.CanApprove.Should().BeTrue();
        mine[0].FamilyName.Should().Be("Synthetic Inviting Family");
        headSees.Should().BeEmpty();
    }

    [Fact]
    public async Task Approve_MovesTheInviteeIn_AndMarksTheInvitationAccepted()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);

        var result = await Service(db, s.Invitee.Id).ApproveAsync(s.Invitation.Id, CancellationToken.None);

        result.FamilyId.Should().Be(s.Inviting.Id);
        (await db.Members.SingleAsync(x => x.Id == s.InviteeMember.Id)).Role.Should().Be(FamilyRole.AdultMember);
        (await db.FamilyInvitations.SingleAsync()).AcceptedByUserId.Should().Be(s.Invitee.Id);
        (await db.PortalNotifications.SingleAsync()).UserId.Should().Be(s.Head.Id);
    }

    [Fact]
    public async Task Reject_CancelsTheInvitation_AndNotifiesTheHead()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);

        await Service(db, s.Invitee.Id).RejectAsync(s.Invitation.Id, CancellationToken.None);

        (await db.FamilyInvitations.SingleAsync()).CancelledAt.Should().NotBeNull();
        (await db.PortalNotifications.SingleAsync()).UserId.Should().Be(s.Head.Id);
        (await Service(db, s.Invitee.Id).GetMineAsync(CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task AnotherUser_CannotApproveOrReject_SomeoneElsesInvitation()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);

        await FluentActions.Awaiting(() => Service(db, s.Head.Id).ApproveAsync(s.Invitation.Id, CancellationToken.None)).Should().ThrowAsync<NotFoundException>();
        await FluentActions.Awaiting(() => Service(db, s.Head.Id).RejectAsync(s.Invitation.Id, CancellationToken.None)).Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task InviteeWhoSharesAFamily_SeesTheInvitationButCannotApprove()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db, inviteeSharesFamily: true);

        var mine = await Service(db, s.Invitee.Id).GetMineAsync(CancellationToken.None);

        mine.Should().ContainSingle().Which.CanApprove.Should().BeFalse();
        mine[0].BlockedReason.Should().Contain("Transfer the Family Head role");
        await FluentActions.Awaiting(() => Service(db, s.Invitee.Id).ApproveAsync(s.Invitation.Id, CancellationToken.None)).Should().ThrowAsync<ConflictException>();
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.FamilyUser;
    }
}
