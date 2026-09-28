// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Role-specific, atomic registration (FamilyVeda Registration Flows). Synthetic data only (RULE 7).
using FamilyVeda.Domain.Common;

namespace FamilyVeda.Application.Auth;

public sealed record AccountDetails(string FullName, string Email, string MobileNumber, string Password, string ConfirmPassword);
public sealed record PersonalDetails(DateOnly DateOfBirth, ClinicalSex SexForClinicalReference);
public sealed record AddressDetails(string AddressLine1, string? AddressLine2, string City, string District, string? PostalCode);

public sealed record RegisterFamilyHeadRequest(
    AccountDetails Account, PersonalDetails Personal, string NationalId, AddressDetails Address, bool AcceptTerms);

public enum FamilyConnectionMethod { Invitation, FamilyCode, Later }

public sealed record FamilyConnection(FamilyConnectionMethod Method, string? InvitationToken, string? FamilyCode, string? Relationship);

public sealed record RegisterAdultMemberRequest(
    AccountDetails Account, PersonalDetails Personal, AddressDetails Address, FamilyConnection Connection, bool AcceptTerms);

/// <summary>Doctor sign-up. The licence document arrives as a separate stream (multipart upload).</summary>
public sealed record RegisterDoctorAccountRequest(
    AccountDetails Account,
    string RegistrationNumber,
    string Specialization,
    string HospitalClinic,
    string PracticeCity,
    string District,
    IReadOnlyList<string> Languages,
    bool AcceptTerms);

public sealed record LicenseDocumentUpload(string FileName, string ContentType, long SizeBytes, Stream Content);

public sealed record RegistrationResult(AuthResponse Auth, string ConnectionOutcome);

public interface IRegistrationService
{
    Task<AuthResponse> RegisterFamilyHeadAsync(RegisterFamilyHeadRequest request, CancellationToken cancellationToken);
    Task<RegistrationResult> RegisterAdultMemberAsync(RegisterAdultMemberRequest request, CancellationToken cancellationToken);
    Task<AuthResponse> RegisterDoctorAsync(RegisterDoctorAccountRequest request, LicenseDocumentUpload document, CancellationToken cancellationToken);
}

/// <summary>Closed option lists shared by validation and clients.</summary>
public static class RegistrationReference
{
    public static readonly IReadOnlyList<string> Districts =
    [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna",
        "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
        "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    public static readonly IReadOnlyList<string> Relationships = ["Spouse", "Son", "Daughter", "Parent", "Sibling", "Other"];
    public static readonly IReadOnlyList<string> Languages = ["Sinhala", "Tamil", "English"];
    public const long MaxLicenseBytes = 5 * 1024 * 1024;
}
