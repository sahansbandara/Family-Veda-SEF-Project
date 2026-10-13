import 'dart:typed_data';
import 'package:family_veda/models/lab_report.dart';
import 'package:family_veda/widgets/records/report_review_workspace.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const report = LabReport(
  id: 'synthetic',
  memberId: 'synthetic-member',
  fileName: 'Synthetic report.png',
  ocrStatus: 'Completed',
);
Map<String, dynamic> detail() => {
  'id': 'synthetic',
  'memberId': 'synthetic-member',
  'values': [
    {
      'id': 'value-1',
      'analyte': 'Synthetic glucose',
      'value': 92,
      'unit': 'mg/dL',
      'referenceLow': 70,
      'referenceHigh': 99,
      'wasManuallyConfirmed': false,
    },
  ],
  'flags': [],
};
void main() {
  for (final width in [375.0, 390.0, 768.0, 1024.0]) {
    testWidgets('review fits width $width and rejects reversed references', (
      tester,
    ) async {
      tester.view.physicalSize = Size(width, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      var saves = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: ReportReviewWorkspace(
            report: report,
            loadDetail: () async => detail(),
            loadOriginal: () async => Uint8List(0),
            save: (_) async {
              saves++;
              return detail();
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(TabBar), width < 800 ? findsOneWidget : findsNothing);
      expect(tester.takeException(), isNull);
      final low = find.widgetWithText(TextFormField, 'Reference low');
      await tester.enterText(low, '110');
      await tester.ensureVisible(find.text('Confirm values'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirm values'));
      await tester.pumpAndSettle();
      expect(saves, 0);
      expect(
        find.text('Reference low cannot exceed reference high.'),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    });
  }
  testWidgets(
    'phone review has Report/Values tabs and guards an unconfirmed close',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MaterialApp(
          home: ReportReviewWorkspace(
            report: report,
            loadDetail: () async => detail(),
            loadOriginal: () async => Uint8List(0),
            save: (_) async => detail(),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Report'), findsOneWidget);
      expect(find.text('Values'), findsOneWidget);
      expect(find.text('Uploaded'), findsOneWidget);
      expect(find.text('Reading text'), findsOneWidget);
      expect(find.text('Values found'), findsOneWidget);
      expect(find.text('You confirmed'), findsOneWidget);
      expect(find.text('Doctor review'), findsOneWidget);
      await tester.tap(find.byTooltip('Close review'));
      await tester.pumpAndSettle();
      expect(find.text('Continue reviewing'), findsOneWidget);
      expect(find.text('Leave without confirming'), findsOneWidget);
      await tester.tap(find.text('Continue reviewing'));
      await tester.pumpAndSettle();
      expect(find.byType(ReportReviewWorkspace), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'failed save preserves edited values and successful save stays open',
    (tester) async {
      tester.view.physicalSize = const Size(1000, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      var fail = true;
      Map<String, dynamic>? payload;
      await tester.pumpWidget(
        MaterialApp(
          home: ReportReviewWorkspace(
            report: report,
            loadDetail: () async => detail(),
            loadOriginal: () async => Uint8List(0),
            save: (body) async {
              payload = body;
              if (fail) throw Exception('offline');
              return detail();
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      final value = find.byKey(const ValueKey('value-value-1'));
      await tester.enterText(value, '104');
      await tester.ensureVisible(find.text('Confirm values'));
      await tester.tap(find.text('Confirm values'));
      await tester.pumpAndSettle();
      expect(
        find.text(
          'Could not save. Your changes are still here. Retry when ready.',
        ),
        findsOneWidget,
      );
      expect((tester.widget<TextFormField>(value).controller!).text, '104');
      expect((payload!['values'] as List).first['value'], 104);
      fail = false;
      await tester.tap(find.text('Confirm values'));
      await tester.pumpAndSettle();
      expect(find.text('Values confirmed'), findsOneWidget);
      expect(find.byType(ReportReviewWorkspace), findsOneWidget);
    },
  );
  for (final width in [375.0, 768.0]) {
    testWidgets(
      'failed read at width $width shows the reason and reads again',
      (tester) async {
        tester.view.physicalSize = Size(width, 1000);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        var reads = 0;
        await tester.pumpWidget(
          MaterialApp(
            home: ReportReviewWorkspace(
              report: const LabReport(
                id: 'synthetic',
                memberId: 'synthetic-member',
                fileName: 'Synthetic report.png',
                ocrStatus: 'Failed',
                ocrErrorCode: 'NO_VALUES_FOUND',
              ),
              loadDetail: () async => {...detail(), 'values': []},
              loadOriginal: () async => Uint8List(0),
              save: (_) async => detail(),
              readAgain: () async => reads++,
            ),
          ),
        );
        await tester.pumpAndSettle();
        if (width < 800) {
          await tester.tap(find.text('Values'));
          await tester.pumpAndSettle();
        }
        expect(
          find.text('Why it could not be read: No test results found'),
          findsOneWidget,
        );
        expect(find.text('Could not read'), findsOneWidget);
        await tester.ensureVisible(find.text('Check report again'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Check report again'));
        await tester.pumpAndSettle();
        expect(reads, 1);
        expect(tester.takeException(), isNull);
      },
    );
  }
  testWidgets(
    'asks before removal and sends explicit deletions and manually added fields',
    (tester) async {
      tester.view.physicalSize = const Size(1024, 1200);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      Map<String, dynamic>? payload;
      await tester.pumpWidget(
        MaterialApp(
          home: ReportReviewWorkspace(
            report: report,
            loadDetail: () async => detail(),
            loadOriginal: () async => Uint8List(0),
            save: (body) async {
              payload = body;
              return {
                ...detail(),
                'values': [
                  {
                    'id': 'server-added',
                    'analyte': 'Synthetic missed field',
                    'value': 5,
                    'unit': 'unit',
                    'wasManuallyConfirmed': true,
                  },
                ],
              };
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Delete value'));
      await tester.pumpAndSettle();
      expect(find.textContaining('This value will be deleted'), findsOneWidget);
      await tester.tap(find.text('CANCEL'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Delete value'), findsOneWidget);
      await tester.tap(find.byTooltip('Delete value'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('DELETE VALUE'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Delete value'), findsNothing);
      await tester.tap(find.text('Add value'));
      await tester.pumpAndSettle();
      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), 'Synthetic missed field');
      await tester.enterText(fields.at(1), '5');
      await tester.enterText(fields.at(2), 'unit');
      await tester.ensureVisible(find.text('Confirm values'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirm values'));
      await tester.pumpAndSettle();
      expect(payload?['values'], isEmpty);
      expect(payload?['deletedValueIds'], [
        (detail()['values'] as List).first['id'],
      ]);
      expect(
        (payload?['addedValues'] as List).single,
        containsPair('analyte', 'Synthetic missed field'),
      );
      expect((payload?['addedValues'] as List).single, isNot(contains('id')));
      await tester.tap(find.text('Confirm values'));
      await tester.pumpAndSettle();
      expect(payload?['addedValues'], isEmpty);
      expect(
        (payload?['values'] as List).single,
        containsPair('id', 'server-added'),
      );
      expect(payload?['deletedValueIds'], isEmpty);
      expect(tester.takeException(), isNull);
    },
  );
  for (final size in [
    const Size(375, 667),
    const Size(390, 844),
    const Size(768, 1024),
    const Size(844, 390),
  ]) {
    testWidgets(
      'branded removal popup fits $size and close preserves the draft',
      (tester) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        final data = detail();
        (data['values'] as List).first['analyte'] =
            'Synthetic long report field with a descriptive name for confirmation layout verification';
        await tester.pumpWidget(
          MaterialApp(
            theme: ThemeData.light(),
            darkTheme: ThemeData.dark(),
            themeMode: ThemeMode.dark,
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(textScaler: const TextScaler.linear(1.5)),
              child: child!,
            ),
            home: ReportReviewWorkspace(
              report: report,
              loadDetail: () async => data,
              loadOriginal: () async => Uint8List(0),
              save: (_) async => data,
            ),
          ),
        );
        await tester.pumpAndSettle();
        if (size.width < 800) {
          await tester.tap(find.text('Values'));
          await tester.pumpAndSettle();
        }
        await tester.scrollUntilVisible(
          find.byTooltip('Delete value'),
          250,
          scrollable: find
              .descendant(
                of: find.byType(Form),
                matching: find.byType(Scrollable),
              )
              .first,
        );
        await tester.pumpAndSettle();
        await tester.tap(find.byTooltip('Delete value'));
        await tester.pumpAndSettle();
        expect(find.text('Delete this value?'), findsOneWidget);
        expect(
          find.descendant(
            of: find.byType(AlertDialog),
            matching: find.textContaining('Synthetic long report field'),
          ),
          findsOneWidget,
        );
        expect(find.text('CANCEL'), findsOneWidget);
        expect(find.text('DELETE VALUE'), findsOneWidget);
        final deleteButton = tester.widget<FilledButton>(
          find.ancestor(
            of: find.text('DELETE VALUE'),
            matching: find.byType(FilledButton),
          ),
        );
        final foreground = deleteButton.style!.foregroundColor!.resolve({})!;
        final background = deleteButton.style!.backgroundColor!.resolve({})!;
        expect(
          (foreground.computeLuminance() + 0.05) /
              (background.computeLuminance() + 0.05),
          greaterThanOrEqualTo(4.5),
        );

        expect(tester.takeException(), isNull);
        await tester.ensureVisible(
          find.byTooltip('Close removal confirmation'),
        );
        await tester.pumpAndSettle();
        await tester.tap(find.byTooltip('Close removal confirmation'));
        await tester.pumpAndSettle();
        expect(find.text('Delete this value?'), findsNothing);
        expect(find.byTooltip('Delete value'), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );
  }
  testWidgets(
    'Add value follows existing rows and scrolls to the focused new field',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MaterialApp(
          home: ReportReviewWorkspace(
            report: report,
            loadDetail: () async => {
              ...detail(),
              'values': List.generate(
                5,
                (index) => {
                  ...(detail()['values'] as List).first as Map<String, dynamic>,
                  'id': 'existing-$index',
                  'analyte': 'Synthetic existing $index',
                },
              ),
            },
            loadOriginal: () async => Uint8List(0),
            save: (_) async => detail(),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Values'));
      await tester.pumpAndSettle();
      final scrollable = find
          .descendant(of: find.byType(Form), matching: find.byType(Scrollable))
          .first;
      await tester.scrollUntilVisible(
        find.text('Add value'),
        150,
        scrollable: scrollable,
      );
      await tester.pumpAndSettle();
      final names = find.byWidgetPredicate(
        (widget) =>
            widget is TextField && widget.decoration?.labelText == 'Analyte',
      );
      expect(
        tester.getTopLeft(find.text('Add value')).dy,
        greaterThan(tester.getTopLeft(names.first).dy),
      );
      for (var addition = 0; addition < 2; addition++) {
        await tester.scrollUntilVisible(
          find.text('Add value'),
          150,
          scrollable: scrollable,
        );
        await tester.pumpAndSettle();
        await tester.tap(find.text('Add value'));
        await tester.pumpAndSettle();
        final addedName = find.byWidgetPredicate(
          (widget) =>
              widget is TextField &&
              widget.decoration?.labelText == 'Analyte' &&
              widget.controller?.text == '',
        );
        final added = tester.widget<TextField>(addedName);
        expect(added.focusNode?.hasFocus, isTrue);
        expect(tester.getTopLeft(addedName).dy, greaterThan(0));
        expect(tester.getBottomRight(addedName).dy, lessThan(844));
        await tester.enterText(addedName, 'Synthetic manual $addition');
      }
      await tester.scrollUntilVisible(
        find.text('Add value'),
        150,
        scrollable: scrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Add value'));
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    },
  );
}
