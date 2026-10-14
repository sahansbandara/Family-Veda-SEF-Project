// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/services/api/doctor_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final doctorApiProvider = Provider<DoctorApi>((ref) {
  return DoctorApiImpl(ref.watch(apiClientProvider));
});

final doctorAppointmentsProvider = FutureProvider.autoDispose<List<Appointment>>((ref) {
  return ref.watch(doctorApiProvider).getDoctorAppointments();
});
