// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Presentational pieces of the Doctor Calendar: status chip, date strip, month picker, appointment block.
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/screens/doctor/doctor_calendar_logic.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Calendar colours resolved from the app theme, so light and dark both follow the shared tokens.
class CalendarPalette {
  CalendarPalette.of(BuildContext context)
    : isDark = Theme.of(context).brightness == Brightness.dark,
      primary = Theme.of(context).colorScheme.primary,
      success = context.glass.success,
      warning = context.glass.warning,
      danger = Theme.of(context).colorScheme.error;

  final bool isDark;
  final Color primary;
  final Color success;
  final Color warning;
  final Color danger;

  Color get surface => isDark ? AppColors.surfaceDark : AppColors.surface;
  Color get surfaceSubtle =>
      isDark ? AppColors.surfaceSubtleDark : AppColors.surfaceSubtle;
  Color get border => isDark ? AppColors.borderDark : AppColors.border;
  Color get heading =>
      isDark ? AppColors.textHeadingDark : AppColors.textHeading;
  Color get text => isDark ? AppColors.textDark : AppColors.text;
  Color get muted => isDark ? AppColors.mutedDark : AppColors.muted;

  Color tone(AppointmentStatus status) => switch (status) {
    AppointmentStatus.confirmed => primary,
    AppointmentStatus.requested => warning,
    AppointmentStatus.completed => success,
    AppointmentStatus.noShow => danger,
    _ => muted,
  };
}

const _weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

String _countLabel(int count) =>
    '$count ${count == 1 ? 'appointment' : 'appointments'}';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final AppointmentStatus status;

  @override
  Widget build(BuildContext context) {
    final tone = CalendarPalette.of(context).tone(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tone.withValues(alpha: 0.32)),
      ),
      child: Text(
        statusLabel(status),
        style: TextStyle(
          color: tone,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.appointments, required this.onAccent});

  final List<Appointment> appointments;
  final bool onAccent;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return SizedBox(
      height: 6,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final appointment in appointments.take(3))
            Container(
              width: 6,
              height: 6,
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              decoration: BoxDecoration(
                color: onAccent
                    ? Colors.white
                    : palette.tone(appointment.status),
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}

/// One week of large touch targets. Phones never get a squeezed seven-column month of text.
class DateStrip extends StatelessWidget {
  const DateStrip({
    super.key,
    required this.selected,
    required this.today,
    required this.byDay,
    required this.onSelect,
  });

  final DateTime selected;
  final DateTime today;
  final Map<String, List<Appointment>> byDay;
  final ValueChanged<DateTime> onSelect;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final selectedKey = dayKey(selected);
    final todayKey = dayKey(today);
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: palette.surfaceSubtle,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        children: [
          for (final date in weekDays(selected))
            Expanded(
              child: _StripDay(
                date: date,
                isSelected: dayKey(date) == selectedKey,
                isToday: dayKey(date) == todayKey,
                appointments: byDay[dayKey(date)] ?? const [],
                onTap: () => onSelect(date),
              ),
            ),
        ],
      ),
    );
  }
}

class _StripDay extends StatelessWidget {
  const _StripDay({
    required this.date,
    required this.isSelected,
    required this.isToday,
    required this.appointments,
    required this.onTap,
  });

