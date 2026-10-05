// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor workspace (DECISIONS 2026-09-29h): visit grants, access chain, consent filtering,
// append-only notes, weekly hours and free slots. Synthetic data only (RULE 7).
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Portal;
using FamilyVeda.Application.Records;
using FamilyVeda.Domain.Triage;
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
    public async Task AmendNote_AfterTheGrantEnds_IsForbidden_AndAppendsNothing()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var service = Workspace(db, f.DoctorUser.Id);
        var visit = await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        var note = await service.AddNoteAsync(f.Adult.Id, new CreateClinicalNoteRequest("Synthetic note", ClinicalNoteType.VisitNote, null), CancellationToken.None);

        // The family doctor assignment stays; only the member-specific visit grant is revoked.
        await Appointments(db, f.DoctorUser.Id).DoctorCancelAsync(visit.Id, new AppointmentActionRequest(null), CancellationToken.None);

        await FluentActions.Awaiting(() => service.AmendNoteAsync(note.Id, new AmendClinicalNoteRequest("Synthetic late amendment"), CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();
        (await db.ClinicalNotes.CountAsync()).Should().Be(1, "a denied amendment appends nothing");
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

    [Fact]
    public async Task GuardianConsent_StopsCounting_OnceTheMemberIsAnAdult()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        db.Add(new Consent { MemberId = f.Adult.Id, Category = ConsentCategory.HereditaryFlags, Status = ConsentStatus.Granted, GrantedByGuardian = true });
        db.Add(new HereditaryFlag { MemberId = f.Adult.Id, ConditionCode = "SYN-1", Finding = "Synthetic flag", Confidence = 0.9m, ManuallyConfirmed = true });
        await db.SaveChangesAsync();
        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));

        var view = await Workspace(db, f.DoctorUser.Id).GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None);

        view.HereditaryFlags.Should().BeNull("a guardian's consent needs reaffirmation once the member is 18");
        view.ConsentedCategories.Should().NotContain("HereditaryFlags");
    }

    [Fact]
    public async Task Confirm_AfterTheStart_IsRejected_AndIssuesNoGrant()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var late = new Appointment { MemberId = f.Adult.Id, DoctorId = f.Doctor.Id, BookedByUserId = f.Head.Id, StartsAt = DateTimeOffset.UtcNow.AddHours(-1), Reason = "Synthetic" };
        db.Add(late);
        await db.SaveChangesAsync();

        await FluentActions.Awaiting(() => Appointments(db, f.DoctorUser.Id).ConfirmAsync(late.Id, new AppointmentActionRequest(null), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>().WithMessage("*already started*");
        (await db.VisitAccessGrants.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DoctorNotAcceptingNewFamilies_IsHiddenFromTheDirectory_AndCannotBeRequested()
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        var doctor = await db.Doctors.SingleAsync(x => x.Id == f.Doctor.Id);
        doctor.AcceptingNewFamilies = false;
        await db.SaveChangesAsync();
        var directory = new FamilyDoctorService(db, new StubCurrentUser(f.Head.Id));

        (await directory.GetDirectoryAsync(null, null, CancellationToken.None)).Should().NotContain(x => x.Id == f.Doctor.Id);
    }

    [Theory]
    [InlineData("application/pdf")]
    [InlineData("image/png")]
    [InlineData("image/jpeg")]
    public async Task OriginalReport_WithVisitAndConsent_ReturnsBytesAndAudits(string type)
    {
        await using var db = NewDb();
        var f = await SeedAsync(db);
        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        var report = new LabReport { MemberId = f.Adult.Id, OriginalFileName = "SYNTHETIC.pdf", StoredFileName = "fixture.pdf", ContentType = type };
        db.Add(report); db.Add(new LabReportFile { LabReport = report, Content = [1, 2, 3] });
        await db.SaveChangesAsync();
        var service = new DoctorWorkspaceService(db, new ReportDoctorUser(f.DoctorUser.Id));
        var result = await service.GetOriginalReportAsync(f.Adult.Id, report.Id, CancellationToken.None);
        result.Content.Should().Equal(1, 2, 3); result.ContentType.Should().Be(type);
        var audit = await db.AuditLogs.SingleAsync(x => x.EventType == "DOCTOR_ORIGINAL_REPORT_READ");
        audit.ResourceId.Should().Be(report.Id); audit.ConsentRefId.Should().NotBeNull();
        (await service.GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None)).LabReports!
            .Should().ContainSingle(x => x.Id == report.Id && x.HasOriginalFile);
    }

    [Theory]
    [InlineData("no-grant")]
    [InlineData("revoked-consent")]
    [InlineData("adult-guardian-consent")]
    [InlineData("wrong-member")]
    [InlineData("revoked-grant")]
    [InlineData("expired-grant")]
    [InlineData("future-grant")]
    [InlineData("ended-assignment")]
    [InlineData("missing-file")]
    [InlineData("unsupported-type")]
    [InlineData("empty-file")]
    public async Task OriginalReport_WhenUnavailable_DeniesWithoutStorageRead(string scenario)
    {
        await using var db = NewDb(); var f = await SeedAsync(db);
        if (scenario != "no-grant") await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        var report = new LabReport { MemberId = f.Adult.Id, OriginalFileName = "SYNTHETIC.pdf", StoredFileName = "fixture.pdf", ContentType = scenario == "unsupported-type" ? "text/html" : "application/pdf" };
        db.Add(report);
        if (scenario != "missing-file") db.Add(new LabReportFile { LabReport = report, Content = scenario == "empty-file" ? [] : [1, 2, 3] });
        var consent = await db.Consents.SingleAsync(x => x.MemberId == f.Adult.Id && x.Category == ConsentCategory.Conditions);
        if (scenario == "revoked-consent") consent.Status = ConsentStatus.Revoked;
        if (scenario == "adult-guardian-consent") consent.GrantedByGuardian = true;
        if (scenario == "ended-assignment") (await db.FamilyDoctorAssignments.SingleAsync()).EndedAt = DateTimeOffset.UtcNow;
        if (scenario is "revoked-grant" or "expired-grant" or "future-grant")
        {
            var grant = await db.VisitAccessGrants.SingleAsync();
            if (scenario == "revoked-grant") grant.RevokedAt = DateTimeOffset.UtcNow;
            if (scenario == "expired-grant") grant.ExpiresAt = DateTimeOffset.UtcNow;
            if (scenario == "future-grant") grant.StartsAt = DateTimeOffset.UtcNow.AddDays(1);
        }
        await db.SaveChangesAsync();
        var service = new DoctorWorkspaceService(db, new ReportDoctorUser(f.DoctorUser.Id));
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetOriginalReportAsync(
            scenario == "wrong-member" ? f.HeadMember.Id : f.Adult.Id, report.Id, CancellationToken.None));
        (await db.AuditLogs.CountAsync(x => x.EventType == "DOCTOR_ORIGINAL_REPORT_READ")).Should().Be(0);
        if (scenario is "missing-file" or "unsupported-type" or "empty-file")
            (await service.GetMemberWorkspaceAsync(f.Adult.Id, CancellationToken.None)).LabReports!
                .Should().ContainSingle(r => r.Id == report.Id && !r.HasOriginalFile);
    }

    [Theory]
    [InlineData("success")]
    [InlineData("storage-failure")]
    [InlineData("consent-revoked-during-read")]
    [InlineData("grant-revoked-during-read")]
    [InlineData("assignment-ended-during-read")]
    public async Task OriginalReport_ExternalStore_RechecksAccessBeforeRelease(string scenario)
    {
        await using var db = NewDb(); var f = await SeedAsync(db);
        var triageCase = new TriageCase { MemberId = f.Adult.Id, EpisodeId = Guid.NewGuid() };
        db.Add(triageCase); db.Add(new CaseAccessGrant { TriageCase = triageCase, DoctorId = f.Doctor.Id,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(1), Reason = "Synthetic shared case" });
        var report = new LabReport { MemberId = f.Adult.Id, OriginalFileName = "SYNTHETIC.pdf", StoredFileName = "gdrive:synthetic.pdf", ContentType = "application/pdf" };
        db.Add(report); db.Add(new LabReportFile { LabReport = report, Content = [] }); await db.SaveChangesAsync();
        var store = new ReportStore(async () =>
        {
            if (scenario == "storage-failure") throw new ReportStorageException("Synthetic outage");
            if (scenario == "consent-revoked-during-read")
                (await db.Consents.SingleAsync(c => c.MemberId == f.Adult.Id && c.Category == ConsentCategory.Conditions)).Status = ConsentStatus.Revoked;
            if (scenario == "grant-revoked-during-read") (await db.CaseAccessGrants.SingleAsync()).RevokedAt = DateTimeOffset.UtcNow;
            if (scenario == "assignment-ended-during-read") (await db.FamilyDoctorAssignments.SingleAsync()).EndedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(); return new byte[] { 1, 2, 3 };
        });
        var service = new DoctorWorkspaceService(db, new ReportDoctorUser(f.DoctorUser.Id), store);
        if (scenario == "success") (await service.GetOriginalReportAsync(f.Adult.Id, report.Id, CancellationToken.None)).Content.Should().Equal(1, 2, 3);
        else if (scenario == "storage-failure") await Assert.ThrowsAsync<ProcessingException>(() => service.GetOriginalReportAsync(f.Adult.Id, report.Id, CancellationToken.None));
        else await Assert.ThrowsAsync<NotFoundException>(() => service.GetOriginalReportAsync(f.Adult.Id, report.Id, CancellationToken.None));
        store.ReadCount.Should().Be(1);
        (await db.AuditLogs.CountAsync(a => a.EventType == "DOCTOR_ORIGINAL_REPORT_READ")).Should().Be(scenario == "success" ? 1 : 0);
    }

    [Theory]
    [InlineData("unverified")]
    [InlineData("unassigned")]
    [InlineData("family-user")]
    public async Task OriginalReport_UnauthorizedActor_CannotReachStorage(string scenario)
    {
        await using var db = NewDb(); var f = await SeedAsync(db);
        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        if (scenario == "unverified") { f.Doctor.VerificationStatus = VerificationStatus.Pending; await db.SaveChangesAsync(); }
        var store = new ReportStore(() => Task.FromResult(new byte[] { 1 }));
        ICurrentUser actor = scenario == "family-user" ? new StubCurrentUser(f.DoctorUser.Id) :
            new ReportDoctorUser(scenario == "unassigned" ? f.OtherDoctorUser.Id : f.DoctorUser.Id);
        var service = new DoctorWorkspaceService(db, actor, store);
        if (scenario == "unassigned") await Assert.ThrowsAsync<NotFoundException>(() => service.GetOriginalReportAsync(f.Adult.Id, Guid.NewGuid(), CancellationToken.None));
        else await Assert.ThrowsAsync<ForbiddenException>(() => service.GetOriginalReportAsync(f.Adult.Id, Guid.NewGuid(), CancellationToken.None));
        store.ReadCount.Should().Be(0);
    }

    private sealed class ReportStore(Func<Task<byte[]>> load) : IExternalReportFileStore
    {
        public bool IsEnabled => true;
        public int ReadCount { get; private set; }
        public bool Owns(string key) => key.StartsWith("gdrive:", StringComparison.Ordinal);
        public Task<string> SaveAsync(string extension, string type, byte[] bytes, CancellationToken token) => throw new NotSupportedException();
        public Task<byte[]> ReadAsync(string key, CancellationToken token) { ReadCount++; return load(); }
        public Task DeleteAsync(string key, CancellationToken token) => throw new NotSupportedException();
    }

    [Fact]
    public async Task ReportNavigation_ShowsOnlyMemberSpecificClinicalAccess()
    {
        await using var db = NewDb(); var f = await SeedAsync(db);
        await ConfirmedVisitAsync(db, f, DateTimeOffset.UtcNow.AddHours(2));
        var service = new DoctorWorkspaceService(db, new ReportDoctorUser(f.DoctorUser.Id));
        var roster = await service.GetFamilyRosterAsync(f.Family.Id, CancellationToken.None);
        roster.Members.Should().Contain(m => m.Id == f.Adult.Id && m.ClinicalAccess);
        roster.Members.Should().Contain(m => m.Id == f.HeadMember.Id && !m.ClinicalAccess);
        (await service.GetProfileAsync(CancellationToken.None)).DisplayName.Should().Be("Dr Synthetic");
        await Assert.ThrowsAsync<NotFoundException>(() => new DoctorWorkspaceService(db,
            new ReportDoctorUser(f.OtherDoctorUser.Id)).GetFamilyRosterAsync(f.Family.Id, CancellationToken.None));
    }

    private sealed class ReportDoctorUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.Doctor;
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => UserType.FamilyUser;
    }
}
