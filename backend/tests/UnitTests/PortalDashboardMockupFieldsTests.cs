// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Privacy and deterministic-range checks for the mockup-aligned dashboard fields.
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Records;
using FamilyVeda.Domain.Triage;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Portal;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class PortalDashboardMockupFieldsTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed record Seeded(UserAccount Head, UserAccount Adult, Member HeadMember, Member AdultMember, Member Minor);

    private static async Task<Seeded> SeedFamilyAsync(AppDbContext db)
    {
        var head = new UserAccount { Email = "head@example.invalid", PasswordHash = "x", DisplayName = "Head", UserType = UserType.FamilyUser };
        var adult = new UserAccount { Email = "adult@example.invalid", PasswordHash = "x", DisplayName = "Adult", UserType = UserType.FamilyUser };
        var family = new Family { Name = "Synthetic Family", CreatedByUser = head, FamilyCode = "FV-MCK001" };
        var headMember = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1980, 1, 1), Role = FamilyRole.Head };
        var adultMember = new Member { Family = family, User = adult, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(1995, 1, 1), Role = FamilyRole.AdultMember };
        var minor = new Member { Family = family, DisplayName = "Synthetic Minor", DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-8), Role = FamilyRole.MinorMember };
        db.AddRange(head, adult, family, headMember, adultMember, minor);
        await db.SaveChangesAsync();
        return new Seeded(head, adult, headMember, adultMember, minor);
    }

    private static LabReport Report(Member member, params (decimal Value, decimal? Low, decimal? High)[] values)
    {
        var report = new LabReport { Member = member, OriginalFileName = $"{member.DisplayName}.jpg", StoredFileName = "s.jpg", ContentType = "image/jpeg", CollectedAt = DateTimeOffset.UtcNow };
        foreach (var v in values)
            report.Values.Add(new LabValue { Analyte = "Synthetic analyte", Value = v.Value, Unit = "u", ReferenceLow = v.Low, ReferenceHigh = v.High, WasManuallyConfirmed = true });
        return report;
    }

    [Fact]
    public async Task HeadMemberCards_NeverCarryAnotherAdultsHealthCounts()
    {
        await using var db = NewDb();
        var s = await SeedFamilyAsync(db);
        db.Add(new Appointment { Member = s.AdultMember, DoctorId = Guid.NewGuid(), BookedByUserId = s.Adult.Id, StartsAt = DateTimeOffset.UtcNow.AddDays(2), Reason = "Private" });
        await db.SaveChangesAsync();

        var dashboard = await new PortalDashboardService(db, new StubCurrentUser(s.Head.Id)).GetFamilyDashboardAsync(CancellationToken.None);

        var adultCard = dashboard.Members.Single(x => x.Id == s.AdultMember.Id);
        adultCard.Summary.Should().Be("Adult · private by default");
        adultCard.Summary.Should().NotContain("appointment");
        dashboard.Members.Single(x => x.Id == s.Minor.Id).Summary.Should().StartWith("Guardian managed");
        dashboard.UpcomingAppointments.Should().Be(0);
    }

    [Fact]
    public async Task HeadReportCount_ExcludesAdultReports_AndIncludesMinors()
    {
        await using var db = NewDb();
        var s = await SeedFamilyAsync(db);
        db.AddRange(Report(s.AdultMember, (1m, 2m, 3m)), Report(s.Minor, (5m, 2m, 3m)), Report(s.HeadMember, (2.5m, 2m, 3m)));
        await db.SaveChangesAsync();

        var dashboard = await new PortalDashboardService(db, new StubCurrentUser(s.Head.Id)).GetFamilyDashboardAsync(CancellationToken.None);

        dashboard.VisibleReportCount.Should().Be(2);
        dashboard.LatestLab!.MemberDisplayName.Should().NotBe("Synthetic Adult");
    }

    [Fact]
    public async Task AdultLatestLab_UsesDeterministicRangeCounts()
    {
        await using var db = NewDb();
        var s = await SeedFamilyAsync(db);
        db.Add(Report(s.AdultMember, (11.2m, 12m, 15m), (7.1m, 4m, 11m), (500m, 150m, 450m), (8m, null, null)));
        await db.SaveChangesAsync();

        var dashboard = await new PortalDashboardService(db, new StubCurrentUser(s.Adult.Id)).GetFamilyDashboardAsync(CancellationToken.None);

        dashboard.Role.Should().Be("AdultMember");
        dashboard.VisibleReportCount.Should().Be(1);
        dashboard.LatestLab.Should().NotBeNull();
        dashboard.LatestLab!.BelowRange.Should().Be(1);
        dashboard.LatestLab.WithinRange.Should().Be(1);
        dashboard.LatestLab.AboveRange.Should().Be(1);
        dashboard.LatestLab.RangeUnavailable.Should().Be(1);
        dashboard.Members.Single(x => x.Id == s.HeadMember.Id).Summary.Should().Be("Family member");
    }

    [Fact]
    public async Task DoctorFamilies_ListOnlyActivePrimaryAssignments()
    {
        await using var db = NewDb();
        var s = await SeedFamilyAsync(db);
        var doctorUser = new UserAccount { Email = "doc@example.invalid", PasswordHash = "x", DisplayName = "Dr. Synthetic", UserType = UserType.Doctor };
        var doctor = new Doctor { User = doctorUser, RegistrationNumberHash = "h", RegistrationNumberLastFour = "0001", VerificationStatus = VerificationStatus.Verified, Specialty = "General Practice" };
        var family = await db.Families.SingleAsync();
        var ended = new Family { Name = "Ended Family", CreatedByUserId = Guid.NewGuid() };
        db.AddRange(doctorUser, doctor, ended,
            new FamilyDoctorAssignment { Family = family, Doctor = doctor, IsPrimary = true },
            new FamilyDoctorAssignment { Family = ended, Doctor = doctor, IsPrimary = true, EndedAt = DateTimeOffset.UtcNow.AddDays(-1) });
        await db.SaveChangesAsync();

        var dashboard = await new PortalDashboardService(db, new StubCurrentUser(doctorUser.Id)).GetDoctorDashboardAsync(CancellationToken.None);

        dashboard.DoctorDisplayName.Should().Be("Dr. Synthetic");
        dashboard.Families.Should().ContainSingle().Which.FamilyName.Should().Be("Synthetic Family");
        dashboard.Families.Single().MemberCount.Should().Be(3);
    }

    [Fact]
    public async Task HeadMemberCard_CountsOnlyItemsTheAdultCurrentlyShares()
    {
        await using var db = NewDb();
        var s = await SeedFamilyAsync(db);
        var shared = Report(s.AdultMember, (1m, 2m, 3m));
        shared.SharedWithFamilyHead = true;
        db.AddRange(shared, Report(s.AdultMember, (1m, 2m, 3m)),
            new HealthRecord { Member = s.AdultMember, Title = "Synthetic shared note", SharedWithFamilyHead = true, OccurredOn = new DateOnly(2026, 9, 1) },
            new HealthRecord { Member = s.AdultMember, Title = "Synthetic private note", OccurredOn = new DateOnly(2026, 9, 1) });
        await db.SaveChangesAsync();

        var dashboard = await new PortalDashboardService(db, new StubCurrentUser(s.Head.Id)).GetFamilyDashboardAsync(CancellationToken.None);

        dashboard.Members.Single(x => x.Id == s.AdultMember.Id).Summary.Should().Be("Adult · 2 shared items");
    }

    [Fact]
    public async Task HeadGuidanceCount_IncludesManagedMinors_ButNeverAnotherAdult()
    {
        await using var db = NewDb();
        var s = await SeedFamilyAsync(db);
        TriageCase Approved(Member member) => new()
        {
            Member = member, Status = TriageStatus.Approved,
            Episode = new Episode { Member = member, SymptomsJson = "[]" }
        };
        db.AddRange(Approved(s.Minor), Approved(s.AdultMember));
        await db.SaveChangesAsync();

        var dashboard = await new PortalDashboardService(db, new StubCurrentUser(s.Head.Id)).GetFamilyDashboardAsync(CancellationToken.None);

        dashboard.ApprovedGuidanceCount.Should().Be(1);
    }

    [Fact]
    public async Task HeadActivity_ShowsSharedItem_OnlyWhileItIsStillShared()
    {
        await using var db = NewDb();
        var s = await SeedFamilyAsync(db);
        var stillShared = Report(s.AdultMember, (1m, 2m, 3m));
        stillShared.SharedWithFamilyHead = true;
        var nowPrivate = Report(s.AdultMember, (1m, 2m, 3m));
        db.AddRange(stillShared, nowPrivate);
        await db.SaveChangesAsync();
        foreach (var report in new[] { stillShared, nowPrivate })
            db.AuditLogs.Add(new AuditLog
            {
                ActorUserId = s.Adult.Id, SubjectMemberId = s.AdultMember.Id, EventType = "ADULT_ITEM_SHARED_WITH_HEAD",
                ResourceType = "LabReport", ResourceId = report.Id, Outcome = "SUCCESS", MetadataJson = "{}"
            });
        await db.SaveChangesAsync();

        var dashboard = await new PortalDashboardService(db, new StubCurrentUser(s.Head.Id)).GetFamilyDashboardAsync(CancellationToken.None);

        var sharedRows = dashboard.Activity.Where(x => x.Title == "Lab report shared").ToList();
        sharedRows.Should().ContainSingle().Which.Subject.Should().Be("Synthetic Adult");
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.FamilyUser;
    }
}
