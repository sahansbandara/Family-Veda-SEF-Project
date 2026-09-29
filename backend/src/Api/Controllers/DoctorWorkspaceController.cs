// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor workspace endpoints (DECISIONS 2026-09-29h). Access rules live in DoctorWorkspaceService.
using FamilyVeda.Application.Portal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyVeda.Api.Controllers;

[Route("api/v1")]
[Authorize]
public sealed class DoctorWorkspaceController(IDoctorWorkspaceService workspace) : ApiControllerBase
{
    [HttpGet("doctors/me/profile")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<DoctorPracticeProfileDto>> GetProfile(CancellationToken cancellationToken) =>
        Ok(await workspace.GetProfileAsync(cancellationToken));

    [HttpPut("doctors/me/profile")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<DoctorPracticeProfileDto>> UpdateProfile(UpdatePracticeProfileRequest request, CancellationToken cancellationToken) =>
        Ok(await workspace.UpdateProfileAsync(request, cancellationToken));

    [HttpGet("doctors/me/schedule")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<DoctorScheduleDto>> GetSchedule(CancellationToken cancellationToken) =>
        Ok(await workspace.GetScheduleAsync(cancellationToken));

    [HttpPut("doctors/me/availability")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<DoctorScheduleDto>> ReplaceAvailability(ReplaceAvailabilityRequest request, CancellationToken cancellationToken) =>
        Ok(await workspace.ReplaceAvailabilityAsync(request, cancellationToken));

    [HttpPost("doctors/me/blocked-time")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<BlockedTimeDto>> AddBlockedTime(CreateBlockedTimeRequest request, CancellationToken cancellationToken) =>
        Ok(await workspace.AddBlockedTimeAsync(request, cancellationToken));

    [HttpDelete("doctors/me/blocked-time/{id:guid}")]
    [Authorize(Policy = "Doctor")]
    public async Task<IActionResult> RemoveBlockedTime(Guid id, CancellationToken cancellationToken)
    {
        await workspace.RemoveBlockedTimeAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("families/{familyId:guid}/doctor/slots")]
    [Authorize(Policy = "FamilyUser")]
    public async Task<ActionResult<DoctorSlotsDto>> GetSlots(Guid familyId, [FromQuery] DateOnly date, CancellationToken cancellationToken) =>
        Ok(await workspace.GetFamilyDoctorSlotsAsync(familyId, date, cancellationToken));

    [HttpGet("doctors/me/families/{familyId:guid}")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<FamilyRosterForDoctorDto>> GetFamilyRoster(Guid familyId, CancellationToken cancellationToken) =>
        Ok(await workspace.GetFamilyRosterAsync(familyId, cancellationToken));

    [HttpGet("doctors/me/members/{memberId:guid}")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<MemberWorkspaceDto>> GetMemberWorkspace(Guid memberId, CancellationToken cancellationToken) =>
        Ok(await workspace.GetMemberWorkspaceAsync(memberId, cancellationToken));

    [HttpPost("doctors/me/members/{memberId:guid}/notes")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<ClinicalNoteDto>> AddNote(Guid memberId, CreateClinicalNoteRequest request, CancellationToken cancellationToken) =>
        Ok(await workspace.AddNoteAsync(memberId, request, cancellationToken));

    [HttpPost("doctors/me/notes/{noteId:guid}/amend")]
    [Authorize(Policy = "Doctor")]
    public async Task<ActionResult<ClinicalNoteDto>> AmendNote(Guid noteId, AmendClinicalNoteRequest request, CancellationToken cancellationToken) =>
        Ok(await workspace.AmendNoteAsync(noteId, request, cancellationToken));
}
