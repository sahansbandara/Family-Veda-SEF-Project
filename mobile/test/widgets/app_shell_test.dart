import 'package:family_veda/widgets/shared/app_shell.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('AppShell renders all 5 core navigation tabs and navigates on tap', (
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
              path: '/appointments',
              builder: (_, _) => const Scaffold(body: Text('Appointments Screen Content')),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();

    // Verify all 5 tab labels are visible
    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('My Family'), findsOneWidget);
    expect(find.text('Records'), findsOneWidget);
    expect(find.text('Triage'), findsOneWidget);
    expect(find.text('Appointments'), findsOneWidget);
    expect(find.text('Home Screen Content'), findsOneWidget);

    // Tap "Records" tab
    await tester.tap(find.text('Records'));
    await tester.pumpAndSettle();
    expect(find.text('Records Screen Content'), findsOneWidget);

    // Tap "Appointments" tab
    await tester.tap(find.text('Appointments'));
    await tester.pumpAndSettle();
    expect(find.text('Appointments Screen Content'), findsOneWidget);

    // Tap "My Family" tab
    await tester.tap(find.text('My Family'));
    await tester.pumpAndSettle();
    expect(find.text('Members Screen Content'), findsOneWidget);
  });
}
