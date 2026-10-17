// Owner: S3 · synthetic fixtures only.
import 'package:family_veda/models/member.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/screens/triage/submit_complaint_screen.dart';
import 'package:family_veda/services/api/patient_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _PatientApi implements PatientApi {
  int submissions = 0;
  @override
  Future<String> submitComplaint({
    required String memberId,
    required String chiefComplaint,
    required int durationDays,
    required int severity,
    required List<String> symptoms,
    String? notes,
  }) async {
    submissions++;
    return 'synthetic-case';
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  Future<_PatientApi> render(
    WidgetTester tester, {
    Size size = const Size(390, 844),
  }) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final api = _PatientApi();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => 'synthetic-self'),
          membersProvider.overrideWith(
            (ref) async => const [
              Member(
                id: 'synthetic-self',
                displayName: 'Synthetic Member',
                relationshipLabel: 'Self',
                isSelf: true,
              ),
            ],
          ),
          patientApiProvider.overrideWithValue(api),
        ],
        child: const MaterialApp(home: SubmitComplaintScreen()),
      ),
    );
    await tester.pumpAndSettle();
    return api;
  }

  Future<void> enterSymptoms(WidgetTester tester) async {
    final field = find.byKey(const Key('chief_complaint_field'));
    await tester.scrollUntilVisible(
      field,
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.enterText(field, 'Synthetic cough\nSynthetic tiredness');
    tester.view.viewInsets = const FakeViewPadding(bottom: 300);
    await tester.pumpAndSettle();
  }

  Future<void> next(WidgetTester tester) async {
    final button = find.byKey(const Key('submit_complaint_button'));
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.pumpAndSettle();
  }

  testWidgets(
    'Hide keyboard removes focus without changing multiline symptoms',
    (tester) async {
      await render(tester);
      expect(find.byKey(const Key('hide_triage_keyboard')), findsNothing);
      await enterSymptoms(tester);
      final editable = tester.widget<EditableText>(find.byType(EditableText));
      expect(editable.focusNode.hasFocus, isTrue);
      await tester.tap(find.byKey(const Key('hide_triage_keyboard')));
      await tester.pumpAndSettle();
      expect(editable.focusNode.hasFocus, isFalse);
      expect(editable.controller.text, 'Synthetic cough\nSynthetic tiredness');
      expect(editable.maxLines, 3);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    '375px keyboard inset leaves Continue reachable without submitting',
    (tester) async {
      final api = await render(tester, size: const Size(375, 667));
      await enterSymptoms(tester);
      final hide = find.byKey(const Key('hide_triage_keyboard'));
      expect(hide, findsOneWidget);
      expect(tester.getRect(hide).bottom, lessThanOrEqualTo(367));
      expect(
        tester.getRect(find.byKey(const Key('submit_complaint_button'))).bottom,
        lessThanOrEqualTo(367),
      );
      await next(tester);
      expect(find.text('More about these symptoms'), findsOneWidget);
      expect(api.submissions, 0);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('duration Done and multiline notes keep review draft intact', (
    tester,
  ) async {
    final api = await render(tester);
    await enterSymptoms(tester);
    await next(tester);
    final duration = find.byKey(const Key('duration_field'));
    await tester.scrollUntilVisible(
      duration,
      150,
      scrollable: find.byType(Scrollable).first,
    );
    final input = tester.widget<EditableText>(
      find.descendant(of: duration, matching: find.byType(EditableText)),
    );
    expect(input.textInputAction, TextInputAction.done);
    await tester.enterText(duration, '2');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(input.focusNode.hasFocus, isFalse);
    final notes = find.widgetWithText(
      TextFormField,
      'Anything else the doctor should know? (optional)',
    );
    await tester.scrollUntilVisible(
      notes,
      150,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.enterText(notes, 'Synthetic context\nSecond synthetic line');
    final notesInput = tester.widget<EditableText>(
      find.descendant(of: notes, matching: find.byType(EditableText)),
    );
    expect(notesInput.maxLines, 3);
    await tester.tap(find.byKey(const Key('hide_triage_keyboard')));
    await tester.pumpAndSettle();
    expect(notesInput.focusNode.hasFocus, isFalse);
    await next(tester);
    expect(find.text('Check your request before submitting'), findsOneWidget);
    final context = find.text(
      'Additional context: Synthetic context\nSecond synthetic line',
    );
    await tester.scrollUntilVisible(
      context,
      150,
      scrollable: find.byType(Scrollable).first,
    );
    expect(context, findsOneWidget);
    expect(api.submissions, 0);
  });
  testWidgets('outside tap dismisses keyboard and preserves draft', (
    tester,
  ) async {
    await render(tester);
    await enterSymptoms(tester);
    final input = tester.widget<EditableText>(find.byType(EditableText));
    await tester.tap(find.text('New symptom request'));
    await tester.pumpAndSettle();
    expect(input.focusNode.hasFocus, isFalse);
    expect(input.controller.text, 'Synthetic cough\nSynthetic tiredness');
  });
  testWidgets('scroll drag dismisses keyboard and preserves draft', (
    tester,
  ) async {
    await render(tester);
    await enterSymptoms(tester);
    final input = tester.widget<EditableText>(find.byType(EditableText));
    await tester.drag(find.byType(ListView), const Offset(0, 150));
    await tester.pumpAndSettle();
    expect(input.focusNode.hasFocus, isFalse);
    expect(input.controller.text, 'Synthetic cough\nSynthetic tiredness');
  });
}
