// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_summary.dart';
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/models/family_doctor_request.dart';
import 'package:family_veda/models/family_doctor_slots.dart';
import 'package:family_veda/providers/family_doctor_slots_provider.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/screens/family/my_doctor_screen.dart';
import 'package:family_veda/services/api/family_portal_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _RecordingApi implements FamilyPortalApi {
  final requested = <String>[];
  final cancelled = <String>[];

  @override
  Future<void> requestFamilyDoctor({
    required String familyId,
    required String doctorId,
    String? message,
  }) async => requested.add('$familyId:$doctorId');

  @override
  Future<void> cancelDoctorRequest({
    required String familyId,
    required String requestId,
  }) async => cancelled.add('$familyId:$requestId');

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

FamilyDashboard _dashboard(String role) => FamilyDashboard.fromJson({
  'role': role,
  'familyId': 'family-1',
  'familyName': 'Synthetic Perera Family',
  'familyCode': 'FV-7K4P92',
  'memberCount': 4,
  'minorCount': 1,
  'pendingJoinRequests': 0,
  'openCases': 0,
  'approvedGuidanceCount': 0,
  'unreadNotifications': 0,
  'members': [],
  'activity': [],
});

final _current = DoctorSummary.fromJson({
  'id': 'doc-123',
  'displayName': 'Dr. Synthetic Perera',
  'specialty': 'General Practice',
  'clinic': 'Family Care Demo Clinic',
  'city': 'Negombo',
  'district': 'Gampaha',
  'languages': 'Sinhala, English',
});
final _wijesinghe = DoctorSummary.fromJson({
  'id': 'doc-rw',
  'displayName': 'Dr. Synthetic Wijesinghe',
  'specialty': 'Family Medicine',
  'clinic': 'Synthetic Coastal Clinic',
  'city': 'Negombo',
  'district': 'Gampaha',
});
final _silva = DoctorSummary.fromJson({
  'id': 'doc-ds',
  'displayName': 'Dr. Synthetic Silva',
  'specialty': 'Family Medicine',
  'city': 'Kandy',
  'district': 'Kandy',
});

Future<_RecordingApi> _pump(
  WidgetTester tester, {
  String role = 'Head',
  DoctorSummary? doctor,
  FamilyDoctorRequest? pending,
}) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final api = _RecordingApi();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        familyPortalApiProvider.overrideWithValue(api),
        familyDashboardProvider.overrideWith((ref) => _dashboard(role)),
        familyDoctorProvider('family-1').overrideWith((ref) => doctor),
        familyDoctorPendingRequestProvider(
          'family-1',
        ).overrideWith((ref) => pending),
        doctorDirectoryProvider.overrideWith((ref) => [_wijesinghe, _silva]),
        familyDoctorSlotsProvider.overrideWith(
          (ref, request) async => FamilyDoctorSlots(
            configured: true,
            slotMinutes: 30,
            slots: [DateTime.parse('${request.date}T03:30:00Z')],
          ),
        ),
      ],
      child: const MaterialApp(home: MyDoctorScreen()),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

Future<void> _reveal(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(
    finder,
    200,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'assigned: shows the doctor, live slots and a collapsed directory',
    (tester) async {
      await _pump(tester, doctor: _current);

      expect(find.text('My Doctor'), findsOneWidget);
      expect(find.text('Dr. Synthetic Perera'), findsOneWidget);
      expect(find.text('Connected'), findsOneWidget);

      await _reveal(tester, find.text('Request appointment'));
      final button = find.widgetWithText(FilledButton, 'Request appointment');
      expect(tester.widget<FilledButton>(button).onPressed, isNull);
      await _reveal(tester, find.byType(ChoiceChip));
      await tester.tap(find.byType(ChoiceChip));
      await tester.pumpAndSettle();
      expect(tester.widget<FilledButton>(button).onPressed, isNotNull);

      await _reveal(tester, find.text('Explore directory'));
      expect(find.text('Dr. Synthetic Wijesinghe'), findsNothing);
    },
  );

  testWidgets('no doctor: head sends a request only after confirming', (
    tester,
  ) async {
    final api = await _pump(tester);

    expect(find.text('Find a doctor your family can rely on.'), findsOneWidget);
    await _reveal(tester, find.text('Request doctor').first);
    await tester.tap(find.text('Request doctor').first);
    await tester.pumpAndSettle();
    expect(api.requested, isEmpty);
    await tester.tap(find.text('Send request'));
    await tester.pumpAndSettle();
    expect(api.requested, ['family-1:doc-rw']);
  });

  testWidgets('pending: head can cancel after confirming', (tester) async {
    final api = await _pump(
      tester,
      pending: FamilyDoctorRequest(id: 'req-1', doctor: _wijesinghe),
    );

    expect(find.text('Your request is on its way.'), findsOneWidget);
    expect(find.text('Request doctor'), findsNothing);
    await _reveal(tester, find.text('Cancel request'));
    await tester.tap(find.text('Cancel request'));
    await tester.pumpAndSettle();
    expect(api.cancelled, isEmpty);
    await tester.tap(find.widgetWithText(FilledButton, 'Cancel request'));
    await tester.pumpAndSettle();
    expect(api.cancelled, ['family-1:req-1']);
  });

  testWidgets('adult member sees no request, change or cancel controls', (
    tester,
  ) async {
    await _pump(
      tester,
      role: 'AdultMember',
      doctor: _current,
      pending: FamilyDoctorRequest(id: 'req-1', doctor: _wijesinghe),
    );

    await _reveal(tester, find.textContaining('Change request pending'));
    expect(find.text('Withdraw request'), findsNothing);
    expect(find.text('Explore directory'), findsNothing);
  });
}
