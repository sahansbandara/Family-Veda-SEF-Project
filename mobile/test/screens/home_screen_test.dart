import 'package:family_veda/models/member.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/screens/home/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('tapping actions without an active member prompts user to select a member', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        GoRoute(
          path: '/home',
          builder: (_, _) => const HomeScreen(),
        ),
        GoRoute(
          path: '/members',
          builder: (_, _) => const Scaffold(body: Text('Members List Screen')),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => null),
          membersProvider.overrideWith((ref) async => const []),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    // Verify "No member selected" prompt is visible
    expect(find.text('No member selected'), findsOneWidget);
    expect(find.text('Describe a symptom'), findsOneWidget);

    // Tap "Describe a symptom" - should not be a dead click
    await tester.tap(find.text('Describe a symptom'));
    await tester.pumpAndSettle();

    // Verify user is navigated to /members and informed
    expect(find.text('Members List Screen'), findsOneWidget);
    expect(
      find.text('Please choose a family member first to access this feature.'),
      findsOneWidget,
    );
  });

  testWidgets('auto-selects first member when members list is available', (
    tester,
  ) async {
    const sampleMembers = <Member>[
      Member(
        id: 'member-1',
        displayName: 'John Doe',
        relationshipLabel: 'Head',
      ),
    ];

    late WidgetRef capturedRef;
    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        GoRoute(
          path: '/home',
          builder: (context, _) => Consumer(
            builder: (context, ref, child) {
              capturedRef = ref;
              return const HomeScreen();
            },
          ),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          membersProvider.overrideWith((ref) async => sampleMembers),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    // First member should be auto-selected
    expect(capturedRef.read(activeMemberProvider), 'member-1');
    expect(find.text('John Doe'), findsOneWidget);
  });

  testWidgets('displays profile card and opens detailed profile bottom sheet', (
    tester,
  ) async {
    const sampleMembers = <Member>[
      Member(
        id: 'mem-99',
        displayName: 'Jane Doe',
        relationshipLabel: 'Spouse',
        dateOfBirth: '1985-05-12',
      ),
    ];

    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        GoRoute(
          path: '/home',
          builder: (_, _) => const HomeScreen(),
        ),
        GoRoute(
          path: '/members',
          builder: (_, _) => const Scaffold(body: Text('Members List Screen')),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => 'mem-99'),
          membersProvider.overrideWith((ref) async => sampleMembers),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    // Verify profile info card on home screen
    expect(find.text('Jane Doe'), findsOneWidget);
    expect(find.text('Spouse'), findsOneWidget);
    expect(find.text('JD'), findsWidgets); // Both in card and AppBar avatar

    // Tap the profile card to open modal bottom sheet
    await tester.tap(find.text('Jane Doe'));
    await tester.pumpAndSettle();

    // Verify modal sheet profile details
    expect(find.text('Member ID'), findsOneWidget);
    expect(find.text('mem-99'), findsOneWidget);
    expect(find.text('Date of Birth'), findsOneWidget);
    expect(find.text('1985-05-12'), findsOneWidget);
    expect(find.text('Clinical Consent'), findsOneWidget);
    expect(find.text('Switch family member'), findsWidgets);
  });
}

