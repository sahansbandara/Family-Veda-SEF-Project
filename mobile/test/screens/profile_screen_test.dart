// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/screens/profile/profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

const _profile = <String, dynamic>{
  'userId': 'u1',
  'email': 'synthetic.head@example.invalid',
  'displayName': 'Synthetic Head',
  'userType': 'FamilyUser',
  'createdAt': '2026-01-01T00:00:00Z',
  'familyRole': 'Head',
  'familyName': 'Synthetic Family',
  'familyCode': 'FV-ABC234',
  'dateOfBirth': '1985-06-15',
  'sexForClinicalReference': 'Female',
};

Future<void> _pump(WidgetTester tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [myProfileProvider.overrideWith((ref) async => _profile)],
      child: const MaterialApp(home: ProfileScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  test('password strength follows the typed value', () {
    expect(passwordStrength('').score, 0);
    expect(passwordStrength('abc').score, 1);
    expect(passwordStrength('abcdefgh').score, 2);
    expect(passwordStrength('Synthetic-Pass-42!').score, 4);
  });

  testWidgets('save is disabled until the display name changes', (
    tester,
  ) async {
    await _pump(tester);
    final save = find.widgetWithText(FilledButton, 'Save');
    expect(tester.widget<FilledButton>(save).onPressed, isNull);
    await tester.enterText(find.byType(TextField).first, 'New Name');
    await tester.pump();
    expect(tester.widget<FilledButton>(save).onPressed, isNotNull);
  });

  testWidgets('account section shows read-only family tiles', (tester) async {
    await _pump(tester);
    await tester.tap(find.text('Account'));
    await tester.pumpAndSettle();
    expect(find.text('1985-06-15'), findsOneWidget);
    expect(find.text('Changed by your Family Head or support'), findsWidgets);
  });

  testWidgets('security section rates the new password', (tester) async {
    await _pump(tester);
    await tester.tap(find.text('Security'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextField, 'New password'),
      'Synthetic-Pass-42!',
    );
    await tester.pump();
    expect(find.text('Strength: Strong'), findsOneWidget);
  });
}
