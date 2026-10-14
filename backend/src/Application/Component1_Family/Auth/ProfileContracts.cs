// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// The signed-in user's own profile. Only the caller's data; never another user's.
namespace FamilyVeda.Application.Auth;

/// <summary>Family fields are present only for family users with a member profile.</summary>
public sealed record MyProfileDto(
    Guid UserId,
    string Email,
    string DisplayName,
    string UserType,
    DateTimeOffset CreatedAt,
    string? FamilyRole,
    string? FamilyName,
    string? FamilyCode,
    DateOnly? DateOfBirth,
    string? SexForClinicalReference);

public sealed record UpdateMyProfileRequest(string DisplayName);

public interface IProfileService
{
    Task<MyProfileDto> GetMineAsync(CancellationToken cancellationToken);
    Task<MyProfileDto> UpdateMineAsync(UpdateMyProfileRequest request, CancellationToken cancellationToken);
}
