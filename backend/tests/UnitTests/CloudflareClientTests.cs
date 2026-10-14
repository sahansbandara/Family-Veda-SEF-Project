using System.Net;
using System.Text;
using System.Text.Json;
using FamilyVeda.Application.Agents;
using FamilyVeda.Infrastructure.Agents;
using FluentAssertions;
using Microsoft.Extensions.Options;

namespace FamilyVeda.UnitTests;

public sealed class CloudflareClientTests
{
    internal const string ContextJson = "{\"memberProfile\":\"Synthetic member\",\"recentVitals\":[],\"episodes\":[],\"conditions\":[],\"confidence\":0.8}";

    [Theory]
    [InlineData("")]
    [InlineData("json")]
    public async Task CompleteFencedOutput_ReturnsValidatedDtoAndUsage(string language)
    {
        var handler = new ProviderHandler(_ => Envelope($"```{language}\n{ContextJson}\n```"));
        var client = Create(handler);
        var result = await client.GenerateStructuredAsync<MemberContextOutput>("Synthetic prompt", new { source = "synthetic" }, CancellationToken.None);
        result.Value.MemberProfile.Should().Be("Synthetic member");
        result.InputTokens.Should().Be(3);
        result.OutputTokens.Should().Be(4);
        result.ModelName.Should().Be("@cf/meta/llama-3.1-8b-instruct-fp8");
        handler.Authorization.Should().Be("Bearer synthetic-key");
        handler.Url.Should().Be("https://api.cloudflare.com/client/v4/accounts/synthetic-account/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8");
        using var body = JsonDocument.Parse(handler.Body!);
        body.RootElement.GetProperty("messages")[0].GetProperty("content").GetString().Should().Contain("memberProfile");
        body.RootElement.GetProperty("messages")[1].GetProperty("content").GetString().Should().Contain("synthetic");
        body.RootElement.GetProperty("temperature").GetInt32().Should().Be(0);
    }

    [Theory]
    [InlineData("{\"memberProfile\":\"Synthetic\",\"recentVitals\":[],\"episodes\":[],\"conditions\":[],\"confidence\":1.1}")]
    [InlineData("{\"memberProfile\":\"\",\"recentVitals\":[],\"episodes\":[],\"conditions\":[],\"confidence\":0.8}")]
    [InlineData("{\"memberProfile\":\"Synthetic\",\"recentVitals\":[],\"episodes\":[],\"conditions\":[],\"confidence\":0.8,\"unexpected\":true}")]
    [InlineData("```json\n{}")]
    [InlineData("{}\n```")]
    [InlineData("preface\n```json\n{}\n```")]
    public async Task InvalidOutput_RetriesOnceAndFailsClosed(string output)
    {
        var handler = new ProviderHandler(_ => Envelope(output));
        var action = () => Create(handler).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>();
        handler.Calls.Should().Be(2);
    }

    [Fact]
    public async Task FirstInvalidOutput_RetryCanRecover()
    {
        var handler = new ProviderHandler(call => Envelope(call == 1 ? "{}" : ContextJson));
        var result = await Create(handler).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        result.Value.Confidence.Should().Be(0.8m);
        handler.Calls.Should().Be(2);
    }

    [Fact]
    public async Task AllExistingOutputTypes_AreValidated()
    {
        var analysis = new ProviderHandler(_ => Envelope("{\"deviations\":[],\"stablePatterns\":[],\"confidence\":0.8}"));
        var familial = new ProviderHandler(_ => Envelope("{\"consentedSignals\":[],\"unknownParties\":[],\"screeningIndication\":\"Review recorded history\",\"confidence\":0.8}"));
        (await Create(analysis).GenerateStructuredAsync<AnalysisFindingsOutput>("Synthetic", new { }, CancellationToken.None)).Value.Deviations.Should().BeEmpty();
        (await Create(familial).GenerateStructuredAsync<FamilialRiskSignalOutput>("Synthetic", new { }, CancellationToken.None)).Value.ScreeningIndication.Should().Be("Review recorded history");
    }

    [Theory]
    [InlineData("", "synthetic-key")]
    [InlineData("synthetic-account", "")]
    public async Task MissingConfiguration_DoesNotSendRequest(string account, string key)
    {
        var handler = new ProviderHandler(_ => Envelope(ContextJson));
        var action = () => Create(handler, account, key).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>();
        handler.Calls.Should().Be(0);
    }

    [Fact]
    public async Task CallerCancellation_DoesNotRetry()
    {
        using var cancellation = new CancellationTokenSource();
        var handler = new ProviderHandler(_ => { cancellation.Cancel(); throw new OperationCanceledException(cancellation.Token); });
        var action = () => Create(handler).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, cancellation.Token);
        await action.Should().ThrowAsync<OperationCanceledException>();
        handler.Calls.Should().Be(1);
    }

    [Theory]
    [InlineData("{\"success\":false,\"result\":{\"response\":\"{}\"},\"errors\":[]}")]
    [InlineData("{\"success\":true,\"result\":null}")]
    public async Task InvalidEnvelope_FailsClosed(string envelope)
    {
        var handler = new ProviderHandler(_ => envelope);
        var action = () => Create(handler).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>();
        handler.Calls.Should().Be(2);
    }

    internal static CloudflareClient Create(HttpMessageHandler handler, string account = "synthetic-account", string key = "synthetic-key") => new(new HttpClient(handler), Options.Create(new CloudflareOptions { AccountId = account, ApiKey = key }));
    internal static string Envelope(string output) => JsonSerializer.Serialize(new { success = true, result = new { response = output, usage = new { prompt_tokens = 3, completion_tokens = 4 } }, errors = Array.Empty<object>(), messages = Array.Empty<object>() });

    internal sealed class ProviderHandler(Func<int, string> response, HttpStatusCode status = HttpStatusCode.OK) : HttpMessageHandler
    {
        public int Calls { get; private set; }
        public string? Authorization { get; private set; }
        public string? Url { get; private set; }
        public string? Body { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            Authorization = request.Headers.Authorization?.ToString();
            Url = request.RequestUri?.AbsoluteUri;
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status) { Content = new StringContent(response(Calls), Encoding.UTF8, "application/json") };
        }
    }
}
