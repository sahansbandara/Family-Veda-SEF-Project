// Owner: S3 · Triage & Agent Orchestration
using FamilyVeda.Application.Agents;
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Triage;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Safety;
using FamilyVeda.Domain.Triage;
using FamilyVeda.Infrastructure.Clinical;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Triage;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FamilyVeda.UnitTests;

public sealed class TriageSubmissionLifecycleTests
{
    [Fact]
    public async Task Submission_IsReceivedImmediately_WithoutClinicalGrant_AndOnlyAssignedDoctorSeesMetadata()
    {
        await using var f = await Fixture.CreateAsync();
        var submitted = await f.Patient.SubmitTriageAsync(f.Episode.Id, default);
        submitted.Status.Should().Be(TriageStatus.Submitted);
        submitted.CaseNumber.Should().Be(f.Db.TriageCases.Single().CaseNumber);
        submitted.DoctorReceivedAt.Should().NotBeNull();
        submitted.DoctorReviewStartedAt.Should().BeNull();
        submitted.CanEdit.Should().BeTrue();
        submitted.SubmittedEpisode!.Notes.Should().Be("Synthetic complaint");
        f.Db.CaseAccessGrants.Should().BeEmpty();
        f.Db.TriageCases.Single().Status = TriageStatus.FailedSafe;
        await f.Db.SaveChangesAsync();
        var queue = await f.Clinical.GetProcessingCasesAsync(1, 20, default);
        queue.Items.Should().ContainSingle().Which.Id.Should().Be(submitted.Id);
        var json = System.Text.Json.JsonSerializer.Serialize(queue.Items.Single());
        json.Should().NotContain("MemberId").And.NotContain("Priority").And.NotContain("Synthetic complaint");
        f.Db.FamilyDoctorAssignments.Single().EndedAt = DateTimeOffset.UtcNow;
        await f.Db.SaveChangesAsync();
        (await f.Clinical.GetProcessingCasesAsync(1, 20, default)).Items.Should().BeEmpty();
    }

