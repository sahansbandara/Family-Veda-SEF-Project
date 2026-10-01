// Phase 2 (S4): report-library card. Range position counts only — no interpretation (RULE 1, RULE 6).
import 'package:family_veda/models/lab_report.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class ReportLibraryCard extends StatelessWidget {
  const ReportLibraryCard({
    super.key,
    required this.report,
    required this.ownerName,
    required this.canChangeSharing,
    this.onToggleSharing,
    this.onViewOriginal,
  });

  final LabReport report;
  final String ownerName;
  final bool canChangeSharing;
  final VoidCallback? onToggleSharing;
  final VoidCallback? onViewOriginal;

  @override
  Widget build(BuildContext context) {
    final collected = report.collectedAt == null
        ? 'Collected date not recorded'
        : DateFormat.yMMMd().format(report.collectedAt!.toLocal());
    final shared = report.sharedWithFamilyHead;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              report.fileName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Text('$ownerName · $collected'),
            const SizedBox(height: 8),
            _Fact(
              'Visibility',
              shared ? 'Shared with Family Head' : 'Private from Family Head',
            ),
            _Fact('Extraction', report.ocrStatus),
            _Fact(
              'Original file',
              report.hasOriginalFile ? 'Stored' : 'Not stored',
            ),
            _Fact(
              'Recorded range position',
              report.rangeSummary?.label ?? 'No values confirmed yet',
            ),
            if (report.hasOriginalFile && onViewOriginal != null)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: onViewOriginal,
                  child: const Text('View original image'),
                ),
              ),
            if (canChangeSharing && onToggleSharing != null)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: onToggleSharing,
                  child: Text(
                    shared
                        ? 'Keep private from Family Head'
                        : 'Share with Family Head',
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodySmall),
        ),
        const SizedBox(width: 8),
        Flexible(child: Text(value, textAlign: TextAlign.end)),
      ],
    ),
  );
}
