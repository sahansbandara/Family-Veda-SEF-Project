// Owner: S3 · synthetic fixtures only.
using FamilyVeda.Application.Agents;
using FamilyVeda.Application.Triage;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Safety;
using FamilyVeda.Domain.Triage;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Triage;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FamilyVeda.UnitTests;

public sealed class TriageOrchestratorCancellationTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task CallerShutdown_PropagatesWithoutRecordingAgentFailure(bool taskCanceled)
    {
        using var shutdown = new CancellationTokenSource();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new AppDbContext(options);
        var item = await SeedAsync(db);
        var notifications = new Notifications();
        var agent = new ThrowingAgent(() =>
        {
            shutdown.Cancel();
            return taskCanceled ? new TaskCanceledException("Synthetic shutdown") : new OperationCanceledException(shutdown.Token);
        });
        var runner = new TriageOrchestrator(db, [agent], new SafetyValidationService(), notifications, new ConfigurationBuilder().Build());

        var run = () => runner.RunAsync(item.Id, shutdown.Token);
        await run.Should().ThrowAsync<OperationCanceledException>();

        // Inspect persisted state through a new context, not failed-save tracked changes.
        await using var verify = new AppDbContext(options);
        var persisted = await verify.TriageCases.SingleAsync();
        persisted.Status.Should().Be(TriageStatus.Planning);
        persisted.FailureCode.Should().BeNull();
        (await verify.AgentTraces.ToListAsync()).Should().ContainSingle().Which.ErrorCode.Should().BeNull();
        notifications.Calls.Should().Be(0);
        db.ChangeTracker.Entries<AgentTrace>().Should().NotContain(x => x.Entity.ErrorCode == "AGENT_UNAVAILABLE");
    }

    [Theory]
    [InlineData("http")]
    [InlineData("task-cancel")]
    public async Task ProviderFailure_WithoutCallerCancellation_RemainsSafeFailure(string failure)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new AppDbContext(options);
        var item = await SeedAsync(db);
        var notifications = new Notifications();
        var agent = new ThrowingAgent(() => failure switch
        {
            "http" => new HttpRequestException("Synthetic provider failure"),
            _ => new TaskCanceledException("Synthetic provider timeout")
        });
        var runner = new TriageOrchestrator(db, [agent], new SafetyValidationService(), notifications, new ConfigurationBuilder().Build());

        await runner.RunAsync(item.Id, CancellationToken.None);

        await using var verify = new AppDbContext(options);
        var persisted = await verify.TriageCases.SingleAsync();
        persisted.Status.Should().Be(TriageStatus.FailedSafe);
        persisted.FailureCode.Should().Be("AGENT_UNAVAILABLE");
        persisted.DraftAdvisoryJson.Should().BeNull();
        (await verify.AgentTraces.OrderBy(x => x.StepNumber).LastAsync()).ErrorCode.Should().Be("AGENT_UNAVAILABLE");
        notifications.Calls.Should().Be(1);
    }

    private static async Task<TriageCase> SeedAsync(AppDbContext db)
    {
        var user = new UserAccount { Email = "synthetic-cancellation@example.invalid", PasswordHash = "synthetic", DisplayName = "Synthetic User", UserType = UserType.FamilyUser };
        var family = new Family { Name = "Synthetic Family", CreatedByUser = user };
        var member = new Member { Family = family, User = user, DisplayName = "Synthetic Member", DateOfBirth = new(1990, 1, 1), Role = FamilyRole.Head };
        var episode = new Episode { Member = member, SymptomsJson = "[\"synthetic cough\"]", DurationDays = 1, Severity = 2 };
        var item = new TriageCase { Episode = episode, Member = member, Status = TriageStatus.Submitted };
        db.Add(item);
        await db.SaveChangesAsync();
        return item;
    }
    private sealed class ThrowingAgent(Func<Exception> failure) : IAgent
    {
        public AgentKind Kind => AgentKind.Context;
        public Task<AgentRunResult> RunAsync(AgentRunContext context, CancellationToken cancellationToken) => throw failure();
    }
    private sealed class Notifications : INotificationService
    {
        public int Calls { get; private set; }
        public Task SendCaseStatusAsync(Guid caseId, TriageStatus status, CancellationToken cancellationToken) { Calls++; return Task.CompletedTask; }
        public Task<NotificationSubscriptionDto> SubscribeAsync(NotificationSubscriptionRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<FamilyVeda.Application.Common.PagedResult<NotificationDto>> GetInboxAsync(int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
