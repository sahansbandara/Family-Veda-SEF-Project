// Owner: S2 · Health Records & Extraction — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// [S2] "Recently deleted" for uploaded reports. Who may delete, restore or purge is decided by the API.
import 'package:dio/dio.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/services/api/api_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DeletedLabReport {
  const DeletedLabReport({
    required this.id,
    required this.fileName,
    required this.deletedAt,
    required this.canDeletePermanently,
  });

  factory DeletedLabReport.fromJson(Map<String, dynamic> json) =>
      DeletedLabReport(
        id: json['id'] as String,
        fileName: (json['originalFileName'] ?? 'Lab report') as String,
        deletedAt: DateTime.parse(json['deletedAt'] as String),
        canDeletePermanently: json['canDeletePermanently'] == true,
      );

  final String id;
  final String fileName;
  final DateTime deletedAt;

  /// False while confirmed values may have informed a symptom case.
  final bool canDeletePermanently;
}

/// The server refused a permanent delete and explained why.
class ReportHeldException implements Exception {
  const ReportHeldException(this.message);
  final String message;
}

abstract interface class ReportTrashApi {
  Future<void> deleteReport(String reportId);
  Future<List<DeletedLabReport>> getDeleted(String memberId);
  Future<void> restore(String reportId);
  Future<void> deletePermanently(String reportId);
}

class DioReportTrashApi implements ReportTrashApi {
  DioReportTrashApi(this._client);
  final ApiClient _client;

  @override
  Future<void> deleteReport(String reportId) =>
      _client.dio.delete<void>('/lab-reports/$reportId');

  @override
  Future<List<DeletedLabReport>> getDeleted(String memberId) async {
    final response = await _client.dio.get<List<dynamic>>(
      '/members/$memberId/lab-reports/deleted',
    );
    return (response.data ?? const [])
        .cast<Map<String, dynamic>>()
        .map(DeletedLabReport.fromJson)
        .toList(growable: false);
  }

  @override
  Future<void> restore(String reportId) =>
      _client.dio.post<void>('/lab-reports/$reportId/restore');

  @override
  Future<void> deletePermanently(String reportId) async {
    try {
      await _client.dio.delete<void>('/lab-reports/$reportId/permanent');
    } on DioException catch (error) {
      final data = error.response?.data;
      if (error.response?.statusCode == 409 &&
          data is Map &&
          data['detail'] is String) {
        throw ReportHeldException(data['detail'] as String);
      }
      rethrow;
    }
  }
}

final reportTrashApiProvider = Provider<ReportTrashApi>(
  (ref) => DioReportTrashApi(ref.watch(apiClientProvider)),
);

/// Empty when nothing is deleted or the viewer may not manage this profile.
final deletedLabReportsProvider = FutureProvider.autoDispose
    .family<List<DeletedLabReport>, String>((ref, memberId) async {
      try {
        return await ref.watch(reportTrashApiProvider).getDeleted(memberId);
      } on Object {
        return const [];
      }
    });
