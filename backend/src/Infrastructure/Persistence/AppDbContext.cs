// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Records;
using FamilyVeda.Domain.Triage;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IDataProtectionKeyContext
{
    // S1 — identity, family, consent
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<Family> Families => Set<Family>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Relationship> Relationships => Set<Relationship>();
    public DbSet<Consent> Consents => Set<Consent>();
    public DbSet<FamilyInvitation> FamilyInvitations => Set<FamilyInvitation>();

    // S2 — records and extraction
    public DbSet<HealthRecord> HealthRecords => Set<HealthRecord>();
    public DbSet<LabReport> LabReports => Set<LabReport>();
    public DbSet<LabReportFile> LabReportFiles => Set<LabReportFile>();
    public DbSet<LabValue> LabValues => Set<LabValue>();
    public DbSet<Vital> Vitals => Set<Vital>();
    public DbSet<HereditaryFlag> HereditaryFlags => Set<HereditaryFlag>();

    // S3 — episodes and triage
    public DbSet<Episode> Episodes => Set<Episode>();
    public DbSet<TriageCase> TriageCases => Set<TriageCase>();
    public DbSet<AgentTrace> AgentTraces => Set<AgentTrace>();
    public DbSet<NotificationSubscription> NotificationSubscriptions => Set<NotificationSubscription>();

    // S4 — doctor, approval, grants and audit
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<DoctorVerificationLog> DoctorVerificationLogs => Set<DoctorVerificationLog>();
    public DbSet<FamilyDoctorAssignment> FamilyDoctorAssignments => Set<FamilyDoctorAssignment>();
    public DbSet<CaseAccessGrant> CaseAccessGrants => Set<CaseAccessGrant>();
    public DbSet<Approval> Approvals => Set<Approval>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // S1 — ASP.NET Data Protection key ring, persisted so protected tokens survive restarts (ADR-010)
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                     .Where(x => typeof(Domain.Common.Entity).IsAssignableFrom(x.ClrType)))
        {
            entityType.FindProperty(nameof(Domain.Common.Entity.Id))?.SetDefaultValueSql("gen_random_uuid()");
        }
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Domain.Common.Entity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
            }

            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
