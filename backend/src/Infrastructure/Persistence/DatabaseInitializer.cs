// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
using System.Security.Cryptography;
using System.Text;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Records;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FamilyVeda.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (configuration.GetValue<bool>("Database:MigrateOnStartup")) await dbContext.Database.MigrateAsync(cancellationToken);
        if (!configuration.GetValue<bool>("Seed:Enabled")) return;
        var password = configuration["Seed:DefaultPassword"];
        if (string.IsNullOrWhiteSpace(password) || password.Length < 12)
            throw new InvalidOperationException("Seed:DefaultPassword must contain at least 12 characters when synthetic seed is enabled.");
        if (await dbContext.Users.AnyAsync(x => x.Email == "demo-head@example.invalid", cancellationToken)) return;

        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<UserAccount>>();
        UserAccount User(string email, string name, UserType type)
        {
            var user = new UserAccount { Email = email, DisplayName = name, UserType = type, PasswordHash = string.Empty };
            user.PasswordHash = hasher.HashPassword(user, password);
            return user;
        }
        var head = User("demo-head@example.invalid", "Synthetic Family Head", UserType.FamilyUser);
        var adult = User("demo-member@example.invalid", "Synthetic Adult Member", UserType.FamilyUser);
        var doctorUser = User("demo-doctor@example.invalid", "Synthetic Verified Doctor", UserType.Doctor);
        var pendingUser = User("demo-pending@example.invalid", "Synthetic Pending Doctor", UserType.Doctor);
        var admin = User("demo-admin@example.invalid", "Synthetic Clinic Admin", UserType.Admin);
        dbContext.Users.AddRange(head, adult, doctorUser, pendingUser, admin);
        var family = new Family { Name = "Synthetic Demonstration Family", CreatedByUser = head };
        var headMember = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1985, 1, 15), Role = FamilyRole.Head };
        var adultMember = new Member { Family = family, User = adult, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(2000, 6, 10), Role = FamilyRole.AdultMember };
        var minorMember = new Member { Family = family, DisplayName = "Synthetic Minor", DateOfBirth = new DateOnly(2015, 3, 20), Role = FamilyRole.MinorMember };
        var secondMinorMember = new Member { Family = family, DisplayName = "Synthetic Younger Minor", DateOfBirth = new DateOnly(2019, 9, 12), Role = FamilyRole.MinorMember };
        dbContext.Families.Add(family); dbContext.Members.AddRange(headMember, adultMember, minorMember, secondMinorMember);
        foreach (var member in new[] { headMember, adultMember, minorMember, secondMinorMember })
            foreach (var category in Enum.GetValues<ConsentCategory>())
                dbContext.Consents.Add(new Consent { Member = member, Category = category, Status = ConsentStatus.NotSet });
        dbContext.Relationships.AddRange(
            new Relationship { Member = headMember, RelatedMember = minorMember, RelationshipType = "guardian", IsBiological = true },
            new Relationship { Member = minorMember, RelatedMember = headMember, RelationshipType = "parent", IsBiological = true },
            new Relationship { Member = headMember, RelatedMember = secondMinorMember, RelationshipType = "guardian", IsBiological = true },
            new Relationship { Member = secondMinorMember, RelatedMember = headMember, RelationshipType = "parent", IsBiological = true });
        // ===== S2 — Health Records & Extraction =====
        var baselineNote = new HealthRecord { Member = headMember, RecordType = RecordType.Note, Title = "Synthetic baseline note", Summary = "Demonstration data only.", OccurredOn = new DateOnly(2026, 1, 15) };
        var laterNote = new HealthRecord { Member = headMember, RecordType = RecordType.Note, Title = "Synthetic follow-up note", Summary = "Later demonstration row for newest/oldest sort.", OccurredOn = new DateOnly(2026, 7, 1) };
        dbContext.HealthRecords.AddRange(baselineNote, laterNote);
        dbContext.Vitals.AddRange(
            new Vital { Member = headMember, VitalType = "synthetic_metric", Value = 1m, Unit = "demo", MeasuredAt = DateTimeOffset.UtcNow.AddDays(-14) },
            new Vital { Member = headMember, VitalType = "synthetic_metric", Value = 1.2m, Unit = "demo", MeasuredAt = DateTimeOffset.UtcNow.AddDays(-7) },
            new Vital { Member = headMember, VitalType = "synthetic_metric", Value = 1.1m, Unit = "demo", MeasuredAt = DateTimeOffset.UtcNow.AddDays(-1) });
        dbContext.HereditaryFlags.Add(new HereditaryFlag
        {
            Member = headMember,
            HealthRecord = laterNote,
            ConditionCode = "SYNTH-DEMO",
            Finding = "Explicit synthetic screening marker",
            Confidence = 0.6m,
            ManuallyConfirmed = false
        });
        // ===== end S2 =====
        string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        var verifiedDoctor = new Doctor { User = doctorUser, RegistrationNumberHash = Hash("SYNTHETIC-VERIFIED"), RegistrationNumberLastFour = "DEMO", VerificationStatus = VerificationStatus.Verified, Specialty = "Synthetic demonstration" };
        var pendingDoctor = new Doctor { User = pendingUser, RegistrationNumberHash = Hash("SYNTHETIC-PENDING"), RegistrationNumberLastFour = "TEST", VerificationStatus = VerificationStatus.Pending, Specialty = "Synthetic demonstration" };
        dbContext.Doctors.AddRange(verifiedDoctor, pendingDoctor);
        dbContext.FamilyDoctorAssignments.Add(new FamilyDoctorAssignment { Family = family, Doctor = verifiedDoctor, IsPrimary = true });
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
