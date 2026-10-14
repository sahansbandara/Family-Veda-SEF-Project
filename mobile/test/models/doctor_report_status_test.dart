import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('unconfirmed extraction is distinguished from missing values', () {
    final report = LabReport.fromJson({
      'id': 'synthetic-report',
      'fileName': 'synthetic.png',
      'ocrStatus': 'Completed',
      'unconfirmedValueCount': 3,
      'values': <dynamic>[],
    });
    expect(report.values, isEmpty);
    expect(report.extractionSummary, contains('3 extracted'));
    expect(report.extractionSummary, contains('awaiting member confirmation'));
  });

  test('pending and failed reports have different next steps', () {
    for (final entry in {
      'Pending': 'Not processed',
      'Failed': 'Extraction failed',
    }.entries) {
      final report = LabReport.fromJson({
        'id': 'synthetic-report',
        'fileName': 'synthetic.pdf',
        'ocrStatus': entry.key,
        'values': <dynamic>[],
      });
      expect(report.extractionSummary, contains(entry.value));
    }
  });
}
