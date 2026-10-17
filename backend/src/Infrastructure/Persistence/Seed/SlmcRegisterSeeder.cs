// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// SYNTHETIC SLMC register (Rule 7). Names and numbers are invented; none is a real practitioner.
// Seeded doctors get an entry under their own seed hash; a few HMAC entries let the live
// registration flow demonstrate Match / NameMismatch. Idempotent.
using System.Security.Cryptography;
using System.Text;
using FamilyVeda.Domain.Clinical;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Persistence.Seed;

public static class SlmcRegisterSeeder
{
    private static readonly (string Number, string FullName)[] DemoRegister =
    [
        ("90001", "Dr. Synthetic Amara Perera"),
        ("90002", "Dr. Synthetic Nuwan Jayasinghe"),
        ("90003", "Dr. Synthetic Kavitha Rajan")
    ];

    public static async Task SeedAsync(AppDbContext dbContext, string? hashKey, CancellationToken cancellationToken)
    {
        var known = (await dbContext.SlmcRegisterEntries.Select(x => x.RegistrationNumberHash).ToListAsync(cancellationToken)).ToHashSet();
        var seededDoctors = await dbContext.Doctors.AsNoTracking()
            .Where(x => x.User!.Email.EndsWith("@example.invalid"))
            .Select(x => new { x.RegistrationNumberHash, x.User!.DisplayName })
            .ToListAsync(cancellationToken);
        foreach (var doctor in seededDoctors.Where(x => known.Add(x.RegistrationNumberHash)))
            dbContext.SlmcRegisterEntries.Add(new SlmcRegisterEntry { RegistrationNumberHash = doctor.RegistrationNumberHash, FullName = doctor.DisplayName });

        if (!string.IsNullOrEmpty(hashKey))
        {
            var purposeKey = SHA256.HashData(Encoding.UTF8.GetBytes($"FamilyVeda.DoctorRegistration.v1:{hashKey}"));
            foreach (var (number, name) in DemoRegister)
            {
                var hash = Convert.ToHexString(HMACSHA256.HashData(purposeKey, Encoding.UTF8.GetBytes(number)));
                if (known.Add(hash)) dbContext.SlmcRegisterEntries.Add(new SlmcRegisterEntry { RegistrationNumberHash = hash, FullName = name });
            }
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
