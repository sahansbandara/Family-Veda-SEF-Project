// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:dio/dio.dart';
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/services/api/api_client.dart';

/// Doctor My Families calls. Same ASP.NET Core endpoints as the web pages; the backend enforces
/// verification, the family assignment, the member grant and consent on every one of them.
abstract interface class DoctorFamiliesApi {
  /// Assigned families and the requests still waiting for an answer.
  Future<DoctorFamiliesOverview> getOverview();

  /// Accepts or declines a long-term family-doctor request. Accepting grants no clinical access.
  Future<void> respondToRequest(String requestId, {required bool accept});

  /// Names, roles and the current grant state for one assigned family.
  Future<FamilyRoster> getRoster(String familyId);

  Future<MemberWorkspace> getMemberWorkspace(String memberId);

  Future<void> addNote(String memberId, String content);

  /// Appends a new version; the original note is never changed.
  Future<void> amendNote(String noteId, String content);
}

class DoctorFamiliesApiImpl implements DoctorFamiliesApi {
  DoctorFamiliesApiImpl(this._client);

  final ApiClient _client;

  @override
  Future<DoctorFamiliesOverview> getOverview() async {
    final results = await Future.wait([
      _client.dio.get<Map<String, dynamic>>('/dashboard/doctor'),
      _client.dio.get<List<dynamic>>('/doctors/me/family-requests'),
    ]);
    final dashboard = results[0].data as Map<String, dynamic>? ?? const {};
    final requests = results[1].data as List<dynamic>? ?? const [];
    return DoctorFamiliesOverview(
      families: (dashboard['families'] as List? ?? const [])
          .cast<Map<String, dynamic>>()
          .map(DoctorFamilyRow.fromJson)
          .toList(),
      requests: requests
          .cast<Map<String, dynamic>>()
          .map(FamilyDoctorRequest.fromJson)
          .where((request) => request.status == 'Pending')
          .toList(),
    );
  }

  @override
  Future<void> respondToRequest(
    String requestId, {
    required bool accept,
  }) => _client.dio.post<dynamic>(
    '/doctors/me/family-requests/$requestId/${accept ? 'accept' : 'decline'}',
  );

  @override
  Future<FamilyRoster> getRoster(String familyId) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/doctors/me/families/$familyId',
    );
    return FamilyRoster.fromJson(res.data!);
  }

  @override
  Future<MemberWorkspace> getMemberWorkspace(String memberId) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/doctors/me/members/$memberId',
    );
    return MemberWorkspace.fromJson(res.data!);
  }

  @override
  Future<void> addNote(String memberId, String content) =>
      _client.dio.post<dynamic>(
        '/doctors/me/members/$memberId/notes',
        data: {'content': content, 'noteType': 'VisitNote'},
      );

  @override
  Future<void> amendNote(String noteId, String content) =>
      _client.dio.post<dynamic>(
        '/doctors/me/notes/$noteId/amend',
        data: {'content': content},
      );
}

/// Safe, non-leaking feedback for a failed note write.
String noteErrorMessage(Object error) {
  final status = error is DioException ? error.response?.statusCode : null;
  if (status == 403 || status == 404) {
    return 'The note was not saved. Notes need an active visit or shared case for this member.';
  }
  return 'The note could not be saved. Nothing was changed. Try again.';
}
