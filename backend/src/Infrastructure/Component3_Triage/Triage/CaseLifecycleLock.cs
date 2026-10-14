// Owner: S3 · Triage & Agent Orchestration
using System.Buffers.Binary;
using FamilyVeda.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace FamilyVeda.Infrastructure.Triage;

/// <summary>Serializes case lifecycle writes across API and worker processes. Network calls stay outside the transaction.</summary>
public sealed class CaseLifecycleLock(IDbContextTransaction? transaction) : IAsyncDisposable
{
    public static async Task<CaseLifecycleLock> AcquireAsync(AppDbContext db, Guid caseId, CancellationToken ct)
    {
        // In-memory tests have no relational transactions. Production is PostgreSQL.
        if (!db.Database.IsRelational()) return new(null);
        var transaction = await db.Database.BeginTransactionAsync(ct);
        try
        {
            if (db.Database.IsNpgsql())
            {
                var key = BinaryPrimitives.ReadInt64LittleEndian(caseId.ToByteArray());
                await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({key})", ct);
            }
            return new(transaction);
        }
        catch { await transaction.DisposeAsync(); throw; }
    }

    private bool disposed;
    public Task CompleteAsync(CancellationToken ct) => transaction?.CommitAsync(ct) ?? Task.CompletedTask;
    public ValueTask DisposeAsync()
    {
        if (disposed) return ValueTask.CompletedTask;
        disposed = true;
        return transaction?.DisposeAsync() ?? ValueTask.CompletedTask;
    }
}
