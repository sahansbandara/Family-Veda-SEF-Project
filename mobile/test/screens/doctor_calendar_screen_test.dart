// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:dio/dio.dart';
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/providers/doctor_provider.dart';
import 'package:family_veda/screens/doctor/doctor_calendar_screen.dart';
import 'package:family_veda/services/api/doctor_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// In-memory stand-in for the HTTP client. Synthetic data only.
class _FakeDoctorApi implements DoctorApi {
  _FakeDoctorApi(this.items);

  List<Appointment> items;
  final calls = <String>[];
  Object? failWith;

  Appointment _set(String id, AppointmentStatus status, String call) {
    calls.add('$call:$id');
    if (failWith != null) throw failWith!;
    final old = items.firstWhere((a) => a.id == id);
    final updated = Appointment(
      id: old.id,
      memberId: old.memberId,
      memberDisplayName: old.memberDisplayName,
      familyName: old.familyName,
      startsAt: old.startsAt,
      durationMinutes: old.durationMinutes,
      reason: old.reason,
      status: status,
    );
    items = [for (final a in items) a.id == id ? updated : a];
    return updated;
  }

  @override
  Future<List<Appointment>> getDoctorAppointments() async => items;
  @override
  Future<Appointment> confirmAppointment(String id) async =>
      _set(id, AppointmentStatus.confirmed, 'confirm');
  @override
  Future<Appointment> completeAppointment(String id) async =>
      _set(id, AppointmentStatus.completed, 'complete');
  @override
  Future<Appointment> noShowAppointment(String id) async =>
      _set(id, AppointmentStatus.noShow, 'no-show');
  @override
  Future<Appointment> cancelAppointment(String id, {String? note}) async =>
      _set(id, AppointmentStatus.cancelled, 'cancel');
  @override
  Future<Appointment> rescheduleAppointment(
    String id,
    DateTime startsAt,
  ) async => _set(id, AppointmentStatus.confirmed, 'reschedule');
}

Appointment _appointment(
  String id,
  int dayOffset,
  int hour,
  AppointmentStatus status,
  String name,
  String reason,
) {
  final now = DateTime.now();
  return Appointment(
    id: id,
    memberId: 'm-$id',
    memberDisplayName: name,
    familyName: 'Synthetic Demonstration Family',
    startsAt: DateTime(now.year, now.month, now.day + dayOffset, hour),
    durationMinutes: 30,
    reason: reason,
    status: status,
  );
}

Future<_FakeDoctorApi> _pump(
  WidgetTester tester, {
  Size size = const Size(390, 844),
}) async {
  final api = _FakeDoctorApi([
    _appointment(
      'apt-1',
      0,
      10,
      AppointmentStatus.confirmed,
      'Synthetic Head',
      'Routine health checkup',
    ),
    _appointment(
      'apt-2',
      0,
      14,
      AppointmentStatus.requested,
      'Synthetic Minor',
      'Follow-up visit',
    ),
    _appointment(
      'apt-3',
      0,
      16,
      AppointmentStatus.completed,
      'Synthetic Adult',
      'Annual review',
    ),
  ]);
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    ProviderScope(
      overrides: [doctorApiProvider.overrideWithValue(api)],
      child: const MaterialApp(home: DoctorCalendarScreen()),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

Future<void> _openAppointment(WidgetTester tester, String id) async {
  final finder = find.byKey(ValueKey('appointment-$id'));
  await tester.scrollUntilVisible(
    finder,
    120,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'shows metrics, the date strip and today\'s agenda from the API',
    (tester) async {
      await _pump(tester);

      expect(find.text('My Calendar'), findsOneWidget);
      expect(find.text("Today's visits"), findsOneWidget);
      expect(find.text('Pending requests'), findsOneWidget);
      expect(find.text('Synthetic Head'), findsOneWidget);
      expect(find.text('Follow-up visit'), findsOneWidget);
      expect(find.text('Awaiting doctor'), findsOneWidget);
      expect(find.textContaining('3 appointments'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('fits a small phone with large text without overflow', (
    tester,
  ) async {
    tester.platformDispatcher.textScaleFactorTestValue = 1.6;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await _pump(tester, size: const Size(320, 568));

    await tester.scrollUntilVisible(
      find.text('Synthetic Adult'),
      120,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Synthetic Adult'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('moving to another day updates the agenda', (tester) async {
    await _pump(tester);

    await tester.tap(find.byTooltip('Next day'));
    await tester.pumpAndSettle();
    expect(find.text('Synthetic Head'), findsNothing);
    expect(find.text('No appointments on this day.'), findsOneWidget);

    await tester.tap(find.text('Today'));
    await tester.pumpAndSettle();
    expect(find.text('Synthetic Head'), findsOneWidget);
  });

  testWidgets('week and month views are available', (tester) async {
    await _pump(tester);

    await tester.tap(find.text('Month'));
    await tester.pumpAndSettle();
    expect(find.text('SUN'), findsOneWidget);
    expect(find.text('Synthetic Head'), findsOneWidget);

    await tester.tap(find.text('Week'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Next week'), findsOneWidget);
    expect(find.text('Synthetic Head'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'a requested appointment offers confirm, reschedule and cancel only',
    (tester) async {
      await _pump(tester);
      await _openAppointment(tester, 'apt-2');

      expect(find.text('Appointment details'), findsOneWidget);
      expect(find.text('Confirm appointment'), findsOneWidget);
      expect(find.text('Reschedule'), findsOneWidget);
      expect(find.text('Cancel appointment'), findsOneWidget);
      expect(find.text('Complete visit'), findsNothing);
      expect(find.text('Mark no-show'), findsNothing);
    },
  );

  testWidgets('a completed appointment is read-only', (tester) async {
    await _pump(tester);
    await _openAppointment(tester, 'apt-3');

    expect(find.textContaining('This appointment is closed'), findsOneWidget);
    expect(find.text('Reschedule'), findsNothing);
    expect(find.text('Cancel appointment'), findsNothing);
  });

  testWidgets('completing asks first, then shows what the server saved', (
    tester,
  ) async {
    final api = await _pump(tester);
    await _openAppointment(tester, 'apt-1');

    await tester.tap(find.text('Complete visit'));
    await tester.pumpAndSettle();
    expect(api.calls, isEmpty);

    await tester.tap(find.text('Yes, complete visit'));
    await tester.pumpAndSettle();

    expect(api.calls, ['complete:apt-1']);
    expect(find.text('Appointment details'), findsNothing);
    expect(
      find.text("Synthetic Head's appointment marked as completed."),
      findsOneWidget,
    );
    expect(find.text('Completed'), findsNWidgets(2));
  });

  testWidgets('a rejected action keeps the sheet open with the server reason', (
    tester,
  ) async {
    final api = await _pump(tester);
    api.failWith = DioException(
      requestOptions: RequestOptions(
        path: '/doctors/me/appointments/apt-2/confirm',
      ),
      response: Response(
        requestOptions: RequestOptions(
          path: '/doctors/me/appointments/apt-2/confirm',
        ),
        statusCode: 409,
        data: <String, dynamic>{
          'message':
              'This appointment has already started. Reschedule it or cancel it instead.',
        },
      ),
    );
    await _openAppointment(tester, 'apt-2');

    await tester.tap(find.text('Confirm appointment'));
    await tester.pumpAndSettle();

    expect(find.textContaining('already started'), findsOneWidget);
    expect(find.text('Appointment details'), findsOneWidget);
    expect(find.text('Awaiting doctor'), findsNWidgets(2));
  });
}
