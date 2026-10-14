// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// An invitation another Family Head sent to this account's email; approved or rejected in-app.
class IncomingInvitation {
  const IncomingInvitation({
    required this.id,
    required this.familyName,
    required this.invitedByName,
    required this.expiresAt,
    required this.canApprove,
    this.relationshipType,
    this.blockedReason,
  });

  factory IncomingInvitation.fromJson(Map<String, dynamic> json) =>
      IncomingInvitation(
        id: json['id'] as String,
        familyName: json['familyName'] as String? ?? 'A family',
        invitedByName: json['invitedByName'] as String? ?? 'Family Head',
        relationshipType: json['relationshipType'] as String?,
        expiresAt: DateTime.tryParse(
          json['expiresAt'] as String? ?? '',
        )?.toLocal(),
        canApprove: json['canApprove'] as bool? ?? false,
        blockedReason: json['blockedReason'] as String?,
      );

  final String id;
  final String familyName;
  final String invitedByName;
  final String? relationshipType;
  final DateTime? expiresAt;
  final bool canApprove;
  final String? blockedReason;
}
