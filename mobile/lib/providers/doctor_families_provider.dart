// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/services/api/doctor_families_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final doctorFamiliesApiProvider = Provider<DoctorFamiliesApi>((ref) {
  return DoctorFamiliesApiImpl(ref.watch(apiClientProvider));
});

// autoDispose: nothing is kept after the screen closes, so a member's clinical data is
// re-read (and re-authorised by the backend) every time a workspace is opened.
final doctorFamiliesOverviewProvider =
    FutureProvider.autoDispose<DoctorFamiliesOverview>((ref) {
      return ref.watch(doctorFamiliesApiProvider).getOverview();
    });

final doctorFamilyRosterProvider = FutureProvider.autoDispose
    .family<FamilyRoster, String>((ref, familyId) {
      return ref.watch(doctorFamiliesApiProvider).getRoster(familyId);
    });

final doctorMemberWorkspaceProvider = FutureProvider.autoDispose
    .family<MemberWorkspace, String>((ref, memberId) {
      return ref.watch(doctorFamiliesApiProvider).getMemberWorkspace(memberId);
    });
