import 'dart:async';
import 'dart:typed_data';
import 'package:family_veda/models/lab_report.dart';
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/providers/records_roster_provider.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/records_provider.dart';
import 'package:family_veda/screens/records/records_screen.dart';
import 'package:family_veda/services/api/mobile_api.dart';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:family_veda/widgets/records/report_review_workspace.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FileApi implements MobileApi {
  final pending = Completer<Uint8List>();
  int loads = 0;
  int reviews = 0;
  @override
  Future<Map<String, dynamic>> getLabReportDetail(String reportId) async => {
    'values': [
      {
        'id': 'synthetic-value',
        'analyte': 'Synthetic glucose',
        'value': 92,
        'unit': 'mg/dL',
        'wasManuallyConfirmed': false,
      },
    ],
    'flags': [],
  };
  @override
  Future<Map<String, dynamic>> reviewLabReport(
    String reportId,
    Map<String, dynamic> review,
  ) async {
    reviews++;
    return {'values': [], 'flags': []};
  }

  @override
  Future<Uint8List> getLabReportFile(String reportId) {
    loads++;
    return pending.future;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

const reports = [
  LabReport(
    id: 'synthetic-report',
    memberId: 'member-1',
    fileName: 'Synthetic CBC report.png',
    ocrStatus: 'Completed',
    hasOriginalFile: true,
  ),
  LabReport(
    id: 'synthetic-missing',
    memberId: 'member-1',
    fileName: 'Synthetic unavailable.pdf',
    ocrStatus: 'Pending',
  ),
];
void main() {
  testWidgets(
    'library refresh after saving keeps the review open until explicit close',
    (tester) async {
      tester.view.physicalSize = const Size(1024, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final api = _FileApi();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            activeMemberProvider.overrideWith((ref) => 'member-1'),
            myMemberIdProvider.overrideWith((ref) async => 'member-1'),
            memberRecordsProvider.overrideWith((ref) async => []),
            memberLabReportsProvider.overrideWith((ref) async => reports),
            mobileApiProvider.overrideWithValue(api),
          ],
          child: const MaterialApp(home: RecordsScreen()),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Lab reports'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Check values').first);
      await tester.pump();
      api.pending.complete(Uint8List(0));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirm values'));
      await tester.pumpAndSettle();
      expect(api.reviews, 1);
      expect(find.byType(ReportReviewWorkspace), findsOneWidget);
      expect(find.text('Values confirmed'), findsOneWidget);
      await tester.tap(find.byTooltip('Close review'));
      await tester.pumpAndSettle();
      expect(find.byType(ReportReviewWorkspace), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('375px library loads originals only in grid view', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(375, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final api = _FileApi();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeMemberProvider.overrideWith((ref) => 'member-1'),
          myMemberIdProvider.overrideWith((ref) async => 'member-1'),
          memberRecordsProvider.overrideWith((ref) async => []),
          memberLabReportsProvider.overrideWith((ref) async => reports),
          mobileApiProvider.overrideWithValue(api),
        ],
        child: const MaterialApp(home: RecordsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lab reports'));
    await tester.pumpAndSettle();
    expect(api.loads, 0);
    await tester.tap(find.byTooltip('Grid view'));
    // The thumbnail request stays pending, so its spinner never settles.
    await tester.pump();
    expect(find.text('Synthetic CBC report.png'), findsOneWidget);
    expect(find.text('Synthetic unavailable.pdf'), findsOneWidget);
    expect(tester.takeException(), isNull);
    // Only the report with a stored original requests its thumbnail.
    expect(api.loads, 1);
    api.pending.completeError(Exception('unavailable'));
    await tester.pumpAndSettle();
    expect(find.text('Original file unavailable'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
  testWidgets('profile switch closes original dialog and discards late bytes', (
    tester,
  ) async {
    final api = _FileApi();
    final container = ProviderContainer(
      overrides: [
        activeMemberProvider.overrideWith((ref) => 'member-1'),
        myMemberIdProvider.overrideWith((ref) async => 'member-1'),
        memberRecordsProvider.overrideWith((ref) async => []),
        memberLabReportsProvider.overrideWith((ref) async {
          ref.watch(activeMemberProvider);
          return reports;
        }),
        mobileApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(container.dispose);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: RecordsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lab reports'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('View original report'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('View original report'));
    await tester.pump();
    expect(find.byType(OriginalReportPreviewDialog), findsOneWidget);
    container.read(activeMemberProvider.notifier).state = 'member-2';
    await tester.pump();
    expect(find.byType(OriginalReportPreviewDialog), findsNothing);
    api.pending.complete(Uint8List.fromList([1, 2, 3]));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
  testWidgets(
    'head views adult shared records locally without write or clinical profile expansion',
    (tester) async {
      final container = ProviderContainer(
        overrides: [
          activeMemberProvider.overrideWith((ref) => 'member-1'),
          myMemberIdProvider.overrideWith((ref) async => 'member-1'),
          familyDashboardProvider.overrideWith(
            (ref) async => FamilyDashboard.fromJson({
              'role': 'FamilyHead',
              'familyId': 'synthetic-family',
            }),
          ),
          recordsRosterProvider('synthetic-family').overrideWith(
            (ref) async => const [
              RecordsRosterMember(
                id: 'member-1',
                displayName: 'Synthetic Head',
                isSelf: true,
                isMinor: false,
              ),
              RecordsRosterMember(
                id: 'adult-2',
                displayName: 'Synthetic Adult',
                isSelf: false,
                isMinor: false,
              ),
            ],
          ),
          memberRecordsProvider.overrideWith((ref) async => []),
          memberLabReportsProvider.overrideWith((ref) async => []),
          recordsByMemberProvider('adult-2').overrideWith((ref) async => []),
          labReportsByMemberProvider('adult-2').overrideWith(
            (ref) async => const [
              LabReport(
                id: 'shared-synthetic',
                memberId: 'adult-2',
                fileName: 'Shared synthetic.pdf',
                ocrStatus: 'Completed',
                sharedWithFamilyHead: true,
              ),
            ],
          ),
        ],
      );
      addTearDown(container.dispose);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: RecordsScreen()),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Synthetic Head (You)'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Synthetic Adult · Shared records').last);
      await tester.pumpAndSettle();
      expect(container.read(activeMemberProvider), 'member-1');
      expect(find.textContaining('Read-only'), findsOneWidget);
      expect(find.byTooltip('Add record'), findsNothing);
      expect(find.byTooltip('Upload lab report'), findsNothing);
      await tester.tap(find.text('Lab reports'));
      await tester.pumpAndSettle();
      expect(find.text('Shared synthetic.pdf'), findsOneWidget);
      expect(find.text('Keep private from Family Head'), findsNothing);
    },
  );
}
