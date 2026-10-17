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

Future<void> pumpRegister(WidgetTester tester) async {
  tester.view.physicalSize = const Size(900, 2400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    const ProviderScope(child: MaterialApp(home: RegisterScreen())),
  );
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

  testWidgets('shows calendar picker button on date of birth field', (
    tester,
  ) async {
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
  });
  for (final role in ['Family Head', 'Adult Member', 'Doctor']) {
    testWidgets('$role mobile rejects typed and pasted letters', (
      tester,
    ) async {
      await pumpRegister(tester);
      if (role != 'Family Head') await tester.tap(find.text(role));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      final phone = find.widgetWithText(TextFormField, 'Sri Lankan mobile');
      await tester.enterText(phone, 'letters');
      expect(tester.widget<TextFormField>(phone).controller!.text, isEmpty);
      await tester.enterText(phone, '+94771234567');
      expect(
        tester.widget<TextFormField>(phone).controller!.text,
        '+94771234567',
      );
      await tester.enterText(phone, '+94771234567abc');
      expect(
        tester.widget<TextFormField>(phone).controller!.text,
        '+94771234567',
      );
    });
  }

  testWidgets(
    'doctor SLMC rejects letters and validates required professional fields',
    (tester) async {
      await pumpRegister(tester);
      await tester.tap(find.text('Doctor'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      Future<void> enter(String label, String value) async {
        final field = find.widgetWithText(TextFormField, label);
        await tester.ensureVisible(field);
        await tester.enterText(field, value);
      }

      await enter('Full name', 'Synthetic Doctor');
      await enter('Email address', 'doctor@example.invalid');
      await enter('Sri Lankan mobile', '0771234567');
      await enter('Password', 'Synthetic-Pass-42!');
      await enter('Confirm password', 'Synthetic-Pass-42!');
      await tester.ensureVisible(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      final slmc = find.widgetWithText(
        TextFormField,
        'SLMC registration number',
      );
      await tester.enterText(slmc, 'SLMC-12345');
      expect(tester.widget<TextFormField>(slmc).controller!.text, isEmpty);
      await tester.enterText(slmc, '12345');
      expect(tester.widget<TextFormField>(slmc).controller!.text, '12345');
      await tester.ensureVisible(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      expect(find.text('Required'), findsWidgets);
    },
  );
}
