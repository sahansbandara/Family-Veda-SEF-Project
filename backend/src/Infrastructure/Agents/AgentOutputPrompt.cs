// Owner: S3 · Triage & Agent Orchestration
using System.Text.Json;
using FamilyVeda.Application.Agents;

namespace FamilyVeda.Infrastructure.Agents;

/// <summary>Explicit existing DTO contracts for providers that cannot infer C# record shapes.</summary>
internal static class AgentOutputPrompt
{
    /// <summary>
    /// The deterministic safety validator (RULE 4) blocks command verbs anywhere in a draft, even descriptive use.
    /// Asking the model to avoid them keeps harmless observations from being fail-safed; the validator is unchanged.
    /// </summary>
    public const string WordingGuard =
        " Write observations as neutral past/present-tense statements. Never use the words take, start, stop, continue, " +
        "increase, decrease, use, apply, inject or swallow in any form of instruction; describe a change in a value with " +
        "words such as lower, higher, rose, fell, dropped, reduced, elevated or raised, and never name a drug.";

    public static string For<T>(string systemPrompt) where T : class
    {
        var (example, fields) = typeof(T).Name switch
        {
            nameof(MemberContextOutput) => (
                "{\"memberProfile\":\"summary of supplied profile\",\"recentVitals\":[\"summary of supplied observation\"],\"episodes\":[],\"conditions\":[],\"confidence\":0.8}",
                new Dictionary<string, object>
                {
                    ["memberProfile"] = Text(4000), ["recentVitals"] = List(50, 1000),
                    ["episodes"] = List(50, 1000), ["conditions"] = List(50, 1000)
                }),
            nameof(AnalysisFindingsOutput) => (
                "{\"deviations\":[],\"stablePatterns\":[\"summary of supplied observation\"],\"confidence\":0.8}",
                new Dictionary<string, object> { ["deviations"] = List(100, 1000), ["stablePatterns"] = List(100, 1000) }),
            nameof(FamilialRiskSignalOutput) => (
                "{\"consentedSignals\":[],\"unknownParties\":[],\"screeningIndication\":\"summary of supplied consented evidence or its absence\",\"confidence\":0.8}",
                new Dictionary<string, object>
                {
                    ["consentedSignals"] = List(100, 1000), ["unknownParties"] = List(100, 500),
                    ["screeningIndication"] = Text(2000)
                }),
            _ => throw new JsonException("Unsupported agent output type.")
        };
        fields["confidence"] = new { type = "number", minimum = 0, maximum = 1 };
        var schema = JsonSerializer.Serialize(new { type = "object", additionalProperties = false, required = fields.Keys.ToArray(), properties = fields });
        return systemPrompt + WordingGuard + "\nReturn exactly one JSON object matching the schema below; no extra properties, markdown or explanation. " +
            "Every property is required. All collections contain strings only, never objects, numbers or null. " +
            "Do not copy nested input objects into output fields; summarize only supplied evidence as short strings. " +
            "Do not invent missing facts. Use empty arrays when evidence is absent. For a required text field with no evidence, " +
            "state that the corresponding information was not supplied. Set confidence from evidence quality; the example confidence is not a default. " +
            "The example illustrates types only; replace its placeholder text using supplied evidence.\nShape example: " + example + "\nRequired JSON schema: " + schema;
    }

    private static object Text(int maximum) => new { type = "string", minLength = 1, maxLength = maximum };
    private static object List(int maximumItems, int maximumText) => new { type = "array", maxItems = maximumItems, items = Text(maximumText) };
}
