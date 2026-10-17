// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Admin-only SLMC claim dispute review. The service re-checks the Admin role (defence in depth).
using FamilyVeda.Application.Clinical;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyVeda.Api.Controllers;

[Route("api/v1/admin")]
[Authorize(Policy = "Admin")]
public sealed class ClaimDisputesController(IClaimDisputeService disputes) : ApiControllerBase
{
    [HttpGet("disputes")]
    public async Task<ActionResult<IReadOnlyList<ClaimDisputeDto>>> GetDisputes(bool includeResolved = false, CancellationToken cancellationToken = default) =>
        Ok(await disputes.GetDisputesAsync(includeResolved, cancellationToken));

    [HttpPost("disputes/{disputeId:guid}/resolve")]
    public async Task<ActionResult<ClaimDisputeDto>> Resolve(Guid disputeId, ResolveClaimDisputeRequest request, CancellationToken cancellationToken) =>
        Ok(await disputes.ResolveAsync(disputeId, request, cancellationToken));

    [HttpGet("doctors/{doctorId:guid}/license-document")]
    [Produces("application/pdf", "image/png", "image/jpeg")]
    public async Task<IActionResult> GetLicenseDocument(Guid doctorId, CancellationToken cancellationToken)
    {
        var file = await disputes.GetLicenseDocumentAsync(doctorId, cancellationToken);
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(file.Content, file.ContentType, file.FileName);
    }
}
