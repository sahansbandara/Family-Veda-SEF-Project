// [S2] Health Records & Extraction — external report storage (ADR-014). Synthetic data only.
using System.Net;
using System.Text;
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Records;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Records;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FamilyVeda.UnitTests;

public sealed class GoogleDriveReportStorageTests
{
    private const string FileId = "synthetic-drive-file-0001";
    private const string FolderId = "synthetic-drive-folder-01";

    [Fact]
    public async Task Save_RefreshesToken_CreatesFolderOnce_AndReturnsKeyWithoutLeakingTheOriginalName()
    {
        var handler = new StubDrive();
        var store = CreateStore(handler);

        var first = await store.SaveAsync(".png", "image/png", [1, 2, 3], CancellationToken.None);
        var second = await store.SaveAsync(".png", "image/png", [4, 5, 6], CancellationToken.None);

        first.Should().Be($"gdrive:{FileId}.png");
        second.Should().Be(first);
        handler.Count("token").Should().Be(1);
        handler.Count("folder-lookup").Should().Be(1);
        handler.Count("folder-create").Should().Be(1);
        handler.Count("upload").Should().Be(2);
        handler.Requests.Where(x => x.Kind != "token").Should().OnlyContain(x => x.Authorization == "Bearer synthetic-access-1");
        handler.Requests.First(x => x.Kind == "upload").Body.Should().Contain(FolderId).And.NotContain("synthetic-lab");
    }

    [Fact]
    public async Task Read_ReturnsBytes_AndRetriesOnceWithAFreshTokenAfter401()
    {
        var handler = new StubDrive { RejectFirstDownload = true };
        var store = CreateStore(handler);

        var bytes = await store.ReadAsync($"gdrive:{FileId}.png", CancellationToken.None);

        bytes.Should().Equal(9, 8, 7);
        handler.Count("token").Should().Be(2);
        handler.Requests.Last(x => x.Kind == "download").Authorization.Should().Be("Bearer synthetic-access-2");
    }

    [Theory]
    [InlineData("db:abc.png")]
    [InlineData("gdrive:../secrets")]
    [InlineData("gdrive:short")]
    [InlineData("gdrive:synthetic-drive-file-0001?alt=media&x=1")]
    public async Task Read_RejectsKeysItDidNotIssue_WithoutCallingGoogle(string key)
    {
        var handler = new StubDrive();

        var read = () => CreateStore(handler).ReadAsync(key, CancellationToken.None);

        await read.Should().ThrowAsync<ReportStorageException>();
        handler.Requests.Should().BeEmpty();
    }

    [Fact]
    public async Task Failure_SurfacesStatusOnly_NeverTheProviderBodyOrCredentials()
    {
        var handler = new StubDrive { FailToken = true };

        var save = () => CreateStore(handler).SaveAsync(".png", "image/png", [1], CancellationToken.None);

        var error = (await save.Should().ThrowAsync<ReportStorageException>()).Which;
        error.Message.Should().Contain("400").And.NotContain("synthetic-refresh").And.NotContain("invalid_grant");
    }

    [Fact]
    public void IsEnabled_OnlyWhenProviderSelectedAndFullyConfigured()
    {
        CreateStore(new StubDrive()).IsEnabled.Should().BeTrue();
        CreateStore(new StubDrive(), provider: "Database").IsEnabled.Should().BeFalse();
        CreateStore(new StubDrive(), refreshToken: "").IsEnabled.Should().BeFalse();
    }

