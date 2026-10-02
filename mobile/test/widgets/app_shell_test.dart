import 'package:family_veda/widgets/shared/app_shell.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('AppShell renders all 7 web-aligned subnav tabs and bottom navigation', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        ShellRoute(
          builder: (context, state, child) => AppShell(
            currentLocation: state.matchedLocation,
            child: child,
          ),
          routes: [
            GoRoute(
              path: '/home',
              builder: (_, _) => const Scaffold(body: Text('Home Screen Content')),
            ),
            GoRoute(
              path: '/members',
              builder: (_, _) => const Scaffold(body: Text('Members Screen Content')),
            ),
            GoRoute(
              path: '/records',
              builder: (_, _) => const Scaffold(body: Text('Records Screen Content')),
            ),
            GoRoute(
              path: '/cases',
              builder: (_, _) => const Scaffold(body: Text('Cases Screen Content')),
            ),
            GoRoute(
              path: '/my-doctor',
              builder: (_, _) => const Scaffold(body: Text('Doctor Screen Content')),
            ),
            GoRoute(
              path: '/appointments',
              builder: (_, _) => const Scaffold(body: Text('Appointments Screen Content')),
            ),
            GoRoute(
              path: '/profile',
              builder: (_, _) => const Scaffold(body: Text('Profile Screen Content')),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();

    // Verify web subnav tab labels and bottom navigation
    expect(find.text('Dashboard'), findsWidgets);
    expect(find.text('My Family'), findsWidgets);
    expect(find.text('Health Records'), findsOneWidget);
    expect(find.text('Symptoms & Triage'), findsOneWidget);
    expect(find.text('My Doctor'), findsOneWidget);
    expect(find.text('Appointments'), findsWidgets);
    expect(find.text('Privacy & Access'), findsOneWidget);
    expect(find.text('Home Screen Content'), findsOneWidget);

    // Tap "Health Records" top subnav tab
    await tester.ensureVisible(find.text('Health Records'));
    await tester.tap(find.text('Health Records'));
    await tester.pumpAndSettle();
    expect(find.text('Records Screen Content'), findsOneWidget);

    // Tap "My Doctor" top subnav tab
    await tester.ensureVisible(find.text('My Doctor'));
    await tester.tap(find.text('My Doctor'));
    await tester.pumpAndSettle();
    expect(find.text('Doctor Screen Content'), findsOneWidget);

    // Tap "Privacy & Access" top subnav tab
    await tester.ensureVisible(find.text('Privacy & Access'));
    await tester.tap(find.text('Privacy & Access'));
    await tester.pumpAndSettle();
    expect(find.text('Profile Screen Content'), findsOneWidget);

    // Tap "My Family" tab
    await tester.ensureVisible(find.text('My Family').first);
    await tester.tap(find.text('My Family').first);
    await tester.pumpAndSettle();
    expect(find.text('Members Screen Content'), findsOneWidget);
  });
}
