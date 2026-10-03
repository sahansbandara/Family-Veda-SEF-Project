// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_practice.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/services/api/doctor_practice_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final doctorPracticeApiProvider = Provider<DoctorPracticeApi>((ref) {
  return DoctorPracticeApiImpl(ref.watch(apiClientProvider));
});

final doctorPracticeProvider = FutureProvider.autoDispose<DoctorPractice>((
  ref,
) {
  return ref.watch(doctorPracticeApiProvider).getPractice();
});
