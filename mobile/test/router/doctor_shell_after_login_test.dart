// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// The role returned by a fresh sign-in must reach the shell through the real router and auth
// provider: a doctor gets the clinician menu, never the family menu.
import 'dart:async';

import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/providers/notifications_provider.dart';
import 'package:family_veda/router/app_router.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:family_veda/services/storage/secure_token_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeTokenStore extends Fake implements TokenStore {
  final _expirations = StreamController<void>.broadcast();
  String? refreshToken = 'stale-refresh-token';

  @override
  Stream<void> get sessionExpirations => _expirations.stream;

  @override
  Future<bool> isCleanupPending() async => false;

  @override
  Future<String?> readRefreshToken() async => refreshToken;

  @override
  Future<void> writeTokens({
    required String accessToken,
    required String refreshToken,
  }) async => this.refreshToken = refreshToken;

  @override
  Future<void> clear() async => refreshToken = null;

  @override
  Future<void> expireSession() async {
    await clear();
    _expirations.add(null);
  }
}

class _FakeAuthApi extends Fake implements AuthApi {
  _FakeAuthApi(this._store, {required this.userType});

  final _FakeTokenStore _store;
  final String userType;

  // The API client expires the session when the stored refresh token is rejected.
  @override
  Future<AuthTokens> refresh(String refreshToken) async {
    await _store.expireSession();
    throw StateError('refresh token rejected');
  }

  @override
  Future<AuthTokens> login({
    required String email,
    required String password,
  }) async => AuthTokens(
    userId: 'synthetic-user',
    accessToken: 'access',
    refreshToken: 'refresh',
    displayName: 'Synthetic User',
    userType: userType,
  );
}

Future<void> _signInAfterExpiredSession(
  WidgetTester tester, {
  required String userType,
}) async {
  tester.view.physicalSize = const Size(800, 1200);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  final store = _FakeTokenStore();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        tokenStoreProvider.overrideWithValue(store),
        authApiProvider.overrideWithValue(
          _FakeAuthApi(store, userType: userType),
        ),
        membersProvider.overrideWith((ref) async => const []),
        notificationsProvider.overrideWith((ref) async => const []),
        familyDashboardProvider.overrideWith(
          (ref) async => const FamilyDashboard(
            role: 'AdultMember',
            memberCount: 0,
            minorCount: 0,
            openCases: 0,
            approvedGuidanceCount: 0,
            unreadNotifications: 0,
          ),
        ),
      ],
      child: Consumer(
        builder: (context, ref, _) =>
            MaterialApp.router(routerConfig: ref.watch(appRouterProvider)),
      ),
    ),
  );
  await tester.pumpAndSettle();
  // The stored session was rejected, so the app is back on the sign-in form.
  expect(find.widgetWithText(TextFormField, 'Email Address'), findsOneWidget);

  await tester.enterText(
    find.widgetWithText(TextFormField, 'Email Address'),
    'demo-doctor@example.invalid',
  );
  await tester.enterText(
    find.widgetWithText(TextFormField, 'Password'),
    'synthetic-password',
  );
  await tester.tap(find.byType(ElevatedButton));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'a doctor signing in after an expired session gets the clinician menu',
    (tester) async {
      await _signInAfterExpiredSession(tester, userType: 'Doctor');

      final nav = find.byType(NavigationBar);
      for (final label in [
        'Calendar',
        'My Families',
        'Triage Cases',
        'Profile',
      ]) {
        expect(
          find.descendant(of: nav, matching: find.text(label)),
          findsOneWidget,
        );
      }
      for (final label in ['My Family', 'Records', 'Triage', 'Appointments']) {
        expect(
          find.descendant(of: nav, matching: find.text(label)),
          findsNothing,
        );
      }
      expect(find.text('Health Records'), findsNothing);
      expect(find.text('My Doctor'), findsNothing);
    },
  );

  testWidgets('a family user signing in keeps the family menu', (tester) async {
    await _signInAfterExpiredSession(tester, userType: 'FamilyUser');

    final nav = find.byType(NavigationBar);
    for (final label in ['My Family', 'Records', 'Triage', 'Appointments']) {
      expect(
        find.descendant(of: nav, matching: find.text(label)),
        findsOneWidget,
      );
    }
    expect(
      find.descendant(of: nav, matching: find.text('Triage Cases')),
      findsNothing,
    );
  });
}
