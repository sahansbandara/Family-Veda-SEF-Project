// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Doctor sign-up with a synthetic licence document; clinical access stays blocked while Pending.
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using Microsoft.AspNetCore.Identity;
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

    [Fact]
    public async Task DuplicateSlmc_OpensDispute_AndAdminResolvesIt()
    {
        var client = _factory!.CreateClient();
        var pdf = Encoding.ASCII.GetBytes("%PDF-1.4 synthetic licence");
        var first = await client.PostAsync("/api/v1/auth/register/doctor", DoctorForm("synthetic-first-claim@example.invalid", "77001", pdf, "application/pdf", "Dr Synthetic Impostor"));
        first.StatusCode.Should().Be(HttpStatusCode.Created);
        var second = await client.PostAsync("/api/v1/auth/register/doctor", DoctorForm("synthetic-second-claim@example.invalid", "77001", pdf, "application/pdf", "Dr Synthetic Real"));
        second.StatusCode.Should().Be(HttpStatusCode.Created, "a duplicate SLMC number is a dispute, not a 409");
        var secondAuth = await second.Content.ReadFromJsonAsync<JsonElement>();
        secondAuth.GetProperty("doctorVerificationStatus").GetString().Should().Be("Pending");
        secondAuth.GetProperty("doctorClaimUnderReview").GetBoolean().Should().BeTrue();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await AdminTokenAsync(client));
        var disputes = await client.GetFromJsonAsync<JsonElement>("/api/v1/admin/disputes");
        disputes.GetArrayLength().Should().Be(1);
        var dispute = disputes[0];
        dispute.GetProperty("claimants").GetArrayLength().Should().Be(2);
        var realId = dispute.GetProperty("claimants").EnumerateArray()
            .Single(x => x.GetProperty("displayName").GetString() == "Dr Synthetic Real").GetProperty("doctorId").GetGuid();

        var noReason = await client.PostAsJsonAsync($"/api/v1/admin/disputes/{dispute.GetProperty("id").GetGuid()}/resolve", new { winnerDoctorId = realId, reason = "" });
        noReason.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var resolved = await client.PostAsJsonAsync($"/api/v1/admin/disputes/{dispute.GetProperty("id").GetGuid()}/resolve", new { winnerDoctorId = realId, reason = "Synthetic licence matches" });
        resolved.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var doctors = await db.Doctors.Include(x => x.User).Where(x => x.RegistrationNumberLastFour == "7001").ToListAsync();
        doctors.Single(x => x.Id == realId).VerificationStatus.Should().Be(VerificationStatus.Verified);
        var loser = doctors.Single(x => x.Id != realId);
        loser.VerificationStatus.Should().Be(VerificationStatus.Suspended);
        loser.User!.IsActive.Should().BeFalse();
        (await db.AuditLogs.AnyAsync(x => x.EventType == "SLMC_CLAIM_DISPUTE_RESOLVED")).Should().BeTrue();
    }

    [Fact]
    public async Task PartialUniqueIndex_AllowsDuplicatePending_ButRejectsTwoVerified()
    {
        await using var scope = _factory!.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Doctor Add(VerificationStatus status)
        {
            var user = new UserAccount { Email = $"{Guid.NewGuid():N}@example.invalid", PasswordHash = "x", DisplayName = "Dr Synthetic Index", UserType = UserType.Doctor };
            var doctor = new Doctor { User = user, RegistrationNumberHash = "SYNTHETIC-INDEX", RegistrationNumberLastFour = "0009", VerificationStatus = status };
            db.AddRange(user, doctor);
            return doctor;
        }
        Add(VerificationStatus.Verified);
        Add(VerificationStatus.Pending);
        await db.SaveChangesAsync();

        Add(VerificationStatus.Verified);
        var act = () => db.SaveChangesAsync();
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    private async Task<string> AdminTokenAsync(HttpClient client)
    {
        const string password = "Synthetic-Admin-Pass-42!";
        await using (var scope = _factory!.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<UserAccount>>();
            var admin = new UserAccount { Email = "synthetic-admin@example.invalid", DisplayName = "Synthetic Admin", PasswordHash = "", UserType = UserType.Admin };
            admin.PasswordHash = hasher.HashPassword(admin, password);
            db.Users.Add(admin);
            await db.SaveChangesAsync();
        }
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { email = "synthetic-admin@example.invalid", password });
        login.EnsureSuccessStatusCode();
        return (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString()!;
    }

    [Theory]
    [InlineData("letters", "0771234567")]
    [InlineData("SLMC-12345", "0771234567")]
    [InlineData("１２３４５", "0771234567")]
    [InlineData("12345", "077abc4567")]
    public async Task Doctor_Registration_RejectsInvalidNumbers_AndCreatesNothing(string slmc, string phone)
    {
        var email = $"synthetic-invalid-{Guid.NewGuid():N}@example.invalid";
        var client = _factory!.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email, password = "Synthetic-Pass-42!", displayName = "Synthetic Doctor", userType = "Doctor",
            registrationNumber = slmc, specialty = "Synthetic specialty", hospitalClinic = "Synthetic clinic", phoneNumber = phone
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        using var form = DoctorForm(email, slmc, Encoding.ASCII.GetBytes("%PDF-1.4 synthetic document"), "application/pdf", phone: phone);
        var multipart = await client.PostAsync("/api/v1/auth/register/doctor", form);
        multipart.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.AnyAsync(x => x.Email == email)).Should().BeFalse();
    }

    private static MultipartFormDataContent DoctorForm(string email, string slmc, byte[] document, string contentType, string fullName = "Synthetic Doctor", string phone = "0771234567")
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(fullName), "fullName" },
            { new StringContent(email), "email" },
            { new StringContent(phone), "mobileNumber" },
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
