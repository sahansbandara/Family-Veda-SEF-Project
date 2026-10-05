// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Profile settings for every portal (family, doctor, admin). The caller only ever sees their own account.
using FamilyVeda.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyVeda.Api.Controllers;

[Route("api/v1/profile")]
[Authorize]
public sealed class ProfileController(IProfileService profileService) : ApiControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<MyProfileDto>> GetMine(CancellationToken cancellationToken) =>
        Ok(await profileService.GetMineAsync(cancellationToken));

    [HttpPut("me")]
    public async Task<ActionResult<MyProfileDto>> UpdateMine(UpdateMyProfileRequest request, CancellationToken cancellationToken) =>
        Ok(await profileService.UpdateMineAsync(request, cancellationToken));
}
