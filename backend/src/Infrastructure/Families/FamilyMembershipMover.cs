// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Moves a Member row between families (agent/DECISIONS.md 2026-09-29c). The row keeps its id, so every
// record, lab, vital, case and consent attached to it moves with the person. Nothing is deleted except
// same-family relationship links, which are copied into the audit row first.
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Families;

public sealed class FamilyMembershipMover(AppDbContext dbContext)
{
    /// <summary>Creates a one-person family with <paramref name="member"/> as Head. Caller saves.</summary>
    public async Task<Family> MoveToOwnHouseholdAsync(Member member, MembershipChangeReason reason, Guid actorUserId, CancellationToken cancellationToken)
    {
        if (member.UserId is null) throw new ConflictException("Only members with their own account can have their own household.");
        var household = new Family
        {
            Name = $"{member.DisplayName} Family",
            CreatedByUserId = member.UserId.Value,
            FamilyCode = await FamilyCodes.GenerateAsync(dbContext, cancellationToken)
        };
        dbContext.Families.Add(household);
        await MoveAsync(member, household.Id, FamilyRole.Head, reason, actorUserId, cancellationToken);
        return household;
    }

    /// <summary>
    /// Puts <paramref name="user"/> into <paramref name="familyId"/> as an Adult Member. A user who is alone in
    /// their own household moves there with their history; a user in a shared family must leave it first.
    /// </summary>
    public async Task<Member> AttachAdultAsync(UserAccount user, Guid familyId, DateOnly dateOfBirth, ClinicalSex sex, CancellationToken cancellationToken)
    {
        var existing = await dbContext.Members.SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        if (existing is null)
        {
            var member = new Member
            {
                FamilyId = familyId,
                UserId = user.Id,
                DisplayName = user.DisplayName,
                DateOfBirth = dateOfBirth,
                SexForClinicalReference = sex,
                Role = FamilyRole.AdultMember
            };
            dbContext.Members.Add(member);
            foreach (var category in Enum.GetValues<ConsentCategory>())
                dbContext.Consents.Add(new Consent { Member = member, Category = category });
            return member;
        }

        if (existing.FamilyId == familyId) throw new ConflictException("You are already a member of this family.");
        await RequireAloneInHouseholdAsync(existing, cancellationToken);
        await MoveAsync(existing, familyId, FamilyRole.AdultMember, MembershipChangeReason.JoinedFamily, user.Id, cancellationToken);
        return existing;
    }

    /// <summary>Joining another family is allowed only from no family or from a household of one.</summary>
    public async Task RequireCanJoinAnotherFamilyAsync(Guid userId, CancellationToken cancellationToken)
    {
        var existing = await dbContext.Members.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (existing is not null) await RequireAloneInHouseholdAsync(existing, cancellationToken);
    }

    private async Task RequireAloneInHouseholdAsync(Member member, CancellationToken cancellationToken)
    {
        if (await dbContext.Members.AnyAsync(x => x.FamilyId == member.FamilyId && x.Id != member.Id, cancellationToken))
            throw new ConflictException("Leave your current family before joining another one.");
    }

