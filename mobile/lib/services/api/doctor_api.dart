// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:dio/dio.dart';
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/services/api/api_client.dart';

/// Doctor-side appointment calls. Every change returns the appointment as the backend saved it,
/// so the app never shows a status the server did not confirm.
abstract interface class DoctorApi {
  Future<List<Appointment>> getDoctorAppointments();
  Future<Appointment> confirmAppointment(String id);
  Future<Appointment> completeAppointment(String id);
  Future<Appointment> noShowAppointment(String id);
  Future<Appointment> cancelAppointment(String id, {String? note});
  Future<Appointment> rescheduleAppointment(String id, DateTime startsAt);
}

class DoctorApiImpl implements DoctorApi {
  DoctorApiImpl(this._client);

  final ApiClient _client;

  @override
  Future<List<Appointment>> getDoctorAppointments() async {
    final res = await _client.dio.get<List<dynamic>>(
      '/doctors/me/appointments',
    );
    return (res.data ?? const [])
        .map((item) => Appointment.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Appointment> _post(
    String id,
    String action,
    Map<String, dynamic> body,
  ) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/doctors/me/appointments/$id/$action',
      data: body,
    );
    return Appointment.fromJson(res.data!);
  }

  @override
  Future<Appointment> confirmAppointment(String id) =>
      _post(id, 'confirm', const {});

  @override
  Future<Appointment> completeAppointment(String id) =>
      _post(id, 'complete', const {});

  @override
  Future<Appointment> noShowAppointment(String id) =>
      _post(id, 'no-show', const {});

  @override
  Future<Appointment> cancelAppointment(String id, {String? note}) =>
      _post(id, 'cancel', {if (note != null && note.isNotEmpty) 'note': note});

  @override
  Future<Appointment> rescheduleAppointment(String id, DateTime startsAt) =>
      _post(id, 'reschedule', {'startsAt': startsAt.toUtc().toIso8601String()});
}

/// The backend's own reason for refusing a change (overlap, outside working hours, wrong status),
/// or a generic line when it gave none.
String appointmentActionError(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final errors = data['errors'];
      if (errors is Map<String, dynamic> && errors.isNotEmpty) {
        return errors.values
            .expand((value) => value is List ? value : [value])
            .join(' ');
      }
      final message = data['message'] ?? data['detail'];
      if (message is String && message.isNotEmpty) return message;
    }
    if (error.response == null) {
      return 'Could not connect. The appointment was not changed.';
    }
  }
  return 'The appointment was not changed. Try again.';
}
