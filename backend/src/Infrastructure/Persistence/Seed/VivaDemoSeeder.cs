// Synthetic viva accounts only. They share Seed:DefaultPassword with the other demo logins; no credential is stored here.
using System.Security.Cryptography;
using System.Text;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Persistence.Seed;

public static class VivaDemoSeeder
{
    private const string HostedHeadEmail = "demo-head@example.invalid";

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher<UserAccount> hasher, string password, CancellationToken ct)
    {
        var hostedHead = await db.Users.SingleOrDefaultAsync(x => x.Email == HostedHeadEmail, ct);
        if (hostedHead is null) return;
        var perera = await db.Families.SingleOrDefaultAsync(x => x.CreatedByUserId == hostedHead.Id, ct);
        if (perera is null) return;

        var now = DateTimeOffset.UtcNow;
        for (var number = 1; number <= 5; number++)
        {
            var email = $"viva-adult-{number:00}@example.invalid";
            var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
            if (user is null)
            {
                user = new UserAccount { Email = email, DisplayName = $"Viva Synthetic Adult {number:00}", UserType = UserType.FamilyUser, PasswordHash = string.Empty };
                db.Users.Add(user);
            }
            EnsurePassword(user, hasher, password);

            var family = number <= 3 ? perera : await EnsureOwnFamilyAsync(db, user, number, ct);
            if (!await db.Members.AnyAsync(x => x.UserId == user.Id, ct))
            {
                var member = new Member { Family = family, User = user, DisplayName = user.DisplayName, DateOfBirth = new DateOnly(1989 + number, 1, 15), Role = number <= 3 ? FamilyRole.AdultMember : FamilyRole.Head };
                db.Members.Add(member);
                foreach (var category in Enum.GetValues<ConsentCategory>())
                    db.Consents.Add(new Consent { Member = member, Category = category, Status = ConsentStatus.Granted, GrantedByUserId = user.Id, GrantedAt = now, GrantedByGuardian = false });
            }
        }

        var profiles = new[]
        {
            ("Family Medicine", "Viva Family Clinic", "Colombo", "Colombo 07"),
            ("General Practice", "Viva Community Clinic", "Gampaha", "Negombo"),
            ("Internal Medicine", "Viva Medical Centre", "Kandy", "Kandy"),
            ("Paediatrics", "Viva Children's Clinic", "Galle", "Galle")
        };
        for (var number = 1; number <= 4; number++)
        {
            var email = $"viva-doctor-{number:00}@example.invalid";
            var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
            if (user is null)
            {
                user = new UserAccount { Email = email, DisplayName = $"Dr. Viva Synthetic {number:00}", UserType = UserType.Doctor, PasswordHash = string.Empty };
                db.Users.Add(user);
            }
            EnsurePassword(user, hasher, password);
            var doctor = await db.Doctors.SingleOrDefaultAsync(x => x.UserId == user.Id, ct);
            if (doctor is null)
            {
                var profile = profiles[number - 1];
                doctor = new Doctor
                {
                    User = user,
                    RegistrationNumberHash = Hash($"SYNTHETIC-VIVA-DOCTOR-{number:00}"),
                    RegistrationNumberLastFour = $"V{number:000}",
                    VerificationStatus = VerificationStatus.Verified,
                    Specialty = profile.Item1,
                    HospitalClinic = profile.Item2,
                    District = profile.Item3,
                    City = profile.Item4,
                    Languages = "Sinhala, English",
                    ConsultationModes = "InPerson,Video",
                    AcceptingNewFamilies = true,
                    SlotMinutes = 30
                };
                db.Doctors.Add(doctor);
                db.DoctorAvailability.Add(new DoctorAvailability { Doctor = doctor, DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(16, 0) });
            }
        }
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Keeps every viva login on the configured seed password, including accounts created by an earlier seeder version.</summary>
    private static void EnsurePassword(UserAccount user, IPasswordHasher<UserAccount> hasher, string password)
    {
        if (user.PasswordHash.Length == 0 || hasher.VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Failed)
            user.PasswordHash = hasher.HashPassword(user, password);
    }

    private static async Task<Family> EnsureOwnFamilyAsync(AppDbContext db, UserAccount user, int number, CancellationToken ct)
    {
        var family = await db.Families.SingleOrDefaultAsync(x => x.CreatedByUserId == user.Id, ct);
        if (family is not null) return family;
        family = new Family { Name = $"Viva Synthetic Family {number:00}", CreatedByUser = user, FamilyCode = $"FV-VIVA{number:00}" };
        db.Families.Add(family);
        return family;
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
