// Phase 1b — synthetic test data (agent/TODO.md "Phase 1b — Synthetic test data").
// Ownership waived for whole-project completion, DECISIONS 2026-09-28b.
// RULE 7: synthetic only. Every email ends with @example.invalid. No real names, drugs, doses or diagnoses.
// Additive: runs after DatabaseInitializer's base seed and DemoDataSeeder. Never edits their rows.
// Idempotent: guarded by SentinelEmail, so it is safe to run twice (e.g. seed on every API start-up).
using FamilyVeda.Domain.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Persistence.Seed;

public static class Phase1bSeeder
{
    public const string SentinelEmail = "phase1b-alpha-head@example.invalid";

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher<UserAccount> hasher, string password, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(x => x.Email == SentinelEmail, ct)) return;

        var now = DateTimeOffset.UtcNow;
        var ctx = new Phase1bSeedContext(db, hasher, password, now);

        var families = Phase1bFamilySeed.Seed(ctx);
        var doctors = Phase1bFamilySeed.SeedDoctors(ctx, families);

        await db.SaveChangesAsync(ct);

        Phase1bClinicalSeed.Seed(ctx, families, doctors);

        await db.SaveChangesAsync(ct);
    }
}

/// <summary>Shared helpers and RNG-free deterministic builders for the Phase 1b seed files.</summary>
public sealed class Phase1bSeedContext(AppDbContext db, IPasswordHasher<UserAccount> hasher, string password, DateTimeOffset now)
{
    public AppDbContext Db { get; } = db;
    public DateTimeOffset Now { get; } = now;

    public UserAccount NewUser(string email, string displayName, FamilyVeda.Domain.Common.UserType type)
    {
        var user = new UserAccount { Email = email, DisplayName = displayName, UserType = type, PasswordHash = string.Empty };
        user.PasswordHash = hasher.HashPassword(user, password);
        Db.Users.Add(user);
        return user;
    }
}
