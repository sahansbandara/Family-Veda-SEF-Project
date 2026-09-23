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

    // Verify Clinical Workspace and Workspace Access text hierarchy
    expect(find.text('Family Veda'), findsOneWidget);
    expect(find.text('CLINICAL WORKSPACE'), findsOneWidget);
    expect(find.text('WORKSPACE ACCESS'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('⚡ QUICK FILL DEMO ROLE'), findsOneWidget);

    // Verify Theme buttons
    expect(find.text('Light'), findsOneWidget);
    expect(find.text('Dark'), findsOneWidget);

    // Verify Continue securely CTA button
    expect(find.text('Continue securely'), findsOneWidget);

    // Verify Accordion exists
    expect(
      find.text('View demo credentials & permitted pages'),
      findsOneWidget,
    );

    // Test tapping a demo credential
    await tester.tap(find.text('View demo credentials & permitted pages'));
    await tester.pumpAndSettle();

    // Verify demo roles are present in the accordion
    expect(find.text('Family Head'), findsOneWidget);
    expect(find.text('Verified Doctor'), findsOneWidget);

    // Tap Family Head demo credential to auto fill
    await tester.tap(find.text('Family Head'));
    await tester.pumpAndSettle();

    // Verify email and password text fields are populated
    expect(
      find.widgetWithText(TextFormField, 'demo-head@example.invalid'),
      findsOneWidget,
    );
    expect(
      find.widgetWithText(TextFormField, 'Demo@123456!!'),
      findsOneWidget,
    );
  });
}
