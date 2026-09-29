// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family lifecycle (DECISIONS 2026-09-29c): removal / leaving moves the member row, with its history,
// into the adult's own household. Invitations can be listed, resent and cancelled. Join requests expire.
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Families;
using FamilyVeda.Application.Portal;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Records;
using FamilyVeda.Infrastructure.Families;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Portal;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class FamilyLifecycleServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed record Seeded(Family Family, UserAccount Head, UserAccount Adult, Member HeadMember, Member AdultMember, Member Minor);

    private static UserAccount User(string name) =>
        new() { Email = $"{name}@example.invalid", PasswordHash = "x", DisplayName = $"Synthetic {name}", UserType = UserType.FamilyUser };

    private static async Task<Seeded> SeedAsync(AppDbContext db, string code = "FV-LIF001")
    {
        var head = User($"head{code}");
        var adult = User($"adult{code}");
        var family = new Family { Name = "Synthetic Family", CreatedByUser = head, FamilyCode = code };
        var headMember = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1975, 1, 1), Role = FamilyRole.Head };
        var adultMember = new Member { Family = family, User = adult, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(1998, 1, 1), Role = FamilyRole.AdultMember };
        var minor = new Member { Family = family, DisplayName = "Synthetic Minor", DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-9), Role = FamilyRole.MinorMember };
        db.AddRange(head, adult, family, headMember, adultMember, minor,
            new Relationship { Member = adultMember, RelatedMember = headMember, RelationshipType = "Child", IsBiological = true });
        await db.SaveChangesAsync();
        return new Seeded(family, head, adult, headMember, adultMember, minor);
    }

    private static FamilyLifecycleService Lifecycle(AppDbContext db, Guid userId) => new(db, new StubCurrentUser(userId));

    [Fact]
    public async Task RemoveAdult_MovesTheMemberAndItsHistory_IntoTheirOwnHousehold()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        db.Add(new LabReport { Member = s.AdultMember, OriginalFileName = "synthetic.jpg", StoredFileName = "s.jpg", ContentType = "image/jpeg" });
        await db.SaveChangesAsync();

        var result = await Lifecycle(db, s.Head.Id).RemoveAdultAsync(s.AdultMember.Id, CancellationToken.None);

        var moved = await db.Members.SingleAsync(x => x.Id == s.AdultMember.Id);
        moved.FamilyId.Should().Be(result.FamilyId).And.NotBe(s.Family.Id);
        moved.Role.Should().Be(FamilyRole.Head);
        (await db.LabReports.SingleAsync()).MemberId.Should().Be(s.AdultMember.Id, "history moves with the member row");
        (await db.Families.SingleAsync(x => x.Id == result.FamilyId)).FamilyCode.Should().StartWith("FV-");
        result.FamilyCode.Should().BeNull("the Head never learns the adult's new family code");
        (await db.Relationships.CountAsync()).Should().Be(0);
        (await db.FamilyMembershipEvents.SingleAsync()).Reason.Should().Be(MembershipChangeReason.RemovedByHead);
        (await db.PortalNotifications.SingleAsync()).UserId.Should().Be(s.Adult.Id);
        (await db.Members.CountAsync(x => x.FamilyId == s.Family.Id)).Should().Be(2);
    }

    [Fact]
    public async Task RemoveAdult_IsHiddenFromNonHeads_AndRefusedForMinorsAndSelf()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);

        await FluentActions.Awaiting(() => Lifecycle(db, s.Adult.Id).RemoveAdultAsync(s.HeadMember.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
        await FluentActions.Awaiting(() => Lifecycle(db, s.Head.Id).RemoveAdultAsync(s.Minor.Id, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
        await FluentActions.Awaiting(() => Lifecycle(db, s.Head.Id).RemoveAdultAsync(s.HeadMember.Id, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>().WithMessage("*Transfer the Family Head role*");
    }

    [Fact]
    public async Task Head_CannotLeave_ButAdultCanStartOwnFamily()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);

        await FluentActions.Awaiting(() => Lifecycle(db, s.Head.Id).LeaveFamilyAsync(new LeaveFamilyRequest(false), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();

        var result = await Lifecycle(db, s.Adult.Id).LeaveFamilyAsync(new LeaveFamilyRequest(true), CancellationToken.None);

        result.FamilyCode.Should().StartWith("FV-");
        (await db.FamilyMembershipEvents.SingleAsync()).Reason.Should().Be(MembershipChangeReason.StartedOwnFamily);
        (await db.PortalNotifications.SingleAsync()).UserId.Should().Be(s.Head.Id);
        await FluentActions.Awaiting(() => Lifecycle(db, s.Adult.Id).LeaveFamilyAsync(new LeaveFamilyRequest(false), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>().WithMessage("*already have your own household*");
    }

    [Fact]
    public async Task Invitations_ListMaskedEmail_AndCancelledOnesCannotBeAccepted()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var invitee = User("invitee");
        db.Add(invitee);
        await db.SaveChangesAsync();
        var created = await new FamilyService(db, new StubCurrentUser(s.Head.Id))
            .CreateInvitationAsync(s.Family.Id, new CreateFamilyInvitationRequest(invitee.Email, "Sister"), CancellationToken.None);

        var listed = (await Lifecycle(db, s.Head.Id).GetInvitationsAsync(s.Family.Id, CancellationToken.None)).Single();
        listed.EmailMasked.Should().Be("i***@example.invalid");
        listed.RelationshipType.Should().Be("Sister");
        listed.Status.Should().Be("Pending");

        await Lifecycle(db, s.Head.Id).CancelInvitationAsync(s.Family.Id, created.Id, CancellationToken.None);

        (await Lifecycle(db, s.Head.Id).GetInvitationsAsync(s.Family.Id, CancellationToken.None)).Single().Status.Should().Be("Cancelled");
        await FluentActions.Awaiting(() => new FamilyService(db, new StubCurrentUser(invitee.Id)).AcceptInvitationAsync(
                new AcceptFamilyInvitationRequest(created.Token, new DateOnly(1999, 1, 1), ClinicalSex.Female), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Resend_RequiresTheSameEmail_AndRetiresTheOldToken()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var created = await new FamilyService(db, new StubCurrentUser(s.Head.Id))
            .CreateInvitationAsync(s.Family.Id, new CreateFamilyInvitationRequest("rashmi@example.invalid"), CancellationToken.None);

        await FluentActions.Awaiting(() => Lifecycle(db, s.Head.Id).ResendInvitationAsync(s.Family.Id, created.Id,
                new ResendFamilyInvitationRequest("someone@example.invalid"), CancellationToken.None))
            .Should().ThrowAsync<ValidationException>();

        var resent = await Lifecycle(db, s.Head.Id).ResendInvitationAsync(s.Family.Id, created.Id,
            new ResendFamilyInvitationRequest("Rashmi@Example.invalid"), CancellationToken.None);

        resent.Token.Should().NotBe(created.Token);
        var statuses = (await Lifecycle(db, s.Head.Id).GetInvitationsAsync(s.Family.Id, CancellationToken.None)).ToDictionary(x => x.Id, x => x.Status);
        statuses[created.Id].Should().Be("Cancelled");
        statuses[resent.Id].Should().Be("Pending");
    }

    [Fact]
    public async Task AnotherFamilysHead_GetsNotFound_ForInvitations()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var other = await SeedAsync(db, "FV-LIF002");

        await FluentActions.Awaiting(() => Lifecycle(db, other.Head.Id).GetInvitationsAsync(s.Family.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task StaleJoinRequest_Expires_AndCannotBeAccepted()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var requester = User("requester");
        var stale = new FamilyJoinRequest { Family = s.Family, RequestingUser = requester, RelationshipType = "Cousin" };
        db.AddRange(requester, stale);
        await db.SaveChangesAsync();
        // SaveChanges stamps CreatedAt on insert, so age the row afterwards.
        stale.CreatedAt = DateTimeOffset.UtcNow - JoinRequestService.PendingLifetime - TimeSpan.FromMinutes(1);
        await db.SaveChangesAsync();
        var service = new JoinRequestService(db, new StubCurrentUser(s.Head.Id));

        await FluentActions.Awaiting(() => service.AcceptAsync(stale.Id, CancellationToken.None))
            .Should().ThrowAsync<ConflictException>().WithMessage("*expired*");
        (await service.GetForFamilyAsync(s.Family.Id, null, CancellationToken.None)).Single().Status.Should().Be(PortalRequestStatus.Expired);
        (await db.Members.AnyAsync(x => x.UserId == requester.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task RemovedAdult_CanJoinAnotherFamily_AndTakesTheirHistoryWithThem()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var target = await SeedAsync(db, "FV-LIF003");
        db.Add(new LabReport { Member = s.AdultMember, OriginalFileName = "synthetic.jpg", StoredFileName = "s.jpg", ContentType = "image/jpeg" });
        await db.SaveChangesAsync();
        await Lifecycle(db, s.Head.Id).RemoveAdultAsync(s.AdultMember.Id, CancellationToken.None);

        var request = await new JoinRequestService(db, new StubCurrentUser(s.Adult.Id))
            .CreateAsync(new CreateJoinRequest("FV-LIF003", "Cousin", null), CancellationToken.None);
        await new JoinRequestService(db, new StubCurrentUser(target.Head.Id)).AcceptAsync(request.Id, CancellationToken.None);

        var moved = await db.Members.SingleAsync(x => x.UserId == s.Adult.Id);
        moved.Id.Should().Be(s.AdultMember.Id, "the same member row moves; no duplicate is created");
        moved.FamilyId.Should().Be(target.Family.Id);
        moved.Role.Should().Be(FamilyRole.AdultMember);
        (await db.LabReports.SingleAsync()).MemberId.Should().Be(moved.Id);
    }

    [Fact]
    public async Task AdultInASharedFamily_MustLeaveBeforeRequestingToJoinAnother()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        await SeedAsync(db, "FV-LIF004");

        await FluentActions.Awaiting(() => new JoinRequestService(db, new StubCurrentUser(s.Adult.Id))
                .CreateAsync(new CreateJoinRequest("FV-LIF004", "Cousin", null), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>().WithMessage("*Leave your current family*");
    }

    [Fact]
    public async Task Roster_ShowsEveryMembersNameAndRole_ButOnlyToFamilyMembers()
    {
        await using var db = NewDb();
        var s = await SeedAsync(db);
        var other = await SeedAsync(db, "FV-LIF005");

        var roster = await Lifecycle(db, s.Head.Id).GetRosterAsync(s.Family.Id, CancellationToken.None);

        roster.Select(x => x.DisplayName).Should().BeEquivalentTo("Synthetic Head", "Synthetic Adult", "Synthetic Minor");
        roster.Single(x => x.DisplayName == "Synthetic Adult").Should().Match<RosterMemberDto>(x => !x.IsMinor && x.HasAccount && !x.IsSelf);
        roster.Single(x => x.DisplayName == "Synthetic Minor").IsMinor.Should().BeTrue();
        await FluentActions.Awaiting(() => Lifecycle(db, other.Head.Id).GetRosterAsync(s.Family.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.FamilyUser;
    }
}
