import 'package:family_veda/models/member.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/screens/triage/submit_complaint_screen.dart';
import 'package:dio/dio.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/services/api/api_client.dart';
import 'package:family_veda/services/storage/secure_token_store.dart';
// Owner: S3/S4 · synthetic fixtures only.
import 'package:family_veda/models/triage_case.dart';
import 'package:family_veda/providers/cases_provider.dart';
import 'package:family_veda/screens/triage/case_status_screen.dart';
import 'package:family_veda/widgets/doctor/processing_requests_section.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

TriageCase request({
  bool editable = false,
  String status = 'PENDING_DOCTOR_REVIEW',
  DateTime? started,
}) => TriageCase(
  id: 'synthetic-request',
  status: status,
  submittedAt: DateTime.utc(2026, 10, 5),
  doctorReceivedAt: DateTime.utc(2026, 10, 5),
  doctorReviewStartedAt: started,
  canEdit: editable,
  canWithdraw: editable,
  submittedEpisode: const {
    'memberId': 'synthetic-member',
    'symptoms': ['Feeling tired'],
    'durationDays': 1,
    'severity': 3,
  },
);

Future<void> render(WidgetTester tester, TriageCase item) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        caseStatusProvider(item.id).overrideWith((_) => Stream.value(item)),
      ],
      child: MaterialApp(home: CaseStatusScreen(caseId: item.id)),
    ),
  );
  await tester.pumpAndSettle();
}

class _TokenStore implements TokenStore {
  @override
  Future<String?> readAccessToken() async => null;
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets(
    'failed safe preserves safety notice and eligible backend actions',
    (tester) async {
      await render(tester, request(editable: true, status: 'FAILED_SAFE'));
      expect(find.text('Automated review unavailable'), findsOneWidget);
      expect(find.text('Edit request'), findsOneWidget);
      expect(find.text('Withdraw request'), findsOneWidget);
      expect(find.text('View approved guidance'), findsNothing);
    },
  );
  testWidgets(
    'low confidence finishes AI without implying doctor review started',
    (tester) async {
      await render(tester, request(status: 'LOW_CONFIDENCE'));
      expect(find.text('Complete'), findsOneWidget);
      expect(find.text('Not started'), findsOneWidget);
      expect(find.text('Step 2 of 4'), findsOneWidget);
      expect(find.text('View approved guidance'), findsNothing);
    },
  );
  testWidgets(
    'edit preserves submitted symptoms and severity when members load',
    (tester) async {
      final item = TriageCase(
        id: 'synthetic-original',
        status: 'SUBMITTED',
        submittedAt: DateTime.utc(2026, 10, 5),
        canEdit: true,
        submittedEpisode: const {
          'memberId': 'synthetic-member',
          'symptoms': ['Other description'],
          'durationDays': 7,
          'severity': 4,
          'notes': 'Synthetic context',
        },
      );
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            membersProvider.overrideWith(
              (_) async => [
                const Member(
                  id: 'synthetic-member',
                  displayName: 'Synthetic member',
                  relationshipLabel: 'Self',
                ),
              ],
            ),
          ],
          child: MaterialApp(
            home: SubmitComplaintScreen(replacementCase: item),
          ),
        ),
      );
      await tester.pumpAndSettle();
      final description = tester.widget<TextFormField>(
        find.byKey(const Key('chief_complaint_field')),
      );
      expect(description.controller!.text, 'Other description');
      expect(find.text('Edit symptom request'), findsOneWidget);
    },
  );
  testWidgets('withdraw sends backend command only after confirmation', (
    tester,
  ) async {
    final requests = <RequestOptions>[];
    final dio = Dio(BaseOptions(baseUrl: 'https://example.invalid/api/v1'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(options);
          handler.resolve(
            Response(
              requestOptions: options,
              data: {'id': 'synthetic-request', 'status': 'Withdrawn'},
            ),
          );
        },
      ),
    );
    final item = request(editable: true);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiClientProvider.overrideWithValue(
            ApiClient(tokenStore: _TokenStore(), dio: dio),
          ),
          memberCasesProvider.overrideWith((_) async => []),
          caseStatusProvider(item.id).overrideWith((_) => Stream.value(item)),
        ],
        child: MaterialApp(home: CaseStatusScreen(caseId: item.id)),
      ),
    );
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Withdraw request'), 200);
    await tester.ensureVisible(
      find.widgetWithText(TextButton, 'Withdraw request'),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Withdraw request'));
    await tester.pumpAndSettle();
    expect(requests, isEmpty);
    await tester.tap(find.text('Withdraw'));
    await tester.pumpAndSettle();
    expect(requests.single.method, 'POST');
    expect(requests.single.path, '/triage-cases/synthetic-request/withdraw');
  });
  test('permissions default closed and server receipt dates parse', () {
    final item = TriageCase.fromJson({
      'id': 'synthetic-request',
      'status': 'Submitted',
      'submittedAt': '2026-10-05T00:00:00Z',
      'doctorReceivedAt': '2026-10-05T00:01:00Z',
    });
    expect(item.canEdit, isFalse);
    expect(item.canWithdraw, isFalse);
    expect(item.doctorReceivedAt, DateTime.utc(2026, 10, 5, 0, 1));
  });

  testWidgets('pending queue does not imply actual doctor review has started', (
    tester,
  ) async {
    await render(tester, request(editable: true));
    expect(find.text('Doctor received request'), findsOneWidget);
    expect(find.text('Not started'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Edit request'), 200);
    expect(find.text('Edit request'), findsOneWidget);
    expect(find.text('Withdraw request'), findsOneWidget);
    expect(find.text('View approved guidance'), findsNothing);
  });

  testWidgets('review started removes controls when backend denies them', (
    tester,
  ) async {
    await render(tester, request(started: DateTime.utc(2026, 10, 5, 0, 2)));
    expect(find.text('Edit request'), findsNothing);
    expect(find.text('Withdraw request'), findsNothing);
    expect(find.textContaining('Started'), findsOneWidget);
  });

  testWidgets('withdrawn request stops progress and approval messaging', (
    tester,
  ) async {
    await render(tester, request(status: 'WITHDRAWN'));
    expect(find.text('This request was withdrawn.'), findsOneWidget);
    expect(find.text('Waiting for doctor approval'), findsNothing);
  });

  testWidgets('processing section exposes only reference time and stage', (
    tester,
  ) async {
    final item = ProcessingRequest.fromJson({
      'id': 'synthetic-case',
      'caseNumber': 42,
      'status': 'Planning',
      'submittedAt': '2026-10-05T00:00:00Z',
      'memberDisplayName': 'DO NOT SHOW',
      'complaint': 'DO NOT SHOW',
      'priority': 'Emergency',
    });
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          processingRequestsProvider.overrideWith((_) async => [item]),
        ],
        child: const MaterialApp(
          home: Scaffold(body: ProcessingRequestsSection()),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Case 0042'), findsOneWidget);
    expect(find.textContaining('Preparing request'), findsOneWidget);
    expect(find.textContaining('DO NOT SHOW'), findsNothing);
    expect(find.text('Emergency'), findsNothing);
    expect(find.byType(FilledButton), findsNothing);
    expect(find.byType(IconButton), findsNothing);
    for (final tile in tester.widgetList<ListTile>(find.byType(ListTile))) {
      expect(tile.onTap, isNull);
      expect(tile.onLongPress, isNull);
    }
  });
}
