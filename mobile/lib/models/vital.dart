// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// [S2] Recorded vitals and their display grouping. Values only: no reference range and no
// interpretation is applied here (RULE 1, RULE 4).
class Vital {
  const Vital({
    required this.id,
    required this.memberId,
    required this.vitalType,
    required this.value,
    required this.unit,
    required this.measuredAt,
  });

  factory Vital.fromJson(Map<String, dynamic> json) => Vital(
    id: json['id'] as String,
    memberId: json['memberId'] as String,
    vitalType: json['vitalType'] as String,
    value: (json['value'] as num).toDouble(),
    unit: json['unit'] as String,
    measuredAt: DateTime.parse(json['measuredAt'] as String),
  );

  final String id;
  final String memberId;
  final String vitalType;
  final double value;
  final String unit;
  final DateTime measuredAt;
}

enum VitalKind { heart, pressure, temperature, oxygen, weight, glucose, other }

/// One quick-add choice. Blood pressure has two fields: it is stored as a systolic and a
/// diastolic reading that share one timestamp.
class VitalPreset {
  const VitalPreset({
    required this.kind,
    required this.label,
    required this.hint,
    required this.unit,
    required this.fields,
  });

  final VitalKind kind;
  final String label;
  final String hint;
  final String unit;

  /// API vital type to field label.
  final Map<String, String> fields;
}

const vitalPresets = <VitalPreset>[
  VitalPreset(
    kind: VitalKind.heart,
    label: 'Heart Rate',
    hint: 'BPM',
    unit: 'bpm',
    fields: {'heart_rate': 'Heart rate'},
  ),
  VitalPreset(
    kind: VitalKind.pressure,
    label: 'Blood Pressure',
    hint: 'Systolic / Diastolic (mmHg)',
    unit: 'mmHg',
    fields: {
      'blood_pressure_systolic': 'Systolic',
      'blood_pressure_diastolic': 'Diastolic',
    },
  ),
  VitalPreset(
    kind: VitalKind.temperature,
    label: 'Body Temperature',
    hint: '°C',
    unit: '°C',
    fields: {'temperature': 'Temperature'},
  ),
  VitalPreset(
    kind: VitalKind.oxygen,
    label: 'Oxygen (SpO₂)',
    hint: 'Percentage (%)',
    unit: '%',
    fields: {'oxygen_saturation': 'Oxygen saturation'},
  ),
  VitalPreset(
    kind: VitalKind.weight,
    label: 'Weight',
    hint: 'Kilograms (kg)',
    unit: 'kg',
    fields: {'weight': 'Weight'},
  ),
  VitalPreset(
    kind: VitalKind.glucose,
    label: 'Blood Glucose',
    hint: 'mg/dL',
    unit: 'mg/dL',
    fields: {'blood_glucose': 'Blood glucose'},
  ),
];

const _kindByKey = <String, VitalKind>{
  'heart_rate': VitalKind.heart,
  'pulse': VitalKind.heart,
  'blood_pressure': VitalKind.pressure,
  'blood_pressure_systolic': VitalKind.pressure,
  'blood_pressure_diastolic': VitalKind.pressure,
  'systolic': VitalKind.pressure,
  'diastolic': VitalKind.pressure,
  'temperature': VitalKind.temperature,
  'body_temperature': VitalKind.temperature,
  'oxygen_saturation': VitalKind.oxygen,
  'oxygen_spo2': VitalKind.oxygen,
  'spo2': VitalKind.oxygen,
  'oxygen': VitalKind.oxygen,
  'weight': VitalKind.weight,
  'body_weight': VitalKind.weight,
  'blood_glucose': VitalKind.glucose,
  'glucose': VitalKind.glucose,
};

String vitalKey(String vitalType) => vitalType
    .toLowerCase()
    .replaceAll(RegExp('[^a-z0-9]+'), '_')
    .replaceAll(RegExp(r'^_+|_+$'), '');

VitalKind vitalKindOf(String vitalType) =>
    _kindByKey[vitalKey(vitalType)] ?? VitalKind.other;

String formatVitalNumber(double value) {
  if (value == value.roundToDouble()) return value.toInt().toString();
  return double.parse(value.toStringAsFixed(2)).toString();
}

class VitalReading {
  const VitalReading({
    required this.id,
    required this.measuredAt,
    required this.display,
    required this.value,
    required this.unit,
  });

  final String id;
  final DateTime measuredAt;

