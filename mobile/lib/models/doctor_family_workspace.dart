// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor My Families models and display rules. Mirrors web/src/pages/doctor/familyWorkspace.ts.
// Nothing here decides access: the backend returns null for a restricted category and the UI
// only labels it. null = restricted (no count) · empty = authorised and empty.
import 'package:family_veda/models/appointment.dart';

DateTime? _date(Object? value) =>
    value is String ? DateTime.tryParse(value) : null;

List<Map<String, dynamic>> _maps(Object? value) =>
    (value as List? ?? const []).cast<Map<String, dynamic>>();

class DoctorFamilyRow {
  const DoctorFamilyRow({
    required this.familyId,
    required this.familyName,
    required this.memberCount,
    this.lastVisit,
    this.nextAppointment,
  });

  factory DoctorFamilyRow.fromJson(Map<String, dynamic> json) =>
      DoctorFamilyRow(
        familyId: json['familyId'] as String,
        familyName: json['familyName'] as String? ?? 'Family',
        memberCount: (json['memberCount'] as num?)?.toInt() ?? 0,
        lastVisit: _date(json['lastVisit']),
        nextAppointment: _date(json['nextAppointment']),
      );

  final String familyId;
  final String familyName;
  final int memberCount;
  final DateTime? lastVisit;
  final DateTime? nextAppointment;

  /// A one-person family is an individual patient (same wording as the web page).
  String get title =>
      memberCount == 1 ? '$familyName · Individual patient' : familyName;
}

class FamilyDoctorRequest {
  const FamilyDoctorRequest({
    required this.id,
    required this.familyName,
    required this.memberCount,
    required this.status,
    this.message,
    this.createdAt,
  });

  factory FamilyDoctorRequest.fromJson(Map<String, dynamic> json) =>
      FamilyDoctorRequest(
        id: json['id'] as String,
        familyName: json['familyName'] as String? ?? 'Family',
        memberCount: (json['memberCount'] as num?)?.toInt() ?? 0,
        status: json['status'] as String? ?? '',
        message: json['message'] as String?,
        createdAt: _date(json['createdAt']),
      );

  final String id;
  final String familyName;
  final int memberCount;
  final String status;
  final String? message;
  final DateTime? createdAt;
}

/// Assigned families plus pending requests: one load for the My Families screen.
class DoctorFamiliesOverview {
  const DoctorFamiliesOverview({
    required this.families,
    required this.requests,
  });

  final List<DoctorFamilyRow> families;
  final List<FamilyDoctorRequest> requests;

  List<DateTime> get upcoming =>
      [for (final f in families) ?f.nextAppointment]..sort();
}

String roleLabel(String role) => switch (role) {
  'Head' => 'Family Head',
  'AdultMember' => 'Adult',
  'MinorMember' => 'Minor',
  _ => role,
};

class RosterMember {
  const RosterMember({
    required this.id,
    required this.displayName,
    required this.role,
    required this.clinicalAccess,
  });

  factory RosterMember.fromJson(Map<String, dynamic> json) => RosterMember(
    id: json['id'] as String,
    displayName: json['displayName'] as String? ?? 'Member',
    role: json['role'] as String? ?? '',
    clinicalAccess: json['clinicalAccess'] == true,
  );

  final String id;
  final String displayName;
  final String role;
  final bool clinicalAccess;
}

class FamilyRoster {
  const FamilyRoster({
    required this.familyId,
    required this.familyName,
    required this.members,
  });

  factory FamilyRoster.fromJson(Map<String, dynamic> json) => FamilyRoster(
    familyId: json['familyId'] as String,
    familyName: json['familyName'] as String? ?? 'Family',
    members: _maps(json['members']).map(RosterMember.fromJson).toList(),
  );

  final String familyId;
  final String familyName;
  final List<RosterMember> members;
}

class WorkspaceRecord {
  const WorkspaceRecord({
    required this.id,
    required this.recordType,
    required this.title,
    required this.occurredOn,
    this.summary,
  });

  factory WorkspaceRecord.fromJson(Map<String, dynamic> json) =>
      WorkspaceRecord(
        id: json['id'] as String,
        recordType: json['recordType'] as String? ?? 'Note',
        title: json['title'] as String? ?? '',
        occurredOn: json['occurredOn'] as String? ?? '',
        summary: json['summary'] as String?,
      );

  final String id;
  final String recordType;
  final String title;
  final String occurredOn;
  final String? summary;
}

enum LabRange {
  below('Below range'),
  within('Within range'),
  above('Above range'),
  unavailable('Range unavailable');

  const LabRange(this.label);
  final String label;

  static LabRange fromApi(Object? value) => switch (value) {
    'BelowRange' => LabRange.below,
    'WithinRange' => LabRange.within,
    'AboveRange' => LabRange.above,
    _ => LabRange.unavailable,
  };
}

