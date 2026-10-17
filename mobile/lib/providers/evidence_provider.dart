// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/evidence_request.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/services/api/evidence_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final evidenceApiProvider = Provider<EvidenceApi>(
  (ref) => DioEvidenceApi(ref.watch(apiClientProvider)),
);

/// Open evidence requests for the signed-in doctor.
final evidenceRequestsProvider =
    FutureProvider.autoDispose<List<EvidenceRequest>>(
      (ref) async => (await ref.watch(evidenceApiProvider).openRequests())
          .where((r) => r.isOpen)
          .toList(),
    );
