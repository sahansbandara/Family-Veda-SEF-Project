// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/services/api/doctor_cases_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final doctorCasesApiProvider = Provider<DoctorCasesApi>((ref) {
  return DoctorCasesApiImpl(ref.watch(apiClientProvider));
});

final doctorQueueProvider = FutureProvider.autoDispose<List<DoctorQueueCase>>((
  ref,
) {
  return ref.watch(doctorCasesApiProvider).getQueue();
});

/// Read only for cases the doctor already holds; the backend still checks the grant.
final submittedComplaintProvider = FutureProvider.autoDispose
    .family<SubmittedComplaint?, String>((ref, caseId) {
      return ref.watch(doctorCasesApiProvider).getSubmittedComplaint(caseId);
    });
