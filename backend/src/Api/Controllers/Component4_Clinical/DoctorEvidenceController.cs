// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// A claimant (Verified or Pending) answers the admin's SLMC evidence request. The service scopes every call to the signed-in doctor.
using FamilyVeda.Application.Clinical;
using FamilyVeda.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyVeda.Api.Controllers;

[Route("api/v1/doctors/me/evidence-requests")]
[Authorize(Policy = "Doctor")]
public sealed class DoctorEvidenceController(IClaimEvidenceService evidence) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EvidenceRequestDto>>> GetOpen(CancellationToken cancellationToken) =>
        Ok(await evidence.GetMyOpenRequestsAsync(cancellationToken));

    [HttpPost("{requestId:guid}/files")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<EvidenceRequestDto>> Upload(Guid requestId, [FromForm] EvidenceUploadForm form, CancellationToken cancellationToken)
    {
        if (form.File is null)
            throw new Application.Common.ValidationException(new Dictionary<string, string[]> { ["file"] = ["Choose a file to upload."] });
        await using var stream = form.File.OpenReadStream();
        return Ok(await evidence.UploadAsync(requestId,
            new EvidenceUpload(form.Kind, form.File.FileName, form.File.ContentType, form.File.Length, stream), cancellationToken));
    }
}

public sealed class EvidenceUploadForm
{
    public EvidenceKind Kind { get; init; }
    public IFormFile? File { get; init; }
}
