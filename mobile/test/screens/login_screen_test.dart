import 'package:family_veda/providers/auth_provider.dart';
import 'package:family_veda/screens/auth/login_screen.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:family_veda/services/storage/secure_token_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthApi extends Fake implements AuthApi {}

class _FakeTokenStore extends Fake implements TokenStore {
  @override
  Stream<void> get sessionExpirations => const Stream.empty();

  @override
  Future<bool> isCleanupPending() async => false;

  @override
  Future<String?> readRefreshToken() async => null;
}

void main() {
  testWidgets('login screen renders web-aligned clinical workspace card and controls', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final fakeController = AuthController(
      authApi: _FakeAuthApi(),
      tokenStore: _FakeTokenStore(),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((_) => fakeController),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );
    await tester.pumpAndSettle();

    // Redesigned glass login (feat/auth-redesign-s4): no layout overflow, core controls present.
    expect(tester.takeException(), isNull);
    expect(find.widgetWithText(TextField, 'Email Address'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Password'), findsOneWidget);
    expect(find.text('Sign up'), findsOneWidget);
    expect(find.textContaining(RegExp('diagnos', caseSensitive: false)), findsNothing);
  });
}
