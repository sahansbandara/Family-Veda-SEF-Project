// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Registration profile captured at sign-up (docs: FamilyVeda Registration Flows). Synthetic data only (RULE 7).
using FamilyVeda.Domain.Common;

namespace FamilyVeda.Domain.Identity;

/// <summary>
/// Personal details collected during registration, one per account. The national ID is never stored raw:
/// only a keyed hash (for duplicate detection) and the last four characters (for display).
/// </summary>
public sealed class UserProfile : Entity
{
    public Guid UserId { get; set; }
    public UserAccount? User { get; set; }
    public required string PhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public ClinicalSex SexForClinicalReference { get; set; } = ClinicalSex.NotSpecified;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? PostalCode { get; set; }
    public string? NationalIdHash { get; set; }
    public string? NationalIdLastFour { get; set; }
    public DateTimeOffset TermsAcceptedAt { get; set; }
}
