import 'package:family_veda/models/vital.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/records_provider.dart';
import 'package:family_veda/screens/records/records_screen.dart';
import 'package:family_veda/screens/records/vital_entry_screen.dart';
import 'package:family_veda/services/api/mobile_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _VitalApi implements MobileApi {
  final saved = <({String type, double value, String unit, DateTime at})>[];

  @override
  Future<void> addVital({
    required String memberId,
    required String vitalType,
    required double value,
    required String unit,
    required DateTime measuredAt,
  }) async => saved.add((
    type: vitalType,
    value: value,
    unit: unit,
    at: measuredAt,
  ));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Vital _vital(String id, String type, double value, String unit, int day) =>
    Vital(
      id: id,
      memberId: 'member-1',
      vitalType: type,
      value: value,
      unit: unit,
      measuredAt: DateTime.utc(2026, 9, day),
    );

void main() {
  testWidgets('vitals tab shows latest readings and history without interpretation', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => null),
          myMemberIdProvider.overrideWith((ref) async => null),
          memberRecordsProvider.overrideWith((ref) async => const []),
          memberVitalsProvider.overrideWith(
            (ref) async => [
              _vital('h1', 'heart_rate', 80, 'bpm', 1),
              _vital('h2', 'heart_rate', 76, 'bpm', 2),
              _vital('s1', 'blood_pressure_systolic', 128, 'mmHg', 1),
              _vital('d1', 'blood_pressure_diastolic', 82, 'mmHg', 1),
            ],
          ),
        ],
        child: const MaterialApp(home: RecordsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Manual records'.toUpperCase()), findsOneWidget);

    await tester.tap(find.text('Vitals'));
    await tester.pumpAndSettle();

    expect(find.text('Latest vitals'), findsOneWidget);
    expect(find.text('Heart Rate'), findsWidgets);
    expect(find.textContaining('128/82'), findsWidgets);
    expect(find.text('↓ 4'), findsWidgets);
    for (final word in ['normal', 'abnormal', 'diagnos', 'Normal']) {
      expect(find.textContaining(word), findsNothing);
    }
    expect(tester.takeException(), isNull);
  });

  testWidgets('blood pressure is saved as a systolic and diastolic pair', (
    tester,
  ) async {
    final api = _VitalApi();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => 'member-1'),
          mobileApiProvider.overrideWithValue(api),
        ],
        child: const MaterialApp(
          home: VitalEntryScreen(initialKind: VitalKind.pressure),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Systolic (mmHg)'),
      '120',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Diastolic (mmHg)'),
      '80',
    );
    await tester.tap(find.text('Save vital'));
    await tester.pumpAndSettle();

    expect(api.saved.map((entry) => entry.type), [
      'blood_pressure_systolic',
      'blood_pressure_diastolic',
    ]);
    expect(api.saved.map((entry) => entry.value), [120, 80]);
    expect(api.saved.first.at, api.saved.last.at);
  });
}
