// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/models/doctor_summary.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/screens/appointments/appointments_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('AppointmentsScreen renders hero banner, monthly calendar board, and visits list', (
    tester,
  ) async {
    final now = DateTime.now();
    final appointments = [
      Appointment(
        id: 'appt-1',
        memberId: 'mem-1',
        memberDisplayName: 'John Doe',
        startsAt: DateTime(now.year, now.month, now.day, 10, 30),
        durationMinutes: 30,
        reason: 'Routine checkup',
        status: AppointmentStatus.confirmed,
        doctor: const DoctorSummary(
          id: 'doc-1',
          displayName: 'Dr. Synthetic Verified Doctor',
          specialty: 'General Practice',
        ),
      ),
    ];

    await tester.binding.setSurfaceSize(const Size(800, 1400));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          myAppointmentsProvider.overrideWith((ref) => appointments),
        ],
        child: const MaterialApp(
          home: AppointmentsScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('SCHEDULING'), findsOneWidget);
    expect(find.text('Calendar'), findsOneWidget);
    expect(find.text('Today'), findsNWidgets(2)); // Calendar top bar nav + Filter chip
    expect(find.text('‹ Prev'), findsOneWidget);
    expect(find.text('Next ›'), findsOneWidget);
    expect(find.text('SUN'), findsOneWidget);
    expect(find.text('MON'), findsOneWidget);
    expect(find.textContaining('John Doe'), findsWidgets);
    expect(find.text('Confirmed'), findsOneWidget);
    expect(find.text('Book'), findsOneWidget);
  });
}
