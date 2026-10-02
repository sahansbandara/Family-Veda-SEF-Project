// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import 'package:family_veda/models/member.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/screens/family/members_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MembersScreen renders hero banner and members roster', (
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

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          membersProvider.overrideWith((ref) => members),
        ],
        child: const MaterialApp(
          home: MembersScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('MEMBERSHIP'), findsOneWidget);
    expect(find.text('Family Members'), findsOneWidget);
    expect(find.text('ROSTER (2)'), findsOneWidget);
    expect(find.text('John Doe'), findsOneWidget);
    expect(find.text('Jane Doe'), findsOneWidget);
  });
}
