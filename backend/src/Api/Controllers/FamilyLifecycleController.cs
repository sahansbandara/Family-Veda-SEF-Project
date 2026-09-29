// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family lifecycle endpoints. Authorization is re-checked in FamilyLifecycleService on every call.
using FamilyVeda.Application.Families;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyVeda.Api.Controllers;

[Route("api/v1")]
[Authorize(Policy = "FamilyUser")]
public sealed class FamilyLifecycleController(IFamilyLifecycleService lifecycleService) : ApiControllerBase
{
    [HttpGet("families/{familyId:guid}/invitations")]
    public async Task<ActionResult<IReadOnlyList<FamilyInvitationSummaryDto>>> GetInvitations(Guid familyId, CancellationToken cancellationToken) =>
        Ok(await lifecycleService.GetInvitationsAsync(familyId, cancellationToken));

    [HttpPost("families/{familyId:guid}/invitations/{invitationId:guid}/resend")]
    public async Task<ActionResult<FamilyInvitationDto>> ResendInvitation(Guid familyId, Guid invitationId, ResendFamilyInvitationRequest request, CancellationToken cancellationToken) =>
        Ok(await lifecycleService.ResendInvitationAsync(familyId, invitationId, request, cancellationToken));

    [HttpPost("families/{familyId:guid}/invitations/{invitationId:guid}/cancel")]
    public async Task<IActionResult> CancelInvitation(Guid familyId, Guid invitationId, CancellationToken cancellationToken)
    {
        await lifecycleService.CancelInvitationAsync(familyId, invitationId, cancellationToken);
        return NoContent();
    }

    /// <summary>Head only. The adult keeps their account and history in a new household of their own.</summary>
    [HttpPost("members/{memberId:guid}/remove-from-family")]
    public async Task<ActionResult<MembershipChangeDto>> RemoveFromFamily(Guid memberId, CancellationToken cancellationToken) =>
        Ok(await lifecycleService.RemoveAdultAsync(memberId, cancellationToken));

    /// <summary>Adult only. <c>startOwnFamily</c> records "Start My Own Family" instead of "Leave Family".</summary>
    [HttpPost("families/me/leave")]
    public async Task<ActionResult<MembershipChangeDto>> Leave(LeaveFamilyRequest request, CancellationToken cancellationToken) =>
        Ok(await lifecycleService.LeaveFamilyAsync(request, cancellationToken));
}
