// Phase 1b synthetic seed tests — agent/TODO.md "Phase 1b — Synthetic test data".
// RULE 7: verifies every seeded email is synthetic (@example.invalid) and the seed is idempotent.
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Persistence.Seed;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class Phase1bSeedTests
{
    private const string Password = "Synthetic1bTestPassword!";

    [Fact]
    public async Task SeedAsync_CreatesThreeFamiliesWithHeadTwoAdultsTwoMinorsEach()
    {
        var db = await SeededDbAsync();

        var families = await db.Families.Where(f => f.FamilyCode!.StartsWith("FV-P1B")).ToListAsync();
        families.Should().HaveCount(3);

        foreach (var family in families)
        {
            var members = await db.Members.Where(m => m.FamilyId == family.Id).ToListAsync();
            members.Should().HaveCount(5);
            members.Count(m => m.Role == FamilyRole.Head).Should().Be(1);
            members.Count(m => m.Role == FamilyRole.AdultMember).Should().Be(2);
            members.Count(m => m.Role == FamilyRole.MinorMember).Should().Be(2);
        }
    }

    [Fact]
    public async Task SeedAsync_CreatesDoctorsMatchingVerificationCountsFromTheTodoList()
    {
        var db = await SeededDbAsync();

        var doctors = await db.Doctors.Where(d => d.RegistrationNumberHash.StartsWith("")
                && db.Users.Any(u => u.Id == d.UserId && u.Email.StartsWith("phase1b-doctor-")))
            .Include(d => d.User)
            .ToListAsync();

        doctors.Should().HaveCount(5);
        doctors.Count(d => d.VerificationStatus == VerificationStatus.Verified).Should().Be(3);
        doctors.Count(d => d.VerificationStatus == VerificationStatus.Pending).Should().Be(1);
        doctors.Count(d => d.VerificationStatus == VerificationStatus.Suspended).Should().Be(1);
        doctors.Select(d => d.District).Distinct().Should().HaveCountGreaterThanOrEqualTo(3);
    }

    [Fact]
    public async Task SeedAsync_EveryPhase1bEmailEndsWithExampleInvalid()
    {
        var db = await SeededDbAsync();

        var emails = await db.Users.Where(u => u.Email.StartsWith("phase1b-")).Select(u => u.Email).ToListAsync();
        emails.Should().NotBeEmpty();
        emails.Should().OnlyContain(e => e.EndsWith("@example.invalid", StringComparison.Ordinal));
    }

    [Fact]
    public async Task SeedAsync_TriageCasesCoverEveryApprovalStateAndEveryPriority()
    {
        var db = await SeededDbAsync();

        var phase1bMemberIds = await db.Members
            .Where(m => db.Families.Any(f => f.Id == m.FamilyId && f.FamilyCode!.StartsWith("FV-P1B")))
            .Select(m => m.Id)
            .ToListAsync();
        var cases = await db.TriageCases.Where(c => phase1bMemberIds.Contains(c.MemberId)).ToListAsync();

        cases.Select(c => c.Priority).Distinct().Should().Contain([TriagePriority.Routine, TriagePriority.Priority, TriagePriority.Emergency]);

        var decisions = await db.Approvals.Where(a => cases.Select(c => c.Id).Contains(a.TriageCaseId)).Select(a => a.Action).ToListAsync();
        decisions.Should().Contain(ApprovalAction.Approve);
        decisions.Should().Contain(ApprovalAction.RequestInformation);
        decisions.Should().Contain(ApprovalAction.Reject);
        decisions.Should().Contain(ApprovalAction.Escalate);
    }

    [Fact]
    public async Task SeedAsync_AppointmentsCoverEveryStatus()
    {
        var db = await SeededDbAsync();

        var statuses = await db.Appointments
            .Where(a => db.Members.Any(m => m.Id == a.MemberId && db.Families.Any(f => f.Id == m.FamilyId && f.FamilyCode!.StartsWith("FV-P1B"))))
            .Select(a => a.Status)
            .Distinct()
            .ToListAsync();

        statuses.Should().Contain([AppointmentStatus.Requested, AppointmentStatus.Confirmed, AppointmentStatus.Completed, AppointmentStatus.Cancelled, AppointmentStatus.NoShow]);
    }

    [Fact]
    public async Task SeedAsync_ConsentsCoverGrantedRevokedAndNotSet()
    {
        var db = await SeededDbAsync();

        var alphaHead = await db.Users.SingleAsync(u => u.Email == "phase1b-alpha-head@example.invalid");
        var headMember = await db.Members.SingleAsync(m => m.UserId == alphaHead.Id);
        var headStatuses = await db.Consents.Where(c => c.MemberId == headMember.Id).Select(c => c.Status).ToListAsync();
        headStatuses.Should().OnlyContain(s => s == ConsentStatus.Granted);

        var alphaAdultOne = await db.Users.SingleAsync(u => u.Email == "phase1b-alpha-adult1@example.invalid");
        var adultOneMember = await db.Members.SingleAsync(m => m.UserId == alphaAdultOne.Id);
        var adultOneStatuses = await db.Consents.Where(c => c.MemberId == adultOneMember.Id).Select(c => c.Status).ToListAsync();
        adultOneStatuses.Should().OnlyContain(s => s == ConsentStatus.Revoked);

        var alphaAdultTwo = await db.Users.SingleAsync(u => u.Email == "phase1b-alpha-adult2@example.invalid");
        var adultTwoMember = await db.Members.SingleAsync(m => m.UserId == alphaAdultTwo.Id);
        var adultTwoStatuses = await db.Consents.Where(c => c.MemberId == adultTwoMember.Id).Select(c => c.Status).ToListAsync();
        adultTwoStatuses.Should().OnlyContain(s => s == ConsentStatus.NotSet);
    }

    [Fact]
    public async Task SeedAsync_IsIdempotent_RunningTwiceDoesNotDuplicateRows()
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var hasher = new PasswordHasher<UserAccount>();
        await SeedBaseAsync(db, hasher);

        await Phase1bSeeder.SeedAsync(db, hasher, Password, CancellationToken.None);
        var firstUserCount = await db.Users.CountAsync();
        var firstFamilyCount = await db.Families.CountAsync();

        await Phase1bSeeder.SeedAsync(db, hasher, Password, CancellationToken.None);
        var secondUserCount = await db.Users.CountAsync();
        var secondFamilyCount = await db.Families.CountAsync();

        secondUserCount.Should().Be(firstUserCount);
        secondFamilyCount.Should().Be(firstFamilyCount);
    }

    private static async Task<AppDbContext> SeededDbAsync()
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var hasher = new PasswordHasher<UserAccount>();
        await SeedBaseAsync(db, hasher);
        await Phase1bSeeder.SeedAsync(db, hasher, Password, CancellationToken.None);
        return db;
    }

    /// <summary>Minimal base rows so Phase1bSeeder can run standalone in a unit test without the full DatabaseInitializer/DemoDataSeeder chain.</summary>
    private static async Task SeedBaseAsync(AppDbContext db, IPasswordHasher<UserAccount> hasher)
    {
        await db.SaveChangesAsync();
    }
}