    [Fact]
    public async Task Upload_WithDriveEnabled_KeepsBytesOutOfPostgres_AndPreviewReadsThemBack()
    {
        var external = new FakeExternalStore();
        var (db, service, member) = await CreateServiceAsync(external);
        var png = SyntheticPng();

        var report = await service.UploadLabReportAsync(member.Id, "synthetic-lab.png", "image/png", png.Length, new MemoryStream(png), null, CancellationToken.None);
        var file = await service.GetLabReportFileAsync(report.Id, CancellationToken.None);

        report.HasOriginalFile.Should().BeTrue();
        (await db.LabReports.SingleAsync()).StoredFileName.Should().Be("gdrive:synthetic-key-000001.png");
        (await db.LabReportFiles.SingleAsync()).Content.Should().BeEmpty();
        file.Content.Should().Equal(png);
        (await service.GetLabReportsAsync(member.Id, CancellationToken.None)).Single().HasOriginalFile.Should().BeTrue();
    }

    [Fact]
    public async Task Upload_WhenDriveFails_FallsBackToPostgres_SoTheUploadIsNeverLost()
    {
        var external = new FakeExternalStore { FailSave = true };
        var (db, service, member) = await CreateServiceAsync(external);
        var png = SyntheticPng();

        var report = await service.UploadLabReportAsync(member.Id, "synthetic-lab.png", "image/png", png.Length, new MemoryStream(png), null, CancellationToken.None);

        (await db.LabReports.SingleAsync()).StoredFileName.Should().StartWith("db:");
        (await db.LabReportFiles.SingleAsync()).Content.Should().Equal(png);
        (await service.GetLabReportFileAsync(report.Id, CancellationToken.None)).Content.Should().Equal(png);
    }

    [Fact]
    public async Task Preview_WhenDriveReadFails_ReportsTemporaryUnavailability_NotMissingFile()
    {
        var external = new FakeExternalStore();
        var (_, service, member) = await CreateServiceAsync(external);
        var png = SyntheticPng();
        var report = await service.UploadLabReportAsync(member.Id, "synthetic-lab.png", "image/png", png.Length, new MemoryStream(png), null, CancellationToken.None);
        external.FailRead = true;

        var read = () => service.GetLabReportFileAsync(report.Id, CancellationToken.None);

        await read.Should().ThrowAsync<ProcessingException>();
    }

    [Fact]
    public async Task Preview_ForAnotherFamily_IsDeniedBeforeExternalStorageIsTouched()
    {
        var external = new FakeExternalStore();
        var (db, service, member) = await CreateServiceAsync(external);
        var png = SyntheticPng();
        var report = await service.UploadLabReportAsync(member.Id, "synthetic-lab.png", "image/png", png.Length, new MemoryStream(png), null, CancellationToken.None);
        var outsider = new UserAccount { Email = "synthetic-outsider@example.invalid", PasswordHash = "synthetic", DisplayName = "Synthetic Outsider", UserType = UserType.FamilyUser };
        var otherFamily = new Family { Name = "Synthetic Other Family", CreatedByUser = outsider };
        db.AddRange(outsider, otherFamily, new Member { Family = otherFamily, User = outsider, DisplayName = "Synthetic Outsider", DateOfBirth = new DateOnly(1988, 1, 1), Role = FamilyRole.Head });
        await db.SaveChangesAsync();
        var outsiderService = new RecordService(db, new StubCurrentUser(outsider.Id), Options.Create(new StorageOptions()), external);
        external.Reads = 0;

        var read = () => outsiderService.GetLabReportFileAsync(report.Id, CancellationToken.None);

        await read.Should().ThrowAsync<NotFoundException>();
        external.Reads.Should().Be(0);
    }

    private static GoogleDriveReportFileStore CreateStore(StubDrive handler, string provider = "GoogleDrive", string refreshToken = "synthetic-refresh") =>
        new(new HttpClient(handler),
            Options.Create(new GoogleDriveOptions { ClientId = "synthetic-client", ClientSecret = "synthetic-secret", RefreshToken = refreshToken }),
            Options.Create(new StorageOptions { Provider = provider }),
            new GoogleDriveSession());