  final DateTime date;
  final bool isSelected;
  final bool isToday;
  final List<Appointment> appointments;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final numberColor = isSelected
        ? Colors.white
        : (isToday ? palette.primary : palette.heading);
    return Semantics(
      button: true,
      selected: isSelected,
      label:
          '${DateFormat('EEEE d MMMM').format(date)}, ${_countLabel(appointments.length)}',
      excludeSemantics: true,
      child: InkWell(
        key: ValueKey('strip-${dayKey(date)}'),
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: AnimatedContainer(
          duration: MediaQuery.disableAnimationsOf(context)
              ? Duration.zero
              : const Duration(milliseconds: 180),
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? palette.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _weekdayLabels[date.weekday % 7].toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 0.4,
                    color: isSelected ? Colors.white : palette.muted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  date.day.toString().padLeft(2, '0'),
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: numberColor,
                  ),
                ),
                const SizedBox(height: 4),
                _Dots(appointments: appointments, onAccent: isSelected),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Compact month used as a date picker: day numbers and status dots only.
class MonthPicker extends StatelessWidget {
  const MonthPicker({
    super.key,
    required this.selected,
    required this.today,
    required this.byDay,
    required this.onSelect,
  });

  final DateTime selected;
  final DateTime today;
  final Map<String, List<Appointment>> byDay;
  final ValueChanged<DateTime> onSelect;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final selectedKey = dayKey(selected);
    final todayKey = dayKey(today);
    final days = monthGrid(selected);
    return Column(
      children: [
        Row(
          children: [
            for (final label in _weekdayLabels)
              Expanded(
                child: ExcludeSemantics(
                  child: Text(
                    label.toUpperCase(),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: palette.muted,
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        for (var week = 0; week < days.length ~/ 7; week++)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: [
                for (final date in days.sublist(week * 7, week * 7 + 7))
                  Expanded(
                    child: _MonthCell(
                      date: date,
                      inMonth: date.month == selected.month,
                      isSelected: dayKey(date) == selectedKey,
                      isToday: dayKey(date) == todayKey,
                      appointments: byDay[dayKey(date)] ?? const [],
                      onTap: () => onSelect(date),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class _MonthCell extends StatelessWidget {
  const _MonthCell({
    required this.date,
    required this.inMonth,
    required this.isSelected,
    required this.isToday,
    required this.appointments,
    required this.onTap,
  });

  final DateTime date;
  final bool inMonth;
  final bool isSelected;
  final bool isToday;
  final List<Appointment> appointments;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final numberColor = isSelected
        ? Colors.white
        : (isToday ? palette.primary : palette.text);
    return Semantics(
      button: true,
      selected: isSelected,
      label:
          '${DateFormat('d MMMM').format(date)}, ${_countLabel(appointments.length)}',
      excludeSemantics: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: InkWell(
          key: ValueKey('month-${dayKey(date)}'),
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: Opacity(
            opacity: inMonth || isSelected ? 1 : 0.45,
            child: Container(
              constraints: const BoxConstraints(minHeight: 48),
              decoration: BoxDecoration(
                color: isSelected ? palette.primary : palette.surfaceSubtle,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isToday && !isSelected
                      ? palette.primary.withValues(alpha: 0.5)
                      : Colors.transparent,
                ),
              ),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${date.day}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: numberColor,
                        ),
                      ),
                      const SizedBox(height: 3),
                      _Dots(appointments: appointments, onAccent: isSelected),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A visit on the timeline: start time in the gutter, then a tinted block with a status-coloured edge.
class AppointmentBlock extends StatelessWidget {
  const AppointmentBlock({
    super.key,
    required this.appointment,
    required this.onTap,
  });

  final Appointment appointment;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final tone = palette.tone(appointment.status);
    final time = DateFormat.Hm();
    final start = time.format(appointment.startsAt);
    final end = time.format(endsAt(appointment));
    final active = isActiveVisit(appointment);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 52,
            child: ExcludeSemantics(
              child: Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  start,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: palette.heading,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: Semantics(
              button: true,
              label:
                  '$start to $end, ${appointment.memberDisplayName}, ${appointment.reason}, ${statusLabel(appointment.status)}',
              excludeSemantics: true,
              child: Material(
                color: Color.alphaBlend(
                  tone.withValues(alpha: 0.13),
                  palette.surface,
                ),
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(6),
                  right: Radius.circular(12),
                ),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  key: ValueKey('appointment-${appointment.id}'),
                  onTap: onTap,
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 64),
                    decoration: BoxDecoration(
                      border: Border(left: BorderSide(color: tone, width: 4)),
                    ),
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                appointment.memberDisplayName,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: active
                                      ? palette.heading
                                      : palette.muted,
                                  decoration: active
                                      ? null
                                      : TextDecoration.lineThrough,
                                ),
                              ),
                              if (appointment.reason.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  appointment.reason,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: palette.muted,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 6),
                              StatusChip(status: appointment.status),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              start,
                              style: TextStyle(
                                fontSize: 13,
                                color: palette.muted,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              end,
                              style: TextStyle(
                                fontSize: 13,
                                color: palette.muted,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
