import 'package:family_veda/models/triage_case.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('submittedAt is converted to device-local time', () {
    final item = TriageCase.fromJson({
      'id': '755e2a67-0000-0000-0000-000000000000',
      'status': 'Submitted',
      'submittedAt': '2026-10-05T23:53:00Z',
    });
    expect(item.submittedAt.isUtc, isFalse);
    expect(item.submittedAt, DateTime.utc(2026, 10, 5, 23, 53).toLocal());
  });

  test('reference shows zero-padded case number, else id prefix', () {
    final numbered = TriageCase.fromJson({
      'id': '755e2a67-0000-0000-0000-000000000000',
      'status': 'Submitted',
      'createdAt': '2026-10-05T23:53:00Z',
      'caseNumber': 40,
    });
    expect(numbered.reference, '0040');
    final legacy = TriageCase.fromJson({
      'id': '755e2a67-0000-0000-0000-000000000000',
      'status': 'Submitted',
      'createdAt': '2026-10-05T23:53:00Z',
    });
    expect(legacy.reference, '755e2a67');
  });
}
