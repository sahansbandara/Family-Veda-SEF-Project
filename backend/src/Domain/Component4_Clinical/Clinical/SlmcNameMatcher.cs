// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Deterministic register name check (Rule 4): no fuzzy scoring, no LLM.
using FamilyVeda.Domain.Common;

namespace FamilyVeda.Domain.Clinical;

public static class SlmcNameMatcher
{
    private static readonly HashSet<string> Titles = new(StringComparer.Ordinal)
    {
        "dr", "doctor", "prof", "professor", "mr", "mrs", "ms", "miss", "rev", "mbbs", "md"
    };

    /// <summary>Lower-cased surname/given-name tokens: titles and single-letter initials removed, order ignored.</summary>
    public static IReadOnlySet<string> Tokens(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return new HashSet<string>();
        var cleaned = new string(name.ToLowerInvariant().Select(c => char.IsLetter(c) ? c : ' ').ToArray());
        return cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 1 && !Titles.Contains(t))
            .ToHashSet(StringComparer.Ordinal);
    }

    public static bool NamesMatch(string? claimed, string? registered)
    {
        var a = Tokens(claimed);
        var b = Tokens(registered);
        return a.Count > 0 && a.SetEquals(b);
    }

    public static RegisterMatch Classify(string? claimedName, string? registeredName) =>
        registeredName is null ? RegisterMatch.NotInRegister
        : NamesMatch(claimedName, registeredName) ? RegisterMatch.Match
        : RegisterMatch.NameMismatch;
}
