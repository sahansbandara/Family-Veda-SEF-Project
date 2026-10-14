// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/models/member.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/screens/family/members_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MembersScreen renders hero banner, 4 sub-tabs, and switches tabs', (
    tester,
  ) async {
    final members = [
      const Member(
        id: 'mem-1',
        displayName: 'John Doe',
        relationshipLabel: 'Head',
      ),
      const Member(
        id: 'mem-2',
        displayName: 'Jane Doe',
        relationshipLabel: 'Spouse',
      ),
    ];

    const dashboard = FamilyDashboard(
      role: 'Head',
      familyId: 'fam-1',
      familyName: 'Perera Family',
      familyCode: 'LK-PERERA-9082',
      memberCount: 2,
      minorCount: 0,
      openCases: 0,
      approvedGuidanceCount: 0,
      unreadNotifications: 0,
      pendingJoinRequests: 1,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          membersProvider.overrideWith((ref) => members),
          familyDashboardProvider.overrideWith((ref) => Future.value(dashboard)),
          pendingJoinRequestsProvider('fam-1').overrideWith((ref) => Future.value([])),
          incomingInvitationsProvider.overrideWith((ref) => Future.value([])),
          familySentInvitationsProvider('fam-1').overrideWith((ref) => Future.value([])),
        ],
        child: const MaterialApp(
          home: MembersScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('MEMBERSHIP'), findsOneWidget);
    expect(find.text('Perera Family'), findsOneWidget);
    expect(find.text('LK-PERERA-9082'), findsOneWidget);

    // Verify 4 Sub-Tabs
    expect(find.text('Members'), findsOneWidget);
    expect(find.text('Join Requests'), findsOneWidget);
    expect(find.text('Invitations'), findsOneWidget);
    expect(find.text('Family Settings'), findsOneWidget);

    // Members Tab Content
    expect(find.text('TOTAL MEMBERS'), findsOneWidget);
    expect(find.text('Family head'), findsOneWidget);
    expect(find.text('1 head'), findsOneWidget);
    expect(find.text('Adult members'), findsOneWidget);
    expect(find.text('Minor profiles'), findsNothing);
    expect(find.text('John Doe'), findsOneWidget);
    expect(find.text('Jane Doe'), findsOneWidget);

    // Switch to Join Requests Tab
    await tester.tap(find.text('Join Requests'));
    await tester.pumpAndSettle();
    expect(find.text('Pending join requests'), findsOneWidget);

    // Switch to Invitations Tab
    await tester.tap(find.text('Invitations'));
    await tester.pumpAndSettle();
    expect(find.text('Invite adult'), findsOneWidget);
    expect(find.text('Create invitation'), findsOneWidget);

    // Switch to Family Settings Tab
    await tester.tap(find.text('Family Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Save name'), findsOneWidget);
    expect(find.text('Copy code'), findsOneWidget);
  });

  testWidgets('MembersScreen hides Head-only tabs and never calls Head-only providers for an Adult', (
    tester,
  ) async {
    final headOnlyCalls = <String>[];
    const dashboard = FamilyDashboard(
      role: 'Adult',
      familyId: 'fam-1',
      familyName: 'Perera Family',
      familyCode: 'LK-PERERA-9082',
      memberCount: 2,
      minorCount: 0,
      openCases: 0,
      approvedGuidanceCount: 0,
      unreadNotifications: 0,
      pendingJoinRequests: 0,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          membersProvider.overrideWith((ref) => [
                const Member(id: 'mem-1', displayName: 'John Doe', relationshipLabel: 'Head'),
                const Member(id: 'mem-2', displayName: 'Jane Doe', relationshipLabel: 'Spouse'),
              ]),
          familyDashboardProvider.overrideWith((ref) => Future.value(dashboard)),
          pendingJoinRequestsProvider('fam-1').overrideWith((ref) {
            headOnlyCalls.add('pendingJoinRequests');
            throw StateError('Head-only endpoint called');
          }),
          incomingInvitationsProvider.overrideWith((ref) => Future.value([])),
          familySentInvitationsProvider('fam-1').overrideWith((ref) {
            headOnlyCalls.add('familySentInvitations');
            throw StateError('Head-only endpoint called');
          }),
        ],
        child: const MaterialApp(home: MembersScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Members'), findsOneWidget);
    expect(find.text('Family Settings'), findsOneWidget);
    expect(find.text('Join Requests'), findsNothing);
    expect(find.text('Invitations'), findsNothing);
    expect(find.text('John Doe'), findsOneWidget);
    expect(find.text('Something went wrong'), findsNothing);

    await tester.tap(find.text('Family Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Something went wrong'), findsNothing);
    expect(headOnlyCalls, isEmpty);
  });
}
