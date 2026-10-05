// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
// Reading a report is a background job on the server (POST /extract returns 202).
// Clients poll GET /lab-reports/{id} until it leaves Processing, capped at ~4 min.

const readingPollInterval = Duration(seconds: 3);
const readingPollMax = Duration(minutes: 4);

bool isStillReading(Map<String, dynamic> detail) =>
    (detail['ocrStatus'] ?? '').toString().toUpperCase() == 'PROCESSING';

/// Returns the first detail that is no longer Processing, or null when the cap
/// elapses or [isActive] turns false (screen closed, profile switched).
Future<Map<String, dynamic>?> waitForReportReading(
  Future<Map<String, dynamic>> Function() fetch, {
  Duration interval = readingPollInterval,
  Duration max = readingPollMax,
  bool Function()? isActive,
}) async {
  final stopwatch = Stopwatch()..start();
  while (stopwatch.elapsed < max) {
    await Future<void>.delayed(interval);
    if (isActive != null && !isActive()) return null;
    try {
      final detail = await fetch();
      if (!isStillReading(detail)) return detail;
    } on Object {
      // A failed poll is retried on the next tick; the server state is unaffected.
    }
  }
  return null;
}
