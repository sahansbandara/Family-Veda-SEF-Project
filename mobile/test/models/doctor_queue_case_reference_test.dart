// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const base = {
    'id': 'b94621d8-6407-4b91-b69c-2c872abc86e1',
    'priority': 'Routine',
    'status': 'PendingDoctorReview',
    'createdAt': '2026-10-04T00:08:00Z',
  };

  test(
    'granted case shows the four-digit case number and released identity',
    () {
      final item = DoctorQueueCase.granted({
        ...base,
        'caseNumber': 7,
        'memberDisplayName': 'Synthetic Arun Screening',
        'familyName': 'Synthetic Screening Family',
      });

      expect(item.reference, '0007');
      expect(
        item.identityLabel,
        'Synthetic Arun Screening · Synthetic Screening Family',
      );
      expect(item.title, 'Synthetic Arun Screening');
      expect(item.caseLine, 'Synthetic Screening Family · Case 0007');
    },
  );

  test(
    'pooled case never carries identity even if the payload includes it',
    () {
      final item = DoctorQueueCase.pooled({
        ...base,
        'caseNumber': 12,
        'memberDisplayName': 'Synthetic Arun Screening',
      });

      expect(item.reference, '0012');
      expect(item.identityLabel, isNull);
      expect(item.title, 'Case 0012');
      expect(item.caseLine, isNull);
    },
  );

  test(
    'falls back to the id prefix when an older API sends no case number',
    () {
      final item = DoctorQueueCase.granted(base);

      expect(item.reference, 'b94621d8');
      expect(item.identityLabel, isNull);
    },
  );
}