  /// Text shown to the user, e.g. "128/82" for a paired blood pressure reading.
  final String display;

  /// Number plotted on the trend line (systolic for blood pressure).
  final double value;
  final String unit;
}

class VitalGroup {
  const VitalGroup({
    required this.key,
    required this.kind,
    required this.label,
    required this.unit,
    required this.readings,
  });

  final String key;
  final VitalKind kind;
  final String label;
  final String unit;

  /// Newest first.
  final List<VitalReading> readings;

  /// Oldest-to-newest values for a trend line.
  List<double> trend(int count) => readings
      .take(count)
      .map((reading) => reading.value)
      .toList()
      .reversed
      .toList(growable: false);

  /// Arithmetic difference from the previous reading: a recorded fact, not an assessment.
  /// Null when there is no earlier reading.
  double? changeAt(int index) {
    if (index + 1 >= readings.length) return null;
    final delta = readings[index].value - readings[index + 1].value;
    return double.parse(delta.toStringAsFixed(2));
  }
}

String describeVitalChange(double? change) {
  if (change == null) return '—';
  if (change == 0) return 'No change';
  return '${change > 0 ? '↑' : '↓'} ${formatVitalNumber(change.abs())}';
}

String _titleCase(String vitalType) => vitalKey(vitalType)
    .split('_')
    .where((word) => word.isNotEmpty)
    .map((word) => '${word[0].toUpperCase()}${word.substring(1)}')
    .join(' ');

/// Groups vitals by measurement, pairing systolic and diastolic readings taken at the same time.
/// The supplied list is not modified.
List<VitalGroup> groupVitals(List<Vital> vitals) {
  final readings = <String, List<VitalReading>>{};
  final meta = <String, ({VitalKind kind, String label, String unit})>{};
  final systolic = <DateTime, Vital>{};
  final diastolic = <DateTime, Vital>{};

  for (final vital in vitals) {
    final key = vitalKey(vital.vitalType);
    final kind = vitalKindOf(vital.vitalType);
    if (kind == VitalKind.pressure && key != 'blood_pressure') {
      (key.contains('diastolic') ? diastolic : systolic)[vital.measuredAt] =
          vital;
      continue;
    }
    final groupKey = kind == VitalKind.other ? key : kind.name;
    final preset = vitalPresets.where((item) => item.kind == kind).firstOrNull;
    meta.putIfAbsent(
      groupKey,
      () => (
        kind: kind,
        label: preset?.label ?? _titleCase(vital.vitalType),
        unit: vital.unit,
      ),
    );
    readings
        .putIfAbsent(groupKey, () => [])
        .add(
          VitalReading(
            id: vital.id,
            measuredAt: vital.measuredAt,
            display: formatVitalNumber(vital.value),
            value: vital.value,
            unit: vital.unit,
          ),
        );
  }

  final pairedTimes = {...systolic.keys, ...diastolic.keys};
  if (pairedTimes.isNotEmpty) {
    final key = VitalKind.pressure.name;
    final any = (systolic.values.firstOrNull ?? diastolic.values.first);
    meta.putIfAbsent(
      key,
      () => (kind: VitalKind.pressure, label: 'Blood Pressure', unit: any.unit),
    );
    for (final time in pairedTimes) {
      final upper = systolic[time];
      final lower = diastolic[time];
      readings
          .putIfAbsent(key, () => [])
          .add(
            VitalReading(
              id: (upper ?? lower)!.id,
              measuredAt: time,
              display:
                  '${upper == null ? '—' : formatVitalNumber(upper.value)}/${lower == null ? '—' : formatVitalNumber(lower.value)}',
              value: (upper ?? lower)!.value,
              unit: (upper ?? lower)!.unit,
            ),
          );
    }
  }

  final order = vitalPresets.map((preset) => preset.kind.name).toList();
  int rank(String key) {
    final index = order.indexOf(key);
    return index == -1 ? order.length : index;
  }

  final groups = [
    for (final entry in readings.entries)
      VitalGroup(
        key: entry.key,
        kind: meta[entry.key]!.kind,
        label: meta[entry.key]!.label,
        unit: meta[entry.key]!.unit,
        readings: [...entry.value]
          ..sort((a, b) => b.measuredAt.compareTo(a.measuredAt)),
      ),
  ];
  groups.sort((a, b) {
    final byRank = rank(a.key).compareTo(rank(b.key));
    return byRank != 0 ? byRank : a.label.compareTo(b.label);
  });
  return groups;
}
