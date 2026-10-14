// Owner: S2 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/lab_report.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/records_provider.dart';
import 'package:family_veda/screens/records/records_screen.dart';
import 'package:family_veda/services/api/mobile_api.dart';
import 'package:family_veda/services/api/report_trash_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _NoFileApi implements MobileApi {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _TrashApi implements ReportTrashApi {
  _TrashApi(this.trash);
  final List<DeletedLabReport> trash;
  final calls = <String>[];
  bool holdPurge = false;

  @override
  Future<void> deleteReport(String reportId) async =>
      calls.add('delete:$reportId');

  @override
  Future<List<DeletedLabReport>> getDeleted(String memberId) async => trash;

  @override
  Future<void> restore(String reportId) async => calls.add('restore:$reportId');

  @override
  Future<void> deletePermanently(String reportId) async {
    if (holdPurge) throw const ReportHeldException('Synthetic refusal reason.');
    calls.add('purge:$reportId');
  }
}

const _live = LabReport(
  id: 'synthetic-live',
  memberId: 'member-1',
  fileName: 'Synthetic live report.png',
  ocrStatus: 'Failed',
);

DeletedLabReport _deleted(String id, {bool removable = true}) =>
    DeletedLabReport(
      id: id,
      fileName: 'Synthetic $id.pdf',
      deletedAt: DateTime.utc(2026, 10, 5),
      canDeletePermanently: removable,
    );

Future<_TrashApi> _pump(
  WidgetTester tester, {
  List<LabReport> reports = const [_live],
  List<DeletedLabReport> trash = const [],
}) async {
  tester.view.physicalSize = const Size(390, 1400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final api = _TrashApi(trash);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        activeMemberProvider.overrideWith((ref) => 'member-1'),
        myMemberIdProvider.overrideWith((ref) async => 'member-1'),
        memberRecordsProvider.overrideWith((ref) async => []),
        memberLabReportsProvider.overrideWith((ref) async => reports),
        mobileApiProvider.overrideWithValue(_NoFileApi()),
        reportTrashApiProvider.overrideWithValue(api),
      ],
      child: const MaterialApp(home: RecordsScreen()),
    ),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.text('Lab reports'));
  await tester.pumpAndSettle();
  return api;
}

void main() {
  testWidgets('deleting a report asks first and never purges', (tester) async {
    final api = await _pump(tester);

    expect(find.textContaining('Recently deleted'), findsNothing);
    await tester.tap(find.widgetWithText(TextButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(api.calls, isEmpty);
    await tester.tap(find.text('Delete report'));
    await tester.pumpAndSettle();

    expect(api.calls, ['delete:synthetic-live']);
    expect(find.textContaining('moved to Recently deleted'), findsOneWidget);
  });

  testWidgets('trash restores, and purges only after a second confirmation', (
    tester,
  ) async {
    final api = await _pump(
      tester,
      reports: const [],
      trash: [_deleted('junk'), _deleted('held', removable: false)],
    );

    await tester.tap(find.text('Recently deleted (2)'));
    await tester.pumpAndSettle();
    final purgeButtons = find.widgetWithText(TextButton, 'Delete permanently');
    expect(tester.widget<TextButton>(purgeButtons.at(1)).onPressed, isNull);
    expect(
      find.textContaining('may have been used in a symptom case'),
      findsOneWidget,
    );

    await tester.tap(purgeButtons.first);
    await tester.pumpAndSettle();
    expect(api.calls, isEmpty);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete permanently'));
    await tester.pumpAndSettle();
    expect(api.calls, ['purge:junk']);

    await tester.tap(find.widgetWithText(OutlinedButton, 'Restore').last);
    await tester.pumpAndSettle();
    expect(api.calls, ['purge:junk', 'restore:held']);
  });

  testWidgets('a server refusal to purge is shown as the server worded it', (
    tester,
  ) async {
    final api = await _pump(
      tester,
      reports: const [],
      trash: [_deleted('junk')],
    );
    api.holdPurge = true;

    await tester.tap(find.text('Recently deleted (1)'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Delete permanently'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Delete permanently'));
    await tester.pumpAndSettle();

    expect(find.text('Synthetic refusal reason.'), findsOneWidget);
    expect(api.calls, isEmpty);
  });
}
