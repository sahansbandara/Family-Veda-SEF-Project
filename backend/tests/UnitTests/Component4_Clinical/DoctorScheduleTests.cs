// Owner: S4 · Deterministic scheduling regressions. Synthetic data only.
using FamilyVeda.Domain.Portal;
using FluentAssertions;

namespace FamilyVeda.UnitTests;

public sealed class DoctorScheduleTests
{
    [Theory]
    [InlineData(15, 3)]
    [InlineData(20, 2)]
    [InlineData(30, 1)]
    [InlineData(45, 1)]
    [InlineData(60, 0)]
    public void FreeSlots_LateWindow_NeverWrapsTheEndPastMidnight(int minutes, int expectedCount)
    {
        var date = new DateOnly(2099, 1, 1);
        var windows = new[] { new DoctorSchedule.Window(date.DayOfWeek, new TimeOnly(23, 0), new TimeOnly(23, 59)) };

        var slots = DoctorSchedule.FreeSlots(date, minutes, windows, [], DateTimeOffset.UnixEpoch);

        slots.Should().HaveCount(expectedCount);
        slots.All(start => DoctorSchedule.Fits(start, minutes, windows, [])).Should().BeTrue();
    }
}