    private async Task MoveAsync(Member member, Guid toFamilyId, FamilyRole newRole, MembershipChangeReason reason, Guid actorUserId, CancellationToken cancellationToken)
    {
        var fromFamilyId = member.FamilyId;
        var links = await dbContext.Relationships
            .Where(x => x.MemberId == member.Id || x.RelatedMemberId == member.Id)
            .ToListAsync(cancellationToken);
        var endedLinks = links.Select(x => new { x.MemberId, x.RelatedMemberId, x.RelationshipType, x.IsBiological }).ToList();
        dbContext.Relationships.RemoveRange(links);

        // An open Head-transfer proposal involving this member can no longer complete.
        var openTransfers = await dbContext.FamilyHeadTransfers
            .Where(x => x.FamilyId == fromFamilyId && x.Status == Domain.Portal.PortalRequestStatus.Pending
                        && (x.FromMemberId == member.Id || x.ToMemberId == member.Id))
            .ToListAsync(cancellationToken);
        foreach (var transfer in openTransfers)
        {
            transfer.Status = Domain.Portal.PortalRequestStatus.Cancelled;
            transfer.RespondedAt = DateTimeOffset.UtcNow;
        }

        dbContext.FamilyMembershipEvents.Add(new FamilyMembershipEvent
        {
            MemberId = member.Id,
            FromFamilyId = fromFamilyId,
            ToFamilyId = toFamilyId,
            Reason = reason,
            PreviousRole = member.Role,
            ActorUserId = actorUserId
        });
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorUserId = actorUserId,
            SubjectMemberId = member.Id,
            EventType = "FAMILY_MEMBERSHIP_CHANGED",
            ResourceType = "Member",
            ResourceId = member.Id,
            Outcome = "SUCCESS",
            MetadataJson = JsonSerializer.Serialize(new { Reason = reason.ToString(), FromFamilyId = fromFamilyId, ToFamilyId = toFamilyId, EndedRelationships = endedLinks })
        });

        await ResetFamilySharingAsync(member.Id, cancellationToken);
        await CloseIfEmptyAsync(fromFamilyId, member.Id, cancellationToken);

        member.FamilyId = toFamilyId;
        member.Role = newRole;
        member.UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Sharing was a choice made for the old Head. A new Head must not inherit it, so every item goes back
    /// to private and the adult re-shares on purpose. Doctor consent is a separate control and is untouched.
    /// </summary>
    private async Task ResetFamilySharingAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var reports = await dbContext.LabReports.Where(x => x.MemberId == memberId && x.SharedWithFamilyHead).ToListAsync(cancellationToken);
        foreach (var report in reports) { report.SharedWithFamilyHead = false; report.UpdatedAt = now; }
        var records = await dbContext.HealthRecords.Where(x => x.MemberId == memberId && x.SharedWithFamilyHead).ToListAsync(cancellationToken);
        foreach (var record in records) { record.SharedWithFamilyHead = false; record.UpdatedAt = now; }
    }

    /// <summary>
    /// When the last person leaves, the household is closed rather than deleted: the doctor assignment ends
    /// (history kept), open requests and invitations stop, and the Family Code is withdrawn so nobody can ask
    /// to join a family without a Head.
    /// </summary>
    private async Task CloseIfEmptyAsync(Guid familyId, Guid leavingMemberId, CancellationToken cancellationToken)
    {
        if (await dbContext.Members.AnyAsync(x => x.FamilyId == familyId && x.Id != leavingMemberId, cancellationToken)) return;

        var now = DateTimeOffset.UtcNow;
        var assignments = await dbContext.FamilyDoctorAssignments.Where(x => x.FamilyId == familyId && x.EndedAt == null).ToListAsync(cancellationToken);
        foreach (var assignment in assignments) { assignment.EndedAt = now; assignment.UpdatedAt = now; }

        var doctorRequests = await dbContext.FamilyDoctorRequests
            .Where(x => x.FamilyId == familyId && x.Status == Domain.Portal.PortalRequestStatus.Pending).ToListAsync(cancellationToken);
        foreach (var request in doctorRequests) { request.Status = Domain.Portal.PortalRequestStatus.Cancelled; request.RespondedAt = now; }

        var joinRequests = await dbContext.FamilyJoinRequests
            .Where(x => x.FamilyId == familyId && x.Status == Domain.Portal.PortalRequestStatus.Pending).ToListAsync(cancellationToken);
        foreach (var request in joinRequests) { request.Status = Domain.Portal.PortalRequestStatus.Cancelled; request.RespondedAt = now; }

        var invitations = await dbContext.FamilyInvitations
            .Where(x => x.FamilyId == familyId && x.AcceptedAt == null && x.ExpiresAt > now).ToListAsync(cancellationToken);
        foreach (var invitation in invitations) invitation.ExpiresAt = now;

        var family = await dbContext.Families.SingleOrDefaultAsync(x => x.Id == familyId, cancellationToken);
        if (family is not null) { family.FamilyCode = null; family.UpdatedAt = now; }
    }
}

public static class FamilyCodes
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    /// <summary>Human-friendly "FV-XXXXXX" code. Identifies a family for a join request; never authorizes.</summary>
    public static async Task<string> GenerateAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var chars = new char[6];
            for (var i = 0; i < chars.Length; i++) chars[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
            var code = "FV-" + new string(chars);
            if (!await dbContext.Families.AnyAsync(x => x.FamilyCode == code, cancellationToken)) return code;
        }
        throw new InvalidOperationException("Unable to generate a unique family code.");
    }
}

public static class InvitationCrypto
{
    public static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    public static string HashEmail(string email, string token) => Convert.ToHexString(
        HMACSHA256.HashData(Encoding.UTF8.GetBytes(token), Encoding.UTF8.GetBytes(email)));

    /// <summary>"rashmi@example.invalid" → "r***@example.invalid". Enough for the Head to recognise, not to contact.</summary>
    public static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at <= 0 ? "***" : $"{email[0]}***{email[at..]}";
    }
}
