import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final now = DateTime.utc(2026, 10, 18, 10);

  test('null without expiry', () {
    expect(grantCountdown(null, now), isNull);
  });

  test('muted with more than 12 hours left', () {
    final c = grantCountdown(now.add(const Duration(hours: 30)), now)!;
    expect(c.label, 'Access ends in 1d 6h');
    expect(c.tone, QueueTone.muted);
  });

  test('amber inside 12 hours', () {
    final c = grantCountdown(
      now.add(const Duration(hours: 6, minutes: 15)),
      now,
    )!;
    expect(c.label, 'Access ends in 6h 15m');
    expect(c.tone, QueueTone.warning);
  });

  test('red once expired', () {
    final c = grantCountdown(now.subtract(const Duration(seconds: 1)), now)!;
    expect(c.label, 'Access expired');
    expect(c.tone, QueueTone.danger);
  });

  test('granted case parses grantExpiresAt', () {
    final item = DoctorQueueCase.granted({
      'id': 'c1',
      'createdAt': '2026-10-18T10:00:00Z',
      'grantExpiresAt': '2026-10-19T10:00:00Z',
    });
    expect(item.grantExpiresAt, DateTime.utc(2026, 10, 19, 10));
  });
}
