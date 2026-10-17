// Owner: S2 · synthetic fixtures only.
import 'dart:io';

import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/records_provider.dart';
import 'package:family_veda/screens/records/lab_upload_screen.dart';
import 'package:family_veda/services/api/mobile_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
// Test-only platform fake uses image_picker's existing transitive platform API.
// ignore: depend_on_referenced_packages
import 'package:image_picker_platform_interface/image_picker_platform_interface.dart';

class _Picker extends ImagePickerPlatform {
  _Picker(this.path);
  String? path;

  @override
  Future<XFile?> getImageFromSource({
    required ImageSource source,
    ImagePickerOptions options = const ImagePickerOptions(),
  }) async => path == null ? null : XFile(path!);
}

class _UploadApi implements MobileApi {
  _UploadApi({this.fail = false, this.savedWithWarning = false});
  final bool fail;
  final bool savedWithWarning;
  int uploads = 0;

  @override
  Future<String> uploadLabReport({
    required String memberId,
    required String path,
    bool sharedWithFamilyHead = false,
  }) async {
    uploads++;
    if (fail) throw Exception('Synthetic upload failure');
    if (savedWithWarning) {
      throw const SavedReportUploadException(
        'Synthetic report saved privately; sharing was not changed.',
        reportId: 'synthetic-report-42',
      );
    }
    return 'synthetic-report-42';
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<({ProviderContainer container, GoRouter router})> render(
    WidgetTester tester,
    _UploadApi api, {
    Size size = const Size(390, 1100),
  }) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final directory = Directory.systemTemp.createTempSync('synthetic-upload-');
    final file = File('${directory.path}/synthetic-report.png');
    file.writeAsBytesSync([1, 2, 3]);
    addTearDown(() => directory.deleteSync(recursive: true));
    final previousPicker = ImagePickerPlatform.instance;
    ImagePickerPlatform.instance = _Picker(file.path);
    addTearDown(() => ImagePickerPlatform.instance = previousPicker);
    final container = ProviderContainer(
      overrides: [
        activeMemberProvider.overrideWith((ref) => 'synthetic-member-1'),
        myMemberIdProvider.overrideWith((ref) async => 'synthetic-member-1'),
        mobileApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(container.dispose);
    final router = GoRouter(
      initialLocation: '/upload',
      routes: [
        GoRoute(path: '/upload', builder: (_, _) => const LabUploadScreen()),
        GoRoute(
          path: '/records',
          builder: (_, state) => Scaffold(body: Text(state.uri.toString())),
        ),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    return (container: container, router: router);
  }

  Future<void> upload(WidgetTester tester) async {
    await tester.tap(find.text('Choose image'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Upload for review'), 200);
    await tester.tap(find.text('Upload for review'));
    await tester.runAsync(() async {
      await Future<void>.delayed(const Duration(milliseconds: 30));
    });
    await tester.pumpAndSettle();
  }

  testWidgets('existing reports action opens the reports tab', (tester) async {
    await render(tester, _UploadApi());
    await tester.ensureVisible(find.text('View existing reports'));
    await tester.tap(find.text('View existing reports'));
    await tester.pumpAndSettle();
    expect(find.text('/records?tab=reports'), findsOneWidget);
  });

  testWidgets('successful upload opens the returned report for checking', (
    tester,
  ) async {
    final api = _UploadApi();
    await render(tester, api);
    await upload(tester);
    expect(api.uploads, 1);
    await tester.scrollUntilVisible(
      find.text('View report & check values'),
      150,
    );
    await tester.tap(find.text('View report & check values'));
    await tester.pumpAndSettle();
    expect(
      find.text('/records?tab=reports&reportId=synthetic-report-42'),
      findsOneWidget,
    );
  });

  testWidgets('failed upload offers no successful report action', (
    tester,
  ) async {
    final api = _UploadApi(fail: true);
    await render(tester, api);
    await upload(tester);
    expect(api.uploads, 1);
    expect(
      find.textContaining('Upload could not be confirmed'),
      findsOneWidget,
    );
    expect(find.text('View report & check values'), findsNothing);
  });

  testWidgets('profile switch clears the last uploaded report action', (
    tester,
  ) async {
    final state = await render(tester, _UploadApi());
    await upload(tester);
    expect(find.text('View report & check values'), findsOneWidget);
    state.container.read(activeMemberProvider.notifier).state =
        'synthetic-member-2';
    await tester.pumpAndSettle();
    expect(find.text('View report & check values'), findsNothing);
  });

  testWidgets(
    'saved report with a follow-up warning still opens for checking',
    (tester) async {
      final api = _UploadApi(savedWithWarning: true);
      await render(tester, api);
      await upload(tester);
      expect(api.uploads, 1);
      expect(find.textContaining('sharing was not changed'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('View report & check values'),
        150,
      );
      await tester.tap(find.text('View report & check values'));
      await tester.pumpAndSettle();
      expect(
        find.text('/records?tab=reports&reportId=synthetic-report-42'),
        findsOneWidget,
      );
    },
  );
  testWidgets('375px success action remains usable without overflow', (
    tester,
  ) async {
    await render(tester, _UploadApi(), size: const Size(375, 667));
    await upload(tester);
    await tester.scrollUntilVisible(
      find.text('View report & check values'),
      150,
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('View report & check values'));
    await tester.pumpAndSettle();
    expect(
      find.text('/records?tab=reports&reportId=synthetic-report-42'),
      findsOneWidget,
    );
  });

  testWidgets('cancelling another picker preserves the saved report action', (
    tester,
  ) async {
    final api = _UploadApi();
    await render(tester, api);
    await upload(tester);
    (ImagePickerPlatform.instance as _Picker).path = null;
    await tester.ensureVisible(find.text('Choose image'));
    await tester.tap(find.text('Choose image'));
    await tester.pumpAndSettle();
    expect(api.uploads, 1);
    expect(find.text('View report & check values'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('View report & check values'),
      150,
    );
    await tester.tap(find.text('View report & check values'));
    await tester.pumpAndSettle();
    expect(
      find.text('/records?tab=reports&reportId=synthetic-report-42'),
      findsOneWidget,
    );
  });
}
