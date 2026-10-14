// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:dio/dio.dart';
import 'package:family_veda/models/doctor_practice.dart';
import 'package:family_veda/services/api/api_client.dart';

/// Doctor Profile & Availability calls. Same ASP.NET Core endpoints as the web page
/// (web/src/pages/doctor/DoctorProfilePage.tsx); the backend validates every write.
abstract interface class DoctorPracticeApi {
  Future<DoctorPractice> getPractice();

  Future<DoctorPracticeProfile> updateProfile(PracticeProfileUpdate update);

  /// Replaces the whole week. Returns the schedule as the backend saved it.
  Future<DoctorSchedule> replaceAvailability(List<AvailabilityWindow> windows);

  Future<void> addBlockedTime(
    DateTime startsAt,
    DateTime endsAt, {
    String? reason,
  });

  Future<void> removeBlockedTime(String id);
}

class DoctorPracticeApiImpl implements DoctorPracticeApi {
  DoctorPracticeApiImpl(this._client);

  final ApiClient _client;

  @override
  Future<DoctorPractice> getPractice() async {
    final results = await Future.wait([
      _client.dio.get<Map<String, dynamic>>('/doctors/me/profile'),
      _client.dio.get<Map<String, dynamic>>('/doctors/me/schedule'),
    ]);
    return DoctorPractice(
      profile: DoctorPracticeProfile.fromJson(results[0].data!),
      schedule: DoctorSchedule.fromJson(results[1].data!),
    );
  }

  @override
  Future<DoctorPracticeProfile> updateProfile(
    PracticeProfileUpdate update,
  ) async {
    final res = await _client.dio.put<Map<String, dynamic>>(
      '/doctors/me/profile',
      data: update.toJson(),
    );
    return DoctorPracticeProfile.fromJson(res.data!);
  }

  @override
  Future<DoctorSchedule> replaceAvailability(
    List<AvailabilityWindow> windows,
  ) async {
    final res = await _client.dio.put<Map<String, dynamic>>(
      '/doctors/me/availability',
      data: {'windows': windows.map((window) => window.toJson()).toList()},
    );
    return DoctorSchedule.fromJson(res.data!);
  }

  @override
  Future<void> addBlockedTime(
    DateTime startsAt,
    DateTime endsAt, {
    String? reason,
  }) => _client.dio.post<dynamic>(
    '/doctors/me/blocked-time',
    data: {
      'startsAt': startsAt.toUtc().toIso8601String(),
      'endsAt': endsAt.toUtc().toIso8601String(),
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    },
  );

  @override
  Future<void> removeBlockedTime(String id) =>
      _client.dio.delete<dynamic>('/doctors/me/blocked-time/$id');
}

/// The backend's own reason for refusing a write, or [fallback] when it gave none.
String practiceErrorMessage(Object error, String fallback) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final errors = data['errors'];
      if (errors is Map<String, dynamic> && errors.isNotEmpty) {
        return errors.values
            .expand((value) => value is List ? value : [value])
            .join(' ');
      }
      final message = data['message'];
      if (message is String && message.isNotEmpty) return message;
    }
  }
  return fallback;
}
