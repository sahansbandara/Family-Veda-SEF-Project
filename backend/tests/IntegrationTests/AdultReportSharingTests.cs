// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Phase 2 adult privacy: a Family Head sees an adult's lab report or health record only when the adult shared it.
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Records;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace FamilyVeda.IntegrationTests;

public sealed class AdultReportSharingTests : IAsyncLifetime
{
    private const string Password = "Synthetic-Test-Password-42!";
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16-alpine")
        .WithDatabase("familyveda_sharing").WithUsername("familyveda_sharing").WithPassword($"test-{Guid.NewGuid():N}").Build();
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
        });
    }

    public async Task DisposeAsync()
    {
        if (_factory is not null) await _factory.DisposeAsync();
        await _database.DisposeAsync();
    }

    [Fact]
    public async Task Head_CannotSeePrivateAdultItems_UntilAdultSharesThem_AndLosesAccessOnUnshare()
    {
        var world = await ArrangeFamilyAsync("share-flow");
        var head = world.Head;
        var adult = world.Adult;

        // Private by default: lists are empty, direct reads 404, dashboard shows nothing of the adult's.
        (await ListLabReportsAsync(head, world.AdultMemberId)).Should().BeEmpty();
        (await ListRecordsAsync(head, world.AdultMemberId)).Should().BeEmpty();
        (await head.GetAsync($"/api/v1/lab-reports/{world.AdultReportId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        var privateDashboard = await DashboardAsync(head);
        // Only the minor's report (guardian-visible) is counted; the adult's private report never is.
        privateDashboard.GetProperty("visibleReportCount").GetInt32().Should().Be(1);
        privateDashboard.GetProperty("latestLab").GetProperty("id").GetGuid().Should().Be(world.MinorReportId);

        // Adult sees their own item as private.
        var own = await ListLabReportsAsync(adult, world.AdultMemberId);
        own.Should().ContainSingle().Which.GetProperty("sharedWithFamilyHead").GetBoolean().Should().BeFalse();

        // Adult shares both items.
        (await adult.PatchAsJsonAsync($"/api/v1/lab-reports/{world.AdultReportId}/sharing", new { sharedWithFamilyHead = true }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await adult.PatchAsJsonAsync($"/api/v1/records/{world.AdultRecordId}/sharing", new { sharedWithFamilyHead = true }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var sharedList = await ListLabReportsAsync(head, world.AdultMemberId);
        sharedList.Should().ContainSingle();
        var summary = sharedList[0].GetProperty("rangeSummary");
        summary.GetProperty("belowRange").GetInt32().Should().Be(1);
        summary.GetProperty("withinRange").GetInt32().Should().Be(1);
        summary.GetProperty("rangeUnavailable").GetInt32().Should().Be(1);
        (await ListRecordsAsync(head, world.AdultMemberId)).Should().ContainSingle();
        var detail = await head.GetAsync($"/api/v1/lab-reports/{world.AdultReportId}");
        detail.StatusCode.Should().Be(HttpStatusCode.OK);
        (await detail.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("flags").GetArrayLength().Should().Be(0);
        var sharedDashboard = await DashboardAsync(head);
        sharedDashboard.GetProperty("visibleReportCount").GetInt32().Should().Be(2);
        sharedDashboard.GetProperty("latestLab").GetProperty("id").GetGuid().Should().Be(world.AdultReportId);

        // Every Head read of a shared adult item is audited (RULE 8).
        await using (var scope = _factory!.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.AuditLogs.CountAsync(x => x.EventType == "ADULT_SHARED_REPORT_ACCESS" && x.SubjectMemberId == world.AdultMemberId))
                .Should().BeGreaterThanOrEqualTo(4);
        }

        // Unshare: access disappears immediately.
        (await adult.PatchAsJsonAsync($"/api/v1/lab-reports/{world.AdultReportId}/sharing", new { sharedWithFamilyHead = false }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await head.GetAsync($"/api/v1/lab-reports/{world.AdultReportId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await ListLabReportsAsync(head, world.AdultMemberId)).Should().BeEmpty();
        (await DashboardAsync(head)).GetProperty("visibleReportCount").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task OnlyTheOwningAdult_CanToggleSharing_AndSharingNeverOpensWritesVitalsOrFlags()
    {
        var world = await ArrangeFamilyAsync("share-guard");
        var head = world.Head;

        (await head.PatchAsJsonAsync($"/api/v1/lab-reports/{world.AdultReportId}/sharing", new { sharedWithFamilyHead = true }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await head.PatchAsJsonAsync($"/api/v1/records/{world.AdultRecordId}/sharing", new { sharedWithFamilyHead = true }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await world.Outsider.PatchAsJsonAsync($"/api/v1/lab-reports/{world.AdultReportId}/sharing", new { sharedWithFamilyHead = true }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        // A minor's items belong to the guardian path, not to sharing.
        (await head.PatchAsJsonAsync($"/api/v1/lab-reports/{world.MinorReportId}/sharing", new { sharedWithFamilyHead = true }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        (await world.Adult.PatchAsJsonAsync($"/api/v1/records/{world.AdultRecordId}/sharing", new { sharedWithFamilyHead = true }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await head.PutAsJsonAsync($"/api/v1/records/{world.AdultRecordId}", new
        {
            recordType = "Note", title = "Head edit attempt", summary = (string?)null, occurredOn = "2026-08-01"
        })).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await head.DeleteAsync($"/api/v1/records/{world.AdultRecordId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await head.GetAsync($"/api/v1/members/{world.AdultMemberId}/vitals")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await head.GetAsync($"/api/v1/members/{world.AdultMemberId}/hereditary-flags")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await head.PostAsync($"/api/v1/lab-reports/{world.AdultReportId}/extract", null)).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task MemberSexForClinicalReference_DefaultsToNotSpecified_AndRejectsUnknownValues()
    {
        var (head, _) = await RegisterAsync("synthetic-sex-head@example.invalid");
        var family = await (await head.PostAsJsonAsync("/api/v1/families", new { name = "Synthetic Sex Family" })).Content.ReadFromJsonAsync<JsonElement>();
        var familyId = family.GetProperty("id").GetGuid();

        var minor = await head.PostAsJsonAsync($"/api/v1/families/{familyId}/members", new
        {
            displayName = "Synthetic Minor Default", dateOfBirth = "2016-02-02", role = "MinorMember", userId = (Guid?)null
        });
        minor.StatusCode.Should().Be(HttpStatusCode.Created);
        (await minor.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("sexForClinicalReference").GetString().Should().Be("NotSpecified");

        var female = await head.PostAsJsonAsync($"/api/v1/families/{familyId}/members", new
        {
            displayName = "Synthetic Minor Female", dateOfBirth = "2017-03-03", role = "MinorMember", userId = (Guid?)null,
            sexForClinicalReference = "Female"
        });
        (await female.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("sexForClinicalReference").GetString().Should().Be("Female");

        var invalid = await head.PostAsJsonAsync($"/api/v1/families/{familyId}/members", new
        {
            displayName = "Synthetic Minor Invalid", dateOfBirth = "2017-03-03", role = "MinorMember", userId = (Guid?)null,
            sexForClinicalReference = 9
        });
        invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private sealed record World(HttpClient Head, HttpClient Adult, HttpClient Outsider,
        Guid AdultMemberId, Guid AdultReportId, Guid AdultRecordId, Guid MinorReportId);

    private async Task<World> ArrangeFamilyAsync(string tag)
    {
        var (head, headUserId) = await RegisterAsync($"synthetic-{tag}-head@example.invalid");
        var (adult, adultUserId) = await RegisterAsync($"synthetic-{tag}-adult@example.invalid");
        var (outsider, _) = await RegisterAsync($"synthetic-{tag}-outsider@example.invalid");

        var family = await (await head.PostAsJsonAsync("/api/v1/families", new { name = $"Synthetic {tag} Family" })).Content.ReadFromJsonAsync<JsonElement>();
        var familyId = family.GetProperty("id").GetGuid();
        (await head.PostAsJsonAsync($"/api/v1/families/{familyId}/members", new
        {
            displayName = "Synthetic Head", dateOfBirth = "1980-01-01", role = "Head", userId = headUserId
        })).StatusCode.Should().Be(HttpStatusCode.Created);

        await using var scope = _factory!.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var adultMember = new Domain.Identity.Member
        {
            FamilyId = familyId, UserId = adultUserId, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(1998, 5, 5), Role = FamilyRole.AdultMember
        };
        var minorMember = new Domain.Identity.Member
        {
            FamilyId = familyId, DisplayName = "Synthetic Minor", DateOfBirth = new DateOnly(2016, 5, 5), Role = FamilyRole.MinorMember
        };
        db.Members.AddRange(adultMember, minorMember);
        var adultReport = NewReport(adultMember.Id);
        adultReport.Values.Add(new LabValue { Analyte = "Synthetic analyte A", Value = 1m, Unit = "u", ReferenceLow = 2m, ReferenceHigh = 5m });
        adultReport.Values.Add(new LabValue { Analyte = "Synthetic analyte B", Value = 3m, Unit = "u", ReferenceLow = 2m, ReferenceHigh = 5m });
        adultReport.Values.Add(new LabValue { Analyte = "Synthetic analyte C", Value = 3m, Unit = "u" });
        var minorReport = NewReport(minorMember.Id);
        minorReport.CollectedAt = DateTimeOffset.UtcNow.AddDays(-10);
        var adultRecord = new HealthRecord
        {
            MemberId = adultMember.Id, RecordType = RecordType.Note, Title = "Synthetic adult note", OccurredOn = new DateOnly(2026, 8, 1)
        };
        db.LabReports.AddRange(adultReport, minorReport);
        db.HealthRecords.Add(adultRecord);
        await db.SaveChangesAsync();
        return new World(head, adult, outsider, adultMember.Id, adultReport.Id, adultRecord.Id, minorReport.Id);
    }

    private static LabReport NewReport(Guid memberId) => new()
    {
        MemberId = memberId,
        OriginalFileName = "synthetic-report.png",
        StoredFileName = $"db:{Guid.NewGuid():N}.png",
        ContentType = "image/png",
        SizeBytes = 1,
        OcrStatus = OcrStatus.Completed,
        CollectedAt = DateTimeOffset.UtcNow.AddDays(-1)
    };

    private async Task<(HttpClient Client, Guid UserId)> RegisterAsync(string email)
    {
        var client = _factory!.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email, password = Password, displayName = "Synthetic Sharing User", userType = "FamilyUser"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var auth = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());
        return (client, auth.GetProperty("userId").GetGuid());
    }

    private static async Task<List<JsonElement>> ListLabReportsAsync(HttpClient client, Guid memberId)
    {
        var response = await client.GetAsync($"/api/v1/members/{memberId}/lab-reports");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
    }

    private static async Task<List<JsonElement>> ListRecordsAsync(HttpClient client, Guid memberId)
    {
        var response = await client.GetAsync($"/api/v1/members/{memberId}/records");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("items").EnumerateArray().ToList();
    }

    private static async Task<JsonElement> DashboardAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/v1/dashboard/family");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }
}
