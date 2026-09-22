// ⚠ SHARED — coordinated by S3. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
using FamilyVeda.Domain.Common;

namespace FamilyVeda.Application.Agents;

public sealed record AgentRunContext(Guid CaseId, Guid MemberId, string InputJson);
public sealed record AgentRunResult(
    AgentKind Agent,
    string OutputJson,
    decimal Confidence,
    IReadOnlyList<string> ToolsRequested,
    IReadOnlyList<string> ToolsAllowed,
    IReadOnlyList<string> ToolsDenied,
    bool SchemaValid,
    string? ModelName = null,
    int? InputTokens = null,
    int? OutputTokens = null);

public interface IAgent
{
    AgentKind Kind { get; }
    Task<AgentRunResult> RunAsync(AgentRunContext context, CancellationToken cancellationToken);
}

public interface IOllamaClient
{
    Task<OllamaResult<T>> GenerateStructuredAsync<T>(string systemPrompt, object input, CancellationToken cancellationToken) where T : class;
}

public sealed record OllamaResult<T>(T Value, string ModelName, int? InputTokens, int? OutputTokens) where T : class;

public interface IToolDispatcher
{
    Task<object> InvokeAsync(AgentKind agent, string tool, Guid memberId, Guid caseId, CancellationToken cancellationToken, object? arguments = null);
}

public sealed class ToolDeniedException(AgentKind agent, string tool)
    : Exception($"Tool '{tool}' is denied for agent '{agent}'.")
{
    public AgentKind Agent { get; } = agent;
    public string Tool { get; } = tool;
}

public sealed record MemberContextOutput(string MemberProfile, IReadOnlyList<string> RecentVitals, IReadOnlyList<string> Episodes, IReadOnlyList<string> Conditions, decimal Confidence);
public sealed record AnalysisFindingsOutput(IReadOnlyList<string> Deviations, IReadOnlyList<string> StablePatterns, decimal Confidence);
public sealed record FamilialRiskSignalOutput(IReadOnlyList<string> ConsentedSignals, IReadOnlyList<string> UnknownParties, string ScreeningIndication, decimal Confidence);

public static class AgentOutputValidator
{
    public static void Validate<T>(T output) where T : class
    {
        var valid = output switch
        {
            MemberContextOutput value =>
                ValidText(value.MemberProfile, 4000) &&
                ValidList(value.RecentVitals, 50, 1000) &&
                ValidList(value.Episodes, 50, 1000) &&
                ValidList(value.Conditions, 50, 1000) &&
                ValidConfidence(value.Confidence),
            AnalysisFindingsOutput value =>
                ValidList(value.Deviations, 100, 1000) &&
                ValidList(value.StablePatterns, 100, 1000) &&
                ValidConfidence(value.Confidence),
            FamilialRiskSignalOutput value =>
                ValidList(value.ConsentedSignals, 100, 1000) &&
                ValidList(value.UnknownParties, 100, 500) &&
                ValidText(value.ScreeningIndication, 2000) &&
                ValidConfidence(value.Confidence),
            _ => false
        };
        if (!valid) throw new System.Text.Json.JsonException("Ollama output failed semantic schema validation.");
    }

    private static bool ValidConfidence(decimal value) => value is >= 0 and <= 1;
    private static bool ValidText(string? value, int maxLength) => !string.IsNullOrWhiteSpace(value) && value.Length <= maxLength;
    private static bool ValidList(IReadOnlyList<string>? values, int maxItems, int maxItemLength) =>
        values is not null && values.Count <= maxItems && values.All(value => ValidText(value, maxItemLength));
}
