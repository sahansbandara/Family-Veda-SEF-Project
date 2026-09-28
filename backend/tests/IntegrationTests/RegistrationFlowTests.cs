// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Role-specific atomic registration (FamilyVeda Registration Flows). Synthetic identities only (RULE 7).
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace FamilyVeda.IntegrationTests;

public sealed class RegistrationFlowTests : IAsyncLifetime
{
    private const string Password = "Synthetic-Pass-42!";
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16-alpine")
        .WithDatabase("familyveda_registration").WithUsername("familyveda_registration").WithPassword($"test-{Guid.NewGuid():N}").Build();
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
    public async Task FamilyHead_RegistersAtomically_WithProfile_AndNeverStoresRawNic()
    {
        var client = _factory!.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register/family-head", HeadBody("synthetic-reg-head@example.invalid", "200012345678"));
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(x => x.Email == "synthetic-reg-head@example.invalid");
            var profile = await db.UserProfiles.SingleAsync(x => x.UserId == user.Id);
            profile.PhoneNumber.Should().Be("0771234567");
            profile.District.Should().Be("Kandy");
            profile.SexForClinicalReference.Should().Be(ClinicalSex.Female);
            profile.NationalIdLastFour.Should().Be("5678");
            profile.NationalIdHash.Should().NotContain("200012345678");
            (await db.AuditLogs.Select(x => x.MetadataJson).ToListAsync()).Should().NotContain(m => m.Contains("200012345678"));
        }

