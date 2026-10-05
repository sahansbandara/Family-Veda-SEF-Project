using System.Text.Json;
using FamilyVeda.Application.Agents;
using FamilyVeda.Infrastructure.Agents;
using FluentAssertions;
using Microsoft.Extensions.Options;
using static FamilyVeda.UnitTests.CloudflareClientTests;
namespace FamilyVeda.UnitTests;

public sealed class AgentOutputPromptTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ContextPrompt_ExplicitlyConstrainsNestedToolDataToStringArrays(bool cloudflare)
    {
        var handler = new ProviderHandler(_ => cloudflare ? Envelope(ContextJson) : JsonSerializer.Serialize(new { choices = new[] { new { message = new { content = ContextJson } } } }));
        await Client(handler, cloudflare).GenerateStructuredAsync<MemberContextOutput>("Build a doctor-only factual context summary from this supplied snapshot.", new { MemberProfile = new { displayName = "Synthetic member", birthDate = "2000-01-01" }, RecentVitals = new[] { new { pulse = 72 } }, Episodes = Array.Empty<object>(), Conditions = Array.Empty<object>() }, CancellationToken.None);
        using var body = JsonDocument.Parse(handler.Body!);
        var prompt = body.RootElement.GetProperty("messages")[0].GetProperty("content").GetString()!;
        prompt.Should().Contain("\"memberProfile\":\"summary of supplied profile\"")
            .And.Contain("\"recentVitals\":[\"summary of supplied observation\"]")
            .And.Contain("\"additionalProperties\":false")
            .And.Contain("Do not copy nested input objects")
            .And.Contain("Do not invent missing facts");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task UnsupportedOutputType_FailsBeforeAnyNetworkRequest(bool cloudflare)
    {
        var handler = new ProviderHandler(_ => "{}");
        var action = () => Client(handler, cloudflare).GenerateStructuredAsync<object>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<JsonException>(); handler.Calls.Should().Be(0);
    }

    private static IOllamaClient Client(ProviderHandler handler, bool cloudflare) => cloudflare ? Create(handler) : new ChatCompletionsLlmClient(new HttpClient(handler) { BaseAddress = new Uri("https://synthetic.invalid/") }, Options.Create(new LlmOptions { ApiKey = "synthetic-key" }));
}
