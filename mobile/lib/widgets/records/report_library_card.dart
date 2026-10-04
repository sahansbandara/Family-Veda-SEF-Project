// Phase 2 (S4): report-library card. Range position counts only — no interpretation (RULE 1, RULE 6).
import 'package:family_veda/models/lab_report.dart';
import 'package:flutter/material.dart';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:family_veda/widgets/records/report_original_thumbnail.dart';
import 'package:intl/intl.dart';

class ReportLibraryCard extends StatefulWidget {
  const ReportLibraryCard({
    super.key,
    required this.report,
    required this.ownerName,
    required this.canChangeSharing,
    this.onToggleSharing,
    this.onViewOriginal,
    this.loadOriginal,
    this.compact = false,
  });

  final bool compact;
  final LabReport report;
  final String ownerName;
  final bool canChangeSharing;
  final VoidCallback? onToggleSharing;
  final VoidCallback? onViewOriginal;

  final OriginalReportLoader? loadOriginal;
  @override
  State<ReportLibraryCard> createState() => _ReportLibraryCardState();
}

class _ReportLibraryCardState extends State<ReportLibraryCard> {
  bool _preview = false;
  @override
  Widget build(BuildContext context) {
    final collected = widget.report.collectedAt == null
        ? 'Collected date not recorded'
        : DateFormat.yMMMd().format(widget.report.collectedAt!.toLocal());
    final shared = widget.report.sharedWithFamilyHead;
    final extraction = switch (widget.report.ocrStatus.toUpperCase()) {
      'COMPLETED' => 'Ready for manual review',
      'PENDING' || 'PROCESSING' => 'Processing report',
      'FAILED' || 'FAILED_SAFE' => 'Manual review required',
      _ => widget.report.ocrStatus.replaceAll('_', ' '),
    };
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              widget.report.fileName.toLowerCase().endsWith('.pdf')
                  ? Icons.picture_as_pdf_outlined
                  : Icons.image_outlined,
              color: Theme.of(context).colorScheme.primary,
              size: 32,
            ),
            const SizedBox(height: 12),
            Text(
              widget.report.fileName,
              maxLines: widget.compact ? 3 : null,
              overflow: widget.compact ? TextOverflow.ellipsis : null,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Text('${widget.ownerName} · $collected'),
            const SizedBox(height: 8),
            if (widget.compact) ...[
              Text(
                shared ? 'Shared with Family Head' : 'Private',
                style: Theme.of(context).textTheme.labelMedium,
              ),
              const SizedBox(height: 4),
              Text(
                extraction,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (!widget.report.hasOriginalFile)
                const Text('Original not stored'),
            ] else ...[
              _Fact(
                'Visibility',
                shared ? 'Shared with Family Head' : 'Private from Family Head',
              ),
              _Fact('Extraction', extraction),
              _Fact(
                'Original file',
                widget.report.hasOriginalFile ? 'Stored' : 'Not stored',
              ),
              _Fact(
                'Recorded range position',
                widget.report.rangeSummary?.label ?? 'No values confirmed yet',
              ),
            ],
            if (widget.report.hasOriginalFile &&
                widget.loadOriginal != null) ...[
              TextButton.icon(
                onPressed: () => setState(() => _preview = !_preview),
                icon: Icon(
                  _preview
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                label: Text(_preview ? 'Hide preview' : 'Preview report'),
              ),
              if (_preview)
                ReportOriginalThumbnail(
                  load: widget.loadOriginal!,
                  fileName: widget.report.fileName,
                ),
            ],
            if (widget.report.hasOriginalFile && widget.onViewOriginal != null)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: widget.onViewOriginal,
                  child: const Text('View original report'),
                ),
              ),
            if (widget.canChangeSharing && widget.onToggleSharing != null)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: widget.onToggleSharing,
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
