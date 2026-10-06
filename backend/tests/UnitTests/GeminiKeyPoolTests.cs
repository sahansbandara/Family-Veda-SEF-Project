using System.Net;
using System.Text.Json;
using FamilyVeda.Application.Agents;
using FamilyVeda.Infrastructure.Agents;
using FluentAssertions;
using Microsoft.Extensions.Options;

namespace FamilyVeda.UnitTests;

public sealed class GeminiKeyPoolTests
{
    [Fact]
    public async Task PoolOnlyConfiguration_UsesPoolKey()
    {
        var handler = new KeyHandler();
        var options = new GeminiOptions { ApiKeys = ["synthetic-a", "synthetic-b"] };
        options.HasConfiguredKey.Should().BeTrue();
        await Create(handler, options).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        handler.Keys.Should().ContainSingle().Which.Should().BeOneOf("synthetic-a", "synthetic-b");
    }

    [Fact]
    public async Task FailedFirstAttempt_RetryUsesDistinctKey_StopsAtTwoRequests()
    {
        var handler = new KeyHandler(HttpStatusCode.TooManyRequests);
        var action = () => Create(handler, new GeminiOptions { ApiKey = "synthetic-a", ApiKeys = ["synthetic-b", "synthetic-c"] }).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>();
        handler.Keys.Should().HaveCount(2).And.OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task DuplicateAndEmptyKeys_UseOnlyOneDistinctKey()
    {
        var handler = new KeyHandler(HttpStatusCode.TooManyRequests);
        var action = () => Create(handler, new GeminiOptions { ApiKey = "synthetic-a", ApiKeys = ["", " ", "synthetic-a"] }).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>();
        handler.Keys.Should().Equal("synthetic-a", "synthetic-a");
    }

    [Fact]
    public async Task Prompt_AsksModelToAvoidCommandVerbsBlockedBySafetyValidator()
    {
        var handler = new KeyHandler();
        await Create(handler, new GeminiOptions { ApiKeys = ["synthetic-a"] }).GenerateStructuredAsync<AnalysisFindingsOutput>("Synthetic", new { }, CancellationToken.None);
        using var body = JsonDocument.Parse(handler.Body!);
        var prompt = body.RootElement.GetProperty("systemInstruction").GetProperty("parts")[0].GetProperty("text").GetString()!;
        prompt.Should().Contain("Never use the words take, start, stop, continue, increase, decrease");
    }

    [Fact]
    public async Task CancelledRequest_DoesNotSendPoolKey()
    {
        var handler = new KeyHandler();
        using var cancellation = new CancellationTokenSource(); cancellation.Cancel();
        var action = () => Create(handler, new GeminiOptions { ApiKeys = ["synthetic-a"] }).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, cancellation.Token);
        await action.Should().ThrowAsync<OperationCanceledException>();
        handler.Keys.Should().BeEmpty();
    }

    [Fact]
    public async Task ConcurrentClients_RotateProcessWideWithoutLosingStarts()
    {
        var handler = new KeyHandler();
        var options = new GeminiOptions { ApiKeys = ["synthetic-a", "synthetic-b", "synthetic-c", "synthetic-d", "synthetic-e"] };
        await Task.WhenAll(Enumerable.Range(0, 20).Select(_ => Create(handler, options).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None)));
        handler.Keys.Should().HaveCount(20);
        handler.Keys.Should().OnlyContain(key => options.ApiKeys.Contains(key));
        handler.Keys.Distinct().Should().HaveCount(5);
    }

    [Fact]
    public async Task MissingConfiguration_DoesNotSendNetworkRequest()
    {
        var handler = new KeyHandler();
        var options = new GeminiOptions { ApiKeys = ["", " "] };
        options.HasConfiguredKey.Should().BeFalse();
        var action = () => Create(handler, options).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>(); handler.Keys.Should().BeEmpty();
    }

    private static GeminiClient Create(HttpMessageHandler handler, GeminiOptions options) => new(new HttpClient(handler) { BaseAddress = new Uri("https://synthetic.invalid/") }, Options.Create(options));
    private sealed class KeyHandler(HttpStatusCode status = HttpStatusCode.OK) : HttpMessageHandler
    {
        public System.Collections.Concurrent.ConcurrentBag<string> Keys { get; } = [];
        public string? Body { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Keys.Add(request.Headers.GetValues("x-goog-api-key").Single());
            Body = request.Content!.ReadAsStringAsync(cancellationToken).GetAwaiter().GetResult();
            var envelope = JsonSerializer.Serialize(new { candidates = new[] { new { content = new { parts = new[] { new { text = CloudflareClientTests.ContextJson } } } } } });
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(envelope) });
        }
    }
}
