import 'package:family_veda/widgets/doctor/processing_requests_section.dart';
// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:dio/dio.dart';
import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:family_veda/providers/doctor_cases_provider.dart';
import 'package:family_veda/screens/doctor/doctor_triage_cases_screen.dart';
import 'package:family_veda/services/api/doctor_cases_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// In-memory stand-in for the HTTP client. Synthetic data only.
class _FakeCasesApi implements DoctorCasesApi {
  _FakeCasesApi(this.assigned, this.pool);

  List<DoctorQueueCase> assigned;
  List<DoctorQueueCase> pool;
  final claims = <String>[];
  int? failStatus;

  @override
  Future<List<DoctorQueueCase>> getQueue() async => mergeQueue(assigned, pool);

  @override
  Future<void> claimCase(String caseId) async {
    claims.add(caseId);
    final item = pool.firstWhere((c) => c.id == caseId);
    pool = [
      for (final c in pool)
        if (c.id != caseId) c,
    ];
    if (failStatus != null) {
      final options = RequestOptions(path: '/triage-cases/$caseId/claim');
      throw DioException(
        requestOptions: options,
        response: Response(requestOptions: options, statusCode: failStatus),
      );
    }
    assigned = [
      ...assigned,
      _case(
        item.id,
        item.isEmergencyReferral ? 'Escalated' : 'Claimed',
        priority: item.priority,
        mine: true,
      ),
    ];
  }

  final followUps = <String>[];
  Object? followUpFailure;

  Future<void> _followUp(String call) async {
    final failure = followUpFailure;
    if (failure != null) {
      followUpFailure = null;
      throw failure;
    }
    followUps.add(call);
  }

  @override
  Future<void> bookFollowUp(
    String caseId, {
    required DateTime startsAt,
    required int durationMinutes,
    String? reason,
  }) => _followUp('book $caseId $durationMinutes');

  @override
  Future<void> shareContact(String caseId) => _followUp('share $caseId');

  @override
  Future<void> closeReferral(String caseId) async {
    await _followUp('close $caseId');
    assigned = [
      for (final c in assigned)
        c.id == caseId
            ? _case(
                c.id,
                c.status,
                priority: c.priority,
                mine: true,
                referralClosed: true,
              )
            : c,
    ];
  }

  @override
  Future<SubmittedComplaint?> getSubmittedComplaint(String caseId) async =>
      const SubmittedComplaint(
        symptoms: ['Sore throat'],
        durationDays: 2,
        severity: 3,
      );
}

DoctorQueueCase _case(
  String id,
  String status, {
  String priority = 'Routine',
  bool mine = false,
  SubmittedComplaint? complaint,
  bool referralClosed = false,
}) => DoctorQueueCase(
  referralClosed: referralClosed,
  id: id,
  priority: priority,
  status: status,
  createdAt: DateTime.utc(2026, 9, 29, 8),
  mine: mine,
  claimable: !mine,
  complaint: complaint,
);

const _poolComplaint = SubmittedComplaint(
  symptoms: ['synthetic_signal_a', 'synthetic_signal_b'],
  durationDays: 1,
  severity: 6,
  notes: 'Synthetic note text.',
  ageBand: '40–49',
);

Future<_FakeCasesApi> _pump(
  WidgetTester tester, {
  Size size = const Size(390, 844),
  SubmittedComplaint? poolComplaint,
  bool acknowledgedEmergency = false,
}) async {
  final api = _FakeCasesApi(
    [
      if (acknowledgedEmergency)
        _case('ackd0001-x', 'Escalated', priority: 'Emergency', mine: true),
      _case('mine0001-x', 'Claimed', mine: true),
      _case('done0001-x', 'ApprovedRevised', mine: true),
    ],
    [
      _case('pool0001-x', 'PendingDoctorReview', complaint: poolComplaint),
      _case('emer0001-x', 'Escalated', priority: 'Emergency'),
    ],
  );
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        doctorCasesApiProvider.overrideWithValue(api),
        processingRequestsProvider.overrideWith((_) async => []),
      ],
      child: const MaterialApp(home: DoctorTriageCasesScreen()),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