String _number(num value) =>
    value == value.roundToDouble() ? value.toInt().toString() : '$value';

class LabValue {
  const LabValue({
    required this.analyte,
    required this.value,
    required this.unit,
    required this.range,
    this.referenceLow,
    this.referenceHigh,
  });

  factory LabValue.fromJson(Map<String, dynamic> json) => LabValue(
    analyte: json['analyte'] as String? ?? '',
    value: json['value'] as num? ?? 0,
    unit: json['unit'] as String? ?? '',
    range: LabRange.fromApi(json['rangeStatus']),
    referenceLow: json['referenceLow'] as num?,
    referenceHigh: json['referenceHigh'] as num?,
  );

  final String analyte;
  final num value;
  final String unit;
  final LabRange range;
  final num? referenceLow;
  final num? referenceHigh;

  String get valueLabel => '${_number(value)} $unit';

  /// The interval printed on the report. None is invented when the report printed none.
  String get referenceLabel {
    final low = referenceLow, high = referenceHigh;
    if (low == null && high == null) return 'Not printed';
    if (low != null && high != null) {
      return '${_number(low)} – ${_number(high)} $unit';
    }
    return low != null
        ? 'From ${_number(low)} $unit'
        : 'Up to ${_number(high!)} $unit';
  }
}

class LabReport {
  const LabReport({
    required this.id,
    required this.fileName,
    required this.values,
    this.collectedAt,
    this.hasOriginalFile = false,
  });

  factory LabReport.fromJson(Map<String, dynamic> json) => LabReport(
    id: json['id'] as String,
    fileName: json['fileName'] as String? ?? 'Report',
    collectedAt: _date(json['collectedAt']),
    hasOriginalFile: json['hasOriginalFile'] == true,
    values: _maps(json['values']).map(LabValue.fromJson).toList(),
  );

  final String id;
  final String fileName;
  final DateTime? collectedAt;
  final bool hasOriginalFile;
  final List<LabValue> values;
}

class VitalReading {
  const VitalReading({
    required this.vitalType,
    required this.value,
    required this.unit,
    required this.measuredAt,
  });

  factory VitalReading.fromJson(Map<String, dynamic> json) => VitalReading(
    vitalType: json['vitalType'] as String? ?? '',
    value: json['value'] as num? ?? 0,
    unit: json['unit'] as String? ?? '',
    measuredAt:
        _date(json['measuredAt']) ?? DateTime.fromMillisecondsSinceEpoch(0),
  );

  final String vitalType;
  final num value;
  final String unit;
  final DateTime measuredAt;

  String get valueLabel => '${_number(value)} $unit';
}

const _vitalLabels = {
  'heart_rate': 'Heart rate',
  'blood_pressure_systolic': 'Systolic blood pressure',
  'blood_pressure_diastolic': 'Diastolic blood pressure',
  'weight': 'Weight',
  'height': 'Height',
  'temperature': 'Temperature',
  'respiratory_rate': 'Respiratory rate',
  'oxygen_saturation': 'Oxygen saturation',
  'blood_glucose': 'Blood glucose',
  'bmi': 'Body mass index',
};

