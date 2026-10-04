// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_summary.dart';
import 'package:family_veda/models/family_doctor_slots.dart';
import 'package:family_veda/providers/family_doctor_slots_provider.dart';
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/screens/family/my_doctor_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets(
    'MyDoctorScreen renders hero banner, current doctor, and search controls',
    (tester) async {
      final dashboard = FamilyDashboard.fromJson({
        'role': 'Head',
        'familyId': 'family-1',
        'familyName': 'Synthetic Perera Family',
        'familyCode': 'FV-7K4P92',
        'memberCount': 4,
        'minorCount': 1,
        'pendingJoinRequests': 0,
        'openCases': 0,
        'approvedGuidanceCount': 0,
        'unreadNotifications': 0,
        'members': [],
        'activity': [],
      });

      final doctor = DoctorSummary.fromJson({
        'id': 'doc-123',
        'displayName': 'Dr. Synthetic Verified Doctor',
        'specialty': 'General Practice',
        'clinic': 'National Hospital Colombo',
        'city': 'Colombo',
        'district': 'Colombo',
        'languages': 'English, Sinhala',
      });

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            familyDoctorSlotsProvider.overrideWith(
              (ref, request) async => const FamilyDoctorSlots(
                configured: false,
                slotMinutes: 30,
                slots: [],
              ),
            ),
            familyDashboardProvider.overrideWith((ref) => dashboard),
            familyDoctorProvider('family-1').overrideWith((ref) => doctor),
            doctorDirectoryProvider.overrideWith(
              (ref) => const <DoctorSummary>[],
            ),
          ],
          child: const MaterialApp(home: MyDoctorScreen()),
        ),
      );
      await tester.pumpAndSettle();

      // Hero elements
      expect(find.text('LONG-TERM CARE'), findsOneWidget);
      expect(find.text('My Doctor'), findsOneWidget);
      expect(find.textContaining('long-term doctor'), findsOneWidget);

      // Current family doctor panel
      expect(find.text('Current family doctor'), findsOneWidget);

      // Find a doctor panel for Family Head
      await tester.scrollUntilVisible(find.text('Find a doctor'), 200);
      expect(find.text('Find a doctor'), findsOneWidget);
      expect(find.text('Search'), findsWidgets);
      expect(find.text('District'), findsOneWidget);
    },
  );
}
