// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Portal;
using FamilyVeda.Application.Triage;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Triage;
using FamilyVeda.Infrastructure.Clinical;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Portal;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FamilyVeda.UnitTests;

/// <summary>What a doctor may do after acknowledging an emergency referral. Synthetic data only.</summary>
public sealed class EmergencyFollowUpTests
{
    [Fact]
    public async Task ClosingAReferral_KeepsThePatientReferralAndRemovesItFromThePool()
    {
        await using var world = await World.CreateAsync();
        await world.AcknowledgeAsync();

        await world.FollowUp().CloseReferralAsync(world.Case.Id, CancellationToken.None);

        (await world.Db.TriageCases.SingleAsync()).Status.Should().Be(TriageStatus.Escalated);
        (await world.Clinical().GetMyCasesAsync(1, 20, CancellationToken.None)).Items.Single().ReferralClosed.Should().BeTrue();
        (await world.Clinical(world.OtherDoctorUser).GetAvailableCasesAsync(1, 20, CancellationToken.None)).Items.Should().BeEmpty();
        (await world.Db.AuditLogs.AnyAsync(x => x.EventType == "EMERGENCY_REFERRAL_CLOSED" && x.ResourceId == world.Case.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task AClosedReferral_CannotBeAcknowledgedAgainOrClosedTwice()
    {
        await using var world = await World.CreateAsync();
        await world.AcknowledgeAsync();
        await world.FollowUp().CloseReferralAsync(world.Case.Id, CancellationToken.None);

        var reclaim = () => world.Clinical(world.OtherDoctorUser).ClaimCaseAsync(world.Case.Id, CancellationToken.None);
        var closeAgain = () => world.FollowUp().CloseReferralAsync(world.Case.Id, CancellationToken.None);

        await reclaim.Should().ThrowAsync<NotFoundException>();
        await closeAgain.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task FollowUpActions_AreRefusedWithoutAnActiveGrant()
    {
        await using var world = await World.CreateAsync();

        var close = () => world.FollowUp().CloseReferralAsync(world.Case.Id, CancellationToken.None);
        var share = () => world.FollowUp().ShareContactAsync(world.Case.Id, CancellationToken.None);
        var book = () => world.Appointments().BookFollowUpAsync(world.Case.Id, new FollowUpAppointmentRequest(DateTimeOffset.UtcNow.AddDays(1), 30, null), CancellationToken.None);

        await close.Should().ThrowAsync<NotFoundException>();
        await share.Should().ThrowAsync<NotFoundException>();
        await book.Should().ThrowAsync<NotFoundException>();
        (await world.Db.PortalNotifications.AnyAsync()).Should().BeFalse();
        (await world.Db.Appointments.AnyAsync()).Should().BeFalse();
    }

    [Fact]
    public async Task FollowUpActions_AreRefusedForACaseThatIsNotAnEmergencyReferral()
    {
        await using var world = await World.CreateAsync(TriageStatus.PendingDoctorReview);
        await world.AcknowledgeAsync();

        var share = () => world.FollowUp().ShareContactAsync(world.Case.Id, CancellationToken.None);

        await share.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task SharingContact_SendsThePatientTheDoctorsNumberOnce()
    {
        await using var world = await World.CreateAsync();
        await world.AcknowledgeAsync();
        world.Db.PortalNotifications.RemoveRange(world.Db.PortalNotifications);
        await world.Db.SaveChangesAsync();

        await world.FollowUp().ShareContactAsync(world.Case.Id, CancellationToken.None);
        var again = () => world.FollowUp().ShareContactAsync(world.Case.Id, CancellationToken.None);

        var notification = await world.Db.PortalNotifications.SingleAsync();
        notification.UserId.Should().Be(world.PatientUser.Id);
        notification.Type.Should().Be("DOCTOR_CONTACT_SHARED");
        notification.Body.Should().Contain("0110000000").And.Contain("Synthetic Clinician").And.Contain("in-person care");
        await again.Should().ThrowAsync<ConflictException>();
        (await world.Db.PortalNotifications.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task SharingContact_NeedsAPhoneNumberOnTheDoctorProfile()
    {
        await using var world = await World.CreateAsync(doctorPhone: null);
        await world.AcknowledgeAsync();

        var share = () => world.FollowUp().ShareContactAsync(world.Case.Id, CancellationToken.None);

        await share.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task BookingAFollowUp_ConfirmsItTellsThePatientAndGrantsNoRecordAccess()
    {
        await using var world = await World.CreateAsync();
        await world.AcknowledgeAsync();
        world.Db.PortalNotifications.RemoveRange(world.Db.PortalNotifications);
        await world.Db.SaveChangesAsync();
        var startsAt = DateTimeOffset.UtcNow.AddDays(2);

        var booked = await world.Appointments().BookFollowUpAsync(world.Case.Id, new FollowUpAppointmentRequest(startsAt, null, "  "), CancellationToken.None);

        booked.Status.Should().Be(AppointmentStatus.Confirmed);
        booked.MemberId.Should().Be(world.Patient.Id);
        booked.Reason.Should().Be("Follow-up after urgent care referral");
        (await world.Db.VisitAccessGrants.AnyAsync()).Should().BeFalse();
        var notification = await world.Db.PortalNotifications.SingleAsync();
        notification.UserId.Should().Be(world.PatientUser.Id);
        notification.LinkPath.Should().Be("/appointments");
    }

    [Fact]
    public async Task BookingAFollowUp_RejectsPastTimesOverlapsAndASecondOpenFollowUp()
    {
        await using var world = await World.CreateAsync();
        await world.AcknowledgeAsync();
        var startsAt = DateTimeOffset.UtcNow.AddDays(2);
        var appointments = world.Appointments();

        var past = () => appointments.BookFollowUpAsync(world.Case.Id, new FollowUpAppointmentRequest(DateTimeOffset.UtcNow.AddMinutes(-5), 30, null), CancellationToken.None);
        await past.Should().ThrowAsync<ValidationException>();
        await appointments.BookFollowUpAsync(world.Case.Id, new FollowUpAppointmentRequest(startsAt, 30, null), CancellationToken.None);
        var second = () => appointments.BookFollowUpAsync(world.Case.Id, new FollowUpAppointmentRequest(startsAt.AddDays(1), 30, null), CancellationToken.None);

        await second.Should().ThrowAsync<ConflictException>();
        (await world.Db.Appointments.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task ThePatient_CanCancelADoctorBookedFollowUp()
    {
        await using var world = await World.CreateAsync();
        await world.AcknowledgeAsync();
        var booked = await world.Appointments().BookFollowUpAsync(world.Case.Id, new FollowUpAppointmentRequest(DateTimeOffset.UtcNow.AddDays(2), 30, null), CancellationToken.None);

        var cancelled = await world.Appointments(world.PatientUser, UserType.FamilyUser).CancelAsync(booked.Id, CancellationToken.None);

        cancelled.Status.Should().Be(AppointmentStatus.Cancelled);
    }

    [Fact]
    public async Task ReschedulingADoctorBookedFollowUp_StillGrantsNoRecordAccessAndTellsThePatient()
    {
        await using var world = await World.CreateAsync();
        await world.AcknowledgeAsync();
        var booked = await world.Appointments().BookFollowUpAsync(world.Case.Id, new FollowUpAppointmentRequest(DateTimeOffset.UtcNow.AddDays(2), 30, null), CancellationToken.None);
        world.Db.PortalNotifications.RemoveRange(world.Db.PortalNotifications);
        await world.Db.SaveChangesAsync();

        await world.Appointments().RescheduleAsync(booked.Id, new RescheduleAppointmentRequest(DateTimeOffset.UtcNow.AddDays(3), null), CancellationToken.None);

        (await world.Db.VisitAccessGrants.AnyAsync()).Should().BeFalse();
        (await world.Db.PortalNotifications.SingleAsync()).UserId.Should().Be(world.PatientUser.Id);
    }

    private sealed class World : IAsyncDisposable
    {
        public required AppDbContext Db { get; init; }
        public required UserAccount PatientUser { get; init; }
        public required UserAccount DoctorUser { get; init; }
        public required UserAccount OtherDoctorUser { get; init; }
        public required Member Patient { get; init; }
        public required TriageCase Case { get; init; }

        public static async Task<World> CreateAsync(TriageStatus status = TriageStatus.Escalated, string? doctorPhone = "0110000000")
        {
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
            var patientUser = User("synthetic-followup-patient@example.invalid", "Synthetic Patient", UserType.FamilyUser);
            var doctorUser = User("synthetic-followup-clinician@example.invalid", "Synthetic Clinician", UserType.Doctor);
            var otherDoctorUser = User("synthetic-followup-other@example.invalid", "Synthetic Other Clinician", UserType.Doctor);
            var family = new Family { Name = "Synthetic Follow-up Family", CreatedByUser = patientUser };
            var patient = new Member { Family = family, User = patientUser, DisplayName = "Synthetic Patient", DateOfBirth = new DateOnly(1990, 1, 1), Role = FamilyRole.Head };
            var episode = new Episode { Member = patient, SymptomsJson = "[\"synthetic_signal\"]", DurationDays = 0, Severity = 9 };
            var triageCase = new TriageCase { Member = patient, Episode = episode, Status = status, Priority = TriagePriority.Emergency };
            db.AddRange(patientUser, doctorUser, otherDoctorUser, family, patient, episode, triageCase,
                new Doctor { User = doctorUser, RegistrationNumberHash = "SYNTHETIC-FU-1", RegistrationNumberLastFour = "0011", VerificationStatus = VerificationStatus.Verified, PhoneNumber = doctorPhone },
                new Doctor { User = otherDoctorUser, RegistrationNumberHash = "SYNTHETIC-FU-2", RegistrationNumberLastFour = "0012", VerificationStatus = VerificationStatus.Verified });
            await db.SaveChangesAsync();
            return new World { Db = db, PatientUser = patientUser, DoctorUser = doctorUser, OtherDoctorUser = otherDoctorUser, Patient = patient, Case = triageCase };
        }

        public ClinicalService Clinical(UserAccount? user = null) =>
            new(Db, new StubCurrentUser((user ?? DoctorUser).Id, UserType.Doctor), new StubNotifications(), new ConfigurationBuilder().AddInMemoryCollection().Build());

        public EmergencyFollowUpService FollowUp() => new(Db, new StubCurrentUser(DoctorUser.Id, UserType.Doctor));

        public AppointmentService Appointments(UserAccount? user = null, UserType type = UserType.Doctor) =>
            new(Db, new StubCurrentUser((user ?? DoctorUser).Id, type));

        public Task AcknowledgeAsync() => Clinical().ClaimCaseAsync(Case.Id, CancellationToken.None);

        public ValueTask DisposeAsync() => Db.DisposeAsync();

        private static UserAccount User(string email, string name, UserType type) => new() { Email = email, PasswordHash = "synthetic", DisplayName = name, UserType = type };
    }

    private sealed class StubCurrentUser(Guid userId, UserType userType) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => userType;
    }

    private sealed class StubNotifications : INotificationService
    {
        public Task<NotificationSubscriptionDto> SubscribeAsync(NotificationSubscriptionRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task SendCaseStatusAsync(Guid caseId, TriageStatus status, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<PagedResult<NotificationDto>> GetInboxAsync(int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
