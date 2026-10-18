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
  testWidgets('clears selection when availability refresh fails', (
    tester,
  ) async {
    var fail = false;
    DateTime? selection;
    final slot = DateTime.utc(2026, 10, 19, 4, 30);
    final key = familyDoctorSlotsProvider((familyId: 'f', date: '2026-10-19'));
    final container = ProviderContainer(
      overrides: [
        key.overrideWith((ref) async {
          if (fail) throw Exception('offline');
          return FamilyDoctorSlots(
            configured: true,
            slotMinutes: 30,
            slots: [slot],
          );
        }),
      ],
    );
    addTearDown(container.dispose);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: Scaffold(
            body: FamilyDoctorAvailability(
              familyId: 'f',
              initialSlot: slot,
              onSelected: (value, duration) => selection = value,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(selection, slot);
    fail = true;
    container.invalidate(key);
    await tester.pumpAndSettle();
    expect(selection, isNull);
    expect(find.text('Retry availability'), findsOneWidget);
  });
}
