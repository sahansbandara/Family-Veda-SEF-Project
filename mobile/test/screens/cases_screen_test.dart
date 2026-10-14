import 'package:family_veda/models/triage_case.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/cases_provider.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/screens/triage/cases_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

TriageCase _case(String id, String status) =>
    TriageCase(id: id, status: status, submittedAt: DateTime.utc(2026, 9, 30));

void main() {
  test(
    'status labels use family wording and never call low confidence a review',
    () {
      expect(
        caseStatusLabel('PENDING_DOCTOR_REVIEW'),
        'Waiting for doctor review',
      );
      expect(caseStatusLabel('APPROVED_REVISED'), 'Guidance available');
      expect(caseStatusLabel('LOW_CONFIDENCE'), 'More information needed');
      expect(caseStatusLabel('FAILED_SAFE'), 'In-person care needed');
      expect(caseStatusLabel('ANALYSED'), 'Being reviewed');
    },
  );

  testWidgets('lists requests, filters them and survives an unknown member', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => 'synthetic-member'),
          membersProvider.overrideWith((ref) async => const []),
          memberCasesProvider.overrideWith(
            (ref) async => [
              _case('synthetic-pending', 'PENDING_DOCTOR_REVIEW'),
              _case('synthetic-approved', 'APPROVED'),
            ],
          ),
        ],
        child: const MaterialApp(home: CasesScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('2 requests'), findsOneWidget);
    expect(find.text('Family member'), findsNWidgets(2));
    expect(find.text('Waiting for doctor review'), findsOneWidget);
    expect(find.text('Guidance available'), findsOneWidget);
    expect(find.text('Call 1990'), findsOneWidget);

    await tester.tap(find.text('Guidance ready'));
    await tester.pumpAndSettle();
    expect(find.text('Waiting for doctor review'), findsNothing);
    expect(find.text('Guidance available'), findsOneWidget);

    await tester.tap(find.text('In review'));
    await tester.pumpAndSettle();
    expect(find.text('Waiting for doctor review'), findsOneWidget);
    expect(find.text('Guidance available'), findsNothing);
  });
}
