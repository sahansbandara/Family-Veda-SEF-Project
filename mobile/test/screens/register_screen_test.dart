import 'package:family_veda/screens/auth/register_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> _enter(WidgetTester tester, String label, String value) async {
  await tester.enterText(find.widgetWithText(TextFormField, label), value);
}

Future<void> _continue(WidgetTester tester) async {
  await tester.ensureVisible(find.text('Continue'));
  await tester.tap(find.text('Continue'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'registration requires choosing a district instead of defaulting one',
    (tester) async {
      tester.view.physicalSize = const Size(900, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: RegisterScreen())),
      );
      await tester.pumpAndSettle();
      await _continue(tester);

      await _enter(tester, 'Full name', 'Synthetic Head');
      await _enter(tester, 'Email address', 'synthetic.head@example.invalid');
      await _enter(tester, 'Sri Lankan mobile', '0771234567');
      await _enter(tester, 'Password', 'Synthetic-Pass-42!');
      await _enter(tester, 'Confirm password', 'Synthetic-Pass-42!');
      await _continue(tester);

      await _enter(tester, 'Date of birth (YYYY-MM-DD)', '1985-06-15');
      await _enter(tester, 'Family name', 'Synthetic Family');
      await _enter(tester, 'Synthetic NIC', '200012345678');
      await _enter(tester, 'Address line 1', '12 Synthetic Lane');
      await _enter(tester, 'City', 'Kandy');
      await _continue(tester);

      expect(find.text('Choose a district.'), findsOneWidget);
      expect(
        find.widgetWithText(TextFormField, 'Address line 1'),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'shows calendar picker button on date of birth field',
    (tester) async {
      tester.view.physicalSize = const Size(900, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: RegisterScreen())),
      );
      await tester.pumpAndSettle();
      await _continue(tester);

      await _enter(tester, 'Full name', 'Synthetic Head');
      await _enter(tester, 'Email address', 'synthetic.head@example.invalid');
      await _enter(tester, 'Sri Lankan mobile', '0771234567');
      await _enter(tester, 'Password', 'Synthetic-Pass-42!');
      await _enter(tester, 'Confirm password', 'Synthetic-Pass-42!');
      await _continue(tester);

      expect(find.byIcon(Icons.calendar_month_outlined), findsOneWidget);
      await tester.tap(find.byIcon(Icons.calendar_month_outlined));
      await tester.pumpAndSettle();
      expect(find.text('Select Date of Birth'), findsOneWidget);
    },
  );
}
