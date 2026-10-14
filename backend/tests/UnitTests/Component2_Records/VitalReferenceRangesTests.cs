// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
using FamilyVeda.Domain.Records;

namespace FamilyVeda.UnitTests;

public sealed class VitalReferenceRangesTests
{
    [Theory]
    [InlineData("heart_rate", "bpm", 59, LabRangeStatus.BelowRange)]
    [InlineData("heart_rate", "bpm", 60, LabRangeStatus.WithinRange)]
    [InlineData("heart_rate", "bpm", 100, LabRangeStatus.WithinRange)]
    [InlineData("heart_rate", "bpm", 101, LabRangeStatus.AboveRange)]
    [InlineData("blood_pressure_systolic", "mmHg", 128, LabRangeStatus.AboveRange)]
    [InlineData("blood_pressure_diastolic", "mmHg", 80, LabRangeStatus.WithinRange)]
    [InlineData("oxygen_saturation", "%", 94, LabRangeStatus.BelowRange)]
    [InlineData(" Heart Rate ", " BPM ", 76, LabRangeStatus.WithinRange)]
    public void Assess_AdultReading_IsPlacedAgainstTheCitedInterval(string type, string unit, decimal value, LabRangeStatus expected)
    {
        var result = VitalReferenceRanges.Assess(type, unit, value, 42);

        Assert.Equal(expected, result.Status);
        Assert.NotNull(result.ReferenceLow);
        Assert.NotNull(result.ReferenceHigh);
        Assert.False(string.IsNullOrWhiteSpace(result.Source));
    }

    [Theory]
    [InlineData("weight", "kg", 42)]            // no age-only weight interval exists
    [InlineData("synthetic_metric", "u", 42)]   // unknown measurement
    [InlineData("temperature", "F", 42)]        // unit the table does not cover
    [InlineData("heart_rate", "bpm", 17)]       // paediatric table not supplied: fail closed
    [InlineData("heart_rate", "bpm", null)]     // age unknown
    public void Assess_WithoutAnApplicableRow_NeverInventsARange(string type, string unit, int? age)
    {
        var result = VitalReferenceRanges.Assess(type, unit, 80, age);

        Assert.Equal(LabRangeStatus.RangeUnavailable, result.Status);
        Assert.Null(result.ReferenceLow);
        Assert.Null(result.ReferenceHigh);
        Assert.Null(result.Source);
    }

    [Fact]
    public void ForAge_Minor_ReturnsNoRows()
    {
        Assert.Empty(VitalReferenceRanges.ForAge(12));
        Assert.Empty(VitalReferenceRanges.ForAge(null));
        Assert.NotEmpty(VitalReferenceRanges.ForAge(18));
    }

    [Fact]
    public void Table_EveryRowIsCitedAndOrdered()
    {
        Assert.All(VitalReferenceRanges.Table, row =>
        {
            Assert.True(row.Low < row.High);
            Assert.False(string.IsNullOrWhiteSpace(row.Source));
            Assert.NotEmpty(row.Units);
        });
    }

    [Fact]
    public void Trend_ComparesTheLatestReadingWithEarlierOnes()
    {
        Assert.Equal(VitalTrend.NotEnoughReadings, VitalReferenceRanges.Trend(74.5m, []));
        Assert.Equal(VitalTrend.Stable, VitalReferenceRanges.Trend(74.5m, [74m, 75m, 73.5m]));
        Assert.Equal(VitalTrend.Rising, VitalReferenceRanges.Trend(82m, [74m, 75m]));
        Assert.Equal(VitalTrend.Falling, VitalReferenceRanges.Trend(68m, [74m, 75m]));
    }

    [Fact]
    public void AgeInYears_CountsCompletedYearsOnly()
    {
        var today = new DateOnly(2026, 10, 4);

        Assert.Equal(42, VitalReferenceRanges.AgeInYears(new DateOnly(1984, 10, 4), today));
        Assert.Equal(41, VitalReferenceRanges.AgeInYears(new DateOnly(1984, 10, 5), today));
        Assert.Null(VitalReferenceRanges.AgeInYears(null, today));
        Assert.Null(VitalReferenceRanges.AgeInYears(new DateOnly(2027, 1, 1), today));
    }
}
