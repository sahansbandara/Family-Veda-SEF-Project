// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Atomic, role-specific registration. Each call stages every row and commits once with SaveChanges,
// so a failed invitation, code or document check leaves no half-created account behind.
using System.Security.Cryptography;
using System.Text;
using FamilyVeda.Application.Auth;
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Auth;

public sealed partial class AuthService : IRegistrationService
{
    private static readonly Dictionary<string, byte[][]> LicenseSignatures = new(StringComparer.OrdinalIgnoreCase)
    {
        ["application/pdf"] = [[0x25, 0x50, 0x44, 0x46]],
        ["image/png"] = [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
        ["image/jpeg"] = [[0xFF, 0xD8, 0xFF]]
    };

    public async Task<AuthResponse> RegisterFamilyHeadAsync(RegisterFamilyHeadRequest request, CancellationToken cancellationToken)
    {
        var user = await StageUserAsync(request.Account, UserType.FamilyUser, cancellationToken);
        var nationalId = request.NationalId.Trim().ToUpperInvariant();
        var nationalIdHash = KeyedHash("FamilyVeda.NationalId.v1", nationalId);
        if (await dbContext.UserProfiles.AnyAsync(x => x.NationalIdHash == nationalIdHash, cancellationToken))
        {
            throw new ConflictException("This NIC is already registered.");
        }

        var profile = StageProfile(user, request.Account, request.Personal, request.Address);
        profile.NationalIdHash = nationalIdHash;
        profile.NationalIdLastFour = nationalId[^4..];
        AddRegistrationAudit(user.Id, "FAMILY_HEAD_REGISTERED", "FamilyHead", user.Id, "PENDING", new { NicLastFour = profile.NationalIdLastFour });
        return await CommitAsync(user, cancellationToken);
    }

    public async Task<RegistrationResult> RegisterAdultMemberAsync(RegisterAdultMemberRequest request, CancellationToken cancellationToken)
    {
        var user = await StageUserAsync(request.Account, UserType.FamilyUser, cancellationToken);
        StageProfile(user, request.Account, request.Personal, request.Address);
        var outcome = request.Connection.Method switch
        {
            FamilyConnectionMethod.Invitation => await StageInvitationAsync(user, request, cancellationToken),
            FamilyConnectionMethod.FamilyCode => await StageJoinRequestAsync(user, request.Connection, cancellationToken),
            _ => "NotConnected"
        };
        AddRegistrationAudit(user.Id, "ADULT_MEMBER_REGISTERED", "User", user.Id, "SUCCESS", new { Connection = outcome });
        return new RegistrationResult(await CommitAsync(user, cancellationToken), outcome);
    }

    public async Task<AuthResponse> RegisterDoctorAsync(RegisterDoctorAccountRequest request, LicenseDocumentUpload document, CancellationToken cancellationToken)
    {
        var content = await ReadLicenseDocumentAsync(document, cancellationToken);
        var user = await StageUserAsync(request.Account, UserType.Doctor, cancellationToken);
        var registrationNumber = request.RegistrationNumber.Trim();
        var registrationHash = Convert.ToHexString(HMACSHA256.HashData(
            SHA256.HashData(Encoding.UTF8.GetBytes($"FamilyVeda.DoctorRegistration.v1:{_options.Key}")),
            Encoding.UTF8.GetBytes(registrationNumber.ToUpperInvariant())));
        if (await dbContext.Doctors.AnyAsync(x => x.RegistrationNumberHash == registrationHash, cancellationToken))
        {
            throw new ConflictException("Registration number is already registered.");
        }

        var doctor = new Doctor
        {
            UserId = user.Id,
            RegistrationNumberHash = registrationHash,
            RegistrationNumberLastFour = registrationNumber[^Math.Min(4, registrationNumber.Length)..],
            VerificationStatus = VerificationStatus.Pending,
            Specialty = request.Specialization.Trim(),
            HospitalClinic = request.HospitalClinic.Trim(),
            PhoneNumber = NormalizeMobile(request.Account.MobileNumber),
            City = request.PracticeCity.Trim(),
            District = request.District,
            Languages = string.Join(", ", request.Languages)
        };
        dbContext.Doctors.Add(doctor);
        dbContext.UserProfiles.Add(new UserProfile { UserId = user.Id, PhoneNumber = doctor.PhoneNumber, TermsAcceptedAt = DateTimeOffset.UtcNow });
        dbContext.DoctorLicenseDocuments.Add(new DoctorLicenseDocument
        {
            DoctorId = doctor.Id,
            FileName = Path.GetFileName(document.FileName),
            ContentType = document.ContentType.ToLowerInvariant(),
            SizeBytes = content.Length,
            Content = content
        });
        AddRegistrationAudit(user.Id, "DOCTOR_REGISTERED", "Doctor", doctor.Id, "PENDING",
            new { RegistrationNumberLastFour = doctor.RegistrationNumberLastFour, LicenseDocument = true });
        return await CommitAsync(user, cancellationToken);
    }

    private async Task<UserAccount> StageUserAsync(AccountDetails account, UserType userType, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(account.Email);
        if (await dbContext.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            throw new ConflictException("An account already exists for this email address.");
        }

        var user = new UserAccount { Email = email, DisplayName = account.FullName.Trim(), PasswordHash = string.Empty, UserType = userType };
        user.PasswordHash = passwordHasher.HashPassword(user, account.Password);
        dbContext.Users.Add(user);
        return user;
    }

    private UserProfile StageProfile(UserAccount user, AccountDetails account, PersonalDetails personal, AddressDetails address)
    {
        var profile = new UserProfile
        {
            UserId = user.Id,
            PhoneNumber = NormalizeMobile(account.MobileNumber),
            DateOfBirth = personal.DateOfBirth,
            SexForClinicalReference = personal.SexForClinicalReference,
            AddressLine1 = address.AddressLine1.Trim(),
            AddressLine2 = string.IsNullOrWhiteSpace(address.AddressLine2) ? null : address.AddressLine2.Trim(),
            City = address.City.Trim(),
            District = address.District,
            PostalCode = string.IsNullOrWhiteSpace(address.PostalCode) ? null : address.PostalCode.Trim(),
            TermsAcceptedAt = DateTimeOffset.UtcNow
        };
        dbContext.UserProfiles.Add(profile);
        return profile;
    }

    private async Task<string> StageInvitationAsync(UserAccount user, RegisterAdultMemberRequest request, CancellationToken cancellationToken)
    {
        var token = request.Connection.InvitationToken!.Trim();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        var emailHash = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(token), Encoding.UTF8.GetBytes(user.Email)));
        var invitation = await dbContext.FamilyInvitations.SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);
        if (invitation is null || invitation.AcceptedAt is not null || invitation.ExpiresAt <= DateTimeOffset.UtcNow || invitation.InvitedEmailHash != emailHash)
        {
            // One generic message: never reveal whether a token exists or which email it was for.
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["connection.invitationToken"] = ["This invitation is invalid, expired, or was sent to a different email address."]
            });
        }

        var member = new Member
        {
            FamilyId = invitation.FamilyId,
            UserId = user.Id,
            DisplayName = user.DisplayName,
            DateOfBirth = request.Personal.DateOfBirth,
            SexForClinicalReference = request.Personal.SexForClinicalReference,
            Role = FamilyRole.AdultMember
        };
        dbContext.Members.Add(member);
        foreach (var category in Enum.GetValues<ConsentCategory>())
        {
            dbContext.Consents.Add(new Consent { Member = member, Category = category });
        }
        invitation.AcceptedAt = DateTimeOffset.UtcNow;
        AddRegistrationAudit(user.Id, "FAMILY_INVITATION_ACCEPTED", "Family", invitation.FamilyId, "SUCCESS", new { });
        return "JoinedFamily";
    }

    private async Task<string> StageJoinRequestAsync(UserAccount user, FamilyConnection connection, CancellationToken cancellationToken)
    {
        var code = connection.FamilyCode!.Trim().ToUpperInvariant();
        var family = await dbContext.Families.AsNoTracking().SingleOrDefaultAsync(x => x.FamilyCode == code, cancellationToken)
            ?? throw new ValidationException(new Dictionary<string, string[]>
            {
                ["connection.familyCode"] = ["We could not send a join request with that family code. Check it with your Family Head."]
            });
        // Knowing the code never grants membership: the Family Head must approve this request.
        var joinRequest = new FamilyJoinRequest { FamilyId = family.Id, RequestingUserId = user.Id, RelationshipType = connection.Relationship! };
        dbContext.FamilyJoinRequests.Add(joinRequest);
        AddRegistrationAudit(user.Id, "FAMILY_JOIN_REQUESTED", "FamilyJoinRequest", joinRequest.Id, "PENDING", new { });
        return "JoinRequestPending";
    }

    private async Task<byte[]> ReadLicenseDocumentAsync(LicenseDocumentUpload document, CancellationToken cancellationToken)
    {
        static ValidationException Invalid(string message) =>
            new(new Dictionary<string, string[]> { ["licenseDocument"] = [message] });

        if (document.SizeBytes <= 0 || document.SizeBytes > RegistrationReference.MaxLicenseBytes)
            throw Invalid("Upload a licence document up to 5 MB.");
        if (!LicenseSignatures.TryGetValue(document.ContentType, out var signatures))
            throw Invalid("Licence document must be a PDF, PNG or JPEG file.");

        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = await document.Content.ReadAsync(chunk, cancellationToken)) > 0)
        {
            if (buffer.Length + read > RegistrationReference.MaxLicenseBytes) throw Invalid("Upload a licence document up to 5 MB.");
            buffer.Write(chunk, 0, read);
        }
        var bytes = buffer.ToArray();
        if (bytes.Length != document.SizeBytes || !signatures.Any(sig => bytes.AsSpan().StartsWith(sig)))
            throw Invalid("The file content does not match a PDF, PNG or JPEG document.");
        return bytes;
    }

    private void AddRegistrationAudit(Guid actor, string eventType, string resourceType, Guid resourceId, string outcome, object metadata) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = actor,
            EventType = eventType,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Outcome = outcome,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(metadata)
        });

    private async Task<AuthResponse> CommitAsync(UserAccount user, CancellationToken cancellationToken)
    {
        // One transaction: the account, profile, connection rows and token state commit together or not at all.
        // Run inside the configured execution strategy so Npgsql's retry policy covers the whole unit.
        if (!dbContext.Database.IsRelational())
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            var inMemory = await IssueTokensAsync(user, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return inMemory;
        }

        return await dbContext.Database.CreateExecutionStrategy().ExecuteAsync(async ct =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
            await dbContext.SaveChangesAsync(ct);
            var response = await IssueTokensAsync(user, ct);
            await dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return response;
        }, cancellationToken);
    }

    private string KeyedHash(string purpose, string value) => Convert.ToHexString(HMACSHA256.HashData(
        SHA256.HashData(Encoding.UTF8.GetBytes($"{purpose}:{_options.Key}")), Encoding.UTF8.GetBytes(value)));

    private static string NormalizeMobile(string value)
    {
        var digits = value.Replace(" ", "");
        return digits.StartsWith("+94", StringComparison.Ordinal) ? "0" + digits[3..] : digits;
    }
}
