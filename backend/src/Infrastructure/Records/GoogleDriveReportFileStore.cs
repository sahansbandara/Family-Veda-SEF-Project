// [S2] Health Records & Extraction — Google Drive store for original lab-report images (ADR-014).
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FamilyVeda.Application.Records;
using Microsoft.Extensions.Options;

namespace FamilyVeda.Infrastructure.Records;

public sealed class GoogleDriveOptions
{
    public const string SectionName = "GoogleDrive";
    public string ClientId { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    /// <summary>Optional. When empty the store finds or creates <see cref="FolderName"/> itself.</summary>
    public string FolderId { get; init; } = string.Empty;
    public string FolderName { get; init; } = "FamilyVeda-LabReports";
}

/// <summary>Process-wide cache for the short-lived access token and the resolved folder id.</summary>
public sealed class GoogleDriveSession
{
    internal SemaphoreSlim TokenGate { get; } = new(1, 1);
    internal SemaphoreSlim FolderGate { get; } = new(1, 1);
    internal string? AccessToken { get; set; }
    internal DateTimeOffset AccessTokenExpiresAt { get; set; }
    internal string? FolderId { get; set; }
}

/// <summary>
/// Uses the <c>drive.file</c> scope, so the backend can only see files it created. Files stay private:
/// no sharing link is ever created and bytes are only returned through the authorised API endpoint.
/// </summary>
public sealed partial class GoogleDriveReportFileStore(
    HttpClient httpClient,
    IOptions<GoogleDriveOptions> driveOptions,
    IOptions<StorageOptions> storageOptions,
    GoogleDriveSession session) : IExternalReportFileStore
{
    public const string KeyPrefix = "gdrive:";
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string FilesEndpoint = "https://www.googleapis.com/drive/v3/files";
    private const string UploadEndpoint = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id";
    private const string FolderMimeType = "application/vnd.google-apps.folder";

    private readonly GoogleDriveOptions options = driveOptions.Value;

    private bool HasCredentials =>
        !string.IsNullOrWhiteSpace(options.ClientId) && !string.IsNullOrWhiteSpace(options.ClientSecret) && !string.IsNullOrWhiteSpace(options.RefreshToken);

    public bool IsEnabled => HasCredentials && string.Equals(storageOptions.Value.Provider, StorageOptions.GoogleDriveProvider, StringComparison.OrdinalIgnoreCase);

    public bool Owns(string storageKey) => storageKey.StartsWith(KeyPrefix, StringComparison.Ordinal);

    public async Task<string> SaveAsync(string extension, string contentType, byte[] content, CancellationToken cancellationToken)
    {
        if (!IsEnabled) throw new ReportStorageException("Google Drive storage is not configured.");
        if (!SafeExtension().IsMatch(extension)) throw new ReportStorageException("Unsupported file extension.");
        var folderId = await ResolveFolderIdAsync(cancellationToken);
        // The Drive file name is random: the original name can carry personal detail and stays in PostgreSQL only.
        var metadata = JsonSerializer.Serialize(new { name = $"{Guid.NewGuid():N}{extension}", parents = new[] { folderId } });
        using var response = await SendAsync(() =>
        {
            var media = new ByteArrayContent(content);
            media.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            return new HttpRequestMessage(HttpMethod.Post, UploadEndpoint)
            {
                Content = new MultipartContent("related") { new StringContent(metadata, Encoding.UTF8, "application/json"), media }
            };
        }, "upload", cancellationToken);
        var fileId = await ReadStringPropertyAsync(response, "id", cancellationToken);
        if (fileId is null || !SafeFileId().IsMatch(fileId)) throw new ReportStorageException("Google Drive returned an unexpected upload response.");
        return $"{KeyPrefix}{fileId}{extension}";
    }

    public async Task<byte[]> ReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        if (!HasCredentials) throw new ReportStorageException("Google Drive storage is not configured.");
        var key = StorageKey().Match(storageKey);
        if (!key.Success) throw new ReportStorageException("Unrecognised storage key.");
        using var response = await SendAsync(
            () => new HttpRequestMessage(HttpMethod.Get, $"{FilesEndpoint}/{key.Groups["id"].Value}?alt=media"), "download", cancellationToken);
        var limit = storageOptions.Value.MaxUploadBytes;
        if (response.Content.Headers.ContentLength > limit) throw new ReportStorageException("Stored file is larger than the upload limit.");
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = await stream.ReadAsync(chunk, cancellationToken)) > 0)
        {
            if (buffer.Length + read > limit) throw new ReportStorageException("Stored file is larger than the upload limit.");
            buffer.Write(chunk, 0, read);
        }
        return buffer.ToArray();
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        if (!HasCredentials) throw new ReportStorageException("Google Drive storage is not configured.");
        var key = StorageKey().Match(storageKey);
        if (!key.Success) throw new ReportStorageException("Unrecognised storage key.");
        using var response = await SendAsync(
            () => new HttpRequestMessage(HttpMethod.Delete, $"{FilesEndpoint}/{key.Groups["id"].Value}"), "delete", cancellationToken);
    }

    private async Task<string> ResolveFolderIdAsync(CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(options.FolderId)) return options.FolderId;
        if (session.FolderId is not null) return session.FolderId;
        if (!SafeFolderName().IsMatch(options.FolderName)) throw new ReportStorageException("Google Drive folder name is not valid.");
        await session.FolderGate.WaitAsync(cancellationToken);
        try
        {
            if (session.FolderId is not null) return session.FolderId;
            var query = Uri.EscapeDataString($"name = '{options.FolderName}' and mimeType = '{FolderMimeType}' and trashed = false");
            using (var found = await SendAsync(
                () => new HttpRequestMessage(HttpMethod.Get, $"{FilesEndpoint}?q={query}&spaces=drive&fields=files(id)&pageSize=1"), "folder lookup", cancellationToken))
            {
                using var document = JsonDocument.Parse(await found.Content.ReadAsStringAsync(cancellationToken));
                if (document.RootElement.TryGetProperty("files", out var files) && files.ValueKind == JsonValueKind.Array && files.GetArrayLength() > 0 &&
                    files[0].TryGetProperty("id", out var existing) && existing.GetString() is { } existingId && SafeFileId().IsMatch(existingId))
                    return session.FolderId = existingId;
            }

            var body = JsonSerializer.Serialize(new { name = options.FolderName, mimeType = FolderMimeType });
            using var created = await SendAsync(() => new HttpRequestMessage(HttpMethod.Post, $"{FilesEndpoint}?fields=id")
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            }, "folder creation", cancellationToken);
            var folderId = await ReadStringPropertyAsync(created, "id", cancellationToken);
            if (folderId is null || !SafeFileId().IsMatch(folderId)) throw new ReportStorageException("Google Drive returned an unexpected folder response.");
            return session.FolderId = folderId;
        }
        finally
        {
            session.FolderGate.Release();
        }
    }

    /// <summary>Sends an authorised request, refreshing the access token once if Google rejects it.</summary>
    private async Task<HttpResponseMessage> SendAsync(Func<HttpRequestMessage> createRequest, string operation, CancellationToken cancellationToken)
    {
        try
        {
            for (var attempt = 0; ; attempt++)
            {
                var token = await GetAccessTokenAsync(forceRefresh: attempt > 0, cancellationToken);
                using var request = createRequest();
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (response.IsSuccessStatusCode) return response;
                var status = response.StatusCode;
                response.Dispose();
                if (status == HttpStatusCode.Unauthorized && attempt == 0) continue;
                throw new ReportStorageException($"Google Drive {operation} failed with status {(int)status}.");
            }
        }
        catch (HttpRequestException exception)
        {
            throw new ReportStorageException($"Google Drive {operation} could not be reached.", exception);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw new ReportStorageException($"Google Drive {operation} timed out.", exception);
        }
    }

    private async Task<string> GetAccessTokenAsync(bool forceRefresh, CancellationToken cancellationToken)
    {
        await session.TokenGate.WaitAsync(cancellationToken);
        try
        {
            if (!forceRefresh && session.AccessToken is not null && session.AccessTokenExpiresAt > DateTimeOffset.UtcNow.AddSeconds(60))
                return session.AccessToken;
            using var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = options.ClientId,
                ["client_secret"] = options.ClientSecret,
                ["refresh_token"] = options.RefreshToken,
                ["grant_type"] = "refresh_token"
            });
            using var response = await httpClient.PostAsync(TokenEndpoint, form, cancellationToken);
            // The token response body is never logged or surfaced: it can echo credential detail.
            if (!response.IsSuccessStatusCode) throw new ReportStorageException($"Google Drive authorisation failed with status {(int)response.StatusCode}.");
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            if (!document.RootElement.TryGetProperty("access_token", out var tokenElement) || tokenElement.GetString() is not { Length: > 0 } token)
                throw new ReportStorageException("Google Drive authorisation returned no access token.");
            var lifetime = document.RootElement.TryGetProperty("expires_in", out var expires) && expires.TryGetInt32(out var seconds) ? seconds : 300;
            session.AccessToken = token;
            session.AccessTokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(lifetime);
            return token;
        }
        catch (JsonException exception)
        {
            throw new ReportStorageException("Google Drive authorisation returned an unexpected response.", exception);
        }
        finally
        {
            session.TokenGate.Release();
        }
    }

    private static async Task<string?> ReadStringPropertyAsync(HttpResponseMessage response, string property, CancellationToken cancellationToken)
    {
        try
        {
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            return document.RootElement.TryGetProperty(property, out var value) ? value.GetString() : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    [GeneratedRegex(@"^gdrive:(?<id>[A-Za-z0-9_-]{10,128})(?:\.[a-z]{3,4})?$", RegexOptions.CultureInvariant)]
    private static partial Regex StorageKey();
    [GeneratedRegex(@"^[A-Za-z0-9_-]{10,128}$", RegexOptions.CultureInvariant)]
    private static partial Regex SafeFileId();
    [GeneratedRegex(@"^\.[a-z]{3,4}$", RegexOptions.CultureInvariant)]
    private static partial Regex SafeExtension();
    [GeneratedRegex(@"^[A-Za-z0-9 _-]{1,80}$", RegexOptions.CultureInvariant)]
    private static partial Regex SafeFolderName();
}
