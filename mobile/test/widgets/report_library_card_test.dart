import 'dart:convert';
import 'dart:typed_data';

import 'package:family_veda/models/lab_report.dart';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:family_veda/widgets/records/report_library_card.dart';
import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';
import 'package:flutter_test/flutter_test.dart';

const _report = LabReport(
  id: 'synthetic-report',
  memberId: 'synthetic-member',
  fileName: 'synthetic-cbc.png',
  ocrStatus: 'Completed',
  hasOriginalFile: true,
  rangeSummary: LabRangeSummary(
    belowRange: 1,
    withinRange: 2,
    aboveRange: 0,
    rangeUnavailable: 1,
  ),
);

void main() {
  for (final outcome in ['saved', 'cancelled', 'failed']) {
    testWidgets('original export $outcome uses protected bytes without closing', (
      tester,
    ) async {
      final bytes = Uint8List.fromList(
        base64Decode(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        ),
      );
      String? requestedName;
      Uint8List? exported;
      await tester.pumpWidget(
        MaterialApp(
          home: OriginalReportPreviewDialog(
            fileName: 'synthetic.png',
            load: () async => bytes,
            export: (name, data) async {
              requestedName = name;
              exported = data;
              if (outcome == 'failed') throw Exception('save failed');
              return outcome == 'saved'
                  ? Uri.file('/synthetic/report.png')
                  : null;
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Save original report'));
      await tester.pump();
      expect(requestedName, 'synthetic.png');
      expect(exported, same(bytes));
      expect(find.byType(OriginalReportPreviewDialog), findsOneWidget);
      expect(
        find.text('Original report saved.'),
        outcome == 'saved' ? findsOneWidget : findsNothing,
      );
      expect(
        find.text('Could not save the original report. Retry.'),
        outcome == 'failed' ? findsOneWidget : findsNothing,
      );
      expect(tester.takeException(), isNull);
    });
  }
  testWidgets('cancelled delete leaves original viewer open', (tester) async {
    var requests = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: OriginalReportPreviewDialog(
          fileName: 'synthetic.png',
          load: () async => Uint8List(0),
          onDelete: () async {
            requests++;
            return false;
          },
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Delete report'));
    await tester.pumpAndSettle();
    expect(requests, 1);
    expect(find.byType(OriginalReportPreviewDialog), findsOneWidget);
  });
  testWidgets(
    'card shows facts without interpretation and hides toggle for non-owner',
    (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ReportLibraryCard(
              report: _report,
              ownerName: 'Family member',
              canChangeSharing: false,
            ),
          ),
        ),
      );
      expect(
        find.text('Family member · Collected date not recorded'),
        findsOneWidget,
      );
      expect(find.text('Private from Family Head'), findsOneWidget);
      expect(find.text('Stored'), findsOneWidget);
      expect(
        find.text('1 below · 2 within · 0 above · 1 no range'),
        findsOneWidget,
      );
      expect(find.byType(DropdownButton<bool>), findsNothing);
      expect(find.text('Delete'), findsNothing);
      expect(
        find.textContaining(
          RegExp('diagnos|abnormal|disease', caseSensitive: false),
        ),
        findsNothing,
      );
    },
  );

  for (final compact in [false, true]) {
    testWidgets('owner can change sharing (compact: $compact)', (tester) async {
      var requests = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReportLibraryCard(
              report: _report,
              ownerName: 'You',
              compact: compact,
              canChangeSharing: true,
              onToggleSharing: () => requests++,
            ),
          ),
        ),
      );
      expect(find.text('Report sharing'), findsOneWidget);
      final sharing = find.byType(DropdownButton<bool>);
      await tester.tap(sharing);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Shared with Family Head').last);
      await tester.pumpAndSettle();
      expect(requests, 1);
      expect(tester.takeException(), isNull);
    });

    testWidgets('non-owner controls stay hidden (compact: $compact)', (
      tester,
    ) async {
      var requests = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReportLibraryCard(
              report: _report,
              ownerName: 'Family member',
              compact: compact,
              canChangeSharing: false,
              onToggleSharing: () => requests++,
            ),
          ),
        ),
      );
      expect(find.byType(DropdownButton<bool>), findsNothing);
      expect(find.text('Delete'), findsNothing);
      expect(requests, 0);
    });

    testWidgets('delete is directly available (compact: $compact)', (
      tester,
    ) async {
      var deleted = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReportLibraryCard(
              report: _report,
              ownerName: 'You',
              compact: compact,
              canChangeSharing: false,
              onDelete: () => deleted++,
            ),
          ),
        ),
      );
      expect(find.byType(PopupMenuButton<String>), findsNothing);
      await tester.tap(find.text('Delete'));
      expect(deleted, 1);
      expect(find.byType(DropdownButton<bool>), findsNothing);
    });
  }

  testWidgets('owner can make a shared report private', (tester) async {
    var requests = 0;
    const sharedReport = LabReport(
      id: 'synthetic-shared-report',
      memberId: 'synthetic-member',
      fileName: 'synthetic-cbc.png',
      ocrStatus: 'Completed',
      sharedWithFamilyHead: true,
    );
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReportLibraryCard(
            report: sharedReport,
            ownerName: 'You',
            compact: true,
            canChangeSharing: true,
            onToggleSharing: () => requests++,
          ),
        ),
      ),
    );
    await tester.tap(find.byType(DropdownButton<bool>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Private from Family Head').last);
    await tester.pumpAndSettle();
    expect(requests, 1);
  });

  testWidgets('current sharing option does not send a toggle request', (
    tester,
  ) async {
    var requests = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReportLibraryCard(
            report: _report,
            ownerName: 'You',
            compact: true,
            canChangeSharing: true,
            onToggleSharing: () => requests++,
          ),
        ),
      ),
    );
    await tester.tap(find.byType(DropdownButton<bool>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Private from Family Head').last);
    await tester.pumpAndSettle();
    expect(requests, 0);
  });

  testWidgets('sharing stays authoritative until the saved report changes', (
    tester,
  ) async {
    var requests = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReportLibraryCard(
            report: _report,
            ownerName: 'You',
            compact: true,
            canChangeSharing: true,
            onToggleSharing: () => requests++,
          ),
        ),
      ),
    );
    await tester.tap(find.byType(DropdownButton<bool>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Shared with Family Head').last);
    await tester.pumpAndSettle();
    expect(requests, 1);
    expect(
      tester
          .widget<DropdownButton<bool>>(find.byType(DropdownButton<bool>))
          .value,
      isFalse,
    );
    await tester.tap(find.byType(DropdownButton<bool>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Shared with Family Head').last);
    await tester.pumpAndSettle();
    expect(requests, 2);
  });

  testWidgets('view original is offered only when a file is stored', (
    tester,
  ) async {
    var opened = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReportLibraryCard(
            report: _report,
            ownerName: 'You',
            canChangeSharing: false,
            onViewOriginal: () => opened = true,
          ),
        ),
      ),
    );
    await tester.tap(find.text('View original report'));
    expect(opened, isTrue);

    const noFile = LabReport(
      id: 'synthetic-report-2',
      memberId: 'synthetic-member',
      fileName: 'synthetic-manual.png',
      ocrStatus: 'Completed',
    );
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReportLibraryCard(
            report: noFile,
            ownerName: 'You',
            canChangeSharing: false,
            onViewOriginal: () {},
          ),
        ),
      ),
    );
    expect(find.text('View original report'), findsNothing);
  });

  testWidgets(
    'preview dialog shows the image, and a plain message when loading fails',
    (tester) async {
      final png = base64Decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      );
      await tester.pumpWidget(
        MaterialApp(
          home: OriginalReportPreviewDialog(
            fileName: 'synthetic-cbc.png',
            load: () async => Uint8List.fromList(png),
          ),
        ),
      );
      expect(find.text('Loading original report…'), findsOneWidget);
      await tester.pumpAndSettle();
      expect(
        find.bySemanticsLabel('Original report image: synthetic-cbc.png'),
        findsOneWidget,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: OriginalReportPreviewDialog(
            key: UniqueKey(),
            fileName: 'synthetic-cbc.png',
            load: () async => throw Exception('denied'),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Original report could not be loaded.'), findsOneWidget);
    },
  );

  testWidgets('original preview renders a PDF original from protected bytes', (
    tester,
  ) async {
    final pdf = Uint8List.fromList(utf8.encode('%PDF-1.4 synthetic'));
    await tester.pumpWidget(
      MaterialApp(
        home: OriginalReportPreviewDialog(
          fileName: 'synthetic.pdf',
          load: () async => pdf,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(PdfViewer), findsOneWidget);
    expect(find.byType(Image), findsNothing);
  });
}
