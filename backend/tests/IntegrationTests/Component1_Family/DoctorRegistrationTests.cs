// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Doctor sign-up with a synthetic licence document; clinical access stays blocked while Pending.
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using FamilyVeda.Domain.Common;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace FamilyVeda.IntegrationTests;

public sealed class DoctorRegistrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16-alpine")
        .WithDatabase("familyveda_doctor_reg").WithUsername("familyveda_doctor_reg").WithPassword($"test-{Guid.NewGuid():N}").Build();
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
    public async Task Doctor_RegistersPending_WithLicence_AndCannotReachClinicalQueues()
    {
        var client = _factory!.CreateClient();
        var response = await client.PostAsync("/api/v1/auth/register/doctor",
            DoctorForm("synthetic-reg-doctor@example.invalid", "12345", Encoding.ASCII.GetBytes("%PDF-1.4 synthetic licence"), "application/pdf"));
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var auth = await response.Content.ReadFromJsonAsync<JsonElement>();
        auth.GetProperty("doctorVerificationStatus").GetString().Should().Be("Pending");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());
        (await client.GetAsync("/api/v1/doctors/case-pool")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.GetAsync("/api/v1/doctors/me/cases")).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var doctor = await db.Doctors.SingleAsync(x => x.RegistrationNumberLastFour == "2345");
        doctor.VerificationStatus.Should().Be(VerificationStatus.Pending);
        doctor.City.Should().Be("Kandy");
        doctor.District.Should().Be("Kandy");
        doctor.Languages.Should().Be("Sinhala, English");
        (await db.DoctorLicenseDocuments.SingleAsync(x => x.DoctorId == doctor.Id)).ContentType.Should().Be("application/pdf");
        (await db.AuditLogs.Select(x => x.MetadataJson).ToListAsync()).Should().NotContain(m => m.Contains("\"12345\""));
    }

    [Fact]
    public async Task Doctor_Registration_RejectsSpoofedOrOversizedLicence_AndCreatesNothing()
    {
        var client = _factory!.CreateClient();
        var spoofed = await client.PostAsync("/api/v1/auth/register/doctor",
            DoctorForm("synthetic-spoof-doctor@example.invalid", "22345", Encoding.ASCII.GetBytes("not really a pdf"), "application/pdf"));
        spoofed.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var oversized = new byte[5 * 1024 * 1024 + 10];
        "%PDF"u8.CopyTo(oversized);
        var tooBig = await client.PostAsync("/api/v1/auth/register/doctor",
            DoctorForm("synthetic-big-doctor@example.invalid", "32345", oversized, "application/pdf"));
        tooBig.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var wrongType = await client.PostAsync("/api/v1/auth/register/doctor",
            DoctorForm("synthetic-type-doctor@example.invalid", "42345", Encoding.ASCII.GetBytes("MZ executable"), "application/x-msdownload"));
        wrongType.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.AnyAsync(x => x.Email.EndsWith("-doctor@example.invalid"))).Should().BeFalse();
    }

    private static MultipartFormDataContent DoctorForm(string email, string slmc, byte[] document, string contentType)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent("Synthetic Doctor"), "fullName" },
            { new StringContent(email), "email" },
            { new StringContent("0771234567"), "mobileNumber" },
            { new StringContent("Synthetic-Pass-42!"), "password" },
            { new StringContent("Synthetic-Pass-42!"), "confirmPassword" },
            { new StringContent(slmc), "registrationNumber" },
            { new StringContent("General Practice"), "specialization" },
            { new StringContent("Synthetic Clinic"), "hospitalClinic" },
            { new StringContent("Kandy"), "practiceCity" },
            { new StringContent("Kandy"), "district" },
            { new StringContent("Sinhala"), "languages" },
            { new StringContent("English"), "languages" },
            { new StringContent("true"), "acceptTerms" }
        };
        var file = new ByteArrayContent(document);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(file, "licenseDocument", "synthetic-licence.pdf");
        return form;
    }
}