    [Fact]
    public async Task FamilyCaseList_WithoutGuardianConsent_DoesNotReleaseMinorComplaint()
    {
        await using var f = await Fixture.CreateAsync();
        var child = new Member { FamilyId = f.Episode.Member!.FamilyId, DisplayName = "Synthetic child", DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-7), Role = FamilyRole.MinorMember };
        var episode = new Episode { Member = child, SymptomsJson = "[\"Synthetic child symptom\"]", DurationDays = 2, Severity = 3, Notes = "Synthetic private child complaint" };
        var item = new TriageCase { Member = child, Episode = episode, Status = TriageStatus.Submitted };
        f.Db.Add(item);
        await f.Db.SaveChangesAsync();
        var cases = await f.Patient.GetFamilyCasesAsync(child.FamilyId, 1, 20, default);
        cases.Items.Should().ContainSingle().Which.SubmittedEpisode.Should().BeNull();
        var serialized = System.Text.Json.JsonSerializer.Serialize(cases);
        serialized.Should().NotContain("Synthetic private child complaint").And.NotContain("Synthetic child symptom");
        await Assert.ThrowsAsync<NotFoundException>(() => f.Patient.GetCaseAsync(item.Id, default));
    }

    [Fact]
    public async Task LegacyDoctorRead_ConservativelyLocksPatientChanges()
    {
        await using var f = await Fixture.CreateAsync();
        var item = new TriageCase { Episode = f.Episode, MemberId = f.Episode.MemberId, Status = TriageStatus.PendingDoctorReview };
        f.Db.Add(item);
        f.Db.AuditLogs.Add(new AuditLog { ActorUserId = f.Doctor.UserId, SubjectMemberId = item.MemberId, EventType = "DOCTOR_CASE_READ", ResourceType = "TriageCase", ResourceId = item.Id, Outcome = "SUCCESS" });
        await f.Db.SaveChangesAsync();
        (await f.Patient.GetCaseAsync(item.Id, default)).CanEdit.Should().BeFalse();
        await Assert.ThrowsAsync<ConflictException>(() => f.Patient.WithdrawAsync(item.Id, default));
        await Assert.ThrowsAsync<ConflictException>(() => f.Patient.ReplaceSubmissionAsync(item.Id, new(["replacement"], 1, 3, null), default));
    }

    [Fact]
    public async Task Edit_CreatesImmutableReplacement_RevokesOldGrant_AndCannotReplaceAgain()
    {
        await using var f = await Fixture.CreateAsync();
        var original = await f.Patient.SubmitTriageAsync(f.Episode.Id, default);
        f.Db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCaseId = original.Id, DoctorId = f.Doctor.Id, Reason = "PRIMARY_DOCTOR_ASSIGNMENT", ExpiresAt = DateTimeOffset.UtcNow.AddHours(2) });
        await f.Db.SaveChangesAsync();
        var replacement = await f.Patient.ReplaceSubmissionAsync(original.Id, new(["synthetic new symptom"], 4, 3, "New synthetic complaint"), default);
        replacement.Id.Should().NotBe(original.Id);
        replacement.EpisodeId.Should().NotBe(original.EpisodeId);
        replacement.Status.Should().Be(TriageStatus.Submitted);
        replacement.SubmittedEpisode!.Notes.Should().Be("New synthetic complaint");
        f.Episode.Notes.Should().Be("Synthetic complaint");
        (await f.Patient.GetCaseAsync(original.Id, default)).Status.Should().Be(TriageStatus.Superseded);
        f.Db.CaseAccessGrants.Single().RevokedAt.Should().NotBeNull();
        await Assert.ThrowsAsync<ConflictException>(() => f.Patient.ReplaceSubmissionAsync(original.Id, new(["again"], 1, 2, null), default));
        f.Queue.Queued.Should().Equal(original.Id, replacement.Id);
    }

    [Fact]
    public async Task MetadataAndStatusReads_DoNotStartReview_FullReviewDoes_AndChangesAreBlocked()
    {
        await using var f = await Fixture.CreateAsync();
        var submitted = await f.Patient.SubmitTriageAsync(f.Episode.Id, default);
        var item = f.Db.TriageCases.Single();
        item.Status = TriageStatus.PendingDoctorReview;
        f.Db.CaseAccessGrants.Add(new CaseAccessGrant { TriageCaseId = item.Id, DoctorId = f.Doctor.Id, Reason = "PRIMARY_DOCTOR_ASSIGNMENT", ExpiresAt = DateTimeOffset.UtcNow.AddHours(2) });
        await f.Db.SaveChangesAsync();
        var doctorTriage = new TriageService(f.Db, new Current(f.Doctor.UserId, UserType.Doctor), f.Queue);
        (await doctorTriage.GetCaseAsync(item.Id, default)).SubmittedEpisode.Should().BeNull();
        await doctorTriage.GetStatusAsync(item.Id, default);
        (await f.Patient.GetCaseAsync(item.Id, default)).CanWithdraw.Should().BeTrue();
        await doctorTriage.GetCaseReviewAsync(item.Id, default);
        await doctorTriage.GetCaseReviewAsync(item.Id, default);
        var patient = await f.Patient.GetCaseAsync(item.Id, default);
        patient.CanEdit.Should().BeFalse();
        patient.DoctorReviewStartedAt.Should().NotBeNull();
        f.Db.AuditLogs.Count(x => x.EventType == CaseLifecycle.ReviewStarted).Should().Be(1);
        await Assert.ThrowsAsync<ConflictException>(() => f.Patient.WithdrawAsync(item.Id, default));
    }

    [Theory]
    [InlineData(TriageStatus.Withdrawn)]
    [InlineData(TriageStatus.Superseded)]
    public async Task AbandonedCase_DuringProviderCall_DiscardsOutputTraceGrantAndNotification(TriageStatus abandonedStatus)
    {
        await using var f = await Fixture.CreateAsync();
        var submitted = await f.Patient.SubmitTriageAsync(f.Episode.Id, default);
        var agent = new AbandoningAgent(f.DbOptions, submitted.Id, abandonedStatus);
        var notifications = new Notifications();
        var orchestrator = new TriageOrchestrator(f.Db, [agent], new SafetyValidationService(), notifications, new ConfigurationBuilder().Build());
        await orchestrator.RunAsync(submitted.Id, default);
        await using var verify = new AppDbContext(f.DbOptions);
        var item = await verify.TriageCases.SingleAsync();
        item.Status.Should().Be(abandonedStatus);
        item.ContextOutputJson.Should().BeNull();
        verify.AgentTraces.Should().ContainSingle().Which.Agent.Should().Be(AgentKind.Coordinator);
        verify.CaseAccessGrants.Should().BeEmpty();
        notifications.Statuses.Should().BeEmpty();
    }

    [Fact]
    public async Task Withdrawal_BeforeWorkerStart_PreservesAuditAndNeverRunsProvider()
    {
        await using var f = await Fixture.CreateAsync();
        var submitted = await f.Patient.SubmitTriageAsync(f.Episode.Id, default);
        var withdrawn = await f.Patient.WithdrawAsync(submitted.Id, default);
        withdrawn.Status.Should().Be(TriageStatus.Withdrawn);
        withdrawn.CanEdit.Should().BeFalse();
        var agent = new AbandoningAgent(f.DbOptions, submitted.Id, TriageStatus.Withdrawn);
        await new TriageOrchestrator(f.Db, [agent], new SafetyValidationService(), new Notifications(), new ConfigurationBuilder().Build()).RunAsync(submitted.Id, default);
        agent.Calls.Should().Be(0);
        f.Db.AgentTraces.Should().BeEmpty();
        f.Db.AuditLogs.Should().Contain(x => x.EventType == "CASE_WITHDRAWN");
    }

    [Fact]
    public async Task Claim_StartsReview_WithoutReplacingEmergencyStatus()
    {
        await using var f = await Fixture.CreateAsync();
        var submitted = await f.Patient.SubmitTriageAsync(f.Episode.Id, default);
        f.Db.TriageCases.Single().Status = TriageStatus.Escalated;
        await f.Db.SaveChangesAsync();
        await f.Clinical.ClaimCaseAsync(submitted.Id, default);
        f.Db.TriageCases.Single().Status.Should().Be(TriageStatus.Escalated);
        (await f.Patient.GetCaseAsync(submitted.Id, default)).DoctorReviewStartedAt.Should().NotBeNull();
    }

    private sealed class AbandoningAgent(DbContextOptions<AppDbContext> options, Guid caseId, TriageStatus status) : IAgent
    {
        public AgentKind Kind => AgentKind.Context;
        public int Calls { get; private set; }
        public async Task<AgentRunResult> RunAsync(AgentRunContext context, CancellationToken cancellationToken)
        {
            Calls++;
            await using var other = new AppDbContext(options);
            var item = await other.TriageCases.SingleAsync(x => x.Id == caseId, cancellationToken);
            item.Status = status;
            await other.SaveChangesAsync(cancellationToken);
            return new AgentRunResult(Kind, "{}", 1m, [], [], [], true, null, null, null);
        }
    }

    private sealed class Fixture : IAsyncDisposable
    {
        public required AppDbContext Db { get; init; }
        public required DbContextOptions<AppDbContext> DbOptions { get; init; }
        public required Episode Episode { get; init; }
        public required Doctor Doctor { get; init; }
        public required TriageService Patient { get; init; }
        public required ClinicalService Clinical { get; init; }
        public required Queue Queue { get; init; }
        public static async Task<Fixture> CreateAsync()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
            var db = new AppDbContext(options);
            var user = new UserAccount { Email = "synthetic-lifecycle@example.invalid", PasswordHash = "synthetic", DisplayName = "Synthetic member", UserType = UserType.FamilyUser };
            var doctorUser = new UserAccount { Email = "synthetic-lifecycle-doctor@example.invalid", PasswordHash = "synthetic", DisplayName = "Synthetic doctor", UserType = UserType.Doctor };
            var family = new Family { Name = "Synthetic family", CreatedByUser = user };
            var member = new Member { Family = family, User = user, DisplayName = "Synthetic member", DateOfBirth = new(1990, 1, 1), Role = FamilyRole.Head };
            var doctor = new Doctor { User = doctorUser, RegistrationNumberHash = "synthetic", RegistrationNumberLastFour = "0001", VerificationStatus = VerificationStatus.Verified };
            var episode = new Episode { Member = member, SymptomsJson = "[\"synthetic symptom\"]", DurationDays = 1, Severity = 2, Notes = "Synthetic complaint" };
            db.AddRange(episode, doctor, new FamilyDoctorAssignment { Family = family, Doctor = doctor, IsPrimary = true });
            await db.SaveChangesAsync();
            var queue = new Queue();
            return new() { Db = db, DbOptions = options, Episode = episode, Doctor = doctor, Queue = queue, Patient = new(db, new Current(user.Id, UserType.FamilyUser), queue), Clinical = new(db, new Current(doctorUser.Id, UserType.Doctor), new Notifications(), new ConfigurationBuilder().Build()) };
        }
        public ValueTask DisposeAsync() => Db.DisposeAsync();
    }
    private sealed class Current(Guid id, UserType type) : ICurrentUser { public bool IsAuthenticated => true; public Guid UserId => id; public UserType UserType => type; }
    private sealed class Queue : ITriageWorkQueue { public List<Guid> Queued { get; } = []; public ValueTask QueueAsync(Guid id, CancellationToken ct) { Queued.Add(id); return ValueTask.CompletedTask; } public ValueTask<Guid> DequeueAsync(CancellationToken ct) => throw new NotSupportedException(); }
    private sealed class Notifications : INotificationService
    {
        public List<TriageStatus> Statuses { get; } = [];
        public Task SendCaseStatusAsync(Guid id, TriageStatus status, CancellationToken ct) { Statuses.Add(status); return Task.CompletedTask; }
        public Task<NotificationSubscriptionDto> SubscribeAsync(NotificationSubscriptionRequest request, CancellationToken ct) => throw new NotSupportedException();
        public Task<PagedResult<NotificationDto>> GetInboxAsync(int page, int size, CancellationToken ct) => throw new NotSupportedException();
    }
}
