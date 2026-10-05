using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Persistence.Seed;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class VivaDemoSeederTests
{
    private const string SeedPassword = "synthetic-seed-password";
    private static readonly PasswordHasher<UserAccount> Hasher = new();

    [Fact]
    public async Task SeedAsync_CreatesLinkedAdultsIsolatedHeadsVerifiedDoctorProfilesAndNoClinicalAccess()
    {
        var db = await SeededDbAsync();

        var adults = await db.Users.Where(x => x.Email.StartsWith("viva-adult-")).OrderBy(x => x.Email).ToListAsync();
        adults.Should().HaveCount(5);
        adults.Should().OnlyContain(x => Hasher.VerifyHashedPassword(x, x.PasswordHash, SeedPassword) != PasswordVerificationResult.Failed);
        var members = await db.Members.Where(x => adults.Select(u => u.Id).Contains(x.UserId!.Value)).ToListAsync();
        var pereraId = (await db.Families.SingleAsync(f => f.Name == "Perera Family")).Id;
        members.Should().HaveCount(5);
        members.Select(x => x.DateOfBirth.Year).Order().Should().Equal([1990, 1991, 1992, 1993, 1994]);
        members.Count(x => x.FamilyId == pereraId && x.Role == FamilyRole.AdultMember).Should().Be(3);
        var isolated = members.Where(x => x.FamilyId != pereraId).ToList();
        isolated.Should().HaveCount(2);
        isolated.Should().OnlyContain(x => x.Role == FamilyRole.Head);
        isolated.Select(x => x.FamilyId).Distinct().Should().HaveCount(2);
        (await db.Consents.Where(x => members.Select(m => m.Id).Contains(x.MemberId)).ToListAsync()).Should().OnlyContain(x => x.Status == ConsentStatus.Granted && x.GrantedByGuardian == false && x.GrantedByUserId != null);

        var doctors = await db.Doctors.Include(x => x.User).Where(x => x.User!.Email.StartsWith("viva-doctor-")).ToListAsync();
        doctors.Should().HaveCount(4);
        doctors.Should().OnlyContain(x => x.VerificationStatus == VerificationStatus.Verified && x.AcceptingNewFamilies && x.SlotMinutes == 30);
        doctors.Select(x => x.Specialty).Distinct().Should().HaveCount(4);
        doctors.Select(x => x.HospitalClinic).Distinct().Should().HaveCount(4);
        (await db.DoctorAvailability.CountAsync(x => doctors.Select(d => d.Id).Contains(x.DoctorId))).Should().Be(4);
        (await db.CaseAccessGrants.CountAsync()).Should().Be(0);
        (await db.LabReports.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SeedAsync_IsIdempotentAndCompletesPartialVivaStateWithoutDuplicates()
    {
        var db = await BaseDbAsync();
        db.Users.Add(new UserAccount { Email = "viva-adult-01@example.invalid", DisplayName = "Viva Synthetic Adult 01", UserType = UserType.FamilyUser, PasswordHash = Hasher.HashPassword(new UserAccount { Email = "viva-adult-01@example.invalid", DisplayName = "legacy", UserType = UserType.FamilyUser, PasswordHash = string.Empty }, "an-earlier-seed-password") });
        await db.SaveChangesAsync();

        await VivaDemoSeeder.SeedAsync(db, Hasher, SeedPassword, CancellationToken.None);
        var usersAfterFirst = await db.Users.CountAsync();
        var familiesAfterFirst = await db.Families.CountAsync();
        await VivaDemoSeeder.SeedAsync(db, Hasher, SeedPassword, CancellationToken.None);

        (await db.Users.CountAsync()).Should().Be(usersAfterFirst);
        (await db.Families.CountAsync()).Should().Be(familiesAfterFirst);
        (await db.Users.CountAsync(x => x.Email == "viva-adult-01@example.invalid")).Should().Be(1);
        (await db.Members.CountAsync(x => x.User!.Email == "viva-adult-01@example.invalid")).Should().Be(1);
        var upgraded = await db.Users.SingleAsync(x => x.Email == "viva-adult-01@example.invalid");
        Hasher.VerifyHashedPassword(upgraded, upgraded.PasswordHash, "an-earlier-seed-password").Should().NotBe(PasswordVerificationResult.Failed);
    }

    private static async Task<AppDbContext> SeededDbAsync()
    {
        var db = await BaseDbAsync();
        await VivaDemoSeeder.SeedAsync(db, Hasher, SeedPassword, CancellationToken.None);
        return db;
    }

    private static async Task<AppDbContext> BaseDbAsync()
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var head = new UserAccount { Email = "demo-head@example.invalid", DisplayName = "Nimal Perera", UserType = UserType.FamilyUser, PasswordHash = "synthetic" };
        var family = new Family { Name = "Perera Family", CreatedByUser = head, FamilyCode = "FV-DEMO01" };
        db.AddRange(head, family, new Member { Family = family, User = head, DisplayName = "Nimal Perera", DateOfBirth = new DateOnly(1980, 1, 1), Role = FamilyRole.Head });
        await db.SaveChangesAsync();
        return db;
    }
}
