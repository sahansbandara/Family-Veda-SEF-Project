// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Pure date and status rules for the Doctor Calendar. Mirrors web/src/pages/doctor/calendar/calendarUtils.ts.
import 'package:family_veda/models/appointment.dart';

enum CalendarView { day, week, month }

enum AppointmentAction { confirm, complete, noShow, cancel }

/// The transitions the backend state machine accepts. The server stays authoritative; this only gates buttons.
List<AppointmentAction> allowedActions(AppointmentStatus status) =>
    switch (status) {
      AppointmentStatus.requested => const [
        AppointmentAction.confirm,
        AppointmentAction.cancel,
      ],
      AppointmentStatus.confirmed => const [
        AppointmentAction.complete,
        AppointmentAction.noShow,
        AppointmentAction.cancel,
      ],
      _ => const [],
    };

bool canReschedule(AppointmentStatus status) =>
    status == AppointmentStatus.requested ||
    status == AppointmentStatus.confirmed;

/// Cancelled and missed visits stay on the calendar but do not count as visits.
bool isActiveVisit(Appointment appointment) =>
    appointment.status != AppointmentStatus.cancelled &&
    appointment.status != AppointmentStatus.noShow;

String dayKey(DateTime date) =>
    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

DateTime startOfDay(DateTime date) => DateTime(date.year, date.month, date.day);

DateTime addDays(DateTime date, int days) =>
    DateTime(date.year, date.month, date.day + days);

/// Same day in another month, clamped so 31 January + 1 month is 28 or 29 February.
DateTime addMonths(DateTime date, int months) {
  final lastDay = DateTime(date.year, date.month + months + 1, 0).day;
  return DateTime(
    date.year,
    date.month + months,
    date.day < lastDay ? date.day : lastDay,
  );
}

/// Sunday-to-Saturday week containing [date].
List<DateTime> weekDays(DateTime date) {
  final sunday = addDays(date, -(date.weekday % 7));
  return List.generate(7, (index) => addDays(sunday, index));
}

/// Whole weeks covering the month of [date], Sunday first.
List<DateTime> monthGrid(DateTime date) {
  final first = DateTime(date.year, date.month, 1);
  final daysInMonth = DateTime(date.year, date.month + 1, 0).day;
  final lead = first.weekday % 7;
  final total = ((lead + daysInMonth) / 7).ceil() * 7;
  return List.generate(total, (index) => addDays(first, index - lead));
}

DateTime shiftByView(DateTime date, CalendarView view, int direction) =>
    switch (view) {
      CalendarView.month => addMonths(date, direction),
      CalendarView.week => addDays(date, 7 * direction),
      CalendarView.day => addDays(date, direction),
    };

DateTime endsAt(Appointment appointment) =>
    appointment.startsAt.add(Duration(minutes: appointment.durationMinutes));

Map<String, List<Appointment>> groupByDay(List<Appointment> appointments) {
  final sorted = [...appointments]
    ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
  final map = <String, List<Appointment>>{};
  for (final appointment in sorted) {
    map.putIfAbsent(dayKey(appointment.startsAt), () => []).add(appointment);
  }
  return map;
}

class CalendarMetrics {
  const CalendarMetrics({
    required this.today,
    required this.pending,
    required this.month,
  });

  final int today;
  final int pending;
  final int month;
}

CalendarMetrics metricsFor(
  List<Appointment> appointments, {
  required DateTime now,
  required DateTime selected,
}) {
  final todayKey = dayKey(now);
  return CalendarMetrics(
    today: appointments
        .where((a) => isActiveVisit(a) && dayKey(a.startsAt) == todayKey)
        .length,
    pending: appointments
        .where((a) => a.status == AppointmentStatus.requested)
        .length,
    month: appointments
        .where(
          (a) =>
              isActiveVisit(a) &&
              a.startsAt.year == selected.year &&
              a.startsAt.month == selected.month,
        )
        .length,
  );
}

String initialsOf(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .take(2);
  final value = parts.map((part) => part[0].toUpperCase()).join();
  return value.isEmpty ? '?' : value;
}

/// Same wording as the web calendar, so both surfaces name a status the same way.
String statusLabel(AppointmentStatus status) => switch (status) {
  AppointmentStatus.requested => 'Awaiting doctor',
  AppointmentStatus.confirmed => 'Confirmed',
  AppointmentStatus.completed => 'Completed',
  AppointmentStatus.cancelled => 'Cancelled',
  AppointmentStatus.noShow => 'No-show',
  AppointmentStatus.unknown => 'Status unavailable',
};
