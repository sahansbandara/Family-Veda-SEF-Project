import 'package:family_veda/screens/records/lab_upload_screen.dart';
import 'package:family_veda/screens/triage/submit_complaint_screen.dart';
import 'package:flutter/material.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/records_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('upload starts private with explicit visibility choice', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => null),
          myMemberIdProvider.overrideWith((ref) async => null),
        ],
        child: MaterialApp(home: LabUploadScreen()),
      ),
    );
    expect(find.text('Private'), findsOneWidget);
    expect(find.text('Shared with Family Head'), findsOneWidget);
    expect(find.text('Report visibility'), findsOneWidget);
  });
  testWidgets(
    'symptoms validates before advancing and reviews before submission',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            activeMemberProvider.overrideWith((ref) => null),
            myMemberIdProvider.overrideWith((ref) async => null),
          ],
          child: MaterialApp(home: SubmitComplaintScreen()),
        ),
      );
      expect(
        find.textContaining('What symptoms are you experiencing?'),
        findsOneWidget,
      );
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('submit_complaint_button')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Choose a symptom'), findsOneWidget);
      await tester.enterText(
        find.byKey(const Key('chief_complaint_field')),
        'Synthetic cough',
      );
      await tester.tap(find.byKey(const Key('submit_complaint_button')));
      await tester.pumpAndSettle();

      expect(find.textContaining('More about these symptoms'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('duration_field')), '2');
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('submit_complaint_button')));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Check your request before submitting'),
        findsOneWidget,
      );
      expect(find.text('Synthetic cough'), findsOneWidget);
      expect(find.textContaining('Submit for doctor review'), findsOneWidget);
    },
  );
  testWidgets(
    'switching active profile clears symptom draft and returns to first step',
    (tester) async {
      final container = ProviderContainer(
        overrides: [
          activeMemberProvider.overrideWith((ref) => 'synthetic-self'),
        ],
      );
      addTearDown(container.dispose);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: SubmitComplaintScreen()),
        ),
      );
      await tester.enterText(
        find.byKey(const Key('chief_complaint_field')),
        'Synthetic private symptom',
      );
      container.read(activeMemberProvider.notifier).state = 'synthetic-minor';
      await tester.pump();
      final field = tester.widget<TextFormField>(
        find.byKey(const Key('chief_complaint_field')),
      );
      expect(field.controller?.text, isEmpty);
      expect(
        find.textContaining('What symptoms are you experiencing?'),
        findsOneWidget,
      );
    },
  );
}
