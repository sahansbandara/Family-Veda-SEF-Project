import 'package:family_veda/models/health_record.dart';
import 'package:family_veda/providers/records_provider.dart';
import 'package:family_veda/screens/records/lab_upload_screen.dart';
import 'package:family_veda/screens/records/records_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('records screen filters and sorts synthetic history', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          memberRecordsProvider.overrideWith(
            (ref) async => const [
              HealthRecord(
                id: 'older',
                memberId: 'member-1',
                type: 'Note',
                title: 'Older synthetic note',
                recordedAt: DateTime.utc(2026, 1, 1),
              ),
              HealthRecord(
                id: 'newer',
                memberId: 'member-1',
                type: 'Allergy',
                title: 'Newer synthetic allergy',
                recordedAt: DateTime.utc(2026, 6, 1),
              ),
            ],
          ),
        ],
        child: const MaterialApp(home: RecordsScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Newer synthetic allergy'), findsOneWidget);
    expect(find.text('Older synthetic note'), findsOneWidget);
    expect(
      tester.getTopLeft(find.text('Newer synthetic allergy')).dy,
      lessThan(tester.getTopLeft(find.text('Older synthetic note')).dy),
    );

    await tester.tap(find.byTooltip('Newest first'));
    await tester.pumpAndSettle();
    expect(
      tester.getTopLeft(find.text('Older synthetic note')).dy,
      lessThan(tester.getTopLeft(find.text('Newer synthetic allergy')).dy),
    );

    await tester.enterText(find.byType(TextField), 'allergy');
    await tester.pumpAndSettle();
    expect(find.text('Newer synthetic allergy'), findsOneWidget);
    expect(find.text('Older synthetic note'), findsNothing);
  });

  testWidgets('lab upload screen is camera capture with no clinical advice', (
    tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: LabUploadScreen())),
    );

    expect(find.text('Take photo'), findsOneWidget);
    expect(find.text('Choose image'), findsOneWidget);
    expect(find.textContaining('synthetic'), findsOneWidget);
    expect(find.textContaining('diagnos'), findsNothing);
    expect(find.textContaining('dose'), findsNothing);
  });
}
