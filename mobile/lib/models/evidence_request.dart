// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)

class EvidenceFile {
  const EvidenceFile({
    required this.id,
    required this.kind,
    required this.fileName,
    this.contentType,
    this.sizeBytes = 0,
  });

  factory EvidenceFile.fromJson(Map<String, dynamic> json) => EvidenceFile(
    id: json['id'].toString(),
    kind: json['kind'].toString(),
    fileName: (json['fileName'] ?? '').toString(),
    contentType: json['contentType']?.toString(),
    sizeBytes: (json['sizeBytes'] as num?)?.toInt() ?? 0,
  );

  final String id;
  final String kind;
  final String fileName;
  final String? contentType;
  final int sizeBytes;
}

class EvidenceRequest {
  const EvidenceRequest({
    required this.id,
    required this.requestedItems,
    required this.isChallenge,
    required this.dueAt,
    required this.status,
    this.note,
    this.files = const [],
  });

  factory EvidenceRequest.fromJson(Map<String, dynamic> json) =>
      EvidenceRequest(
        id: json['id'].toString(),
        requestedItems: [
          for (final k in (json['requestedItems'] as List? ?? const []))
            k.toString(),
        ],
        note: json['note']?.toString(),
        isChallenge: json['isChallenge'] == true,
        dueAt: DateTime.parse(json['dueAt'].toString()),
        status: (json['status'] ?? 'Open').toString(),
        files: [
          for (final f in (json['files'] as List? ?? const []))
            EvidenceFile.fromJson(Map<String, dynamic>.from(f as Map)),
        ],
      );

  final String id;
  final List<String> requestedItems;
  final String? note;
  final bool isChallenge;
  final DateTime dueAt;
  final String status;
  final List<EvidenceFile> files;

  bool get isOpen => status == 'Open';

  bool hasFileFor(String kind) => files.any((f) => f.kind == kind);
}

const evidenceKindLabels = {
  'SlmcCertificate': 'SLMC certificate',
  'NationalIdCopy': 'National ID copy',
  'HospitalLetter': 'Hospital letter',
  'Other': 'Other supporting document',
};
