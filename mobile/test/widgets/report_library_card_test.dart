import 'dart:convert';
import 'dart:typed_data';

import 'package:family_veda/models/lab_report.dart';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:family_veda/widgets/records/report_library_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const _report = LabReport(
  id: 'synthetic-report',
  memberId: 'synthetic-member',
  fileName: 'synthetic-cbc.png',
  ocrStatus: 'Completed',
  hasOriginalFile: true,
  rangeSummary: LabRangeSummary(belowRange: 1, withinRange: 2, aboveRange: 0, rangeUnavailable: 1),
);

void main() {
  testWidgets('card shows facts without interpretation and hides toggle for non-owner', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: ReportLibraryCard(report: _report, ownerName: 'Family member', canChangeSharing: false))));
    expect(find.text('Private from Family Head'), findsOneWidget);
    expect(find.text('Stored'), findsOneWidget);
    expect(find.text('1 below · 2 within · 0 above · 1 no range'), findsOneWidget);
    expect(find.text('Share with Family Head'), findsNothing);
    expect(find.textContaining(RegExp('diagnos|abnormal|disease', caseSensitive: false)), findsNothing);
  });

  testWidgets('owner can toggle sharing', (tester) async {
    var toggled = false;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: ReportLibraryCard(report: _report, ownerName: 'You', canChangeSharing: true, onToggleSharing: () => toggled = true))));
    await tester.tap(find.text('Share with Family Head'));
    expect(toggled, isTrue);
  });

  testWidgets('view original is offered only when a file is stored', (tester) async {
    var opened = false;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: ReportLibraryCard(report: _report, ownerName: 'You', canChangeSharing: false, onViewOriginal: () => opened = true))));
    await tester.tap(find.text('View original image'));
    expect(opened, isTrue);

    const noFile = LabReport(id: 'synthetic-report-2', memberId: 'synthetic-member', fileName: 'synthetic-manual.png', ocrStatus: 'Completed');
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: ReportLibraryCard(report: noFile, ownerName: 'You', canChangeSharing: false, onViewOriginal: () {}))));
    expect(find.text('View original image'), findsNothing);
  });

  testWidgets('preview dialog shows the image, and a plain message when loading fails', (tester) async {
    final png = base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    await tester.pumpWidget(MaterialApp(home: OriginalReportPreviewDialog(fileName: 'synthetic-cbc.png', load: () async => Uint8List.fromList(png))));
    expect(find.text('Loading original image…'), findsOneWidget);
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('Original report image: synthetic-cbc.png'), findsOneWidget);

    await tester.pumpWidget(MaterialApp(home: OriginalReportPreviewDialog(key: UniqueKey(), fileName: 'synthetic-cbc.png', load: () async => throw Exception('denied'))));
    await tester.pumpAndSettle();
    expect(find.text('Original image could not be loaded.'), findsOneWidget);
  });
}
