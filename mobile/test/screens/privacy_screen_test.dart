// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b). Synthetic data only.
import 'package:family_veda/models/doctor_summary.dart';
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/screens/privacy/privacy_screen.dart';
import 'package:family_veda/services/api/privacy_api.dart';
import 'package:family_veda/widgets/privacy/privacy_parts.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakePrivacyApi implements PrivacyApi {
  final consentWrites = <String>[];

  @override
  Future<PrivacyMember> getMe() async => const PrivacyMember(id: 'm-head', displayName: 'Synthetic Head', role: 'Head');

  @override
  Future<List<PrivacyMember>> getFamilyMembers() async => const [
    PrivacyMember(id: 'm-head', displayName: 'Synthetic Head', role: 'Head'),
    PrivacyMember(id: 'm-minor', displayName: 'Synthetic Child', role: 'MinorMember'),
    PrivacyMember(id: 'm-adult', displayName: 'Synthetic Adult', role: 'AdultMember'),
  ];

  @override
  Future<List<ConsentSetting>> getConsents(String memberId) async => memberId == 'm-minor'
      ? const [ConsentSetting(id: 'c-m', category: 'HereditaryFlags', status: 'NotSet')]
      : const [ConsentSetting(id: 'c-h', category: 'Conditions', status: 'Granted')];

  @override
  Future<void> setConsent(String memberId, String category, String status) async =>
      consentWrites.add('$memberId:$category:$status');

  @override
  Future<AuditPage> getAudit({int page = 1, int pageSize = 20}) async => AuditPage(
    items: [AuditEntry(id: 'a-$page', eventType: 'CONSENT_CHANGED', resourceType: 'Consent', outcome: 'Success', createdAt: DateTime(2026, 9, 1))],
    page: page,
    totalPages: 1,
    totalCount: 1,
  );

  @override
  Future<List<SharedItem>> getSharingItems(String memberId) async =>
      const [SharedItem(id: 'lab-1', isReport: true, title: 'shared.png', shared: true)];

  @override
  Future<void> setSharing(SharedItem item, {required bool shared}) async {}
}

void main() {
  testWidgets('Family Head toggles a minor consent; adults show no switches', (tester) async {
    tester.view.physicalSize = const Size(390 * 3, 844 * 3);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final api = _FakePrivacyApi();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          privacyApiProvider.overrideWithValue(api),
          familyDashboardProvider.overrideWith((ref) async => FamilyDashboard.fromJson({'role': 'Head', 'familyId': 'f-1'})),
          familyDoctorProvider('f-1').overrideWith((ref) async => DoctorSummary.fromJson({'id': 'd-1', 'displayName': 'Dr. Synthetic Doctor'})),
        ],
        child: const MaterialApp(home: PrivacyScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Privacy & Access'), findsOneWidget);
    expect(find.text('Member permissions'), findsOneWidget);
    final minorSwitch = find.widgetWithText(SwitchListTile, 'Family history (screening flags)');
    // NestedScrollView: drag the list so the header scrolls away and the switch is on screen.
    await tester.dragUntilVisible(minorSwitch.hitTestable(), find.byType(ListView).first, const Offset(0, -200));
    await tester.pumpAndSettle();
    await tester.tap(minorSwitch);
    await tester.pumpAndSettle();
    expect(api.consentWrites, ['m-minor:HereditaryFlags:Granted']);

    // The adult card sits below the fold of the lazy list: scroll to it.
    final adultText = find.textContaining('1 item shared with you');
    await tester.dragUntilVisible(adultText, find.byType(ListView).first, const Offset(0, -200));
    expect(adultText, findsOneWidget);
    // Adults manage their own privacy: their card carries no switches.
    final adultCard = find.ancestor(of: adultText, matching: find.byType(MemberCard));
    expect(find.descendant(of: adultCard, matching: find.byType(SwitchListTile)), findsNothing);
  });
}
