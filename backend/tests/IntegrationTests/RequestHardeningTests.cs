// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Regression tests for the findings of the OWASP ZAP API scan of 2026-10-05. Synthetic data only (RULE 7).
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;

namespace FamilyVeda.IntegrationTests;

public sealed class RequestHardeningTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16-alpine")
        .WithDatabase("familyveda_hardening").WithUsername("familyveda_hardening").WithPassword($"test-{Guid.NewGuid():N}").Build();
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
    public async Task NulCharacterInQueryString_IsRejectedAsBadRequest_NotServerError()
    {
        var client = _factory!.CreateClient();

        var response = await client.GetAsync("/api/v1/doctors/directory?search=%00&district=district");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        body.RootElement.GetProperty("status").GetInt32().Should().Be(400);
    }

    [Fact]
    public async Task OrdinaryQueryString_StillReachesAuthentication()
    {
        var client = _factory!.CreateClient();

        var response = await client.GetAsync("/api/v1/doctors/directory?search=kandy");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/api/v1/doctors/directory")]
    public async Task EveryResponse_TellsBrowsersNotToSniffContentType(string path)
    {
        var client = _factory!.CreateClient();

        var response = await client.GetAsync(path);

        response.Headers.GetValues("X-Content-Type-Options").Should().ContainSingle().Which.Should().Be("nosniff");
    }
}
