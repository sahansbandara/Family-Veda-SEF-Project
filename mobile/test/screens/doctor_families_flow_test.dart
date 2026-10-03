// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:dio/dio.dart';
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/providers/doctor_families_provider.dart';
import 'package:family_veda/screens/doctor/doctor_families_screen.dart';
import 'package:family_veda/screens/doctor/doctor_family_detail_screen.dart';
import 'package:family_veda/screens/doctor/doctor_member_workspace_screen.dart';
import 'package:family_veda/services/api/doctor_families_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

DioException _http(int status) {
  final options = RequestOptions(path: '/synthetic');
  return DioException(
    requestOptions: options,
    response: Response(requestOptions: options, statusCode: status),
  );
}

Map<String, dynamic> _workspaceJson({
  bool access = true,
  List<String> consent = const ['Conditions'],
  Object? records = const <Object>[],
  Object? labReports = const <Object>[],
  Object? vitals,
  List<Map<String, dynamic>> visits = const [],
  List<Map<String, dynamic>> notes = const [],
}) => {
  'memberId': 'm-1',
  'displayName': 'Synthetic Adult',
  'role': 'AdultMember',
  'familyId': 'f-1',
  'familyName': 'Synthetic Perera Family',
  'clinicalAccess': access,
  'accessBasis': access
      ? 'Confirmed visit + member consent.'
      : 'Family doctor assignment only.',
  'accessExpiresAt': access ? '2026-10-07T18:14:00Z' : null,
  'consentedCategories': access ? consent : <String>[],
  'records': access ? records : null,
  'labReports': access ? labReports : null,
  'vitals': access ? vitals : null,
  'hereditaryFlags': null,
  'visits': visits,
  'notes': notes,
};

/// In-memory stand-in for the HTTP client. Synthetic data only.
class _FakeApi implements DoctorFamiliesApi {
  List<FamilyDoctorRequest> requests = [
    FamilyDoctorRequest(
      id: 'req-1',
      familyName: 'Synthetic Wijesinghe Family',
      memberCount: 4,
      status: 'Pending',
      message: 'Synthetic request message.',
      createdAt: DateTime.utc(2026, 9, 30, 18),
    ),
  ];
  List<Map<String, dynamic>> workspaces = [_workspaceJson()];
  final responses = <(String, bool)>[];
  final added = <String>[];
  final amended = <(String, String)>[];
  int? failStatus;
  int _reads = 0;

  @override
  Future<DoctorFamiliesOverview> getOverview() async => DoctorFamiliesOverview(
    families: [
      DoctorFamilyRow(
        familyId: 'f-1',
        familyName: 'Synthetic Perera Family',
        memberCount: 4,
        nextAppointment: DateTime.utc(2026, 10, 4, 15),
      ),
      const DoctorFamilyRow(
        familyId: 'f-3',
        familyName: 'Synthetic Solo Family',
        memberCount: 1,
      ),
    ],
    requests: requests,
  );

  @override
  Future<void> respondToRequest(
    String requestId, {
    required bool accept,
  }) async {
    responses.add((requestId, accept));
    if (failStatus != null) throw _http(failStatus!);
    requests = [];
  }

  @override
  Future<FamilyRoster> getRoster(String familyId) async => const FamilyRoster(
    familyId: 'f-1',
    familyName: 'Synthetic Perera Family',
    members: [
      RosterMember(
        id: 'm-1',
        displayName: 'Synthetic Adult',
        role: 'AdultMember',
        clinicalAccess: true,
      ),
      RosterMember(
        id: 'm-2',
        displayName: 'Synthetic Head',
        role: 'Head',
        clinicalAccess: false,
      ),
    ],
  );

  /// Serves the queued workspaces in order, then keeps returning the last one.
  @override
  Future<MemberWorkspace> getMemberWorkspace(String memberId) async {
    final index = _reads < workspaces.length ? _reads : workspaces.length - 1;
    _reads++;
    return MemberWorkspace.fromJson(workspaces[index]);
  }

  @override
  Future<void> addNote(String memberId, String content) async {
    added.add(content);
    if (failStatus != null) throw _http(failStatus!);
  }

