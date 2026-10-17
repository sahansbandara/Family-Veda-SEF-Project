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
    public async Task DuplicateClaim_OpensDispute_FlagsBoth_AndIncumbentKeepsWorking()
    {
        await using var db = NewDb();
        var first = NewDoctor(db, "Dr Synthetic Incumbent", VerificationStatus.Verified);
        db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCaseId = Guid.NewGuid(), DoctorId = first.Id, ExpiresAt = DateTimeOffset.UtcNow.AddHours(4), Reason = "synthetic" });
        db.DoctorLicenseDocuments.Add(new DoctorLicenseDocument { DoctorId = first.Id, FileName = "l.pdf", ContentType = "application/pdf", Content = [1], Sha256 = "SAMEFILE" });
        await db.SaveChangesAsync();

        var second = NewDoctor(db, "Dr Synthetic Claimant", VerificationStatus.Pending);
        var outcome = await ClaimDisputeService.StageClaimAsync(db, second, second.UserId, CancellationToken.None, "SAMEFILE");
        await db.SaveChangesAsync();

        outcome.Should().Be(ClaimOutcome.Disputed);
        (await db.Doctors.CountAsync(x => x.ClaimDisputed)).Should().Be(2);
        first.AccessFrozen.Should().BeFalse();
        (await db.CaseAccessGrants.CountAsync()).Should().Be(1, "the incumbent keeps case access while the dispute is reviewed");
        (await db.DoctorClaimDisputes.SingleAsync()).DuplicateLicenseFile.Should().BeTrue();
    }

    [Fact]
    public async Task UniqueClaim_IsNotDisputed()
    {
        await using var db = NewDb();
        NewDoctor(db, "Dr Synthetic Other", VerificationStatus.Verified, "OTHER");
        await db.SaveChangesAsync();
        var doctor = NewDoctor(db, "Dr Synthetic New", VerificationStatus.Pending);

        (await ClaimDisputeService.StageClaimAsync(db, doctor, doctor.UserId, CancellationToken.None)).Should().Be(ClaimOutcome.None);
        doctor.ClaimDisputed.Should().BeFalse();
    }

    [Fact]
    public async Task ClaimOnConfirmedOwner_IsAutoRejected_AndAdminsNotified()
    {
        await using var db = NewDb();
        var owner = NewDoctor(db, "Dr Synthetic Owner", VerificationStatus.Verified);
        owner.OwnershipConfirmedAt = DateTimeOffset.UtcNow;
        db.Users.Add(new UserAccount { Email = "admin@example.invalid", PasswordHash = "x", DisplayName = "Admin", UserType = UserType.Admin });
        await db.SaveChangesAsync();
        var third = NewDoctor(db, "Dr Synthetic Third", VerificationStatus.Pending);

        (await ClaimDisputeService.StageClaimAsync(db, third, third.UserId, CancellationToken.None)).Should().Be(ClaimOutcome.AutoRejected);
        await db.SaveChangesAsync();

        third.VerificationStatus.Should().Be(VerificationStatus.Rejected);
        owner.ClaimDisputed.Should().BeFalse();
        (await db.DoctorClaimDisputes.AnyAsync()).Should().BeFalse();
        (await db.PortalNotifications.AnyAsync(x => x.Type == "SLMC_CLAIM_AUTO_REJECTED")).Should().BeTrue();
    }

    [Fact]
    public async Task Resolve_VerifiesWinner_SuspendsLoser_RevokesLoserGrants()
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
    public async Task Resolve_ConfirmsWinnerOwnership_AndCancelsOpenEvidenceRequests()
    {
        await using var db = NewDb();
        var real = NewDoctor(db, "Dr Synthetic Real", VerificationStatus.Verified);
        await db.SaveChangesAsync();
        var impostor = NewDoctor(db, "Dr Synthetic Impostor", VerificationStatus.Pending);
        await ClaimDisputeService.StageClaimAsync(db, impostor, impostor.UserId, CancellationToken.None);
        await db.SaveChangesAsync();
        var service = new ClaimDisputeService(db, new StubCurrentUser(Guid.NewGuid(), UserType.Admin));
        var dispute = await db.DoctorClaimDisputes.SingleAsync();
        await service.RequestEvidenceAsync(dispute.Id, new CreateEvidenceRequest(impostor.Id, [EvidenceKind.NationalIdCopy], null, false), CancellationToken.None);

        await service.ResolveAsync(dispute.Id, new ResolveClaimDisputeRequest(real.Id, "Original holder"), CancellationToken.None);

        real.OwnershipConfirmedAt.Should().NotBeNull();
        (await db.ClaimEvidenceRequests.SingleAsync()).Status.Should().Be(EvidenceRequestStatus.Cancelled);
    }

    [Fact]
    public async Task ChallengeDeadline_IsThreeDays_UploadSubmits_AndMissedDeadlineSuspends()
    {
        await using var db = NewDb();
        var incumbent = NewDoctor(db, "Dr Synthetic Incumbent", VerificationStatus.Verified);
        await db.SaveChangesAsync();
        var claimant = NewDoctor(db, "Dr Synthetic Claimant", VerificationStatus.Pending);
        await ClaimDisputeService.StageClaimAsync(db, claimant, claimant.UserId, CancellationToken.None);
        await db.SaveChangesAsync();
        var admin = new ClaimDisputeService(db, new StubCurrentUser(Guid.NewGuid(), UserType.Admin));
        var dispute = await db.DoctorClaimDisputes.SingleAsync();

        var challenge = await admin.RequestEvidenceAsync(dispute.Id, new CreateEvidenceRequest(incumbent.Id, [EvidenceKind.SlmcCertificate], null, true), CancellationToken.None);
        var standard = await admin.RequestEvidenceAsync(dispute.Id, new CreateEvidenceRequest(claimant.Id, [EvidenceKind.NationalIdCopy], null, false), CancellationToken.None);
        (challenge.DueAt - challenge.RequestedAt).TotalDays.Should().BeApproximately(3, 0.01);
        (standard.DueAt - standard.RequestedAt).TotalDays.Should().BeApproximately(30, 0.01);
        (await db.PortalNotifications.AnyAsync(x => x.UserId == incumbent.UserId && x.Type == "SLMC_EVIDENCE_REQUESTED")).Should().BeTrue();

        var doctorSide = new ClaimEvidenceService(db, new StubCurrentUser(incumbent.UserId, UserType.Doctor));
        var pdf = new MemoryStream("%PDF-1.4 synthetic certificate"u8.ToArray());
        var uploaded = await doctorSide.UploadAsync(challenge.Id, new EvidenceUpload(EvidenceKind.SlmcCertificate, "cert.pdf", "application/pdf", pdf.Length, pdf), CancellationToken.None);
        uploaded.Status.Should().Be(EvidenceRequestStatus.Submitted);
        var fake = new MemoryStream("not a pdf"u8.ToArray());
        await doctorSide.Invoking(s => s.UploadAsync(challenge.Id, new EvidenceUpload(EvidenceKind.SlmcCertificate, "x.pdf", "application/pdf", fake.Length, fake), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>("a submitted request is closed");

        (await db.ClaimEvidenceRequests.SingleAsync(x => x.Id == standard.Id)).DueAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        await db.SaveChangesAsync();
        (await new ClaimEvidenceService(db, new StubCurrentUser(Guid.Empty, UserType.Admin)).ProcessExpiredAsync(CancellationToken.None)).Should().Be(1);

        claimant.VerificationStatus.Should().Be(VerificationStatus.Suspended);
        claimant.User!.IsActive.Should().BeFalse();
        incumbent.VerificationStatus.Should().Be(VerificationStatus.Verified, "the incumbent answered in time");
        (await db.DoctorVerificationLogs.SingleAsync(x => x.DoctorId == claimant.Id)).Reason.Should().StartWith("EvidenceDeadlineMissed");
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
