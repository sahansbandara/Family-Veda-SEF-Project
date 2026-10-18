// Owner: S4 · Doctor workspace regression tests. Synthetic data only.
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FamilyVeda.Application.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Portal;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace FamilyVeda.IntegrationTests;

public sealed class DoctorSlotsPostgreSqlTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16-alpine")
        .WithDatabase("familyveda_slots").WithUsername("familyveda_slots").WithPassword($"test-{Guid.NewGuid():N}").Build();

    public Task InitializeAsync() => _database.StartAsync();
    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task SlotsAndBooking_HttpPostgreSql_AcceptsClinicOffsetsAndExcludesBusyTimes()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(_database.GetConnectionString())
            .UseSnakeCaseNamingConvention().Options;
        await using var db = new AppDbContext(options);
        await db.Database.MigrateAsync();
        var head = new UserAccount { Email = "synthetic-slots-head@example.invalid", PasswordHash = "x", DisplayName = "Synthetic Head", UserType = UserType.FamilyUser };
        var doctorUser = new UserAccount { Email = "synthetic-slots-doctor@example.invalid", PasswordHash = "x", DisplayName = "Synthetic Doctor", UserType = UserType.Doctor };
        var family = new Family { Name = "Synthetic Slots", FamilyCode = "FV-SLOTS1", CreatedByUser = head };
        var member = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1980, 1, 1), Role = FamilyRole.Head };
        var doctor = new Doctor { User = doctorUser, RegistrationNumberHash = "synthetic-slots", RegistrationNumberLastFour = "0000", VerificationStatus = VerificationStatus.Verified };
        const string password = "Synthetic-Slots-Password-42!";
        var hasher = new PasswordHasher<UserAccount>();
        head.PasswordHash = hasher.HashPassword(head, password);
        doctorUser.PasswordHash = hasher.HashPassword(doctorUser, password);
        var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        DateTimeOffset Local(int hour, int minute) => new(date.ToDateTime(new TimeOnly(hour, minute)), DoctorSchedule.ClinicOffset);
        Appointment Visit(DateTimeOffset start, AppointmentStatus status = AppointmentStatus.Requested) => new()
        {
            Member = member, Doctor = doctor, BookedByUserId = head.Id, StartsAt = start.ToUniversalTime(),
            DurationMinutes = 30, Reason = "Synthetic slot fixture", Status = status
        };
        db.AddRange(head, doctorUser, family, member, doctor,
            new FamilyDoctorAssignment { Family = family, Doctor = doctor, IsPrimary = true },
            new DoctorAvailability { Doctor = doctor, DayOfWeek = date.DayOfWeek, StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(2, 0) },
            new DoctorAvailability { Doctor = doctor, DayOfWeek = date.DayOfWeek, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(10, 0) },
            new DoctorAvailability { Doctor = doctor, DayOfWeek = date.DayOfWeek, StartTime = new TimeOnly(23, 0), EndTime = new TimeOnly(23, 59) },
            Visit(Local(0, 0).AddMinutes(-15)),
            Visit(Local(9, 0), AppointmentStatus.Confirmed),
            Visit(Local(9, 30), AppointmentStatus.Cancelled),
            Visit(Local(0, 0).AddDays(1)),
            new DoctorUnavailablePeriod { Doctor = doctor, StartsAt = Local(0, 0).AddMinutes(-5).ToUniversalTime(), EndsAt = Local(0, 45).ToUniversalTime() },
            new DoctorUnavailablePeriod { Doctor = doctor, StartsAt = Local(0, 0).AddDays(1).ToUniversalTime(), EndsAt = Local(1, 0).AddDays(1).ToUniversalTime() });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var result = await new DoctorWorkspaceService(db, new FamilyUser(head.Id))
            .GetFamilyDoctorSlotsAsync(family.Id, date, CancellationToken.None);

        result.Date.Should().Be(date);
        result.AvailabilityConfigured.Should().BeTrue();
        result.Slots.Should().Equal(Local(1, 0), Local(1, 30), Local(9, 30), Local(23, 0));
        result.Slots.Should().OnlyContain(slot => slot.Offset == TimeSpan.FromMinutes(330));

        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("ConnectionStrings:DefaultConnection", _database.GetConnectionString());
            builder.UseSetting("Database:MigrateOnStartup", "true");
            builder.UseSetting("Jwt:Key", "integration-test-key-with-at-least-thirty-two-bytes");
            builder.UseSetting("Jwt:Issuer", "familyveda");
            builder.UseSetting("Jwt:Audience", "familyveda-clients");
        });
        using var client = factory.CreateClient();
        async Task Authenticate(UserAccount user)
        {
            var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { email = user.Email, password });
            login.StatusCode.Should().Be(HttpStatusCode.OK);
            var auth = await login.Content.ReadFromJsonAsync<JsonElement>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());
        }
        await Authenticate(head);
        var offered = await client.GetFromJsonAsync<JsonElement>($"/api/v1/families/{family.Id}/doctor/slots?date={date:yyyy-MM-dd}");
        var offeredSlot = offered.GetProperty("slots")[0].GetString()!;
        offeredSlot.Should().EndWith("+05:30");
        var booking = new { memberId = member.Id, startsAt = offeredSlot, durationMinutes = 30, reason = "Synthetic offset booking" };
        var booked = await client.PostAsJsonAsync("/api/v1/appointments", booking);
        booked.StatusCode.Should().Be(HttpStatusCode.Created, await booked.Content.ReadAsStringAsync());
        var appointmentId = (await booked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var duplicate = await client.PostAsJsonAsync("/api/v1/appointments", booking);
        duplicate.StatusCode.Should().Be(HttpStatusCode.Conflict);

        await Authenticate(doctorUser);
        var rescheduled = await client.PostAsJsonAsync($"/api/v1/doctors/me/appointments/{appointmentId}/reschedule",
            new { startsAt = Local(1, 30), note = "Synthetic offset reschedule" });
        rescheduled.StatusCode.Should().Be(HttpStatusCode.OK, await rescheduled.Content.ReadAsStringAsync());
        db.ChangeTracker.Clear();
        var persisted = await db.Appointments.SingleAsync(x => x.Id == appointmentId);
        persisted.StartsAt.Should().Be(Local(1, 30).ToUniversalTime());
        persisted.StartsAt.Offset.Should().Be(TimeSpan.Zero);

        var badPhone = await client.PutAsJsonAsync("/api/v1/doctors/me/profile", new
        {
            clinic = "Synthetic rejected clinic", phoneNumber = "011000000a", acceptingNewFamilies = true, slotMinutes = 30
        });
        badPhone.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await badPhone.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("errors").TryGetProperty("phoneNumber", out _).Should().BeTrue();
        db.ChangeTracker.Clear();
        var unchanged = await db.Doctors.SingleAsync(x => x.Id == doctor.Id);
        unchanged.PhoneNumber.Should().BeNull();
        unchanged.HospitalClinic.Should().BeNull();
        (await db.AuditLogs.AnyAsync(x => x.EventType == "DOCTOR_PROFILE_UPDATED")).Should().BeFalse();
    }

    private sealed class FamilyUser(Guid id) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => id;
        public UserType UserType => UserType.FamilyUser;
    }
}
