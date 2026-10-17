// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Every five minutes: claimants who missed their SLMC evidence deadline are suspended and admins notified.
using FamilyVeda.Application.Clinical;

namespace FamilyVeda.Api.Background;

public sealed class ClaimEvidenceDeadlineWorker(IServiceScopeFactory scopeFactory, ILogger<ClaimEvidenceDeadlineWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var expired = await scope.ServiceProvider.GetRequiredService<IClaimEvidenceDeadlineProcessor>().ProcessExpiredAsync(stoppingToken);
                if (expired > 0) logger.LogInformation("Expired {Count} SLMC evidence requests.", expired);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogError(exception, "SLMC evidence deadline scan failed."); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
