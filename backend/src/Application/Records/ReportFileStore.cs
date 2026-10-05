// [S2] Health Records & Extraction — external storage seam for original lab-report images (ADR-014).
namespace FamilyVeda.Application.Records;

/// <summary>
/// Stores original report images outside PostgreSQL. Only the backend calls it: clients and agents never
/// reach the provider directly, and every read happens after the consent and grant checks have passed.
/// </summary>
public interface IExternalReportFileStore
{
    /// <summary>True when the provider is selected and fully configured.</summary>
    bool IsEnabled { get; }

    /// <summary>True when <paramref name="storageKey"/> was issued by this store.</summary>
    bool Owns(string storageKey);

    /// <summary>Saves the bytes and returns the storage key to keep on the report.</summary>
    Task<string> SaveAsync(string extension, string contentType, byte[] content, CancellationToken cancellationToken);

    Task<byte[]> ReadAsync(string storageKey, CancellationToken cancellationToken);

    /// <summary>Removes the stored bytes for a permanently deleted report.</summary>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}

/// <summary>The external store could not complete a request. The message never contains provider responses or credentials.</summary>
public sealed class ReportStorageException(string message, Exception? innerException = null) : Exception(message, innerException);
