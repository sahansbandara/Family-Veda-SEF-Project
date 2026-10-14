// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/widgets/doctor/vital_overview_grid.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

List<VitalSeries> _groups() => groupVitals([
  for (final type in [
    'heart_rate',
    'blood_pressure_systolic',
    'blood_pressure_diastolic',
    'temperature',
    'oxygen_saturation',
    'respiratory_rate',
  ])
    VitalReading(
      vitalType: type,
      value: 99,
      unit: 'u',
      measuredAt: DateTime.utc(2026, 10, 1),
      range: LabRange.above,
    ),
]);

Future<void> _pumpAt(WidgetTester tester, double width) async {
  final groups = _groups();
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: SizedBox(
            width: width,
            child: VitalOverviewGrid(
              groups: groups,
              selectedKey: groups.first.key,
              onSelect: (_) {},
            ),
          ),
        ),
      ),
    ),
  );
}

void main() {
  test('column count is 1 on phones, 2 on tablets, 3 on desktop', () {
    expect(vitalGridColumns(375), 1);
    expect(vitalGridColumns(390), 1);
    expect(vitalGridColumns(768), 2);
    expect(vitalGridColumns(1440), 3);
  });

  for (final width in [320.0, 375.0, 390.0, 768.0, 1200.0]) {
    testWidgets('renders six cards without overflow at ${width}px', (
      tester,
    ) async {
      tester.view.physicalSize = Size(width, 2400);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await _pumpAt(tester, width);
      expect(tester.takeException(), isNull);
      expect(find.text('Above reference range'), findsNWidgets(6));
    });
  }
}
