// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Deterministic scheduling rules. Weekly hours are clinic-local time in Sri Lanka (UTC+05:30, no DST).
namespace FamilyVeda.Domain.Portal;

public static class DoctorSchedule
{
    public static readonly TimeSpan ClinicOffset = TimeSpan.FromMinutes(330);
    public static readonly int[] AllowedSlotMinutes = [15, 20, 30, 45, 60];

    public readonly record struct Window(DayOfWeek Day, TimeOnly Start, TimeOnly End);
    public readonly record struct Busy(DateTimeOffset Start, DateTimeOffset End);

    /// <summary>True when every window ends after it starts and windows on the same day do not overlap.</summary>
    public static bool AreValid(IEnumerable<Window> windows)
    {
        var list = windows.ToList();
        if (list.Any(w => w.End <= w.Start)) return false;
        return !list.GroupBy(w => w.Day).Any(day =>
        {
            var ordered = day.OrderBy(w => w.Start).ToList();
            return ordered.Zip(ordered.Skip(1)).Any(pair => pair.Second.Start < pair.First.End);
        });
    }

    /// <summary>The appointment must sit fully inside one weekly window and must not touch blocked time.</summary>
    public static bool Fits(DateTimeOffset startsAt, int durationMinutes, IReadOnlyCollection<Window> windows, IReadOnlyCollection<Busy> blocked)
    {
        var local = startsAt.ToOffset(ClinicOffset);
        var endLocal = local.AddMinutes(durationMinutes);
        if (endLocal.Date != local.Date) return false;
        var start = TimeOnly.FromDateTime(local.DateTime);
        var end = TimeOnly.FromDateTime(endLocal.DateTime);
        var inWindow = windows.Any(w => w.Day == local.DayOfWeek && w.Start <= start && end <= w.End);
        return inWindow && !Overlaps(startsAt, startsAt.AddMinutes(durationMinutes), blocked);
    }

    /// <summary>Free slot starts for one clinic-local date, after <paramref name="now"/>.</summary>
    public static IReadOnlyList<DateTimeOffset> FreeSlots(DateOnly date, int slotMinutes, IReadOnlyCollection<Window> windows,
        IReadOnlyCollection<Busy> busy, DateTimeOffset now)
    {
        var slots = new List<DateTimeOffset>();
        foreach (var window in windows.Where(w => w.Day == date.DayOfWeek).OrderBy(w => w.Start))
        {
            for (var t = window.Start; t.AddMinutes(slotMinutes) <= window.End && t >= window.Start; t = t.AddMinutes(slotMinutes))
            {
                var start = new DateTimeOffset(date.ToDateTime(t), ClinicOffset);
                var end = start.AddMinutes(slotMinutes);
                if (start > now && !Overlaps(start, end, busy)) slots.Add(start);
                if (t.AddMinutes(slotMinutes) < t) break; // wrapped past midnight
            }
        }
        return slots;
    }

    private static bool Overlaps(DateTimeOffset start, DateTimeOffset end, IEnumerable<Busy> busy) =>
        busy.Any(b => b.Start < end && start < b.End);
}
