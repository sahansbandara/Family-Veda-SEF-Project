// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/models/doctor_summary.dart';
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/screens/appointments/appointments_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

const _doctor = DoctorSummary(
  id: 'doc-1',
  displayName: 'Dr. Synthetic Verified Doctor',
  specialty: 'General Practice',
);

Appointment _appt(String id, DateTime startsAt, AppointmentStatus status, {String? note}) =>
    Appointment(
      id: id,
      memberId: 'mem-1',
      memberDisplayName: 'John Doe',
      startsAt: startsAt,
      durationMinutes: 30,
      reason: 'Synthetic reason $id',
      status: status,
      doctor: _doctor,
      doctorNote: note,
    );

Future<void> _pump(WidgetTester tester, List<Appointment> appointments) async {
  await tester.binding.setSurfaceSize(const Size(400, 1600));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        myAppointmentsProvider.overrideWith((ref) => appointments),
        familyDashboardProvider.overrideWith(
          (ref) async => const FamilyDashboard(
            role: 'AdultMember',
            memberCount: 1,
            minorCount: 0,
            openCases: 0,
            approvedGuidanceCount: 0,
            unreadNotifications: 0,
            familyDoctor: _doctor,
          ),
        ),
      ],
      child: const MaterialApp(home: AppointmentsScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  final now = DateTime.now();
  final future = now.add(const Duration(days: 3));
  final past = now.subtract(const Duration(days: 3));

  test('tabs are mutually exclusive', () {
    expect(appointmentTabFor(_appt('a', future, AppointmentStatus.confirmed), now), AppointmentTab.upcoming);
    expect(appointmentTabFor(_appt('b', future, AppointmentStatus.requested), now), AppointmentTab.requests);
    expect(appointmentTabFor(_appt('c', past, AppointmentStatus.confirmed), now), AppointmentTab.past);
    expect(appointmentTabFor(_appt('d', future, AppointmentStatus.cancelled), now), AppointmentTab.past);
  });

  testWidgets('renders hero, stat tiles, real tab counts and expands a card on View', (tester) async {
    await _pump(tester, [
      _appt('a1', future, AppointmentStatus.confirmed, note: 'Synthetic doctor note'),
      _appt('a2', future, AppointmentStatus.requested),
      _appt('a3', past, AppointmentStatus.completed),
    ]);

    expect(find.text('APPOINTMENTS'), findsOneWidget);
    expect(find.text('AWAITING DOCTOR'), findsOneWidget);
    expect(find.text('Dr. Synthetic Verified Doctor'), findsWidgets);
    expect(find.text('Upcoming 1'), findsOneWidget);
    expect(find.text('Requests 1'), findsOneWidget);
    expect(find.text('Past 1'), findsOneWidget);
    expect(find.text('Confirmed'), findsOneWidget);
    expect(find.text('Book'), findsOneWidget);

    await tester.tap(find.text('View'));
    await tester.pumpAndSettle();
    expect(find.text('Synthetic doctor note'), findsOneWidget);

    await tester.tap(find.text('Past 1'));
    await tester.pumpAndSettle();
    expect(find.text('Completed'), findsWidgets);
    expect(find.text('Cancel'), findsNothing);
  });
}
