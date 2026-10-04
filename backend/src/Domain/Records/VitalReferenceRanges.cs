// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// [S4] Deterministic vital reference intervals and trend — RULE 4: code, never LLM judgement.
namespace FamilyVeda.Domain.Records;

public enum VitalTrend
{
    NotEnoughReadings,
    Falling,
    Stable,
    Rising
}

/// <summary>One published resting reference interval for an age band. <c>MaxAgeYears</c> null means no upper limit.</summary>
public sealed record VitalReferenceRange(
    string VitalType, string Label, IReadOnlyList<string> Units, int MinAgeYears, int? MaxAgeYears,
    decimal Low, decimal High, string Source)
{
    public string AgeBand => MaxAgeYears is null ? $"{MinAgeYears}+ years" : $"{MinAgeYears}–{MaxAgeYears} years";
}

public sealed record VitalRangeAssessment(decimal? ReferenceLow, decimal? ReferenceHigh, LabRangeStatus Status, string? Source);

/// <summary>
/// Places a recorded vital against a cited reference interval for the member's age. The result is a
/// position relative to a published interval for a doctor to read — it is never a diagnosis (RULE 1).
/// An unknown vital, unit, or age yields <see cref="LabRangeStatus.RangeUnavailable"/>; a range is never invented.
/// Under-18 intervals stay unavailable until the group supplies an approved paediatric table.
/// Weight has no row: an age-only weight interval does not exist for adults.
/// </summary>
public static class VitalReferenceRanges
{
    private const int AdultFrom = 18;
    private static readonly VitalRangeAssessment Unavailable = new(null, null, LabRangeStatus.RangeUnavailable, null);

    public static readonly IReadOnlyList<VitalReferenceRange> Table =
    [
        new("heart_rate", "Heart rate (resting)", ["bpm", "beats/min"], AdultFrom, null, 60m, 100m,
            "American Heart Association — adult resting heart rate"),
        new("blood_pressure_systolic", "Systolic blood pressure", ["mmhg"], AdultFrom, null, 90m, 120m,
            "NHS — adult blood pressure 90/60 to 120/80 mmHg"),
        new("blood_pressure_diastolic", "Diastolic blood pressure", ["mmhg"], AdultFrom, null, 60m, 80m,
            "NHS — adult blood pressure 90/60 to 120/80 mmHg"),
        new("temperature", "Body temperature", ["°c", "c", "celsius"], AdultFrom, null, 36.1m, 37.2m,
            "MedlinePlus (US National Library of Medicine) — adult body temperature"),
        new("oxygen_saturation", "Oxygen saturation", ["%"], AdultFrom, null, 95m, 100m,
            "WHO Pulse Oximetry Training Manual"),
        new("respiratory_rate", "Respiratory rate (resting)", ["breaths/min", "/min", "bpm"], AdultFrom, null, 12m, 20m,
            "Royal College of Physicians — NEWS2"),
        new("bmi", "Body mass index", ["kg/m2", "kg/m²"], AdultFrom, null, 18.5m, 24.9m,
            "WHO — adult BMI classification"),
    ];

    /// <summary>The intervals that apply at this age, for the reference panel. Empty when none are configured.</summary>
    public static IReadOnlyList<VitalReferenceRange> ForAge(int? ageYears) =>
        ageYears is null
            ? []
            : Table.Where(row => ageYears >= row.MinAgeYears && (row.MaxAgeYears is null || ageYears <= row.MaxAgeYears)).ToList();

    public static VitalRangeAssessment Assess(string vitalType, string unit, decimal value, int? ageYears)
    {
        var type = Normalize(vitalType).Replace(' ', '_');
        var normalizedUnit = Normalize(unit).Replace(" ", string.Empty);
        var row = ForAge(ageYears).FirstOrDefault(x => x.VitalType == type && x.Units.Contains(normalizedUnit));
        return row is null
            ? Unavailable
            : new(row.Low, row.High, LabRangeClassifier.Classify(value, row.Low, row.High), row.Source);
    }

    /// <summary>
    /// A display rule, not a clinical one: the latest reading against the mean of up to three earlier
    /// readings of the same measurement and unit. A change within 5% is reported as stable.
    /// </summary>
    public static VitalTrend Trend(decimal latest, IReadOnlyCollection<decimal> earlier)
    {
        if (earlier.Count == 0) return VitalTrend.NotEnoughReadings;
        var baseline = earlier.Average();
        var tolerance = Math.Abs(baseline) * 0.05m;
        var change = latest - baseline;
        if (Math.Abs(change) <= tolerance) return VitalTrend.Stable;
        return change > 0 ? VitalTrend.Rising : VitalTrend.Falling;
    }

    public static int? AgeInYears(DateOnly? dateOfBirth, DateOnly today)
    {
        if (dateOfBirth is not { } born || born > today) return null;
        var age = today.Year - born.Year;
        return born > today.AddYears(-age) ? age - 1 : age;
    }

    private static string Normalize(string value) => (value ?? string.Empty).Trim().ToLowerInvariant();
}
