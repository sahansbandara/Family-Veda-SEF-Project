// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
import 'package:family_veda/services/api/report_reading_poller.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const tick = Duration(milliseconds: 1);

  test('polls until the report leaves Processing', () async {
    final statuses = ['Processing', 'Processing', 'Completed'];
    var calls = 0;
    final done = await waitForReportReading(
      () async => {'ocrStatus': statuses[calls++]},
      interval: tick,
    );
    expect(done?['ocrStatus'], 'Completed');
    expect(calls, 3);
  });

  test('returns a failed read so its reason can be shown', () async {
    final done = await waitForReportReading(
      () async => {'ocrStatus': 'Failed', 'ocrErrorCode': 'OCR_TIMEOUT'},
      interval: tick,
    );
    expect(done?['ocrErrorCode'], 'OCR_TIMEOUT');
  });

  test('keeps polling through a failed request', () async {
    var calls = 0;
    final done = await waitForReportReading(() async {
      if (calls++ == 0) throw Exception('network');
      return {'ocrStatus': 'Completed'};
    }, interval: tick);
    expect(done?['ocrStatus'], 'Completed');
  });

  test('gives up after the cap', () async {
    final done = await waitForReportReading(
      () async => {'ocrStatus': 'Processing'},
      interval: tick,
      max: const Duration(milliseconds: 20),
    );
    expect(done, isNull);
  });

  test('stops when the screen is gone', () async {
    var calls = 0;
    final done = await waitForReportReading(
      () async {
        calls++;
        return {'ocrStatus': 'Processing'};
      },
      interval: tick,
      isActive: () => false,
    );
    expect(done, isNull);
    expect(calls, 0);
  });
}
