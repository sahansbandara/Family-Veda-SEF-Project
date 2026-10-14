import 'package:family_veda/models/family_doctor_slots.dart';
import 'package:family_veda/providers/family_doctor_slots_provider.dart';
import 'package:family_veda/widgets/family/family_doctor_availability.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';

void main() {
  test('Sri Lanka time is independent of device timezone', () {
    expect(sriLankaTime(DateTime.parse('2026-10-04T03:30:00Z')).hour, 9);
    expect(sriLankaTime(DateTime.parse('2026-10-04T09:00:00+05:30')).hour, 9);
  });
  for (final configured in [false, true]) {
    testWidgets('empty availability distinguishes configured=$configured', (
      tester,
    ) async {
      final now = sriLankaTime(DateTime.now());
      final request = (
        familyId: 'synthetic-family',
        date: DateFormat('yyyy-MM-dd').format(now),
      );
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            familyDoctorSlotsProvider(request).overrideWith(
              (ref) async => FamilyDoctorSlots(
                configured: configured,
                slotMinutes: 30,
                slots: const [],
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: FamilyDoctorAvailability(familyId: 'synthetic-family'),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(
        find.textContaining(
          configured ? 'No available slots' : 'not configured',
        ),
        findsOneWidget,
      );
      expect(find.text('Sri Lanka time · UTC+05:30'), findsOneWidget);
    });
  }
}
