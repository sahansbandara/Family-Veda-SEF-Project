// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
using FamilyVeda.Application.Clinical;
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.Infrastructure.Clinical;

/// <summary>
/// What a doctor can do after acknowledging an emergency referral. None of it changes what the
/// patient was told — the referral to in-person care stands and no AI output is released
/// (agent/DECISIONS.md 2026-10-05b).
/// </summary>
public sealed class EmergencyFollowUpService(AppDbContext dbContext, ICurrentUser currentUser) : IEmergencyFollowUpService
{
    public async Task<ApprovalDto> CloseReferralAsync(Guid caseId, CancellationToken cancellationToken)
    {
        var access = await EmergencyCaseAccess.RequireAsync(dbContext, currentUser, caseId, cancellationToken);
        // The case stays Escalated: the patient keeps seeing the referral. Closing only ends the doctors' queue work.
        var approval = new Approval
        {
            TriageCaseId = caseId,
            DoctorId = access.Doctor.Id,
            Action = ApprovalAction.CloseReferral,
            DoctorNotes = "Emergency referral closed.",
            DecidedAt = DateTimeOffset.UtcNow
        };
        dbContext.Approvals.Add(approval);
        AddAudit("EMERGENCY_REFERRAL_CLOSED", caseId, access.Case.MemberId);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ApprovalDto(approval.Id, approval.TriageCaseId, approval.DoctorId, approval.Action, approval.DecidedAt);
    }

    public async Task<ContactSharedDto> ShareContactAsync(Guid caseId, CancellationToken cancellationToken)
    {
        var access = await EmergencyCaseAccess.RequireAsync(dbContext, currentUser, caseId, cancellationToken);
        var phone = access.Doctor.PhoneNumber?.Trim();
        if (string.IsNullOrEmpty(phone))
        {
            throw new ValidationException(new Dictionary<string, string[]> { ["phoneNumber"] = ["Add a phone number to your profile before sharing your contact."] });
        }
        var alreadyShared = await dbContext.AuditLogs.AnyAsync(x =>
            x.EventType == "DOCTOR_CONTACT_SHARED" && x.ResourceId == caseId && x.ActorUserId == currentUser.UserId, cancellationToken);
        if (alreadyShared) throw new ConflictException("You already shared your contact for this referral.");

        var name = access.Doctor.User?.DisplayName?.Trim();
        var doctorLabel = string.IsNullOrEmpty(name) ? "A doctor" : name;
        foreach (var userId in await EmergencyCaseAccess.PatientRecipientsAsync(dbContext, access.Case.MemberId, cancellationToken))
        {
            dbContext.PortalNotifications.Add(new PortalNotification
            {
                UserId = userId,
                Type = "DOCTOR_CONTACT_SHARED",
                Title = "A doctor is following your referral",
                Body = $"{doctorLabel} has seen your urgent care referral. If you need to reach them directly, call {phone}. This does not replace urgent in-person care.",
                LinkPath = "/triage"
            });
        }
        AddAudit("DOCTOR_CONTACT_SHARED", caseId, access.Case.MemberId);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ContactSharedDto(caseId, DateTimeOffset.UtcNow);
    }

    private void AddAudit(string eventType, Guid caseId, Guid memberId) => dbContext.AuditLogs.Add(new AuditLog
    {
        ActorUserId = currentUser.UserId,
        SubjectMemberId = memberId,
        EventType = eventType,
        ResourceType = "TriageCase",
        ResourceId = caseId,
        Outcome = "SUCCESS",
        MetadataJson = "{}"
    });
}
