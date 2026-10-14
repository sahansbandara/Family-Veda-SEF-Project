// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/widgets/family/head_dashboard_section.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

FamilyDashboard _headDashboard({int pendingJoinRequests = 2}) =>
    FamilyDashboard.fromJson({
      'role': 'Head',
      'familyName': 'Synthetic Perera Family',
      'familyCode': 'FV-7K4P92',
      'memberCount': 4,
      'minorCount': 1,
      'pendingJoinRequests': pendingJoinRequests,
      'openCases': 1,
      'approvedGuidanceCount': 0,
      'unreadNotifications': 0,
      'members': [
        {
          'id': 'm1',
          'displayName': 'Synthetic Head',
          'role': 'Head',
          'isSelf': true,
          'isMinor': false,
          'summary': 'You · no upcoming appointments',
        },
        {
          'id': 'm2',
          'displayName': 'Synthetic Adult',
          'role': 'AdultMember',
          'isSelf': false,
          'isMinor': false,
          'summary': 'Adult · private by default',
        },
      ],
      'activity': [
        {
          'title': 'Lab report shared',
          'subject': 'Synthetic Adult',
          'occurredAt': '2026-09-26T08:00:00Z',
        },
      ],
    });

Future<List<String>> _pump(
  WidgetTester tester,
  FamilyDashboard dashboard,
) async {
  final visited = <String>[];
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: HeadDashboardSection(
            dashboard: dashboard,
            onNavigate: visited.add,
          ),
        ),
      ),
    ),
  );
  return visited;
}

void main() {
  testWidgets('shows family code, metrics, members and shared activity', (
    tester,
  ) async {
    await _pump(tester, _headDashboard());

    expect(find.text('Synthetic Perera Family'), findsOneWidget);
    expect(find.text('Family Code FV-7K4P92'), findsOneWidget);
    expect(find.text('1 minor'), findsOneWidget);
    expect(find.text('Adult · private by default'), findsOneWidget);
    expect(find.text('Lab report shared'), findsOneWidget);
    expect(find.text('Emergency Help'), findsNothing);
    expect(
      find.text(
        'No family doctor yet. Search the directory and send a request.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('join-request attention card routes to the review screen', (
    tester,
  ) async {
    final visited = await _pump(tester, _headDashboard());

    await tester.ensureVisible(find.text('2 join requests'));
    await tester.tap(find.text('2 join requests'));
    expect(visited, ['/join-requests']);
  });

  testWidgets('says nothing needs attention when there is nothing pending', (
    tester,
  ) async {
    await _pump(tester, _headDashboard(pendingJoinRequests: 0));

    expect(
      find.text('Nothing needs your attention right now.'),
      findsOneWidget,
    );
  });
}
