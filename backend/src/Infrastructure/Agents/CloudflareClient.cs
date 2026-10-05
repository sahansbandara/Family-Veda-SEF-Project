// Owner: S3 · Triage & Agent Orchestration
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FamilyVeda.Application.Agents;
using Microsoft.Extensions.Options;

namespace FamilyVeda.Infrastructure.Agents;

public sealed class CloudflareOptions
{
    public const string SectionName = "Cloudflare";
    public string AccountId { get; init; } = "";
    public string ApiKey { get; init; } = "";
    public string Model { get; init; } = "@cf/meta/llama-3.1-8b-instruct-fp8";
    public int TimeoutSeconds { get; init; } = 30;
}

/// <summary>Server-only Workers AI client. Output remains subject to the existing safety and approval gates.</summary>
public sealed class CloudflareClient(HttpClient httpClient, IOptions<CloudflareOptions> options) : IOllamaClient
{
    private readonly CloudflareOptions _options = options.Value;
    private static readonly JsonSerializerOptions RequestJson = new(JsonSerializerDefaults.Web);
    private static readonly JsonSerializerOptions OutputJson = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow
    };

    public async Task<OllamaResult<T>> GenerateStructuredAsync<T>(string systemPrompt, object input, CancellationToken cancellationToken) where T : class
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (string.IsNullOrWhiteSpace(_options.AccountId) || string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new InvalidOperationException("Cloudflare inference is not configured.");

        // State the existing DTO contract explicitly: Workers AI does not infer C# types.
        var shape = typeof(T).Name switch
        {
            nameof(MemberContextOutput) => "memberProfile (non-empty string), recentVitals, episodes, conditions (arrays of non-empty strings)",
            nameof(AnalysisFindingsOutput) => "deviations, stablePatterns (arrays of non-empty strings)",
            nameof(FamilialRiskSignalOutput) => "consentedSignals, unknownParties (arrays of non-empty strings), screeningIndication (non-empty string)",
            _ => throw new JsonException("Unsupported agent output type.")
        };
        var fullPrompt = systemPrompt + "\nReturn a single JSON object only, with exactly these properties: " + shape +
            ", confidence (number between 0 and 1). Use empty arrays when no evidence exists. Do not add facts or properties.";
        var endpoint = "https://api.cloudflare.com/client/v4/accounts/" + Uri.EscapeDataString(_options.AccountId) +
            "/ai/run/" + string.Join("/", _options.Model.Split('/').Select(segment => Uri.EscapeDataString(segment).Replace("%40", "@", StringComparison.Ordinal)));
        Exception? lastError = null;
        for (var attempt = 0; attempt < 2; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));
                using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = JsonContent.Create(new
                    {
                        temperature = 0,
                        messages = new[]
                        {
                            new { role = "system", content = fullPrompt },
                            new { role = "user", content = JsonSerializer.Serialize(input, RequestJson) }
                        }
                    }, options: RequestJson)
                };
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
                using var response = await httpClient.SendAsync(request, timeout.Token);
                response.EnsureSuccessStatusCode();
                var envelope = await response.Content.ReadFromJsonAsync<CloudflareEnvelope>(RequestJson, timeout.Token)
                    ?? throw new JsonException("Cloudflare returned an empty response.");
                if (!envelope.Success || envelope.Result?.Response is null)
                    throw new JsonException("Cloudflare returned no successful output.");
                var output = StripCompleteFence(envelope.Result.Response);
                var parsed = JsonSerializer.Deserialize<T>(output, OutputJson)
                    ?? throw new JsonException("Cloudflare structured output was null.");
                AgentOutputValidator.Validate(parsed);
                cancellationToken.ThrowIfCancellationRequested();
                return new OllamaResult<T>(parsed, _options.Model,
                    envelope.Result.Usage?.PromptTokens, envelope.Result.Usage?.CompletionTokens);
            }
            catch (Exception exception) when (!cancellationToken.IsCancellationRequested &&
                exception is HttpRequestException or JsonException or OperationCanceledException)
            {
                lastError = exception;
            }
        }
        throw new InvalidOperationException("Cloudflare inference failed after one retry.", lastError);
    }

    private static string StripCompleteFence(string value)
    {
        var text = value.Trim();
        var newline = text.IndexOf('\n');
        if (newline < 0) return text;
        var opening = text[..newline].TrimEnd('\r');
        if ((opening == "```" || opening == "```json") && text.EndsWith("\n```", StringComparison.Ordinal))
            return text[(newline + 1)..^4].Trim();
        return text;
    }

    private sealed record CloudflareEnvelope(bool Success, CloudflareResult? Result);
    private sealed record CloudflareResult(string? Response, CloudflareUsage? Usage);
    private sealed record CloudflareUsage(
        [property: JsonPropertyName("prompt_tokens")] int? PromptTokens,
        [property: JsonPropertyName("completion_tokens")] int? CompletionTokens);
}
