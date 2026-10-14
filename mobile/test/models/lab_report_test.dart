import 'package:family_veda/models/health_record.dart';
import 'package:family_veda/models/lab_report.dart';
import 'package:family_veda/models/member.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('lab report parses sharing, file state and range counts', () {
    final report = LabReport.fromJson({
      'id': 'synthetic-report',
      'memberId': 'synthetic-member',
      'originalFileName': 'synthetic-cbc.png',
      'ocrStatus': 'Completed',
      'collectedAt': '2026-08-01T00:00:00Z',
      'sharedWithFamilyHead': true,
      'hasOriginalFile': true,
      'rangeSummary': {'belowRange': 1, 'withinRange': 2, 'aboveRange': 0, 'rangeUnavailable': 1},
    });
    expect(report.sharedWithFamilyHead, isTrue);
    expect(report.hasOriginalFile, isTrue);
    expect(report.rangeSummary!.label, '1 below · 2 within · 0 above · 1 no range');
  });

  test('items default to private and sex defaults to not specified', () {
    final report = LabReport.fromJson({'id': 'r', 'memberId': 'm'});
    final record = HealthRecord.fromJson({'id': 'x', 'memberId': 'm', 'recordType': 'Note', 'title': 't', 'occurredOn': '2026-08-01'});
    final member = Member.fromJson({'id': 'm', 'displayName': 'Synthetic Adult', 'role': 'AdultMember'});
    expect(report.sharedWithFamilyHead, isFalse);
    expect(report.rangeSummary, isNull);
    expect(record.sharedWithFamilyHead, isFalse);
    expect(member.sexForClinicalReference, 'NotSpecified');
  });
}
