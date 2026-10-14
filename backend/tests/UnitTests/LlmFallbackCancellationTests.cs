using FamilyVeda.Application.Agents;
using FamilyVeda.Infrastructure.Agents;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace FamilyVeda.UnitTests;

public sealed class LlmFallbackCancellationTests
{
    [Fact]
    public async Task CancelledRequest_DoesNotCallAnotherProviderOrBecomeProviderFailure()
    {
        var handler = new CountingHandler();
        var geminiOptions = Options.Create(new GeminiOptions());
        var groqOptions = Options.Create(new LlmOptions { ApiKey = "synthetic-key" });
        var client = new LlmFallbackClient(
            new GeminiClient(new HttpClient(handler), geminiOptions),
            new ChatCompletionsLlmClient(new HttpClient(handler) { BaseAddress = new Uri("https://synthetic.invalid/") }, groqOptions),
            new CloudflareClient(new HttpClient(handler), Options.Create(new CloudflareOptions { AccountId = "synthetic-account", ApiKey = "synthetic-key" })),
            geminiOptions, groqOptions, Options.Create(new CloudflareOptions { AccountId = "synthetic-account", ApiKey = "synthetic-key" }), NullLogger<LlmFallbackClient>.Instance);
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var action = () => client.GenerateStructuredAsync<MemberContextOutput>("synthetic", new { }, cancellation.Token);

        await action.Should().ThrowAsync<OperationCanceledException>();
        handler.Calls.Should().Be(0);
    }

    private sealed class CountingHandler : HttpMessageHandler
    {
        public int Calls { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromCanceled<HttpResponseMessage>(cancellationToken);
        }
    }
}
