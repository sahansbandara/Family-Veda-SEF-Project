// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/services/api/api_client.dart';

abstract interface class DoctorApi {
  Future<List<Appointment>> getDoctorAppointments();
  Future<void> confirmAppointment(String id);
  Future<void> completeAppointment(String id);
  Future<void> noShowAppointment(String id);
  Future<void> cancelAppointment(String id, String note);
  Future<void> rescheduleAppointment(String id, String startsAt);
}

class DoctorApiImpl implements DoctorApi {
  final ApiClient _client;
  DoctorApiImpl(this._client);

  @override
  Future<List<Appointment>> getDoctorAppointments() async {
    final res = await _client.dio.get('/doctors/me/appointments');
    return (res.data as List).map((x) => Appointment.fromJson(x)).toList();
  }

  @override
  Future<void> confirmAppointment(String id) => _client.dio.post('/doctors/me/appointments/$id/confirm', data: {});

  @override
  Future<void> completeAppointment(String id) => _client.dio.post('/doctors/me/appointments/$id/complete', data: {});

  @override
  Future<void> noShowAppointment(String id) => _client.dio.post('/doctors/me/appointments/$id/no-show', data: {});

  @override
  Future<void> cancelAppointment(String id, String note) => _client.dio.post('/doctors/me/appointments/$id/cancel', data: {'note': note});

  @override
  Future<void> rescheduleAppointment(String id, String startsAt) => _client.dio.post('/doctors/me/appointments/$id/reschedule', data: {'startsAt': startsAt});
}
