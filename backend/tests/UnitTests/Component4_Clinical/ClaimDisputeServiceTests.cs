// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// SLMC contested claims: duplicate -> dispute, grant freeze, admin resolution. Synthetic data only.
using FamilyVeda.Application.Clinical;
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Access;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Clinical;
using FamilyVeda.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class ClaimDisputeServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static Doctor NewDoctor(AppDbContext db, string name, VerificationStatus status, string hash = "SYN-HASH")
    {
        var user = new UserAccount { Email = $"{Guid.NewGuid():N}@example.invalid", PasswordHash = "x", DisplayName = name, UserType = UserType.Doctor };
        var doctor = new Doctor { User = user, UserId = user.Id, RegistrationNumberHash = hash, RegistrationNumberLastFour = "0001", VerificationStatus = status };
        db.AddRange(user, doctor);
        return doctor;
    }

    [Theory]
    [InlineData("Dr. Synthetic Amara Perera", "Perera Amara Synthetic", true)]
    [InlineData("Dr. A. B. Synthetic Perera", "Synthetic Perera", true)]
    [InlineData("Prof. Synthetic Perera", "Dr Synthetic Silva", false)]
    [InlineData("", "Dr Synthetic Silva", false)]
    public void NamesMatch_IgnoresTitlesInitialsAndOrder(string claimed, string registered, bool expected) =>
        SlmcNameMatcher.NamesMatch(claimed, registered).Should().Be(expected);

    [Fact]
    public void Classify_ReportsNotInRegister_WhenNoEntry() =>
        SlmcNameMatcher.Classify("Dr Synthetic Silva", null).Should().Be(RegisterMatch.NotInRegister);

    [Fact]
    public void FrozenGrant_GivesNoAccess() =>
        CaseGrantPolicy.HasAccess(DateTimeOffset.UtcNow.AddHours(1), null, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow).Should().BeFalse();

    [Fact]
    public async Task DuplicateClaim_OpensDispute_FlagsBoth_AndFreezesVerifiedGrants()
    {
        await using var db = NewDb();
        var first = NewDoctor(db, "Dr Synthetic Impostor", VerificationStatus.Verified);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCaseId = Guid.NewGuid(), DoctorId = first.Id, ExpiresAt = DateTimeOffset.UtcNow.AddHours(4), Reason = "synthetic" });
        await db.SaveChangesAsync();

        var second = NewDoctor(db, "Dr Synthetic Real", VerificationStatus.Pending);
        var disputed = await ClaimDisputeService.StageClaimAsync(db, second, second.UserId, CancellationToken.None);
        await db.SaveChangesAsync();

        disputed.Should().BeTrue();
        (await db.Doctors.CountAsync(x => x.ClaimDisputed)).Should().Be(2);
        first.VerificationStatus.Should().Be(VerificationStatus.Verified);
        (await db.CaseAccessGrants.CountAsync()).Should().Be(0, "frozen grants are hidden by the grant query filter");
        (await db.CaseAccessGrants.IgnoreQueryFilters().SingleAsync()).FrozenAt.Should().NotBeNull();
        (await db.DoctorClaimDisputes.SingleAsync()).Status.Should().Be(ClaimDisputeStatus.Open);
        (await db.AuditLogs.CountAsync(x => x.EventType == "SLMC_CLAIM_DISPUTED")).Should().Be(2);
    }

    [Fact]
    public async Task UniqueClaim_IsNotDisputed()
    {
        await using var db = NewDb();
        NewDoctor(db, "Dr Synthetic Other", VerificationStatus.Verified, "OTHER");
        await db.SaveChangesAsync();
        var doctor = NewDoctor(db, "Dr Synthetic New", VerificationStatus.Pending);

        (await ClaimDisputeService.StageClaimAsync(db, doctor, doctor.UserId, CancellationToken.None)).Should().BeFalse();
        doctor.ClaimDisputed.Should().BeFalse();
    }

    [Fact]
    public async Task Resolve_VerifiesWinner_SuspendsLoser_RevokesLoserGrants_UnfreezesWinner()
    {
        await using var db = NewDb();
        var impostor = NewDoctor(db, "Dr Synthetic Impostor", VerificationStatus.Verified);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCaseId = Guid.NewGuid(), DoctorId = impostor.Id, ExpiresAt = DateTimeOffset.UtcNow.AddHours(4), Reason = "synthetic" });
        db.SlmcRegisterEntries.Add(new SlmcRegisterEntry { RegistrationNumberHash = "SYN-HASH", FullName = "Dr. Synthetic Real" });
        await db.SaveChangesAsync();
        var real = NewDoctor(db, "Dr Synthetic Real", VerificationStatus.Pending);
        await ClaimDisputeService.StageClaimAsync(db, real, real.UserId, CancellationToken.None);
        await db.SaveChangesAsync();
        var admin = Guid.NewGuid();
        var service = new ClaimDisputeService(db, new StubCurrentUser(admin, UserType.Admin));

        var listed = (await service.GetDisputesAsync(false, CancellationToken.None)).Single();
        listed.Claimants.Single(x => x.DoctorId == real.Id).RegisterMatch.Should().Be(RegisterMatch.Match);
        listed.Claimants.Single(x => x.DoctorId == impostor.Id).RegisterMatch.Should().Be(RegisterMatch.NameMismatch);

        var result = await service.ResolveAsync(listed.Id, new ResolveClaimDisputeRequest(real.Id, "Synthetic register name matches"), CancellationToken.None);

        result.Status.Should().Be(ClaimDisputeStatus.Resolved);
        real.VerificationStatus.Should().Be(VerificationStatus.Verified);
        real.ClaimDisputed.Should().BeFalse();
        impostor.VerificationStatus.Should().Be(VerificationStatus.Suspended);
        impostor.User!.IsActive.Should().BeFalse();
        (await db.CaseAccessGrants.IgnoreQueryFilters().SingleAsync()).RevokedAt.Should().NotBeNull();
        (await db.DoctorVerificationLogs.SingleAsync(x => x.DoctorId == impostor.Id)).Reason.Should().StartWith("FraudulentClaim");
        (await db.AuditLogs.AnyAsync(x => x.EventType == "SLMC_CLAIM_DISPUTE_RESOLVED" && x.ActorUserId == admin)).Should().BeTrue();
    }

    [Fact]
    public async Task Resolve_WinnerKeepsFrozenGrants_AfterUnfreeze()
    {
        await using var db = NewDb();
        var real = NewDoctor(db, "Dr Synthetic Real", VerificationStatus.Verified);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCaseId = Guid.NewGuid(), DoctorId = real.Id, ExpiresAt = DateTimeOffset.UtcNow.AddHours(4), Reason = "synthetic" });
        await db.SaveChangesAsync();
        var impostor = NewDoctor(db, "Dr Synthetic Impostor", VerificationStatus.Pending);
        await ClaimDisputeService.StageClaimAsync(db, impostor, impostor.UserId, CancellationToken.None);
        await db.SaveChangesAsync();
        var service = new ClaimDisputeService(db, new StubCurrentUser(Guid.NewGuid(), UserType.Admin));
        var dispute = await db.DoctorClaimDisputes.SingleAsync();

        await service.ResolveAsync(dispute.Id, new ResolveClaimDisputeRequest(real.Id, "Original holder"), CancellationToken.None);

        (await db.CaseAccessGrants.SingleAsync()).DoctorId.Should().Be(real.Id);
    }

    [Fact]
    public async Task Resolve_RequiresReason_AdminRole_AndClaimantWinner()
    {
        await using var db = NewDb();
        NewDoctor(db, "Dr Synthetic A", VerificationStatus.Verified);
        await db.SaveChangesAsync();
        var b = NewDoctor(db, "Dr Synthetic B", VerificationStatus.Pending);
        await ClaimDisputeService.StageClaimAsync(db, b, b.UserId, CancellationToken.None);
        await db.SaveChangesAsync();
        var dispute = await db.DoctorClaimDisputes.SingleAsync();
        var admin = new ClaimDisputeService(db, new StubCurrentUser(Guid.NewGuid(), UserType.Admin));
        var doctorCaller = new ClaimDisputeService(db, new StubCurrentUser(b.UserId, UserType.Doctor));

        await admin.Invoking(s => s.ResolveAsync(dispute.Id, new ResolveClaimDisputeRequest(b.Id, " "), CancellationToken.None)).Should().ThrowAsync<ValidationException>();
        await admin.Invoking(s => s.ResolveAsync(dispute.Id, new ResolveClaimDisputeRequest(Guid.NewGuid(), "x"), CancellationToken.None)).Should().ThrowAsync<ValidationException>();
        await doctorCaller.Invoking(s => s.ResolveAsync(dispute.Id, new ResolveClaimDisputeRequest(b.Id, "x"), CancellationToken.None)).Should().ThrowAsync<ForbiddenException>();
        await doctorCaller.Invoking(s => s.GetDisputesAsync(false, CancellationToken.None)).Should().ThrowAsync<ForbiddenException>();
    }

    private sealed class StubCurrentUser(Guid userId, UserType userType) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => userType;
    }
}
