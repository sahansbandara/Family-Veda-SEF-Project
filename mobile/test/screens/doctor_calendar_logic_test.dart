// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/screens/doctor/doctor_calendar_logic.dart';
import 'package:flutter_test/flutter_test.dart';

Appointment _appointment(
  String id,
  DateTime startsAt,
  AppointmentStatus status,
) => Appointment(
  id: id,
  memberId: 'm-$id',
  memberDisplayName: 'Synthetic Member',
  startsAt: startsAt,
  durationMinutes: 30,
  reason: 'Synthetic visit',
  status: status,
);

void main() {
  test('offers only the transitions the backend state machine allows', () {
    expect(allowedActions(AppointmentStatus.requested), [
      AppointmentAction.confirm,
      AppointmentAction.cancel,
    ]);
    expect(allowedActions(AppointmentStatus.confirmed), [
      AppointmentAction.complete,
      AppointmentAction.noShow,
      AppointmentAction.cancel,
    ]);
    for (final closed in [
      AppointmentStatus.completed,
      AppointmentStatus.cancelled,
      AppointmentStatus.noShow,
    ]) {
      expect(allowedActions(closed), isEmpty);
      expect(canReschedule(closed), isFalse);
    }
    expect(canReschedule(AppointmentStatus.requested), isTrue);
  });

  test('builds whole weeks for a month, Sunday first', () {
    final grid = monthGrid(DateTime(2026, 10, 14));
    expect(grid, hasLength(35));
    expect(dayKey(grid.first), '2026-09-27');
    expect(dayKey(grid.last), '2026-10-31');
    expect(weekDays(DateTime(2026, 10, 14)).map(dayKey), [
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
    ]);
  });

  test('steps by view and clamps short months', () {
    expect(dayKey(addMonths(DateTime(2026, 1, 31), 1)), '2026-02-28');
    expect(
      dayKey(shiftByView(DateTime(2026, 10, 14), CalendarView.week, -1)),
      '2026-10-07',
    );
    expect(
      dayKey(shiftByView(DateTime(2026, 10, 31), CalendarView.day, 1)),
      '2026-11-01',
    );
  });

  test('metrics count active visits and pending requests', () {
    final now = DateTime(2026, 10, 14, 8);
    final items = [
      _appointment('a', DateTime(2026, 10, 14, 9), AppointmentStatus.confirmed),
      _appointment(
        'b',
        DateTime(2026, 10, 14, 11),
        AppointmentStatus.cancelled,
      ),
      _appointment('c', DateTime(2026, 10, 20, 9), AppointmentStatus.requested),
      _appointment('d', DateTime(2026, 11, 2, 9), AppointmentStatus.requested),
    ];
    final metrics = metricsFor(items, now: now, selected: now);
    expect(metrics.today, 1);
    expect(metrics.pending, 2);
    expect(metrics.month, 2);
    expect(groupByDay(items)['2026-10-14']!.map((a) => a.id), ['a', 'b']);
  });

  test('uses the same status wording as the web calendar', () {
    expect(statusLabel(AppointmentStatus.requested), 'Awaiting doctor');
    expect(statusLabel(AppointmentStatus.noShow), 'No-show');
  });
}