        var duplicateNic = await client.PostAsJsonAsync("/api/v1/auth/register/family-head", HeadBody("synthetic-reg-head-2@example.invalid", "200012345678"));
        duplicateNic.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var invalid = await client.PostAsJsonAsync("/api/v1/auth/register/family-head", HeadBody("synthetic-reg-head-3@example.invalid", "12345"));
        invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AdultMember_FamilyCode_CreatesPendingJoinRequest_NeverMembership()
    {
        var (_, familyId, familyCode) = await CreateHeadWithFamilyAsync("synthetic-code-head@example.invalid", "199012345678");
        var client = _factory!.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register/adult-member",
            AdultBody("synthetic-code-adult@example.invalid", new { method = "FamilyCode", familyCode, relationship = "Sibling" }));
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("connectionOutcome").GetString().Should().Be("JoinRequestPending");

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var adult = await db.Users.SingleAsync(x => x.Email == "synthetic-code-adult@example.invalid");
        (await db.Members.AnyAsync(x => x.UserId == adult.Id)).Should().BeFalse();
        var request = await db.FamilyJoinRequests.SingleAsync(x => x.RequestingUserId == adult.Id);
        request.FamilyId.Should().Be(familyId);
        request.Status.Should().Be(PortalRequestStatus.Pending);
        request.RelationshipType.Should().Be("Sibling");
    }

    [Fact]
    public async Task AdultMember_UnknownCodeOrWrongInvitation_CreatesNothing()
    {
        var client = _factory!.CreateClient();
        var unknownCode = await client.PostAsJsonAsync("/api/v1/auth/register/adult-member",
            AdultBody("synthetic-bad-code@example.invalid", new { method = "FamilyCode", familyCode = "FV-ZZZZZZ", relationship = "Spouse" }));
        unknownCode.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var badInvite = await client.PostAsJsonAsync("/api/v1/auth/register/adult-member",
            AdultBody("synthetic-bad-invite@example.invalid", new { method = "Invitation", invitationToken = "not-a-real-token" }));
        badInvite.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var missingRelationship = await client.PostAsJsonAsync("/api/v1/auth/register/adult-member",
            AdultBody("synthetic-no-relationship@example.invalid", new { method = "FamilyCode", familyCode = "FV-ABC234" }));
        missingRelationship.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.AnyAsync(x => x.Email.StartsWith("synthetic-bad-") || x.Email.StartsWith("synthetic-no-relationship"))).Should().BeFalse();
    }

    [Fact]
    public async Task AdultMember_Invitation_JoinsFamilyWithProfileDetails_AndJoinLaterStaysIndependent()
    {
        var (head, familyId, _) = await CreateHeadWithFamilyAsync("synthetic-invite-head@example.invalid", "198512345678");
        var invite = await head.PostAsJsonAsync($"/api/v1/families/{familyId}/invitations", new { email = "synthetic-invitee@example.invalid" });
        invite.StatusCode.Should().Be(HttpStatusCode.Created);
        var token = (await invite.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString();

        var client = _factory!.CreateClient();
        var joined = await client.PostAsJsonAsync("/api/v1/auth/register/adult-member",
            AdultBody("synthetic-invitee@example.invalid", new { method = "Invitation", invitationToken = token }));
        joined.StatusCode.Should().Be(HttpStatusCode.Created);
        (await joined.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("connectionOutcome").GetString().Should().Be("JoinedFamily");

        var later = await client.PostAsJsonAsync("/api/v1/auth/register/adult-member",
            AdultBody("synthetic-later@example.invalid", new { method = "Later" }));
        later.StatusCode.Should().Be(HttpStatusCode.Created);
        (await later.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("connectionOutcome").GetString().Should().Be("NotConnected");

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var invitee = await db.Users.SingleAsync(x => x.Email == "synthetic-invitee@example.invalid");
        var member = await db.Members.SingleAsync(x => x.UserId == invitee.Id);
        member.FamilyId.Should().Be(familyId);
        member.Role.Should().Be(FamilyRole.AdultMember);
        member.DateOfBirth.Should().Be(new DateOnly(1995, 4, 12));
        member.SexForClinicalReference.Should().Be(ClinicalSex.Male);
        var independent = await db.Users.SingleAsync(x => x.Email == "synthetic-later@example.invalid");
        (await db.Members.AnyAsync(x => x.UserId == independent.Id)).Should().BeFalse();
    }

    private async Task<(HttpClient Head, Guid FamilyId, string FamilyCode)> CreateHeadWithFamilyAsync(string email, string nic)
    {
        var client = _factory!.CreateClient();
        var register = await client.PostAsJsonAsync("/api/v1/auth/register/family-head", HeadBody(email, nic));
        register.StatusCode.Should().Be(HttpStatusCode.Created);
        var auth = await register.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());
        var family = await (await client.PostAsJsonAsync("/api/v1/families", new { name = "Synthetic Registration Family" })).Content.ReadFromJsonAsync<JsonElement>();
        var familyId = family.GetProperty("id").GetGuid();
        (await client.PostAsJsonAsync($"/api/v1/families/{familyId}/members", new
        {
            displayName = "Synthetic Head", dateOfBirth = "1980-02-02", role = "Head", userId = auth.GetProperty("userId").GetGuid()
        })).StatusCode.Should().Be(HttpStatusCode.Created);
        return (client, familyId, family.GetProperty("familyCode").GetString()!);
    }

    private static object HeadBody(string email, string nic) => new
    {
        account = new { fullName = "Synthetic Head", email, mobileNumber = "+94 771234567", password = Password, confirmPassword = Password },
        personal = new { dateOfBirth = "1985-06-15", sexForClinicalReference = "Female" },
        nationalId = nic,
        address = new { addressLine1 = "12 Synthetic Lane", addressLine2 = (string?)null, city = "Kandy", district = "Kandy", postalCode = "20000" },
        acceptTerms = true
    };

    private static object AdultBody(string email, object connection) => new
    {
        account = new { fullName = "Synthetic Adult", email, mobileNumber = "0712345678", password = Password, confirmPassword = Password },
        personal = new { dateOfBirth = "1995-04-12", sexForClinicalReference = "Male" },
        address = new { addressLine1 = "5 Synthetic Road", city = "Galle", district = "Galle" },
        connection,
        acceptTerms = true
    };
}
