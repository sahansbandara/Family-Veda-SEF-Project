// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:dio/dio.dart';
import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:family_veda/services/api/api_client.dart';

/// Doctor triage queue calls. Same ASP.NET Core endpoints as the web Triage Cases page; the
/// backend enforces verification, grants and consent on every one of them.
abstract interface class DoctorCasesApi {
  /// Granted cases merged with the claimable pool.
  Future<List<DoctorQueueCase>> getQueue();

  /// Claims a pool case, or acknowledges a pooled emergency referral.
  Future<void> claimCase(String caseId);

  /// The submitted complaint for a granted case, or null when none was submitted.
  Future<SubmittedComplaint?> getSubmittedComplaint(String caseId);

  /// Books a confirmed follow-up for the patient of an acknowledged emergency referral.
  Future<void> bookFollowUp(
    String caseId, {
    required DateTime startsAt,
    required int durationMinutes,
    String? reason,
  });

  /// Sends the doctor's profile phone number to the patient of an acknowledged referral.
  Future<void> shareContact(String caseId);

  /// Closes an acknowledged emergency referral for every doctor's queue.
  Future<void> closeReferral(String caseId);
}

class DoctorCasesApiImpl implements DoctorCasesApi {
  DoctorCasesApiImpl(this._client);

  final ApiClient _client;

  static const _pageSize = 100;
  static const _maxPages = 10;

  Future<List<Map<String, dynamic>>> _all(String path) async {
    final items = <Map<String, dynamic>>[];
    for (var page = 1; page <= _maxPages; page++) {
      final res = await _client.dio.get<Map<String, dynamic>>(
        path,
        queryParameters: {'page': page, 'pageSize': _pageSize},
      );
      final data = res.data ?? const {};
      items.addAll(
        (data['items'] as List? ?? const []).cast<Map<String, dynamic>>(),
      );
      if (page >= ((data['totalPages'] as num?)?.toInt() ?? 1)) break;
    }
    return items;
  }

  @override
  Future<List<DoctorQueueCase>> getQueue() async {
    final results = await Future.wait([
      _all('/doctors/me/cases'),
      _all('/doctors/case-pool'),
    ]);
    return mergeQueue(
      results[0].map(DoctorQueueCase.granted).toList(),
      results[1].map(DoctorQueueCase.pooled).toList(),
    );
  }

  @override
  Future<void> claimCase(String caseId) async {
    await _client.dio.post<Map<String, dynamic>>('/triage-cases/$caseId/claim');
  }

  @override
  Future<SubmittedComplaint?> getSubmittedComplaint(String caseId) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/triage-cases/$caseId/review',
    );
    final episode = res.data?['submittedEpisode'];
    return episode is Map<String, dynamic>
        ? SubmittedComplaint.fromJson(episode)
        : null;
  }

  @override
  Future<void> bookFollowUp(
    String caseId, {
    required DateTime startsAt,
    required int durationMinutes,
    String? reason,
  }) async {
    await _client.dio.post<Map<String, dynamic>>(
      '/triage-cases/$caseId/appointments',
      data: {
        'startsAt': startsAt.toUtc().toIso8601String(),
        'durationMinutes': durationMinutes,
        'reason': (reason ?? '').trim().isEmpty ? null : reason!.trim(),
      },
    );
  }

  @override
  Future<void> shareContact(String caseId) async {
    await _client.dio.post<Map<String, dynamic>>(
      '/triage-cases/$caseId/share-contact',
    );
  }

  @override
  Future<void> closeReferral(String caseId) async {
    await _client.dio.post<Map<String, dynamic>>(
      '/triage-cases/$caseId/close-referral',
    );
  }
}

/// A safe sentence for a failed follow-up action; never echoes server internals.
String followUpErrorMessage(Object error, String fallback) {
  final response = error is DioException ? error.response : null;
  final data = response?.data;
  final status = response?.statusCode;
  if (status == 400 && data is Map && data['errors'] is Map) {
    for (final messages in (data['errors'] as Map).values) {
      if (messages is List && messages.isNotEmpty) return '${messages.first}';
    }
  }
  if (status == 409 && data is Map && data['detail'] is String) {
    return data['detail'] as String;
  }
  if (status == 403 || status == 404) {
    return 'This referral is no longer available to you. Refresh the queue.';
  }
  return fallback;
}

/// Safe, non-leaking feedback for a failed claim.
String claimErrorMessage(Object error) {
  final status = error is DioException ? error.response?.statusCode : null;
  if (status == 409) {
    return 'Another doctor claimed this case first. The queue has been refreshed.';
  }
  if (status == 403 || status == 404) {
    return 'This case is no longer available to you. The queue has been refreshed.';
  }
  return 'The case was not claimed. Nothing was changed. Try again.';
}
