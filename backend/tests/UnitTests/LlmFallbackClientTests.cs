using System.Net;
using System.Text.Json;
using FamilyVeda.Application.Agents;
using FamilyVeda.Infrastructure.Agents;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using static FamilyVeda.UnitTests.CloudflareClientTests;
namespace FamilyVeda.UnitTests;
public sealed class LlmFallbackClientTests
{
    [Fact]
    public async Task GeminiSuccess_DoesNotCallFallbacks()
    {
        var gemini = new ProviderHandler(_ => JsonSerializer.Serialize(new { candidates = new[] { new { content = new { parts = new[] { new { text = ContextJson } } } } } }));
        var groq = new ProviderHandler(_ => GroqEnvelope());
        var cloudflare = new ProviderHandler(_ => Envelope(ContextJson));
        var result = await CreateChain(gemini, groq, cloudflare).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        result.Value.MemberProfile.Should().Be("Synthetic member");
        gemini.Calls.Should().Be(1); groq.Calls.Should().Be(0); cloudflare.Calls.Should().Be(0);
    }
    [Fact]
    public async Task GeminiPoolOnlyConfiguration_IsUsedBeforeFallbacks()
    {
        var gemini = new ProviderHandler(_ => JsonSerializer.Serialize(new { candidates = new[] { new { content = new { parts = new[] { new { text = ContextJson } } } } } }));
        var groq = new ProviderHandler(_ => GroqEnvelope());
        var cf = new ProviderHandler(_ => Envelope(ContextJson));
        var result = await CreateChain(gemini, groq, cf, geminiConfigured: false, geminiPool: ["synthetic-pool-key"]).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        result.ModelName.Should().Be("gemini-3.5-flash");
        gemini.Calls.Should().Be(1); groq.Calls.Should().Be(0); cf.Calls.Should().Be(0);
    }

    [Fact]
    public async Task GeminiFailure_GroqSuccess_DoesNotCallCloudflare()
    {
        var gemini = new ProviderHandler(_ => "{}", HttpStatusCode.TooManyRequests);
        var groq = new ProviderHandler(_ => GroqEnvelope());
        var cloudflare = new ProviderHandler(_ => Envelope(ContextJson));
        var result = await CreateChain(gemini, groq, cloudflare).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        result.ModelName.Should().Be("synthetic-groq");
        gemini.Calls.Should().Be(2); groq.Calls.Should().Be(1); cloudflare.Calls.Should().Be(0);
    }
    [Fact]
    public async Task BothEarlierProvidersFail_CloudflareServesValidatedOutput()
    {
        var gemini = new ProviderHandler(_ => "{}", HttpStatusCode.TooManyRequests);
        var groq = new ProviderHandler(_ => "{}", HttpStatusCode.ServiceUnavailable);
        var cloudflare = new ProviderHandler(_ => Envelope(ContextJson));
        var result = await CreateChain(gemini, groq, cloudflare).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        result.Value.MemberProfile.Should().Be("Synthetic member");
        gemini.Calls.Should().Be(2); groq.Calls.Should().Be(2); cloudflare.Calls.Should().Be(1);
    }
    [Theory]
    [InlineData("", "synthetic-key")]
    [InlineData("synthetic-account", "")]
    public async Task CloudflareMissingConfiguration_IsSkipped(string account, string key)
    {
        var gemini = new ProviderHandler(_ => "{}"); var groq = new ProviderHandler(_ => "{}"); var cf = new ProviderHandler(_ => Envelope(ContextJson));
        var action = () => CreateChain(gemini, groq, cf, false, account, key).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>();
        gemini.Calls.Should().Be(0); groq.Calls.Should().Be(0); cf.Calls.Should().Be(0);
    }
    [Fact]
    public async Task AllProvidersFail_ReturnsSafeFailure()
    {
        var gemini = new ProviderHandler(_ => "{}", HttpStatusCode.TooManyRequests);
        var groq = new ProviderHandler(_ => "{}", HttpStatusCode.TooManyRequests);
        var cf = new ProviderHandler(_ => "{}", HttpStatusCode.TooManyRequests);
        var action = () => CreateChain(gemini, groq, cf).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>().WithMessage("All configured LLM providers failed or are unconfigured.");
        gemini.Calls.Should().Be(2); groq.Calls.Should().Be(2); cf.Calls.Should().Be(2);
    }
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task CallerCancellationDuringProvider_DoesNotRetryOrFallBack(bool firstProvider)
    {
        using var cancellation = new CancellationTokenSource();
        var cancelled = new ProviderHandler(_ => { cancellation.Cancel(); throw new OperationCanceledException(cancellation.Token); });
        var unused = new ProviderHandler(_ => "{}");
        var cf = new ProviderHandler(_ => Envelope(ContextJson));
        var chain = CreateChain(firstProvider ? cancelled : unused, firstProvider ? unused : cancelled, cf, geminiConfigured: firstProvider);
        var action = () => chain.GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, cancellation.Token);
        await action.Should().ThrowAsync<OperationCanceledException>();
        cancelled.Calls.Should().Be(1); unused.Calls.Should().Be(0); cf.Calls.Should().Be(0);
    }
    [Fact]
    public async Task ProviderTimeout_CanFallBack()
    {
        var gemini = new ProviderHandler(_ => throw new TaskCanceledException("Synthetic timeout"));
        var groq = new ProviderHandler(_ => GroqEnvelope());
        var cf = new ProviderHandler(_ => Envelope(ContextJson));
        var result = await CreateChain(gemini, groq, cf).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        result.ModelName.Should().Be("synthetic-groq"); cf.Calls.Should().Be(0);
    }
    private static string GroqEnvelope() => JsonSerializer.Serialize(new { model = "synthetic-groq", choices = new[] { new { message = new { content = ContextJson } } } });
    private static LlmFallbackClient CreateChain(ProviderHandler gemini, ProviderHandler groq, ProviderHandler cf, bool configured = true, string account = "synthetic-account", string key = "synthetic-key", bool? geminiConfigured = null, string[]? geminiPool = null)
    {
        var go = Options.Create(new GeminiOptions { ApiKey = (geminiConfigured ?? configured) ? "synthetic-key" : "", ApiKeys = geminiPool ?? [] });
        var qo = Options.Create(new LlmOptions { ApiKey = configured ? "synthetic-key" : "" });
        var co = Options.Create(new CloudflareOptions { AccountId = account, ApiKey = key });
        return new(new(new HttpClient(gemini) { BaseAddress = new Uri("https://synthetic.invalid/") }, go), new(new HttpClient(groq) { BaseAddress = new Uri("https://synthetic.invalid/") }, qo), new(new HttpClient(cf), co), go, qo, co, NullLogger<LlmFallbackClient>.Instance);
    }
}
