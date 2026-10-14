// Owner: S3 · whole-project ownership waiver
using System.Text.Json;

namespace FamilyVeda.Application.Agents;

/// <summary>Required evidence must exist and satisfy the existing agent schema.</summary>
public static class RequiredAgentEvidence
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static bool HasOutput(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return false;
        try
        {
            using var document = JsonDocument.Parse(raw);
            return document.RootElement.ValueKind == JsonValueKind.Object && document.RootElement.EnumerateObject().Any();
        }
        catch (JsonException) { return false; }
    }

    public static bool IsComplete(string? context, string? analysis) =>
        IsValid<MemberContextOutput>(context) && IsValid<AnalysisFindingsOutput>(analysis);

    private static bool IsValid<T>(string? raw) where T : class
    {
        if (!HasOutput(raw)) return false;
        try
        {
            var value = JsonSerializer.Deserialize<T>(raw!, JsonOptions);
            if (value is null) return false;
            AgentOutputValidator.Validate(value);
            return true;
        }
        catch (JsonException) { return false; }
    }
}
