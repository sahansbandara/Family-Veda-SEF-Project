// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import 'package:family_veda/screens/public/public_information_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

GoRouter _router(String initialLocation) => GoRouter(
  initialLocation: initialLocation,
  routes: [
    GoRoute(path: '/login', builder: (_, _) => const Scaffold(body: Text('login-stub'))),
    GoRoute(path: '/about', builder: (_, _) => const PublicInformationScreen(kind: PublicInformationKind.about)),
    GoRoute(path: '/privacy-policy', builder: (_, _) => const PublicInformationScreen(kind: PublicInformationKind.privacy)),
    GoRoute(path: '/terms', builder: (_, _) => const PublicInformationScreen(kind: PublicInformationKind.terms)),
  ],
);

Future<void> _pump(WidgetTester tester, String location, {Size size = const Size(390, 844)}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(MaterialApp.router(routerConfig: _router(location)));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('each public route shows its own title', (tester) async {
    await _pump(tester, '/about');
    expect(find.text('About Family Veda'), findsOneWidget);

    await _pump(tester, '/privacy-policy');
    expect(find.text('Privacy and data use'), findsOneWidget);

    await _pump(tester, '/terms');
    expect(find.text('Terms for using Family Veda'), findsOneWidget);
  });

  testWidgets('terms state the clinical boundaries', (tester) async {
    await _pump(tester, '/terms');
    expect(find.textContaining('does not provide a diagnosis, prescription, medication dosing or meal plan'), findsOneWidget);
  });

  testWidgets('footer links move between the public pages', (tester) async {
    await _pump(tester, '/about');

    final privacyLink = find.widgetWithText(TextButton, 'Privacy policy');
    await tester.scrollUntilVisible(privacyLink, 300);
    await tester.tap(privacyLink);
    await tester.pumpAndSettle();
    expect(find.text('Privacy and data use'), findsOneWidget);

    final termsLink = find.widgetWithText(TextButton, 'Terms of service');
    await tester.scrollUntilVisible(termsLink, 300);
    await tester.tap(termsLink);
    await tester.pumpAndSettle();
    expect(find.text('Terms for using Family Veda'), findsOneWidget);
  });

  testWidgets('back returns to login when there is nothing to pop', (tester) async {
    await _pump(tester, '/terms');
    await tester.tap(find.byTooltip('Back'));
    await tester.pumpAndSettle();
    expect(find.text('login-stub'), findsOneWidget);
  });

  testWidgets('lays out without overflow on a small phone', (tester) async {
    await _pump(tester, '/privacy-policy', size: const Size(320, 568));
    expect(tester.takeException(), isNull);
  });
}
