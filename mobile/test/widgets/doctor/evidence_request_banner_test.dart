import 'package:family_veda/models/evidence_request.dart';
import 'package:family_veda/providers/evidence_provider.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:family_veda/services/api/evidence_api.dart';
import 'package:family_veda/widgets/doctor/evidence_request_banner.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeApi implements EvidenceApi {
  _FakeApi(this.items);
  final List<EvidenceRequest> items;
  @override
  Future<List<EvidenceRequest>> openRequests() async => items;
  @override
  Future<EvidenceRequest> upload({
    required String requestId,
    required String kind,
    required String path,
    required String fileName,
  }) => throw UnimplementedError();
}

Widget _app(List<EvidenceRequest> items) => ProviderScope(
  overrides: [evidenceApiProvider.overrideWithValue(_FakeApi(items))],
  child: const MaterialApp(
    home: Scaffold(body: SingleChildScrollView(child: EvidenceRequestBanner())),
  ),
);

EvidenceRequest _req({bool challenge = true}) => EvidenceRequest(
  id: 'r1',
  requestedItems: const ['SlmcCertificate', 'NationalIdCopy'],
  isChallenge: challenge,
  dueAt: DateTime.now().add(const Duration(days: 2, hours: 3)),
  status: 'Open',
  files: const [
    EvidenceFile(id: 'f1', kind: 'SlmcCertificate', fileName: 'a.pdf'),
  ],
);

void main() {
  testWidgets('shows challenge text and countdown', (tester) async {
    await tester.pumpWidget(_app([_req()]));
    await tester.pump();
    expect(find.text(evidenceChallengeText), findsOneWidget);
    expect(find.textContaining('2d 2h'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle), findsOneWidget);
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('admin request shows admin text', (tester) async {
    await tester.pumpWidget(_app([_req(challenge: false)]));
    await tester.pump();
    expect(find.text(evidenceAdminText), findsOneWidget);
  });

  testWidgets('hidden when no open requests', (tester) async {
    await tester.pumpWidget(_app(const []));
    await tester.pump();
    expect(find.byKey(const Key('evidence-countdown')), findsNothing);
    expect(find.text(evidenceChallengeText), findsNothing);
  });

  test('AuthTokens parses claimRejected', () {
    final t = AuthTokens.fromRegistration({
      'userId': 'u',
      'accessToken': 'a',
      'refreshToken': 'r',
      'doctorClaimRejected': true,
    });
    expect(t.claimRejected, isTrue);
    expect(t.claimUnderReview, isFalse);
  });
}