    private static async Task<(AppDbContext Db, RecordService Service, Member Member)> CreateServiceAsync(IExternalReportFileStore external)
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new UserAccount { Email = "synthetic-drive@example.invalid", PasswordHash = "synthetic", DisplayName = "Synthetic User", UserType = UserType.FamilyUser };
        var family = new Family { Name = "Synthetic Drive Family", CreatedByUser = user };
        var member = new Member { Family = family, User = user, DisplayName = "Synthetic Member", DateOfBirth = new DateOnly(1990, 1, 1), Role = FamilyRole.Head };
        db.AddRange(user, family, member);
        await db.SaveChangesAsync();
        return (db, new RecordService(db, new StubCurrentUser(user.Id), Options.Create(new StorageOptions()), external), member);
    }

    private static byte[] SyntheticPng()
    {
        var bytes = new byte[64];
        new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }.CopyTo(bytes, 0);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32BigEndian(bytes.AsSpan(16, 4), 64);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32BigEndian(bytes.AsSpan(20, 4), 32);
        return bytes;
    }

    private sealed class FakeExternalStore : IExternalReportFileStore
    {
        private readonly Dictionary<string, byte[]> files = [];
        public bool FailSave { get; set; }
        public bool FailRead { get; set; }
        public int Reads { get; set; }
        public bool IsEnabled => true;
        public bool Owns(string storageKey) => storageKey.StartsWith("gdrive:", StringComparison.Ordinal);
        public Task DeleteAsync(string storageKey, CancellationToken cancellationToken) { files.Remove(storageKey); return Task.CompletedTask; }

        public Task<string> SaveAsync(string extension, string contentType, byte[] content, CancellationToken cancellationToken)
        {
            if (FailSave) throw new ReportStorageException("synthetic outage");
            var key = $"gdrive:synthetic-key-{files.Count + 1:000000}{extension}";
            files[key] = content;
            return Task.FromResult(key);
        }

        public Task<byte[]> ReadAsync(string storageKey, CancellationToken cancellationToken)
        {
            Reads++;
            if (FailRead) throw new ReportStorageException("synthetic outage");
            return Task.FromResult(files[storageKey]);
        }
    }

    private sealed record Seen(string Kind, string? Authorization, string Body);

    private sealed class StubDrive : HttpMessageHandler
    {
        private int tokens;
        private bool downloadRejected;
        public bool RejectFirstDownload { get; init; }
        public bool FailToken { get; init; }
        public List<Seen> Requests { get; } = [];
        public int Count(string kind) => Requests.Count(x => x.Kind == kind);

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var url = request.RequestUri!.ToString();
            var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            var kind = url.Contains("oauth2.googleapis.com") ? "token"
                : url.Contains("/upload/") ? "upload"
                : url.Contains("alt=media") ? "download"
                : request.Method == HttpMethod.Get ? "folder-lookup" : "folder-create";
            Requests.Add(new Seen(kind, request.Headers.Authorization?.ToString(), body));
            switch (kind)
            {
                case "token" when FailToken:
                    return Json(HttpStatusCode.BadRequest, """{"error":"invalid_grant"}""");
                case "token":
                    return Json(HttpStatusCode.OK, $$"""{"access_token":"synthetic-access-{{++tokens}}","expires_in":3600}""");
                case "folder-lookup":
                    return Json(HttpStatusCode.OK, """{"files":[]}""");
                case "folder-create":
                    return Json(HttpStatusCode.OK, $$"""{"id":"{{FolderId}}"}""");
                case "upload":
                    return Json(HttpStatusCode.OK, $$"""{"id":"{{FileId}}"}""");
                default:
                    if (RejectFirstDownload && !downloadRejected)
                    {
                        downloadRejected = true;
                        return new HttpResponseMessage(HttpStatusCode.Unauthorized);
                    }
                    return new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent([9, 8, 7]) };
            }
        }

        private static HttpResponseMessage Json(HttpStatusCode status, string json) =>
            new(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") };
    }

    private sealed class StubCurrentUser(Guid userId) : ICurrentUser
    {
        public Guid UserId => userId;
        public bool IsAuthenticated => true;
        public UserType UserType => UserType.FamilyUser;
    }
}
