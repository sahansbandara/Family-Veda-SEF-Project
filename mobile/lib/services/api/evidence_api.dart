// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:dio/dio.dart';
import 'package:family_veda/models/evidence_request.dart';
import 'package:family_veda/services/api/api_client.dart';

abstract class EvidenceApi {
  Future<List<EvidenceRequest>> openRequests();
  Future<EvidenceRequest> upload({
    required String requestId,
    required String kind,
    required String path,
    required String fileName,
  });
}

class DioEvidenceApi implements EvidenceApi {
  const DioEvidenceApi(this._client);

  final ApiClient _client;

  @override
  Future<List<EvidenceRequest>> openRequests() async {
    final response = await _client.dio.get<List<dynamic>>(
      '/doctors/me/evidence-requests',
    );
    return [
      for (final item in response.data ?? const [])
        EvidenceRequest.fromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  @override
  Future<EvidenceRequest> upload({
    required String requestId,
    required String kind,
    required String path,
    required String fileName,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/doctors/me/evidence-requests/$requestId/files',
      data: FormData.fromMap({
        'kind': kind,
        'file': await MultipartFile.fromFile(path, filename: fileName),
      }),
    );
    return EvidenceRequest.fromJson(response.data!);
  }
}
