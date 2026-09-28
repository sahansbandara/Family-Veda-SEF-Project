// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Synthetic end-to-end evidence for the doctor approval gate.
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FamilyVeda.Application.Agents;
using FamilyVeda.Application.Triage;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Triage;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Testcontainers.PostgreSql;

namespace FamilyVeda.IntegrationTests;

public sealed class GoldenCaseFlowTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16-alpine")
        .WithDatabase("familyveda_golden").WithUsername("familyveda_golden").WithPassword($"test-{Guid.NewGuid():N}").Build();
    private WebApplicationFactory<Program>? _factory;

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("ConnectionStrings:DefaultConnection", _database.GetConnectionString());
            builder.UseSetting("Database:MigrateOnStartup", "true");
            builder.UseSetting("Jwt:Key", "integration-test-key-with-at-least-thirty-two-bytes");
            builder.UseSetting("Jwt:Issuer", "familyveda");
            builder.UseSetting("Jwt:Audience", "familyveda-clients");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IHostedService>();
                services.RemoveAll<IAgent>();
                services.AddScoped<IAgent>(_ => new StubAgent(AgentKind.Context, schemaValid: true));
                services.AddScoped<IAgent>(_ => new StubAgent(AgentKind.Analysis, schemaValid: true));
                services.AddScoped<IAgent>(_ => new StubAgent(AgentKind.FamilialRisk, schemaValid: true));
            });
        });
    }

    public async Task DisposeAsync()
    {
        if (_factory is not null) await _factory.DisposeAsync();
        await _database.DisposeAsync();
    }

    [Fact]
    public async Task SyntheticGoldenCase_RequiresApprovalBeforeFamilyCanReadGuidance()
    {
        var headClient = _factory!.CreateClient();
        var doctorClient = _factory.CreateClient();
        var (headUserId, familyId, memberId) = await RegisterFamilyAsync(headClient, "golden-head");
        var doctorId = await RegisterVerifiedAssignedDoctorAsync(doctorClient, familyId, "golden-doctor");
        var caseId = await CreateAndSubmitCaseAsync(headClient, memberId, "synthetic routine signal");

        (await headClient.GetAsync($"/api/v1/triage-cases/{caseId}/approved-guidance")).StatusCode.Should().Be(HttpStatusCode.NotFound);

        await RunOrchestratorAsync(caseId);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var triageCase = await db.TriageCases.SingleAsync(x => x.Id == caseId);
            triageCase.Status.Should().Be(TriageStatus.PendingDoctorReview);
            (await db.AgentTraces.Where(x => x.TriageCaseId == caseId && x.Status == AgentStepStatus.Completed).CountAsync()).Should().Be(5);
            (await db.CaseAccessGrants.SingleAsync(x => x.TriageCaseId == caseId)).DoctorId.Should().Be(doctorId);
        }

        // A case already granted to the family's verified primary doctor is reviewed directly;
        // the claim endpoint is reserved for cases selected from the available case pool.
        (await doctorClient.PostAsync($"/api/v1/triage-cases/{caseId}/claim", null)).StatusCode.Should().Be(HttpStatusCode.Conflict);
        var approval = await doctorClient.PostAsJsonAsync($"/api/v1/triage-cases/{caseId}/approve", new
        {
            doctorNotes = "Synthetic evidence review completed.",
            finalAdvisory = "Please arrange an in-person clinical review."
        });
        approval.StatusCode.Should().Be(HttpStatusCode.OK);

        var guidance = await headClient.GetAsync($"/api/v1/triage-cases/{caseId}/approved-guidance");
        guidance.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await guidance.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("finalAdvisory").GetString().Should().Be("Please arrange an in-person clinical review.");
        headUserId.Should().NotBeEmpty();
    }

    [Fact]
    public async Task InvalidAgentSchema_FailsSafe_AndKeepsFamilyGuidanceUnavailable()
    {
        var headClient = _factory!.CreateClient();
        var (_, _, memberId) = await RegisterFamilyAsync(headClient, "invalid-schema-head");
        var caseId = await CreateAndSubmitCaseAsync(headClient, memberId, "synthetic schema signal");
        var invalid = new StubAgent(AgentKind.Context, schemaValid: false);
        var later = new StubAgent(AgentKind.Analysis, schemaValid: true);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var orchestrator = new TriageOrchestrator(
                db,
                [invalid, later, new StubAgent(AgentKind.FamilialRisk, schemaValid: true)],
                scope.ServiceProvider.GetRequiredService<FamilyVeda.Domain.Safety.SafetyValidationService>(),
                scope.ServiceProvider.GetRequiredService<INotificationService>(),
                scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>());

            await orchestrator.RunAsync(caseId, CancellationToken.None);

            var triageCase = await db.TriageCases.SingleAsync(x => x.Id == caseId);
            triageCase.Status.Should().Be(TriageStatus.FailedSafe);
            triageCase.FailureCode.Should().Be("INVALID_AGENT_SCHEMA");
            var safeFailureTrace = await db.AgentTraces.SingleAsync(x => x.TriageCaseId == caseId && x.Agent == AgentKind.Context);
            safeFailureTrace.Status.Should().Be(AgentStepStatus.SafeFailure);
            safeFailureTrace.ErrorCode.Should().Be("INVALID_AGENT_SCHEMA");
            safeFailureTrace.OutputSchemaValid.Should().BeFalse();
            later.Calls.Should().Be(0);
        }

        (await headClient.GetAsync($"/api/v1/triage-cases/{caseId}/approved-guidance")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private async Task<(Guid UserId, Guid FamilyId, Guid MemberId)> RegisterFamilyAsync(HttpClient client, string prefix)
    {
        var registration = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email = $"synthetic-{prefix}@example.invalid",
            password = "Synthetic-Test-Password-42!",
            displayName = "Synthetic Family Head",
            userType = "FamilyUser"
        });
        registration.StatusCode.Should().Be(HttpStatusCode.Created);
        var auth = await registration.Content.ReadFromJsonAsync<JsonElement>();
        var userId = auth.GetProperty("userId").GetGuid();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());

        var familyResponse = await client.PostAsJsonAsync("/api/v1/families", new { name = "Synthetic Golden Family" });
        familyResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var familyId = (await familyResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var memberResponse = await client.PostAsJsonAsync($"/api/v1/families/{familyId}/members", new
        {
            displayName = "Synthetic Golden Member",
            dateOfBirth = "1995-01-01",
            role = "Head",
            userId
        });
        memberResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        return (userId, familyId, (await memberResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid());
    }

    private async Task<Guid> RegisterVerifiedAssignedDoctorAsync(HttpClient client, Guid familyId, string prefix)
    {
        var registration = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email = $"synthetic-{prefix}@example.invalid",
            password = "Synthetic-Test-Password-42!",
            displayName = "Synthetic Verified Doctor",
            userType = "Doctor"
        });
        registration.StatusCode.Should().Be(HttpStatusCode.Created);
        var auth = await registration.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());
        (await client.PostAsJsonAsync("/api/v1/doctors/register", new
        {
            registrationNumber = "SYNTHETIC-GOLDEN-DOCTOR",
            specialty = "Synthetic specialty"
        })).StatusCode.Should().Be(HttpStatusCode.Created);

        await using var scope = _factory!.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var doctor = await db.Doctors.SingleAsync(x => x.UserId == auth.GetProperty("userId").GetGuid());
        doctor.VerificationStatus = VerificationStatus.Verified;
        db.FamilyDoctorAssignments.Add(new FamilyDoctorAssignment { FamilyId = familyId, DoctorId = doctor.Id, IsPrimary = true });
        await db.SaveChangesAsync();
        return doctor.Id;
    }

    private async Task<Guid> CreateAndSubmitCaseAsync(HttpClient client, Guid memberId, string symptom)
    {
        var episodeResponse = await client.PostAsJsonAsync($"/api/v1/members/{memberId}/episodes", new
        {
            symptoms = new[] { symptom },
            durationDays = 1,
            severity = 2,
            notes = "Synthetic integration evidence only."
        });
        episodeResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var episodeId = (await episodeResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var submission = await client.PostAsync($"/api/v1/episodes/{episodeId}/triage", null);
        submission.StatusCode.Should().Be(HttpStatusCode.Accepted);
        return (await submission.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    private async Task RunOrchestratorAsync(Guid caseId)
    {
        await using var scope = _factory!.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ITriageOrchestrator>().RunAsync(caseId, CancellationToken.None);
    }

    private sealed class StubAgent(AgentKind kind, bool schemaValid) : IAgent
    {
        public int Calls { get; private set; }
        public AgentKind Kind => kind;

        public Task<AgentRunResult> RunAsync(AgentRunContext context, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(new AgentRunResult(kind, "{\"synthetic\":true}", 0.9m, [], [], [], schemaValid));
        }
    }
}
