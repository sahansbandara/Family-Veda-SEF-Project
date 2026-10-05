// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
using System.Text.Json;
using FamilyVeda.Application.Agents;
using FamilyVeda.Domain.Common;
using FamilyVeda.Infrastructure.Agents;

namespace FamilyVeda.UnitTests;

public sealed class FamilialRiskAgentTests
{
    private static readonly Guid Mother = Guid.NewGuid();
    private static readonly Guid Father = Guid.NewGuid();

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RunAsync_ReconcilesUnknownRelativesFromFilteredFacts(bool motherHasConsentedFlag)
    {
        var dispatcher = new FactsDispatcher(motherHasConsentedFlag);
        var result = await new FamilialRiskAgent(dispatcher, new DraftClient())
            .RunAsync(new(Guid.NewGuid(), Guid.NewGuid(), "{}"), CancellationToken.None);
        var output = JsonSerializer.Deserialize<FamilialRiskSignalOutput>(result.OutputJson)!;
        Assert.Equal(motherHasConsentedFlag ? 1 : 2, output.UnknownParties.Count);
        Assert.All(output.UnknownParties, value => Assert.Contains("Biological Parent", value));
        Assert.DoesNotContain(Mother.ToString(), result.OutputJson);
        Assert.DoesNotContain(Father.ToString(), result.OutputJson);
        Assert.DoesNotContain(output.UnknownParties, value => value.Contains("invented"));
        Assert.Equal("Discuss screening with a licensed clinician.", output.ScreeningIndication);
        Assert.Equal(.9m, output.Confidence);
        Assert.Equal(new ToolRegistry().GetAllowedTools(AgentKind.FamilialRisk).Order(), dispatcher.Requested.Order());
        Assert.False(new ToolRegistry().IsAllowed(AgentKind.FamilialRisk, "read_raw_record"));
    }

    [Fact]
    public async Task RunAsync_WhenNoBiologicalRelations_RemovesInventedUnknownIdentity()
    {
        var result = await new FamilialRiskAgent(new FactsDispatcher(true, true), new DraftClient())
            .RunAsync(new(Guid.NewGuid(), Guid.NewGuid(), "{}"), CancellationToken.None);
        Assert.Empty(JsonSerializer.Deserialize<FamilialRiskSignalOutput>(result.OutputJson)!.UnknownParties);
    }

    [Theory]
    [InlineData(-0.1)]
    [InlineData(1.1)]
    public async Task RunAsync_WhenConfidenceInvalid_FailsSafe(double confidence)
    {
        await Assert.ThrowsAsync<JsonException>(() => new FamilialRiskAgent(
            new FactsDispatcher(true), new DraftClient((decimal)confidence))
            .RunAsync(new(Guid.NewGuid(), Guid.NewGuid(), "{}"), CancellationToken.None));
    }

    [Fact]
    public async Task RunAsync_WhenFinalSchemaInvalid_FailsSafe()
    {
        await Assert.ThrowsAsync<JsonException>(() => new FamilialRiskAgent(
            new FactsDispatcher(true), new DraftClient(screeningIndication: " "))
            .RunAsync(new(Guid.NewGuid(), Guid.NewGuid(), "{}"), CancellationToken.None));
    }

    private sealed class FactsDispatcher(bool motherFlag, bool noRelations = false) : IToolDispatcher
    {
        public List<string> Requested { get; } = [];
        public Task<object> InvokeAsync(AgentKind agent, string tool, Guid memberId, Guid caseId,
            CancellationToken cancellationToken, object? arguments = null)
        {
            Requested.Add(tool);
            object value = tool switch
            {
                "read_relationship_graph" => noRelations ? Array.Empty<object>() : new object[]
                {
                    new { RelatedMemberId = Mother, RelationshipType = "Parent" },
                    new { RelatedMemberId = Father, RelationshipType = "Parent" },
                    new { RelatedMemberId = Father, RelationshipType = "Parent" }
                },
                "read_consented_hereditary_flags" => motherFlag ? new object[]
                {
                    new { MemberId = Mother, ConditionCode = "T2D_HISTORY", Finding = "Synthetic reported history", Confidence = .9m }
                } : Array.Empty<object>(),
                "lookup_inheritance_pattern" => Array.Empty<object>(),
                _ => throw new ToolDeniedException(agent, tool)
            };
            return Task.FromResult(value);
        }
    }

    private sealed class DraftClient(decimal confidence = .9m, string screeningIndication = "Discuss screening with a licensed clinician.") : IOllamaClient
    {
        public Task<OllamaResult<T>> GenerateStructuredAsync<T>(string systemPrompt, object input,
            CancellationToken cancellationToken) where T : class => Task.FromResult(new OllamaResult<T>(
                (T)(object)new FamilialRiskSignalOutput([], ["invented relative"],
                    screeningIndication, confidence), "test", 1, 1));
    }
}
