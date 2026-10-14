import 'package:family_veda/models/vital.dart';
import 'package:flutter_test/flutter_test.dart';

Vital _vital(String id, String type, double value, String unit, DateTime at) =>
    Vital(
      id: id,
      memberId: 'synthetic-member',
      vitalType: type,
      value: value,
      unit: unit,
      measuredAt: at,
    );

void main() {
  test('recognises seeded snake_case and free-text vital names', () {
    expect(vitalKindOf('heart_rate'), VitalKind.heart);
    expect(vitalKindOf('Oxygen (SpO2)'), VitalKind.oxygen);
    expect(vitalKindOf('Body Weight'), VitalKind.weight);
    expect(vitalKindOf('synthetic custom'), VitalKind.other);
  });

  test('pairs systolic and diastolic readings that share a timestamp', () {
    final groups = groupVitals([
      _vital('s1', 'blood_pressure_systolic', 128, 'mmHg', DateTime.utc(2026, 9)),
      _vital('d1', 'blood_pressure_diastolic', 82, 'mmHg', DateTime.utc(2026, 9)),
      _vital('s2', 'blood_pressure_systolic', 131, 'mmHg', DateTime.utc(2026, 8)),
    ]);
    expect(groups, hasLength(1));
    expect(groups.single.label, 'Blood Pressure');
    expect(groups.single.readings.map((reading) => reading.display), [
      '128/82',
      '131/—',
    ]);
  });

  test('orders newest first and reports only the arithmetic change', () {
    final input = [
      _vital('w1', 'weight', 75, 'kg', DateTime.utc(2026, 7)),
      _vital('w3', 'weight', 74.5, 'kg', DateTime.utc(2026, 9)),
      _vital('w2', 'weight', 74.5, 'kg', DateTime.utc(2026, 8)),
    ];
    final group = groupVitals(input).single;
    expect(group.readings.map((reading) => reading.id), ['w3', 'w2', 'w1']);
    expect(group.trend(5), [75, 74.5, 74.5]);
    expect(describeVitalChange(group.changeAt(0)), 'No change');
    expect(describeVitalChange(group.changeAt(1)), '↓ 0.5');
    expect(describeVitalChange(group.changeAt(2)), '—');
    expect(input.map((vital) => vital.id), ['w1', 'w3', 'w2']);
  });
}