  @override
  Future<void> amendNote(String noteId, String content) async {
    amended.add((noteId, content));
    if (failStatus != null) throw _http(failStatus!);
  }
}

Future<_FakeApi> _pump(
  WidgetTester tester, {
  String location = '/families',
  _FakeApi? api,
  Size size = const Size(390, 844),
}) async {
  final fake = api ?? _FakeApi();
  final router = GoRouter(
    initialLocation: location,
    routes: [
      GoRoute(
        path: '/families',
        builder: (_, _) => const DoctorFamiliesScreen(),
      ),
      GoRoute(
        path: '/families/members/:memberId',
        builder: (_, state) => DoctorMemberWorkspaceScreen(
          memberId: state.pathParameters['memberId']!,
        ),
      ),
      GoRoute(
        path: '/families/:familyId',
        builder: (_, state) => DoctorFamilyDetailScreen(
          familyId: state.pathParameters['familyId']!,
        ),
      ),
    ],
  );
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    ProviderScope(
      overrides: [doctorFamiliesApiProvider.overrideWithValue(fake)],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return fake;
}

/// Lists are lazy, so an item below the fold is scrolled into existence first.
Future<void> _reveal(WidgetTester tester, Finder finder) async {
  if (finder.evaluate().isEmpty) {
    await tester.scrollUntilVisible(
      finder,
      200,
      scrollable: find
          .byWidgetPredicate(
            (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
          )
          .first,
    );
  }
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
}

Future<void> _tap(WidgetTester tester, Finder finder) async {
  await _reveal(tester, finder);
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  test('display rules match the web workspace', () {
    expect(vitalLabel('heart_rate'), 'Heart rate');
    expect(vitalLabel('blood_pressure_systolic'), 'Systolic blood pressure');
    expect(consentLabel('HereditaryFlags'), 'Family-history screening');

    final restricted = MemberWorkspace.fromJson(_workspaceJson(access: false));
    expect(restricted.records, isNull, reason: 'null stays null: restricted');
    final empty = MemberWorkspace.fromJson(_workspaceJson());
    expect(empty.records, isEmpty, reason: 'authorised and empty');

    // Same type in two units is two series, never one mixed trend.
    final groups = groupVitals([
      VitalReading(
        vitalType: 'weight',
        value: 61,
        unit: 'kg',
        measuredAt: DateTime(2026, 10),
      ),
      VitalReading(
        vitalType: 'weight',
        value: 134,
        unit: 'lb',
        measuredAt: DateTime(2026, 9),
      ),
    ]);
    expect(groups, hasLength(2));

    const noRange = LabValue(
      analyte: 'Synthetic ESR',
      value: 12,
      unit: 'mm/h',
      range: LabRange.unavailable,
    );
    expect(noRange.referenceLabel, 'Not printed');
  });

  testWidgets('lists assigned families with API-derived summary and search', (
    tester,
  ) async {
    await _pump(tester);

    expect(find.text('My Families'), findsOneWidget);
    expect(find.text('Assigned (2)'), findsOneWidget);
    expect(find.text('Requests (1)'), findsOneWidget);
    expect(
      find.text('Synthetic Solo Family · Individual patient'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField), 'solo');
    await tester.pumpAndSettle();
    expect(find.text('Synthetic Perera Family'), findsNothing);
  });

  testWidgets(
    'accepting a request asks for confirmation and grants no clinical access',
    (tester) async {
      final api = await _pump(tester);
      await _tap(tester, find.text('Requests (1)'));

      await _tap(tester, find.widgetWithText(FilledButton, 'Accept'));
      expect(api.responses, isEmpty);
      expect(find.textContaining('does not grant access'), findsOneWidget);

      await _tap(tester, find.widgetWithText(FilledButton, 'Accept request'));
      expect(api.responses, [('req-1', true)]);
      expect(
        find.textContaining('You are now the family doctor'),
        findsOneWidget,
      );
      expect(find.text('Requests (0)'), findsOneWidget);
    },
  );

  testWidgets(
    'cancelling the confirmation changes nothing; a failure is reported',
    (tester) async {
      final api = await _pump(tester);
      await _tap(tester, find.text('Requests (1)'));

      await _tap(tester, find.widgetWithText(OutlinedButton, 'Decline'));
      await _tap(tester, find.widgetWithText(TextButton, 'Cancel'));
      expect(api.responses, isEmpty);

      api.failStatus = 500;
      await _tap(tester, find.widgetWithText(OutlinedButton, 'Decline'));
      await _tap(tester, find.widgetWithText(FilledButton, 'Decline request'));
      expect(find.textContaining('could not be saved'), findsOneWidget);
      expect(find.text('Requests (1)'), findsOneWidget);
    },
  );

  testWidgets(
    'family directory shows the real grant state and opens a member',
    (tester) async {
      await _pump(tester);
      await _tap(tester, find.byKey(const ValueKey('open-family-f-1')));

      expect(
        find.text('2 members · 1 with an active care grant'),
        findsOneWidget,
      );
      expect(find.text('Open Member Workspace'), findsOneWidget);
      await _reveal(tester, find.text('View Access Details'));
      expect(find.text('View Access Details'), findsOneWidget);

      await _tap(tester, find.widgetWithText(ChoiceChip, 'Restricted'));
      expect(find.text('Synthetic Adult'), findsNothing);
      await _tap(tester, find.widgetWithText(ChoiceChip, 'All members'));

      await _tap(tester, find.byKey(const ValueKey('open-member-m-1')));
      expect(find.text('Clinical access permitted'), findsOneWidget);
    },
  );

  testWidgets('restricted member shows no counts and no note form', (
    tester,
  ) async {
    final api = _FakeApi()..workspaces = [_workspaceJson(access: false)];
    await _pump(tester, location: '/families/members/m-1', api: api);

    expect(find.text('Clinical categories restricted'), findsOneWidget);
    await _tap(tester, find.widgetWithText(Tab, 'Records'));
    expect(find.text('Records restricted'), findsOneWidget);
    expect(find.text('No records'), findsNothing);
    await _tap(tester, find.widgetWithText(Tab, 'Notes'));
    expect(find.byKey(const ValueKey('note-save')), findsNothing);
  });

  testWidgets(
    'consented categories open; others stay restricted; labs are deterministic',
    (tester) async {
      final api = _FakeApi()
        ..workspaces = [
          _workspaceJson(
            labReports: [
              {
                'id': 'lab-1',
                'fileName': 'synthetic-cbc.png',
                'collectedAt': null,
                'values': [
                  {
                    'analyte': 'Synthetic Hb',
                    'value': 11.2,
                    'unit': 'g/dL',
                    'referenceLow': 12,
                    'referenceHigh': 15,
                    'rangeStatus': 'BelowRange',
                  },
                ],
              },
            ],
          ),
        ];
      await _pump(tester, location: '/families/members/m-1', api: api);

      expect(find.text('Conditions / Records'), findsOneWidget);
      await _tap(tester, find.widgetWithText(Tab, 'Records'));
      expect(find.text('No records'), findsOneWidget);
      await _tap(tester, find.widgetWithText(Tab, 'Labs'));
      expect(find.text('Below range'), findsOneWidget);
      expect(find.text('Printed range: 12 – 15 g/dL'), findsOneWidget);
      await _tap(tester, find.widgetWithText(Tab, 'Vitals'));
      expect(find.text('Vitals restricted'), findsOneWidget);
    },
  );

  testWidgets(
    'vitals use readable names and one reading is not drawn as a trend',
    (tester) async {
      final api = _FakeApi()
        ..workspaces = [
          _workspaceJson(
            consent: ['VitalsSummary'],
            vitals: [
              {
                'vitalType': 'heart_rate',
                'value': 72,
                'unit': 'bpm',
                'measuredAt': '2026-10-01T08:00:00Z',
              },
              {
                'vitalType': 'heart_rate',
                'value': 74,
                'unit': 'bpm',
                'measuredAt': '2026-09-01T08:00:00Z',
              },
              {
                'vitalType': 'blood_pressure_systolic',
                'value': 116,
                'unit': 'mmHg',
                'measuredAt': '2026-09-20T08:00:00Z',
              },
            ],
          ),
        ];
      await _pump(tester, location: '/families/members/m-1', api: api);
      await _tap(tester, find.widgetWithText(Tab, 'Vitals'));

      expect(find.textContaining('heart_rate'), findsNothing);
      expect(find.text('Heart rate trend'), findsOneWidget);
      expect(find.byType(CustomPaint), findsWidgets);

      await _tap(tester, find.text('Systolic blood pressure · 116 mmHg'));
      expect(find.textContaining('One reading recorded'), findsOneWidget);
      expect(find.textContaining('116/'), findsNothing);
    },
  );

  testWidgets('adds a note, then amends the original as a new version', (
    tester,
  ) async {
    final note = {
      'id': 'n-1',
      'content': 'Synthetic original',
      'version': 1,
      'amendsNoteId': null,
      'createdAt': '2026-10-01T08:00:00Z',
    };
    final api = _FakeApi()
      ..workspaces = [
        _workspaceJson(),
        _workspaceJson(notes: [note]),
      ];
    await _pump(tester, location: '/families/members/m-1', api: api);
    await _tap(tester, find.widgetWithText(Tab, 'Notes'));

    await tester.enterText(
      find.byKey(const ValueKey('note-input')),
      'Synthetic original',
    );
    await tester.pumpAndSettle();
    await _tap(tester, find.byKey(const ValueKey('note-save')));
    expect(api.added, ['Synthetic original']);
    expect(find.text('Note saved.'), findsOneWidget);

    await _tap(tester, find.byKey(const ValueKey('amend-n-1')));
    await tester.enterText(
      find.byKey(const ValueKey('note-input')),
      'Synthetic corrected',
    );
    await tester.pumpAndSettle();
    await _tap(tester, find.byKey(const ValueKey('note-save')));
    expect(api.amended, [('n-1', 'Synthetic corrected')]);
    expect(find.text('Synthetic original'), findsOneWidget);
  });

  testWidgets('a denied write re-reads the workspace and drops clinical data', (
    tester,
  ) async {
    final api = _FakeApi()
      ..workspaces = [
        _workspaceJson(
          records: [
            {
              'id': 'r-1',
              'recordType': 'Condition',
              'title': 'Synthetic condition',
              'summary': null,
              'occurredOn': '2026-01-01',
            },
          ],
        ),
        _workspaceJson(access: false),
      ]
      ..failStatus = 403;
    await _pump(tester, location: '/families/members/m-1', api: api);
    await _tap(tester, find.widgetWithText(Tab, 'Notes'));
    await tester.enterText(
      find.byKey(const ValueKey('note-input')),
      'Synthetic late note',
    );
    await tester.pumpAndSettle();
    await _tap(tester, find.byKey(const ValueKey('note-save')));

    expect(find.textContaining('The note was not saved'), findsOneWidget);
    await _tap(tester, find.widgetWithText(Tab, 'Records'));
    expect(find.text('Synthetic condition'), findsNothing);
    expect(find.text('Records restricted'), findsOneWidget);
  });

  testWidgets('fits a small phone with large text without overflow', (
    tester,
  ) async {
    final api = _FakeApi();
    tester.platformDispatcher.textScaleFactorTestValue = 1.5;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await _pump(tester, api: api, size: const Size(320, 640));
    expect(tester.takeException(), isNull, reason: 'families');
    final steps = <(String, Finder)>[
      ('requests', find.text('Requests (1)')),
      ('assigned', find.text('Assigned (2)')),
      ('family directory', find.byKey(const ValueKey('open-family-f-1'))),
      ('member overview', find.byKey(const ValueKey('open-member-m-1'))),
      for (final tab in ['Records', 'Labs', 'Vitals', 'Visits', 'Notes'])
        (tab, find.widgetWithText(Tab, tab)),
    ];
    for (final (name, finder) in steps) {
      await _tap(tester, finder);
      expect(tester.takeException(), isNull, reason: name);
    }
  });
}
