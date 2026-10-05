// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FamilyVeda.Infrastructure.Persistence.Configurations;

internal sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("user_profiles");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.Property(x => x.PhoneNumber).HasMaxLength(16).IsRequired();
        builder.Property(x => x.SexForClinicalReference).HasConversion<string>().HasMaxLength(16).HasDefaultValue(ClinicalSex.NotSpecified);
        builder.Property(x => x.AddressLine1).HasMaxLength(120);
        builder.Property(x => x.AddressLine2).HasMaxLength(120);
        builder.Property(x => x.City).HasMaxLength(80);
        builder.Property(x => x.District).HasMaxLength(40);
        builder.Property(x => x.PostalCode).HasMaxLength(5);
        builder.Property(x => x.NationalIdHash).HasMaxLength(64);
        builder.Property(x => x.NationalIdLastFour).HasMaxLength(4);
        builder.HasIndex(x => x.NationalIdHash).IsUnique().HasFilter("national_id_hash IS NOT NULL");
    }
}

internal sealed class DoctorLicenseDocumentConfiguration : IEntityTypeConfiguration<DoctorLicenseDocument>
{
    public void Configure(EntityTypeBuilder<DoctorLicenseDocument> builder)
    {
        builder.ToTable("doctor_license_documents");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.DoctorId);
        builder.Property(x => x.FileName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Content).IsRequired();
    }
}
