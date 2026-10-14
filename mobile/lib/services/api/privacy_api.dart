// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Privacy & Access API: the same ASP.NET Core endpoints the React PrivacyPage uses (invariants 1 and 2).
// Audit entries carry metadata only — never clinical content (RULE 8).
import 'package:family_veda/services/api/api_client.dart';

class PrivacyMember {
  const PrivacyMember({required this.id, required this.displayName, required this.role});

  factory PrivacyMember.fromJson(Map<String, dynamic> json) => PrivacyMember(
    id: json['id'] as String,
    displayName: (json['displayName'] as String?) ?? 'Member',
    role: (json['role'] as String?) ?? 'AdultMember',
  );

  final String id;
  final String displayName;
  final String role;

  bool get isMinor => role == 'MinorMember';
}

class ConsentSetting {
  const ConsentSetting({required this.id, required this.category, required this.status});

  factory ConsentSetting.fromJson(Map<String, dynamic> json) => ConsentSetting(
    id: (json['id'] as String?) ?? '${json['category']}',
    category: json['category'] as String,
    status: (json['status'] as String?) ?? 'NotSet',
  );

  final String id;
  final String category;
  final String status;

  bool get granted => status == 'Granted';

  /// Valid transitions only: NotSet/Revoked/PendingReaffirmation → Granted, Granted → Revoked.
  String get nextStatus => granted ? 'Revoked' : 'Granted';
}

class AuditEntry {
  const AuditEntry({
    required this.id,
    required this.eventType,
    required this.resourceType,
    required this.outcome,
    this.createdAt,
  });

  factory AuditEntry.fromJson(Map<String, dynamic> json) => AuditEntry(
    id: json['id'] as String,
    eventType: (json['eventType'] as String?) ?? 'UNKNOWN',
    resourceType: (json['resourceType'] as String?) ?? '—',
    outcome: (json['outcome'] as String?) ?? '—',
    createdAt: DateTime.tryParse((json['createdAt'] as String?) ?? '')?.toLocal(),
  );

  final String id;
  final String eventType;
  final String resourceType;
  final String outcome;
  final DateTime? createdAt;
}

class AuditPage {
  const AuditPage({required this.items, required this.page, required this.totalPages, required this.totalCount});

  final List<AuditEntry> items;
  final int page;
  final int totalPages;
  final int totalCount;
}

class SharedItem {
  const SharedItem({required this.id, required this.isReport, required this.title, required this.shared, this.date});

  final String id;
  final bool isReport;
  final String title;
  final bool shared;
  final DateTime? date;
}

abstract interface class PrivacyApi {
  Future<PrivacyMember> getMe();
  Future<List<PrivacyMember>> getFamilyMembers();
  Future<List<ConsentSetting>> getConsents(String memberId);
  Future<void> setConsent(String memberId, String category, String status);
  Future<AuditPage> getAudit({int page = 1, int pageSize = 20});

  /// Items an adult may see: their own (all), or another adult's shared items (count only).
  Future<List<SharedItem>> getSharingItems(String memberId);
  Future<void> setSharing(SharedItem item, {required bool shared});
}

class DioPrivacyApi implements PrivacyApi {
  const DioPrivacyApi(this._client);

  final ApiClient _client;

  @override
  Future<PrivacyMember> getMe() async {
    final response = await _client.dio.get<Map<String, dynamic>>('/members/me');
    final data = response.data;
    if (data == null) throw const FormatException('Empty member response');
    return PrivacyMember.fromJson(data);
  }

  @override
  Future<List<PrivacyMember>> getFamilyMembers() async {
    final response = await _client.dio.get<Map<String, dynamic>>('/families/me');
    final members = (response.data?['members'] as List?) ?? const [];
    return members.cast<Map<String, dynamic>>().map(PrivacyMember.fromJson).toList(growable: false);
  }

  @override
  Future<List<ConsentSetting>> getConsents(String memberId) async {
    final response = await _client.dio.get<List<dynamic>>('/members/$memberId/consents');
    return (response.data ?? const []).cast<Map<String, dynamic>>().map(ConsentSetting.fromJson).toList(growable: false);
  }

  @override
  Future<void> setConsent(String memberId, String category, String status) async {
    await _client.dio.put<void>('/members/$memberId/consents/$category', data: {'status': status});
  }

  @override
  Future<AuditPage> getAudit({int page = 1, int pageSize = 20}) async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      '/audit',
      queryParameters: {'page': page, 'pageSize': pageSize},
    );
    final data = response.data ?? const <String, dynamic>{};
    final items = ((data['items'] as List?) ?? const []).cast<Map<String, dynamic>>().map(AuditEntry.fromJson).toList(growable: false);
    return AuditPage(
      items: items,
      page: (data['page'] as num?)?.toInt() ?? page,
      totalPages: (data['totalPages'] as num?)?.toInt() ?? 1,
      totalCount: (data['totalCount'] as num?)?.toInt() ?? items.length,
    );
  }

  @override
  Future<List<SharedItem>> getSharingItems(String memberId) async {
    final reports = await _client.dio.get<List<dynamic>>('/members/$memberId/lab-reports');
    final items = <SharedItem>[
      for (final raw in (reports.data ?? const []).cast<Map<String, dynamic>>())
        SharedItem(
          id: raw['id'] as String,
          isReport: true,
          title: (raw['originalFileName'] as String?) ?? 'Lab report',
          shared: raw['sharedWithFamilyHead'] == true,
          date: DateTime.tryParse((raw['collectedAt'] as String?) ?? ''),
        ),
    ];
    for (var page = 1; page <= 100; page++) {
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/members/$memberId/records',
        queryParameters: {'page': page, 'pageSize': 50},
      );
      final data = response.data ?? const <String, dynamic>{};
      final records = ((data['items'] as List?) ?? const []).cast<Map<String, dynamic>>();
      items.addAll(records.map((raw) => SharedItem(
        id: raw['id'] as String,
        isReport: false,
        title: (raw['title'] as String?) ?? 'Health record',
        shared: raw['sharedWithFamilyHead'] == true,
        date: DateTime.tryParse((raw['occurredOn'] as String?) ?? ''),
      )));
      final totalPages = (data['totalPages'] as num?)?.toInt() ?? 1;
      if (page >= totalPages || records.isEmpty) break;
    }
    return items;
  }

  @override
  Future<void> setSharing(SharedItem item, {required bool shared}) async {
    final url = item.isReport ? '/lab-reports/${item.id}/sharing' : '/records/${item.id}/sharing';
    await _client.dio.patch<void>(url, data: {'sharedWithFamilyHead': shared});
  }
}
