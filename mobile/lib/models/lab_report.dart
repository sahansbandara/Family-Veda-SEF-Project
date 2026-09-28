// Phase 2 (S2+S4): lab-report library entry. Range values are counts only — never an interpretation (RULE 1).
class LabRangeSummary {
  const LabRangeSummary({
    required this.belowRange,
    required this.withinRange,
    required this.aboveRange,
    required this.rangeUnavailable,
  });

  factory LabRangeSummary.fromJson(Map<String, dynamic> json) =>
      LabRangeSummary(
        belowRange: (json['belowRange'] as num?)?.toInt() ?? 0,
        withinRange: (json['withinRange'] as num?)?.toInt() ?? 0,
        aboveRange: (json['aboveRange'] as num?)?.toInt() ?? 0,
        rangeUnavailable: (json['rangeUnavailable'] as num?)?.toInt() ?? 0,
      );

  final int belowRange;
  final int withinRange;
  final int aboveRange;
  final int rangeUnavailable;

  String get label =>
      '$belowRange below · $withinRange within · $aboveRange above · $rangeUnavailable no range';
}

class LabReport {
  const LabReport({
    required this.id,
    required this.memberId,
    required this.fileName,
    required this.ocrStatus,
    this.collectedAt,
    this.sharedWithFamilyHead = false,
    this.hasOriginalFile = false,
    this.rangeSummary,
  });

  factory LabReport.fromJson(Map<String, dynamic> json) => LabReport(
    id: json['id'] as String,
    memberId: json['memberId'] as String,
    fileName: (json['originalFileName'] ?? 'Lab report') as String,
    ocrStatus: (json['ocrStatus'] ?? 'Pending') as String,
    collectedAt: json['collectedAt'] == null
        ? null
        : DateTime.parse(json['collectedAt'] as String),
    sharedWithFamilyHead: json['sharedWithFamilyHead'] == true,
    hasOriginalFile: json['hasOriginalFile'] == true,
    rangeSummary: json['rangeSummary'] is Map<String, dynamic>
        ? LabRangeSummary.fromJson(json['rangeSummary'] as Map<String, dynamic>)
        : null,
  );

  final String id;
  final String memberId;
  final String fileName;
  final String ocrStatus;
  final DateTime? collectedAt;
  final bool sharedWithFamilyHead;
  final bool hasOriginalFile;
  final LabRangeSummary? rangeSummary;
}
