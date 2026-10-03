// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Doctor Calendar: metrics, Day / Week / Month switcher, a week date strip and the selected day's agenda.
// Same endpoints and status rules as the web calendar (web/src/pages/doctor/DoctorCalendarPage.tsx).
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/providers/doctor_provider.dart';
import 'package:family_veda/screens/doctor/doctor_calendar_logic.dart';
import 'package:family_veda/widgets/doctor/appointment_detail_sheet.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class DoctorCalendarScreen extends ConsumerStatefulWidget {
  const DoctorCalendarScreen({super.key});

  @override
  ConsumerState<DoctorCalendarScreen> createState() =>
      _DoctorCalendarScreenState();
}

class _DoctorCalendarScreenState extends ConsumerState<DoctorCalendarScreen> {
  DateTime _selected = startOfDay(DateTime.now());
  CalendarView _view = CalendarView.day;

  Future<void> _open(Appointment appointment) async {
    final message = await showAppointmentDetailSheet(context, appointment);
    if (message == null || !mounted) return;
    // The list is re-read from the backend, so the agenda shows exactly what was saved.
    ref.invalidate(doctorAppointmentsProvider);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String get _title => switch (_view) {
    CalendarView.month => DateFormat('MMMM y').format(_selected),
    CalendarView.day => DateFormat('EEE, d MMM y').format(_selected),
    CalendarView.week => () {
      final days = weekDays(_selected);
      return '${DateFormat('d MMM').format(days.first)} – ${DateFormat('d MMM y').format(days.last)}';
    }(),
  };

  @override
  Widget build(BuildContext context) {
    final appointments = ref.watch(doctorAppointmentsProvider);
    final palette = CalendarPalette.of(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('My Calendar'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: appointments.when(
          loading: () => const LoadingStateView(label: 'Loading your calendar'),
          error: (_, _) => ErrorRetryView(
            message:
                'Your appointments could not be loaded. Nothing was changed.',
            onRetry: () => ref.invalidate(doctorAppointmentsProvider),
          ),
          data: (items) {
            final now = DateTime.now();
            final byDay = groupByDay(items);
            final metrics = metricsFor(items, now: now, selected: _selected);
            final sameMonth =
                _selected.year == now.year && _selected.month == now.month;
            return RefreshIndicator(
              onRefresh: () => ref.refresh(doctorAppointmentsProvider.future),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                children: [
                  Text(
                    'Manage appointments and availability',
                    style: TextStyle(fontSize: 13, color: palette.muted),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _MetricTile(
                          label: "Today's visits",
                          value: metrics.today,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _MetricTile(
                          label: 'Pending requests',
                          value: metrics.pending,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _MetricTile(
                          label: sameMonth
                              ? 'This month'
                              : DateFormat('MMMM').format(_selected),
                          value: metrics.month,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SegmentedButton<CalendarView>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(
                        value: CalendarView.day,
                        label: Text('Day'),
                      ),
                      ButtonSegment(
                        value: CalendarView.week,
                        label: Text('Week'),
                      ),
                      ButtonSegment(
                        value: CalendarView.month,
                        label: Text('Month'),
                      ),
                    ],
                    selected: {_view},
                    onSelectionChanged: (value) =>
                        setState(() => _view = value.first),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      IconButton(
                        tooltip: 'Previous ${_view.name}',
                        onPressed: () => setState(
                          () => _selected = shiftByView(_selected, _view, -1),
                        ),
                        icon: const Icon(Icons.chevron_left_rounded),
                      ),
                      Expanded(
                        child: Semantics(
                          header: true,
                          child: Text(
                            _title,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: palette.heading,
                            ),
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(
                          () => _selected = startOfDay(DateTime.now()),
                        ),
                        child: const Text('Today'),
                      ),
                      IconButton(
                        tooltip: 'Next ${_view.name}',
                        onPressed: () => setState(
                          () => _selected = shiftByView(_selected, _view, 1),
                        ),
                        icon: const Icon(Icons.chevron_right_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (_view == CalendarView.month)
                    MonthPicker(
                      selected: _selected,
                      today: now,
                      byDay: byDay,
                      onSelect: (date) => setState(() => _selected = date),
                    )
                  else
                    DateStrip(
                      selected: _selected,
                      today: now,
                      byDay: byDay,
                      onSelect: (date) => setState(() => _selected = date),
                    ),
                  const SizedBox(height: 16),
                  AnimatedSwitcher(
                    duration: MediaQuery.disableAnimationsOf(context)
                        ? Duration.zero
                        : const Duration(milliseconds: 180),
                    child: KeyedSubtree(
                      key: ValueKey('${_view.name}-${dayKey(_selected)}'),
                      child: _view == CalendarView.week
                          ? _WeekAgenda(
                              selected: _selected,
                              byDay: byDay,
                              onOpen: _open,
                            )
                          : _DayAgenda(
                              date: _selected,
                              appointments:
                                  byDay[dayKey(_selected)] ?? const [],
                              onOpen: _open,
                            ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return MergeSemantics(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: palette.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: palette.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$value',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: palette.heading,
              ),
            ),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 12, color: palette.muted)),
          ],
        ),
      ),
    );
  }
}

class _DayAgenda extends StatelessWidget {
  const _DayAgenda({
    required this.date,
    required this.appointments,
    required this.onOpen,
  });

  final DateTime date;
  final List<Appointment> appointments;
  final ValueChanged<Appointment> onOpen;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final count = appointments.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${DateFormat('EEEE, d MMMM').format(date)} · $count ${count == 1 ? 'appointment' : 'appointments'}',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: palette.muted,
          ),
        ),
        const SizedBox(height: 10),
        if (appointments.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 28),
            child: Text(
              'No appointments on this day.',
              textAlign: TextAlign.center,
              style: TextStyle(color: palette.muted),
            ),
          )
        else
          for (final appointment in appointments)
            AppointmentBlock(
              appointment: appointment,
              onTap: () => onOpen(appointment),
            ),
      ],
    );
  }
}

class _WeekAgenda extends StatelessWidget {
  const _WeekAgenda({
    required this.selected,
    required this.byDay,
    required this.onOpen,
  });

  final DateTime selected;
  final Map<String, List<Appointment>> byDay;
  final ValueChanged<Appointment> onOpen;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final days = weekDays(
      selected,
    ).where((date) => (byDay[dayKey(date)] ?? const []).isNotEmpty).toList();
    if (days.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Text(
          'No appointments this week.',
          textAlign: TextAlign.center,
          style: TextStyle(color: palette.muted),
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final date in days) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 8, top: 4),
            child: Text(
              DateFormat('EEEE, d MMMM').format(date),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: palette.heading,
              ),
            ),
          ),
          for (final appointment in byDay[dayKey(date)]!)
            AppointmentBlock(
              appointment: appointment,
              onTap: () => onOpen(appointment),
            ),
        ],
      ],
    );
  }
}
