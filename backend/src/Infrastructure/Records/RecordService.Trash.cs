// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Whole-project waiver (agent/DECISIONS.md 2026-09-28b). "Recently deleted" for uploaded reports:
// delete hides a report everywhere, restore brings it back unchanged, permanent delete removes it.
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Records;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Records;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FamilyVeda.Infrastructure.Records;

public sealed partial class RecordService
{
    public async Task DeleteLabReportAsync(Guid reportId, CancellationToken cancellationToken)
    {
        // The query filter already hides a report that is in the bin, so a second delete is a 404.
        var report = await dbContext.LabReports.SingleOrDefaultAsync(x => x.Id == reportId, cancellationToken) ?? throw new NotFoundException();
        await RequireMemberAccessAsync(report.MemberId, ConsentCategory.Conditions, cancellationToken);
        report.DeletedAt = DateTimeOffset.UtcNow;
        report.DeletedByUserId = currentUser.UserId;
        AddTrashAudit(report, "LAB_REPORT_DELETED");
        await SaveTrashChangeAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DeletedLabReportDto>> GetDeletedLabReportsAsync(Guid memberId, CancellationToken cancellationToken)
    {
        await RequireMemberAccessAsync(memberId, ConsentCategory.Conditions, cancellationToken);
        var reports = await dbContext.LabReports.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.MemberId == memberId && x.DeletedAt != null)
            .OrderByDescending(x => x.DeletedAt)
            .Select(x => new
            {
                x.Id, x.MemberId, x.OriginalFileName, x.ContentType, x.OcrStatus, x.CollectedAt, x.CreatedAt, DeletedAt = x.DeletedAt!.Value,
                HasConfirmedValues = x.Values.Any(v => v.WasManuallyConfirmed)
            })
            .ToListAsync(cancellationToken);
        if (reports.Count == 0) return [];
        var caseTimes = await dbContext.TriageCases.AsNoTracking().Where(x => x.MemberId == memberId)
            .Select(x => x.CreatedAt).ToListAsync(cancellationToken);
        return reports.Select(x => new DeletedLabReportDto(x.Id, x.MemberId, x.OriginalFileName, x.ContentType, x.OcrStatus, x.CollectedAt, x.DeletedAt,
            CanDeletePermanently: !(x.HasConfirmedValues && caseTimes.Any(created => created >= x.CreatedAt)))).ToList();
    }

    public async Task<LabReportDto> RestoreLabReportAsync(Guid reportId, CancellationToken cancellationToken)
    {
        var report = await FindDeletedAsync(reportId, cancellationToken);
        await RequireMemberAccessAsync(report.MemberId, ConsentCategory.Conditions, cancellationToken);
        report.DeletedAt = null;
        report.DeletedByUserId = null;
        AddTrashAudit(report, "LAB_REPORT_RESTORED");
        await SaveTrashChangeAsync(cancellationToken);
        return MapLabReport(report, report.File is not null);
    }

    public async Task PermanentlyDeleteLabReportAsync(Guid reportId, CancellationToken cancellationToken)
    {
        // Only a report already in the bin can be removed for good: two deliberate steps, never one.
        var report = await FindDeletedAsync(reportId, cancellationToken);
        await RequireMemberAccessAsync(report.MemberId, ConsentCategory.Conditions, cancellationToken);
        // Cases keep no link to the reports the agents read. Confirmed values that existed when a case
        // was opened may have informed it, so that evidence stays recoverable.
        if (report.Values.Any(x => x.WasManuallyConfirmed) &&
            await dbContext.TriageCases.AnyAsync(x => x.MemberId == report.MemberId && x.CreatedAt >= report.CreatedAt, cancellationToken))
        {
            throw new ConflictException("This report has confirmed values that may have been used in a symptom case, so it cannot be permanently deleted. It stays hidden in Recently deleted.");
        }

        var flags = await dbContext.HereditaryFlags.IgnoreQueryFilters().Where(x => x.LabReportId == reportId).ToListAsync(cancellationToken);
        foreach (var flag in flags)
        {
            // A flag the owner confirmed is their own statement and outlives the file it was found in.
            if (flag.ManuallyConfirmed) flag.LabReportId = null;
            else dbContext.HereditaryFlags.Remove(flag);
        }
        var storedFileName = report.StoredFileName;
        dbContext.LabValues.RemoveRange(report.Values);
        if (report.File is not null) dbContext.LabReportFiles.Remove(report.File);
        dbContext.LabReports.Remove(report);
        AddTrashAudit(report, "LAB_REPORT_PERMANENTLY_DELETED");
        await SaveTrashChangeAsync(cancellationToken);
        await RemoveStoredBytesAsync(storedFileName, cancellationToken);
    }

    private async Task<LabReport> FindDeletedAsync(Guid reportId, CancellationToken cancellationToken) =>
        await dbContext.LabReports.IgnoreQueryFilters().Include(x => x.Values).Include(x => x.File)
            .SingleOrDefaultAsync(x => x.Id == reportId && x.DeletedAt != null, cancellationToken) ?? throw new NotFoundException();

    private async Task SaveTrashChangeAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // OcrStatus is a concurrency token; a report still being read can change underneath us.
            throw new ConflictException("The report changed while this was in progress. Please try again.");
        }
    }

    /// <summary>The database rows are already gone; a copy left in external or legacy storage is logged, not surfaced.</summary>
    private async Task RemoveStoredBytesAsync(string storedFileName, CancellationToken cancellationToken)
    {
        try
        {
            if (externalStore is not null && externalStore.Owns(storedFileName))
            {
                await externalStore.DeleteAsync(storedFileName, cancellationToken);
                return;
            }
            var root = Path.GetFullPath(storageOptions.Value.LabReportPath);
            var legacyPath = Path.GetFullPath(Path.Combine(root, storedFileName));
            if (legacyPath.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal) && File.Exists(legacyPath)) File.Delete(legacyPath);
        }
        catch (Exception exception) when (exception is ReportStorageException or IOException or UnauthorizedAccessException)
        {
            logger?.LogWarning(exception, "Stored bytes for a permanently deleted report could not be removed.");
        }
    }

    private void AddTrashAudit(LabReport report, string eventType) => dbContext.AuditLogs.Add(new AuditLog
    {
        ActorUserId = currentUser.UserId,
        SubjectMemberId = report.MemberId,
        EventType = eventType,
        ResourceType = "LabReport",
        ResourceId = report.Id,
        Outcome = "SUCCESS",
        MetadataJson = "{}"
    });
}
