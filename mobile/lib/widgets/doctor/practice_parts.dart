// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Presentational pieces of the doctor Profile & Availability screen: summary tiles, the
// "Add availability" banner, one card per time range and the add-range sheet.
import 'package:family_veda/models/doctor_practice.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:flutter/material.dart';

TimeOfDay _timeOfDay(int minutes) =>
    TimeOfDay(hour: minutes ~/ 60, minute: minutes % 60);

/// Clock picker for one end of a range. Returns minutes from midnight, or null when dismissed.
Future<int?> pickClockMinutes(
  BuildContext context, {
  required int initial,
  required String helpText,
}) async {
  final picked = await showTimePicker(
    context: context,
    initialTime: _timeOfDay(initial),
    helpText: helpText,
  );
  return picked == null ? null : picked.hour * 60 + picked.minute;
}

/// Four practice facts in a 2 × 2 grid. Text carries the meaning; icons are decoration.
class PracticeSummaryGrid extends StatelessWidget {
  const PracticeSummaryGrid({
    super.key,
    required this.accepting,
    required this.slotMinutes,
    required this.activeDays,
    required this.blockedCount,
  });

  final bool accepting;
  final int slotMinutes;
  final int activeDays;
  final int blockedCount;

  @override
  Widget build(BuildContext context) {
    final tiles = [
      (
        'Practice status',
        accepting ? 'Accepting families' : 'Not accepting',
        Icons.groups_2_outlined,
      ),
      ('Consultation length', '$slotMinutes minutes', Icons.schedule_rounded),
      (
        'Weekly schedule',
        plural(activeDays, 'active day'),
        Icons.calendar_month_outlined,
      ),
      (
        'Upcoming time off',
        plural(blockedCount, 'blocked period'),
        Icons.event_busy_outlined,
      ),
    ];
    Widget row(int first) => IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: _SummaryTile(tile: tiles[first])),
          const SizedBox(width: 10),
          Expanded(child: _SummaryTile(tile: tiles[first + 1])),
        ],
      ),
    );
    return Column(children: [row(0), const SizedBox(height: 10), row(2)]);
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.tile});

  final (String, String, IconData) tile;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final (label, value, icon) = tile;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: MergeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(color: palette.muted, fontSize: 12),
                  ),
                ),
                ExcludeSemantics(
                  child: Icon(icon, size: 18, color: palette.primary),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                color: palette.heading,
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The tinted call-to-action that opens the add-range sheet.
class AddAvailabilityBanner extends StatelessWidget {
  const AddAvailabilityBanner({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return Semantics(
      button: true,
      child: Material(
        color: palette.primary.withValues(alpha: palette.isDark ? 0.22 : 0.1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: palette.primary.withValues(alpha: 0.4)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 14, 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Add availability',
                        style: TextStyle(
                          color: palette.heading,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Select the day and time of your preference',
                        style: TextStyle(color: palette.muted, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: palette.primary, width: 1.5),
                  ),
                  child: Icon(Icons.add_rounded, color: palette.primary),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

enum SlotAction { start, end, remove }

/// One bookable range: length, clock range and a menu to change or remove it.
class AvailabilitySlotCard extends StatelessWidget {
  const AvailabilitySlotCard({
    super.key,
    required this.window,
    required this.onAction,
  });

  final AvailabilityWindow window;
  final ValueChanged<SlotAction> onAction;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final valid = window.end > window.start;
    final tone = !valid
        ? palette.danger
        : window.isMorning
        ? palette.success
        : palette.warning;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 4, 12),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: valid ? palette.border : palette.danger),
      ),
      child: Row(
        children: [
          Expanded(
            child: MergeSemantics(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      ExcludeSemantics(
                        child: Icon(
                          valid
                              ? Icons.wb_twilight_rounded
                              : Icons.error_outline_rounded,
                          size: 17,
                          color: tone,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        valid
                            ? window.durationLabel
                            : 'End must be after start',
                        style: TextStyle(
                          color: tone,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    window.rangeLabel,
                    style: TextStyle(
                      color: palette.heading,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          PopupMenuButton<SlotAction>(
            tooltip: 'Options for ${window.day} ${window.rangeLabel}',
            icon: Icon(Icons.more_vert_rounded, color: palette.muted),
            onSelected: onAction,
            itemBuilder: (_) => const [
              PopupMenuItem(
                value: SlotAction.start,
                child: Text('Change start time'),
              ),
              PopupMenuItem(
                value: SlotAction.end,
                child: Text('Change end time'),
              ),
              PopupMenuItem(value: SlotAction.remove, child: Text('Remove')),
            ],
          ),
        ],
      ),
    );
  }
}

/// A day with no ranges.
class NotAvailableCard extends StatelessWidget {
  const NotAvailableCard({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      decoration: BoxDecoration(
        color: palette.surfaceSubtle,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border.withValues(alpha: 0.5)),
      ),
      child: Text(
        'Not available',
        style: TextStyle(color: palette.muted, fontSize: 15),
      ),
    );
  }
}

/// Bottom sheet that builds one new range. Pops with the range, or null when dismissed.
class AddAvailabilitySheet extends StatefulWidget {
  const AddAvailabilitySheet({super.key, required this.existing});

  final List<AvailabilityWindow> existing;

  @override
  State<AddAvailabilitySheet> createState() => _AddAvailabilitySheetState();
}

class _AddAvailabilitySheetState extends State<AddAvailabilitySheet> {
  late AvailabilityWindow _draft = nextWindow(weekDays.first, widget.existing);

  Future<void> _pick({required bool start}) async {
    final minutes = await pickClockMinutes(
      context,
      initial: start ? _draft.start : _draft.end,
      helpText: start ? 'Start time' : 'End time',
    );
    if (minutes == null || !mounted) return;
    setState(
      () => _draft = start
          ? _draft.copyWith(start: minutes)
          : _draft.copyWith(end: minutes),
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final valid = _draft.end > _draft.start;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Add availability',
              style: TextStyle(
                color: palette.heading,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Clinic time · Sri Lanka (UTC+05:30)',
              style: TextStyle(color: palette.muted, fontSize: 13),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                for (final day in weekDays)
                  ChoiceChip(
                    label: Text(day.substring(0, 3)),
                    tooltip: day,
                    selected: _draft.day == day,
                    onSelected: (_) => setState(
                      () => _draft = nextWindow(day, widget.existing),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pick(start: true),
                    child: Text('From ${clockLabel(_draft.start)}'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pick(start: false),
                    child: Text('To ${clockLabel(_draft.end)}'),
                  ),
                ),
              ],
            ),
            if (!valid)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'End time must be after start time.',
                  style: TextStyle(color: palette.danger, fontSize: 13),
                ),
              ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: valid ? () => Navigator.pop(context, _draft) : null,
              child: Text('Add to ${_draft.day}'),
            ),
          ],
        ),
      ),
    );
  }
}