Future<void> _tapVisible(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  test('queue rules match the web queue', () {
    final held = mergeQueue(
      [_case('a', 'Claimed', mine: true)],
      [_case('a', 'Claimed')],
    ).single;
    expect(held.action, QueueActionKind.none);
    expect(held.tab, QueueTab.mine);

    final failed = _case('b', 'FailedSafe', priority: 'Emergency', mine: true);
    expect(failed.statusLabel, 'Processing stopped safely');
    expect(failed.tab, QueueTab.completed);

    final referral = _case('c', 'Escalated', priority: 'Emergency');
    expect(referral.tab, QueueTab.emergency);
    expect(referral.actionLabel, 'Acknowledge Emergency');
  });

  testWidgets('shows real counts and only claimable cases under Available', (
    tester,
  ) async {
    await _pump(tester);

    expect(find.text('Triage Cases'), findsOneWidget);
    expect(find.text('Available Cases'), findsOneWidget);
    expect(find.text('Available (1)'), findsOneWidget);
    expect(find.text('My Cases (1)'), findsOneWidget);
    expect(find.text('Emergency (1)'), findsOneWidget);
    expect(find.text('Case pool0001'), findsOneWidget);
    expect(find.text('Case mine0001'), findsNothing);
    expect(
      find.text('Details available after authorized access.'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  test('a pooled case carries the released complaint and no identity', () {
    final pooled = DoctorQueueCase.pooled({
      'id': 'pool0001-x',
      'priority': 'Routine',
      'status': 'PendingDoctorReview',
      'createdAt': '2026-09-29T08:00:00Z',
      'complaint': {
        'symptoms': ['synthetic_signal_a', 'synthetic_signal_b'],
        'durationDays': 1,
        'severity': 6,
        'notes': 'Synthetic note text.',
        'ageBand': '40–49',
      },
    });

    expect(
      pooled.complaint?.summary,
      'synthetic signal a, synthetic signal b · 1 day · Severity 6 / 10 · Age 40–49',
    );
    expect(pooled.memberDisplayName, isNull);
    expect(pooled.familyName, isNull);
    expect(
      DoctorQueueCase.pooled({
        'id': 'old-api',
        'createdAt': '2026-09-29T08:00:00Z',
      }).complaint,
      isNull,
    );
  });

  testWidgets('a doctor can read the complaint before claiming', (
    tester,
  ) async {
    await _pump(tester, poolComplaint: _poolComplaint);

    expect(find.text(_poolComplaint.summary), findsOneWidget);
    expect(
      find.text('Details available after authorized access.'),
      findsNothing,
    );
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-case-pool0001-x')),
    );

    expect(find.text('Synthetic note text.'), findsOneWidget);
    expect(find.text('6 / 10'), findsOneWidget);
    expect(
      find.textContaining(
        'Age band 40–49. Name and family are shown after you claim the case.',
      ),
      findsOneWidget,
    );
    expect(find.byKey(const ValueKey('queue-sheet-action')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('claims a case and re-reads the queue from the server', (
    tester,
  ) async {
    final api = await _pump(tester);

    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-action-pool0001-x')),
    );
    expect(api.claims, ['pool0001-x']);
    expect(find.textContaining('now assigned to you'), findsOneWidget);
    expect(find.text('Available (0)'), findsOneWidget);

    await _tapVisible(tester, find.byKey(const ValueKey('queue-tab-mine')));
    expect(find.text('Case pool0001'), findsOneWidget);
    expect(find.text('Claim Case'), findsNothing);
  });

  testWidgets('gives safe conflict feedback when another doctor claims first', (
    tester,
  ) async {
    final api = await _pump(tester);
    api.failStatus = 409;

    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-action-pool0001-x')),
    );
    expect(
      find.textContaining('Another doctor claimed this case first'),
      findsOneWidget,
    );
    expect(find.text('Case pool0001'), findsNothing);
  });

  testWidgets('an assigned case opens with its complaint and no claim action', (
    tester,
  ) async {
    await _pump(tester);
    await _tapVisible(tester, find.byKey(const ValueKey('queue-tab-mine')));
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-case-mine0001-x')),
    );

    expect(find.text('Sore throat'), findsOneWidget);
    expect(find.text('2 days'), findsOneWidget);
    expect(find.byKey(const ValueKey('queue-sheet-action')), findsNothing);
    expect(find.textContaining('Approval Desk'), findsOneWidget);
  });

  test('a closed referral leaves Emergency for Completed', () {
    final closed = _case(
      'e',
      'Escalated',
      priority: 'Emergency',
      mine: true,
      referralClosed: true,
    );
    expect(closed.tab, QueueTab.completed);
    expect(closed.statusLabel, 'Referral closed');
    expect(closed.hasFollowUp, isFalse);
    expect(closed.isEmergencyReferral, isFalse);

    final acknowledged = _case(
      'f',
      'Escalated',
      priority: 'Emergency',
      mine: true,
    );
    expect(acknowledged.tab, QueueTab.emergency);
    expect(acknowledged.hasFollowUp, isTrue);
    expect(_case('g', 'Escalated').hasFollowUp, isFalse);
  });

  test('follow-up errors never echo server internals', () {
    DioException failure(int status, Object? data) {
      final options = RequestOptions(path: '/x');
      return DioException(
        requestOptions: options,
        response: Response(
          requestOptions: options,
          statusCode: status,
          data: data,
        ),
      );
    }

    expect(
      followUpErrorMessage(
        failure(400, {
          'errors': {
            'phoneNumber': ['Add a phone number first.'],
          },
        }),
        'fallback',
      ),
      'Add a phone number first.',
    );
    expect(
      followUpErrorMessage(failure(409, {'detail': 'Already shared.'}), 'f'),
      'Already shared.',
    );
    expect(
      followUpErrorMessage(failure(404, null), 'f'),
      contains('no longer available'),
    );
    expect(
      followUpErrorMessage(failure(500, {'detail': 'stack'}), 'fallback'),
      'fallback',
    );
  });

  testWidgets('an acknowledged referral can be closed after confirmation', (
    tester,
  ) async {
    final api = await _pump(tester, acknowledgedEmergency: true);
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-tab-emergency')),
    );
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-case-ackd0001-x')),
    );
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-close')));

    expect(api.followUps, isEmpty);
    expect(
      find.textContaining('The patient still sees the referral'),
      findsOneWidget,
    );
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-confirm')));

    expect(api.followUps, ['close ackd0001-x']);
    expect(find.textContaining('Referral ackd0001 closed'), findsOneWidget);
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-tab-completed')),
    );
    expect(find.text('Referral closed'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('sharing contact reports a missing profile phone safely', (
    tester,
  ) async {
    final api = await _pump(tester, acknowledgedEmergency: true);
    final options = RequestOptions(path: '/x');
    api.followUpFailure = DioException(
      requestOptions: options,
      response: Response(
        requestOptions: options,
        statusCode: 400,
        data: {
          'errors': {
            'phoneNumber': ['Add a phone number to your profile first.'],
          },
        },
      ),
    );
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-tab-emergency')),
    );
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-case-ackd0001-x')),
    );
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-share')));
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-confirm')));

    expect(
      find.text('Add a phone number to your profile first.'),
      findsOneWidget,
    );
    expect(api.followUps, isEmpty);
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-confirm')));
    expect(api.followUps, ['share ackd0001-x']);
    expect(
      find.textContaining('Your contact number was sent to the patient'),
      findsOneWidget,
    );
  });

  testWidgets('a follow-up appointment needs a time before it is booked', (
    tester,
  ) async {
    final api = await _pump(
      tester,
      acknowledgedEmergency: true,
      size: const Size(800, 1280),
    );
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-tab-emergency')),
    );
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-case-ackd0001-x')),
    );
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-book')));
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-confirm')));

    expect(
      find.text('Choose a date and time for the appointment.'),
      findsOneWidget,
    );
    expect(api.followUps, isEmpty);

    await _tapVisible(
      tester,
      find.byKey(const ValueKey('follow-up-pick-time')),
    );
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await _tapVisible(tester, find.byKey(const ValueKey('follow-up-confirm')));

    expect(api.followUps, ['book ackd0001-x 30']);
    expect(
      find.textContaining('Follow-up appointment booked for case ackd0001'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('emergency referrals show explicit text and acknowledgement', (
    tester,
  ) async {
    await _pump(tester);
    await _tapVisible(
      tester,
      find.byKey(const ValueKey('queue-tab-emergency')),
    );

    expect(find.text('Emergency referral'), findsOneWidget);
    expect(find.text('Acknowledge Emergency'), findsOneWidget);
  });

  testWidgets('fits a small phone and a tablet without overflow', (
    tester,
  ) async {
    await _pump(tester, size: const Size(320, 640));
    expect(tester.takeException(), isNull);
    await _pump(tester, size: const Size(820, 1180));
    expect(tester.takeException(), isNull);
  });
}
