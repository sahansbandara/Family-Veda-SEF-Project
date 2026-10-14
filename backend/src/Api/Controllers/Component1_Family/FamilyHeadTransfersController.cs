// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// FH-3 Family Head transfer. The service re-checks Head / target identity on every call.
using FamilyVeda.Application.Families;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyVeda.Api.Controllers;

[Route("api/v1/families")]
[Authorize(Policy = "FamilyUser")]
public sealed class FamilyHeadTransfersController(IFamilyHeadTransferService transferService) : ApiControllerBase
{
    [HttpPost("{familyId:guid}/head-transfers")]
    public async Task<ActionResult<HeadTransferDto>> Propose(Guid familyId, CreateHeadTransferRequest request, CancellationToken cancellationToken) =>
        Ok(await transferService.ProposeAsync(familyId, request, cancellationToken));

    /// <summary>Head only. 204 when nothing is waiting.</summary>
    [HttpGet("{familyId:guid}/head-transfers/pending")]
    public async Task<ActionResult<HeadTransferDto>> GetPending(Guid familyId, CancellationToken cancellationToken) =>
        await transferService.GetPendingForFamilyAsync(familyId, cancellationToken) is { } transfer ? Ok(transfer) : NoContent();

    /// <summary>The signed-in adult's open offer, if any. 204 when nothing is waiting.</summary>
    [HttpGet("head-transfers/incoming")]
    public async Task<ActionResult<HeadTransferDto>> GetIncoming(CancellationToken cancellationToken) =>
        await transferService.GetIncomingAsync(cancellationToken) is { } transfer ? Ok(transfer) : NoContent();

    [HttpPost("head-transfers/{transferId:guid}/accept")]
    public async Task<ActionResult<HeadTransferDto>> Accept(Guid transferId, CancellationToken cancellationToken) =>
        Ok(await transferService.AcceptAsync(transferId, cancellationToken));

    [HttpPost("head-transfers/{transferId:guid}/decline")]
    public async Task<ActionResult<HeadTransferDto>> Decline(Guid transferId, CancellationToken cancellationToken) =>
        Ok(await transferService.DeclineAsync(transferId, cancellationToken));

    [HttpPost("head-transfers/{transferId:guid}/cancel")]
    public async Task<ActionResult<HeadTransferDto>> Cancel(Guid transferId, CancellationToken cancellationToken) =>
        Ok(await transferService.CancelAsync(transferId, cancellationToken));
}
