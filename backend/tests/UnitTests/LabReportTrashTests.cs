// Owner: S2 · Health Records & Extraction — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// "Recently deleted" for uploaded reports: soft delete hides, restore returns, permanent delete removes.
using FamilyVeda.Application.Common;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Records;
using FamilyVeda.Domain.Triage;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Records;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FamilyVeda.UnitTests;

public sealed class LabReportTrashTests
{
    private sealed record World(AppDbContext Db, UserAccount Owner, UserAccount Head, Member OwnerMember, LabReport Report, LabValue Value, HereditaryFlag Flag);

    private static async Task<World> ArrangeAsync(bool valueConfirmed = false, bool flagConfirmed = false)
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var head = new UserAccount { Email = "trash-head@example.invalid", PasswordHash = "x", DisplayName = "Synthetic Head", UserType = UserType.FamilyUser };
        var owner = new UserAccount { Email = "trash-owner@example.invalid", PasswordHash = "x", DisplayName = "Synthetic Adult", UserType = UserType.FamilyUser };
        var family = new Family { Name = "Synthetic Trash Family", CreatedByUser = head };
        var headMember = new Member { Family = family, User = head, DisplayName = "Synthetic Head", DateOfBirth = new DateOnly(1980, 1, 1), Role = FamilyRole.Head };
        var ownerMember = new Member { Family = family, User = owner, DisplayName = "Synthetic Adult", DateOfBirth = new DateOnly(1990, 1, 1), Role = FamilyRole.AdultMember };
        var report = new LabReport
        {
            Member = ownerMember, OriginalFileName = "synthetic-report.pdf", StoredFileName = "synthetic-report.pdf", ContentType = "application/pdf",
            SizeBytes = 3, OcrStatus = OcrStatus.Completed, SharedWithFamilyHead = true, CreatedAt = DateTimeOffset.UtcNow.AddDays(-2)
        };
        report.File = new LabReportFile { LabReport = report, Content = [1, 2, 3] };
        var value = new LabValue { LabReport = report, Analyte = "Synthetic Analyte", Value = 1m, Unit = "unit", WasManuallyConfirmed = valueConfirmed };
        var flag = new HereditaryFlag { Member = ownerMember, LabReport = report, ConditionCode = "SYNTHETIC_FLAG", Finding = "Synthetic screening signal", Confidence = 0.8m, ManuallyConfirmed = flagConfirmed };
        db.AddRange(head, owner, family, headMember, ownerMember, report, value, flag);
        await db.SaveChangesAsync();
        return new World(db, owner, head, ownerMember, report, value, flag);
    }

    private static RecordService ServiceFor(World world, UserAccount user, UserType type = UserType.FamilyUser) =>
        new(world.Db, new StubCurrentUser(user.Id, type), Options.Create(new StorageOptions { LabReportPath = Path.GetTempPath() }));

    [Fact]
    public async Task Delete_HidesReportValuesFileAndFlagsFromEveryReader_AndListsItInTrash()
    {
        var world = await ArrangeAsync(flagConfirmed: true);
        var service = ServiceFor(world, world.Owner);

        await service.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        (await service.GetLabReportsAsync(world.OwnerMember.Id, CancellationToken.None)).Should().BeEmpty();
        (await ServiceFor(world, world.Head).GetLabReportsAsync(world.OwnerMember.Id, CancellationToken.None)).Should().BeEmpty();
        // The same unfiltered DbSets feed the doctor workspace and the agent tool dispatcher.
        (await world.Db.LabReports.AnyAsync()).Should().BeFalse();
        (await world.Db.LabValues.AnyAsync()).Should().BeFalse();
        (await world.Db.LabReportFiles.AnyAsync()).Should().BeFalse();
        (await world.Db.HereditaryFlags.AnyAsync()).Should().BeFalse();
        var open = () => service.GetLabReportDetailAsync(world.Report.Id, CancellationToken.None);
        await open.Should().ThrowAsync<NotFoundException>();
        var deleteAgain = () => service.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);
        await deleteAgain.Should().ThrowAsync<NotFoundException>();

        var trash = await service.GetDeletedLabReportsAsync(world.OwnerMember.Id, CancellationToken.None);
        trash.Should().ContainSingle(x => x.Id == world.Report.Id && x.CanDeletePermanently);
        (await world.Db.AuditLogs.CountAsync(x => x.EventType == "LAB_REPORT_DELETED" && x.ResourceId == world.Report.Id)).Should().Be(1);
    }

    [Fact]
    public async Task Restore_ReturnsReportUnchanged_WithValuesFlagsAndSharing()
    {
        var world = await ArrangeAsync(valueConfirmed: true, flagConfirmed: true);
        var service = ServiceFor(world, world.Owner);
        await service.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        var restored = await service.RestoreLabReportAsync(world.Report.Id, CancellationToken.None);

        restored.HasOriginalFile.Should().BeTrue();
        restored.SharedWithFamilyHead.Should().BeTrue();
        (await service.GetLabReportDetailAsync(world.Report.Id, CancellationToken.None)).Values.Should().ContainSingle(x => x.WasManuallyConfirmed);
        (await world.Db.HereditaryFlags.CountAsync()).Should().Be(1);
        (await service.GetDeletedLabReportsAsync(world.OwnerMember.Id, CancellationToken.None)).Should().BeEmpty();
        var restoreAgain = () => service.RestoreLabReportAsync(world.Report.Id, CancellationToken.None);
        await restoreAgain.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task PermanentDelete_RequiresTrashFirst_ThenRemovesRowsAndKeepsConfirmedFlagAndAudit()
    {
        var world = await ArrangeAsync(flagConfirmed: true);
        var service = ServiceFor(world, world.Owner);
        var skipTrash = () => service.PermanentlyDeleteLabReportAsync(world.Report.Id, CancellationToken.None);
        await skipTrash.Should().ThrowAsync<NotFoundException>();
        await service.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        await service.PermanentlyDeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        (await world.Db.LabReports.IgnoreQueryFilters().AnyAsync()).Should().BeFalse();
        (await world.Db.LabValues.IgnoreQueryFilters().AnyAsync()).Should().BeFalse();
        (await world.Db.LabReportFiles.IgnoreQueryFilters().AnyAsync()).Should().BeFalse();
        var flag = await world.Db.HereditaryFlags.SingleAsync();
        flag.LabReportId.Should().BeNull();
        flag.ManuallyConfirmed.Should().BeTrue();
        (await world.Db.AuditLogs.CountAsync(x => x.EventType == "LAB_REPORT_PERMANENTLY_DELETED" && x.ResourceId == world.Report.Id)).Should().Be(1);
    }

    [Fact]
    public async Task PermanentDelete_RemovesUnconfirmedFlag()
    {
        var world = await ArrangeAsync();
        var service = ServiceFor(world, world.Owner);
        await service.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        await service.PermanentlyDeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        (await world.Db.HereditaryFlags.IgnoreQueryFilters().AnyAsync()).Should().BeFalse();
    }

    [Fact]
    public async Task PermanentDelete_IsRefused_WhenConfirmedValuesMayHaveInformedACase()
    {
        var world = await ArrangeAsync(valueConfirmed: true);
        world.Db.TriageCases.Add(new TriageCase { MemberId = world.OwnerMember.Id, EpisodeId = Guid.NewGuid() });
        await world.Db.SaveChangesAsync();
        var service = ServiceFor(world, world.Owner);
        await service.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        var act = () => service.PermanentlyDeleteLabReportAsync(world.Report.Id, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        (await service.GetDeletedLabReportsAsync(world.OwnerMember.Id, CancellationToken.None)).Should().ContainSingle(x => !x.CanDeletePermanently);
        (await world.Db.LabValues.IgnoreQueryFilters().CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task HeadAndDoctor_CannotDeleteRestoreListOrPurge_AnAdultsReport_EvenWhenShared()
    {
        var world = await ArrangeAsync();
        var owner = ServiceFor(world, world.Owner);
        foreach (var intruder in new[] { ServiceFor(world, world.Head), ServiceFor(world, world.Head, UserType.Doctor) })
        {
            var delete = () => intruder.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);
            await delete.Should().ThrowAsync<Exception>().Where(x => x is NotFoundException || x is ForbiddenException);
        }
        (await world.Db.LabReports.CountAsync()).Should().Be(1);

        await owner.DeleteLabReportAsync(world.Report.Id, CancellationToken.None);
        foreach (var intruder in new[] { ServiceFor(world, world.Head), ServiceFor(world, world.Head, UserType.Doctor) })
        {
            var list = () => intruder.GetDeletedLabReportsAsync(world.OwnerMember.Id, CancellationToken.None);
            var restore = () => intruder.RestoreLabReportAsync(world.Report.Id, CancellationToken.None);
            var purge = () => intruder.PermanentlyDeleteLabReportAsync(world.Report.Id, CancellationToken.None);
            await list.Should().ThrowAsync<Exception>().Where(x => x is NotFoundException || x is ForbiddenException);
            await restore.Should().ThrowAsync<Exception>().Where(x => x is NotFoundException || x is ForbiddenException);
            await purge.Should().ThrowAsync<Exception>().Where(x => x is NotFoundException || x is ForbiddenException);
        }
        (await world.Db.LabReports.IgnoreQueryFilters().SingleAsync()).DeletedAt.Should().NotBeNull();
    }

    private sealed class StubCurrentUser(Guid userId, UserType userType) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid UserId => userId;
        public UserType UserType => userType;
    }
}
