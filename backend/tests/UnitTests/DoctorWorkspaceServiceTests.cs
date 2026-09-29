// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor workspace (DECISIONS 2026-09-29h): visit grants, access chain, consent filtering,
// append-only notes, weekly hours and free slots. Synthetic data only (RULE 7).
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Portal;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;
using FamilyVeda.Domain.Records;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Portal;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace FamilyVeda.UnitTests;

public sealed class DoctorWorkspaceServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed record Fixture(UserAccount Head, UserAccount DoctorUser, UserAccount OtherDoctorUser, Member Adult, Member HeadMember, Doctor Doctor, Family Family);

    private static async Task<Fixture> SeedAsync(AppDbContext db)
    {
        var head = new UserAccount { Email = "head@example.invalid", PasswordHash = "x", DisplayName = "Synthetic Head", UserType = UserType.FamilyUser };
        var adultUser = new UserAccount { Email = "adult@example.invalid", PasswordHash = "x", DisplayName = "Synthetic Adult", UserType = UserType.FamilyUser };
        var family = new Family { Name = "Synthetic Family", CreatedByUser = head, FamilyCode = "FV-DWS001" };
        var headMember = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1975, 1, 1), Role = FamilyRole.Head };
        var adult = new Member { Family = family, User = adultUser, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(1995, 1, 1), Role = FamilyRole.AdultMember };
        var doctorUser = new UserAccount { Email = "doc@example.invalid", PasswordHash = "x", DisplayName = "Dr Synthetic", UserType = UserType.Doctor };
        var doctor = new Doctor { User = doctorUser, RegistrationNumberHash = "h1", RegistrationNumberLastFour = "0001", VerificationStatus = VerificationStatus.Verified };
        var otherDoctorUser = new UserAccount { Email = "doc2@example.invalid", PasswordHash = "x", DisplayName = "Dr Other", UserType = UserType.Doctor };
        var otherDoctor = new Doctor { User = otherDoctorUser, RegistrationNumberHash = "h2", RegistrationNumberLastFour = "0002", VerificationStatus = VerificationStatus.Verified };
        db.AddRange(head, adultUser, family, headMember, adult, doctorUser, doctor, otherDoctorUser, otherDoctor,
            new FamilyDoctorAssignment { Family = family, Doctor = doctor, IsPrimary = true },
            new Consent { Member = adult, Category = ConsentCategory.Conditions, Status = ConsentStatus.Granted },
            new Consent { Member = adult, Category = ConsentCategory.VitalsSummary, Status = ConsentStatus.Revoked },
            new HealthRecord { Member = adult, Title = "Synthetic condition", RecordType = RecordType.Condition, OccurredOn = new DateOnly(2026, 1, 1) },
            new Vital { Member = adult, VitalType = "Synthetic BP", Value = 120, Unit = "mmHg", MeasuredAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
        return new Fixture(head, doctorUser, otherDoctorUser, adult, headMember, doctor, family);
    }

    private static DoctorWorkspaceService Workspace(AppDbContext db, Guid userId) => new(db, new StubCurrentUser(userId));
    private static AppointmentService Appointments(AppDbContext db, Guid userId) => new(db, new StubCurrentUser(userId));

    private static async Task<Appointment> ConfirmedVisitAsync(AppDbContext db, Fixture f, DateTimeOffset startsAt)
    {
        var appointment = new Appointment { MemberId = f.Adult.Id, DoctorId = f.Doctor.Id, BookedByUserId = f.Head.Id, StartsAt = startsAt, Reason = "Synthetic visit" };
        db.Add(appointment);
        await db.SaveChangesAsync();
        await Appointments(db, f.DoctorUser.Id).ConfirmAsync(appointment.Id, new AppointmentActionRequest(null), CancellationToken.None);
        return appointment;
    }

    [Fact]
    public async Task Confirm_IssuesVisitGrant_From24hBeforeTo24hAfter()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var start = DateTimeOffset.UtcNow.AddHours(3);

        var appointment = await ConfirmedVisitAsync(db, f, start);

        var grant = await db.VisitAccessGrants.SingleAsync();
        grant.AppointmentId.Should().Be(appointment.Id);
        grant.StartsAt.Should().Be(start.AddHours(-24));
        grant.ExpiresAt.Should().Be(start.AddMinutes(30).AddHours(24));
        (await db.AuditLogs.AnyAsync(x => x.EventType == "VISIT_GRANT_ISSUED")).Should().BeTrue();
    }

    [Fact]
    public async Task Workspace_WithAssignmentOnly_IsRestricted_AndLeaksNoCounts()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);

        var view = await Workspace(db, f.DoctorUser.Id).GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None);

        view.ClinicalAccess.Should().BeFalse();
        view.Records.Should().BeNull();
        view.LabReports.Should().BeNull();
        view.Vitals.Should().BeNull();
        view.ConsentedCategories.Should().BeEmpty();
        (await db.AuditLogs.SingleAsync(x => x.EventType == "DOCTOR_MEMBER_WORKSPACE_READ")).Outcome.Should().Be("RESTRICTED");
    }

    [Fact]
    public async Task Workspace_DuringVisit_ReturnsOnlyConsentedCategories_AndAudits()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));

        var view = await Workspace(db, f.DoctorUser.Id).GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None);

        view.ClinicalAccess.Should().BeTrue();
        view.Records.Should().ContainSingle(x => x.Title == "Synthetic condition");
        view.Vitals.Should().BeNull("vitals consent is revoked");
        view.HereditaryFlags.Should().BeNull("hereditary consent was never granted");
        (await db.AuditLogs.SingleAsync(x => x.EventType == "DOCTOR_MEMBER_WORKSPACE_READ")).Outcome.Should().Be("SUCCESS");
    }

    [Fact]
    public async Task Workspace_AfterCancel_IsRestrictedAgain()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var appointment = await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        await Appointments(db, f.DoctorUser.Id).DoctorCancelAsync(appointment.Id, new AppointmentActionRequest(null), CancellationToken.None);

        var view = await Workspace(db, f.DoctorUser.Id).GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None);

        view.ClinicalAccess.Should().BeFalse();
        (await db.VisitAccessGrants.SingleAsync()).RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Workspace_ForUnassignedDoctor_Returns404_EvenWithAVisit()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));

        await FluentActions.Awaiting(() => Workspace(db, f.OtherDoctorUser.Id).GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Workspace_ForEndedAssignment_Returns404()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        (await db.FamilyDoctorAssignments.SingleAsync()).EndedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        await FluentActions.Awaiting(() => Workspace(db, f.DoctorUser.Id).GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Workspace_ForFamilyUser_IsForbidden()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);

        await FluentActions.Awaiting(() => Workspace(db, f.Head.Id).GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Notes_NeedAGrant_AndAmendmentsAppendANewVersion()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var service = Workspace(db, f.DoctorUser.Id);

        await FluentActions.Awaiting(() => service.AddNoteAsync(f.Adult.Id, new CreateClinicalNoteRequest("Synthetic note", ClinicalNoteType.VisitNote, null), CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();

        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        var note = await service.AddNoteAsync(f.Adult.Id, new CreateClinicalNoteRequest("Synthetic note", ClinicalNoteType.VisitNote, null), CancellationToken.None);
        var amended = await service.AmendNoteAsync(note.Id, new AmendClinicalNoteRequest("Synthetic note, corrected"), CancellationToken.None);

        amended.Version.Should().Be(2);
        amended.AmendsNoteId.Should().Be(note.Id);
        (await db.ClinicalNotes.CountAsync()).Should().Be(2, "the original note is kept");
        (await db.ClinicalNotes.SingleAsync(x => x.Id == note.Id)).Content.Should().Be("Synthetic note");
    }

    [Fact]
    public async Task Availability_RejectsOverlap_AndSlotsSkipBookedTime()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var service = Workspace(db, f.DoctorUser.Id);

        await FluentActions.Awaiting(() => service.ReplaceAvailabilityAsync(new ReplaceAvailabilityRequest([
                new AvailabilityWindowDto(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(12, 0)),
                new AvailabilityWindowDto(DayOfWeek.Monday, new TimeOnly(11, 0), new TimeOnly(13, 0))]), CancellationToken.None))
            .Should().ThrowAsync<ValidationException>();

        var nextMonday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        while (nextMonday.DayOfWeek != DayOfWeek.Monday) nextMonday = nextMonday.AddDays(1);
        await service.ReplaceAvailabilityAsync(new ReplaceAvailabilityRequest([new AvailabilityWindowDto(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(10, 0))]), CancellationToken.None);
        var booked = new DateTimeOffset(nextMonday.ToDateTime(new TimeOnly(9, 30)), DoctorSchedule.ClinicOffset);
        db.Add(new Appointment { MemberId = f.Adult.Id, DoctorId = f.Doctor.Id, BookedByUserId = f.Head.Id, StartsAt = booked, Reason = "Synthetic" });
        await db.SaveChangesAsync();

        var slots = await Workspace(db, f.Head.Id).GetFamilyDoctorSlotsAsync(f.Family.Id, nextMonday, CancellationToken.None);

        slots.AvailabilityConfigured.Should().BeTrue();
        slots.Slots.Should().Equal(new DateTimeOffset(nextMonday.ToDateTime(new TimeOnly(9, 0)), DoctorSchedule.ClinicOffset));
    }

    [Fact]
    public async Task Book_OutsideWorkingHours_IsRejected_OnceHoursAreSet()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        await Workspace(db, f.DoctorUser.Id).ReplaceAvailabilityAsync(new ReplaceAvailabilityRequest([new AvailabilityWindowDto(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(10, 0))]), CancellationToken.None);
        var nextTuesday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        while (nextTuesday.DayOfWeek != DayOfWeek.Tuesday) nextTuesday = nextTuesday.AddDays(1);

        await FluentActions.Awaiting(() => Appointments(db, f.Head.Id).BookAsync(new CreateAppointmentRequest(f.HeadMember.Id,
                new DateTimeOffset(nextTuesday.ToDateTime(new TimeOnly(9, 0)), DoctorSchedule.ClinicOffset), 30, "Synthetic"), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>().WithMessage("*working hours*");
    }

    [Fact]
    public async Task Reschedule_MovesTime_KeepsHistory_AndNotifiesTheFamily()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var original = DateTimeOffset.UtcNow.AddDays(2);
        var appointment = await ConfirmedVisitAsync(db, f, original);
        var moved = original.AddDays(1);

        var result = await Appointments(db, f.DoctorUser.Id).RescheduleAsync(appointment.Id, new RescheduleAppointmentRequest(moved, null), CancellationToken.None);

        result.StartsAt.Should().Be(moved);
        (await db.Appointments.SingleAsync()).RescheduledFromStartsAt.Should().Be(original);
        (await db.VisitAccessGrants.CountAsync(x => x.RevokedAt == null)).Should().Be(1);
        (await db.VisitAccessGrants.SingleAsync(x => x.RevokedAt == null)).StartsAt.Should().Be(moved.AddHours(-24));
        (await db.PortalNotifications.AnyAsync(x => x.UserId == f.Head.Id && x.Type == "APPOINTMENT_RESCHEDULED")).Should().BeTrue();
    }

    [Fact]
    public async Task Slots_ForNonMember_Return404()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);

        await FluentActions.Awaiting(() => Workspace(db, f.OtherDoctorUser.Id).GetFamilyDoctorSlotsAsync(f.Family.Id, DateOnly.FromDateTime(DateTime.UtcNow), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Profile_RejectsUnsupportedSlotLength()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);

        await FluentActions.Awaiting(() => Workspace(db, f.DoctorUser.Id).UpdateProfileAsync(
                new UpdatePracticeProfileRequest("GP", null, null, null, null, null, null, true, 25), CancellationToken.None))
            .Should().ThrowAsync<ValidationException>();
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.FamilyUser;
    }
}