String _splitWords(String value) =>
    value.replaceAllMapped(RegExp('([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}');

/// `heart_rate` → `Heart rate`. A name the member typed is kept, only tidied.
String vitalLabel(String vitalType) {
  final known = _vitalLabels[vitalType.trim().toLowerCase()];
  if (known != null) return known;
  final words = _splitWords(vitalType).replaceAll(RegExp('[_-]+'), ' ').trim();
  return words.isEmpty
      ? 'Measurement'
      : words[0].toUpperCase() + words.substring(1);
}

class VitalSeries {
  VitalSeries(this.key, this.label, this.unit);

  final String key;
  final String label;
  final String unit;

  /// Newest first.
  final List<VitalReading> readings = [];

  VitalReading get latest => readings.first;
}

/// Groups readings that share a type and a unit. Different units are never mixed in one series.
List<VitalSeries> groupVitals(List<VitalReading> vitals) {
  final groups = <String, VitalSeries>{};
  for (final vital in vitals) {
    final key =
        '${vital.vitalType.trim().toLowerCase()}|${vital.unit.trim().toLowerCase()}';
    groups
        .putIfAbsent(
          key,
          () => VitalSeries(key, vitalLabel(vital.vitalType), vital.unit),
        )
        .readings
        .add(vital);
  }
  for (final series in groups.values) {
    series.readings.sort((a, b) => b.measuredAt.compareTo(a.measuredAt));
  }
  return groups.values.toList()..sort((a, b) => a.label.compareTo(b.label));
}

class WorkspaceVisit {
  const WorkspaceVisit({
    required this.appointmentId,
    required this.startsAt,
    required this.reason,
    required this.status,
  });

  factory WorkspaceVisit.fromJson(Map<String, dynamic> json) => WorkspaceVisit(
    appointmentId: json['appointmentId'] as String,
    startsAt: _date(json['startsAt']) ?? DateTime.fromMillisecondsSinceEpoch(0),
    reason: json['reason'] as String? ?? '',
    status: AppointmentStatus.fromApi(json['status'] as String?),
  );

  final String appointmentId;
  final DateTime startsAt;
  final String reason;
  final AppointmentStatus status;

  bool isUpcoming(DateTime now) =>
      !startsAt.isBefore(now) &&
      (status == AppointmentStatus.confirmed ||
          status == AppointmentStatus.requested);
}

class ClinicalNote {
  const ClinicalNote({
    required this.id,
    required this.content,
    required this.version,
    this.amendsNoteId,
    this.createdAt,
  });

  factory ClinicalNote.fromJson(Map<String, dynamic> json) => ClinicalNote(
    id: json['id'] as String,
    content: json['content'] as String? ?? '',
    version: (json['version'] as num?)?.toInt() ?? 1,
    amendsNoteId: json['amendsNoteId'] as String?,
    createdAt: _date(json['createdAt']),
  );

  final String id;
  final String content;
  final int version;
  final String? amendsNoteId;
  final DateTime? createdAt;

  /// Amendments always point at the original note, so the version chain stays one chain.
  String get rootId => amendsNoteId ?? id;
  String get versionLabel =>
      version > 1 ? 'Amendment v$version' : 'Original note';
}

class HereditaryFlag {
  const HereditaryFlag({required this.conditionCode, required this.finding});

  factory HereditaryFlag.fromJson(Map<String, dynamic> json) => HereditaryFlag(
    conditionCode: json['conditionCode'] as String? ?? '',
    finding: json['finding'] as String? ?? '',
  );

  final String conditionCode;
  final String finding;
}

String consentLabel(String category) => switch (category) {
  'Conditions' => 'Conditions / Records',
  'VitalsSummary' => 'Vitals summary',
  'HereditaryFlags' => 'Family-history screening',
  _ => _splitWords(category),
};

class MemberWorkspace {
  const MemberWorkspace({
    required this.memberId,
    required this.displayName,
    required this.role,
    required this.familyId,
    required this.familyName,
    required this.clinicalAccess,
    required this.accessBasis,
    required this.consentedCategories,
    required this.visits,
    required this.notes,
    this.accessExpiresAt,
    this.records,
    this.labReports,
    this.vitals,
    this.hereditaryFlags,
  });

  factory MemberWorkspace.fromJson(Map<String, dynamic> json) {
    List<T>? optional<T>(String key, T Function(Map<String, dynamic>) map) =>
        json[key] == null ? null : _maps(json[key]).map(map).toList();

    return MemberWorkspace(
      memberId: json['memberId'] as String,
      displayName: json['displayName'] as String? ?? 'Member',
      role: json['role'] as String? ?? '',
      familyId: json['familyId'] as String,
      familyName: json['familyName'] as String? ?? 'Family',
      clinicalAccess: json['clinicalAccess'] == true,
      accessBasis: json['accessBasis'] as String? ?? '',
      accessExpiresAt: _date(json['accessExpiresAt']),
      consentedCategories: (json['consentedCategories'] as List? ?? const [])
          .cast<String>(),
      records: optional('records', WorkspaceRecord.fromJson),
      labReports: optional('labReports', LabReport.fromJson),
      vitals: optional('vitals', VitalReading.fromJson),
      hereditaryFlags: optional('hereditaryFlags', HereditaryFlag.fromJson),
      visits: _maps(json['visits']).map(WorkspaceVisit.fromJson).toList(),
      notes: _maps(json['notes']).map(ClinicalNote.fromJson).toList(),
    );
  }

  final String memberId;
  final String displayName;
  final String role;
  final String familyId;
  final String familyName;
  final bool clinicalAccess;
  final String accessBasis;
  final DateTime? accessExpiresAt;
  final List<String> consentedCategories;
  final List<WorkspaceRecord>? records;
  final List<LabReport>? labReports;
  final List<VitalReading>? vitals;
  final List<HereditaryFlag>? hereditaryFlags;
  final List<WorkspaceVisit> visits;
  final List<ClinicalNote> notes;

  List<WorkspaceVisit> upcomingVisits(DateTime now) =>
      visits.where((v) => v.isUpcoming(now)).toList()
        ..sort((a, b) => a.startsAt.compareTo(b.startsAt));

  List<WorkspaceVisit> pastVisits(DateTime now) =>
      visits.where((v) => !v.isUpcoming(now)).toList()
        ..sort((a, b) => b.startsAt.compareTo(a.startsAt));
}

String initialsOf(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
  final text = parts.take(2).map((p) => p[0].toUpperCase()).join();
  return text.isEmpty ? '?' : text;
}
