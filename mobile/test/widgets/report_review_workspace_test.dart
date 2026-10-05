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
      expect(find.text('Reading'), findsOneWidget);
      expect(find.text('Ready'), findsOneWidget);
      expect(find.text('Confirmed'), findsOneWidget);
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
}
