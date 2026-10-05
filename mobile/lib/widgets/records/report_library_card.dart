// Phase 2 (S4): report-library card. Range position counts only — no interpretation (RULE 1, RULE 6).
import 'package:family_veda/widgets/records/report_reading.dart';
import 'package:family_veda/models/lab_report.dart';
import 'package:flutter/material.dart';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:family_veda/widgets/records/report_original_thumbnail.dart';
import 'package:intl/intl.dart';
import 'package:family_veda/widgets/records/report_progress.dart';

class ReportLibraryCard extends StatefulWidget {
  const ReportLibraryCard({
    super.key,
    required this.report,
    required this.ownerName,
    required this.canChangeSharing,
    this.onToggleSharing,
    this.onViewOriginal,
    this.onDelete,
    this.onCheckValues,
    this.loadOriginal,
    this.compact = false,
  });

  final bool compact;
  final LabReport report;
  final String ownerName;
  final bool canChangeSharing;
  final VoidCallback? onToggleSharing;
  final VoidCallback? onViewOriginal;

  /// Present only when the viewer may move this report to Recently deleted.
  final VoidCallback? onDelete;
  final VoidCallback? onCheckValues;

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
      'PENDING' => 'Not read yet',
      'PROCESSING' => 'Reading report',
      'FAILED' || 'FAILED_SAFE' =>
        'Could not read: ${readingFailure(widget.report.ocrErrorCode).title}',
      _ => widget.report.ocrStatus.replaceAll('_', ' '),
    };
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: .6),
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: EdgeInsets.all(widget.compact ? 12 : 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).colorScheme.primaryContainer.withValues(alpha: .45),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    widget.report.fileName.toLowerCase().endsWith('.pdf')
                        ? Icons.picture_as_pdf_outlined
                        : Icons.image_outlined,
                    color: Theme.of(context).colorScheme.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.report.fileName,
                        maxLines: widget.compact ? 3 : 2,
                        overflow: TextOverflow.ellipsis,
                        style: widget.compact
                            ? Theme.of(context).textTheme.titleSmall
                            : Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${widget.ownerName} · $collected',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (!widget.compact) ...[
              const SizedBox(height: 14),
              ReportProgress(status: widget.report.ocrStatus),
            ],
            const SizedBox(height: 8),
            if (widget.compact) ...[
              Text(
                shared ? 'Shared with Family Head' : 'Private',
                style: Theme.of(context).textTheme.labelMedium,
              ),
              const SizedBox(height: 4),
              Text(extraction, style: Theme.of(context).textTheme.bodySmall),
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
            // One wrapping row keeps the card short; each action stays a full-size tap target.
            Align(
              alignment: Alignment.centerRight,
              child: Wrap(
                alignment: WrapAlignment.end,
                spacing: 4,
                children: [
                  if (widget.report.hasOriginalFile &&
                      widget.onViewOriginal != null)
                    TextButton(
                      onPressed: widget.onViewOriginal,
                      child: const Text('View original report'),
                    ),
                  if (widget.onCheckValues != null)
                    FilledButton.tonal(
                      onPressed: widget.onCheckValues,
                      child: const Text('Check values'),
                    ),
                  if (!widget.compact &&
                      widget.canChangeSharing &&
                      widget.onToggleSharing != null)
                    TextButton(
                      onPressed: widget.onToggleSharing,
                      child: Text(
                        shared
                            ? 'Keep private from Family Head'
                            : 'Share with Family Head',
                      ),
                    ),
                  if (widget.compact &&
                      (widget.onDelete != null ||
                          (widget.canChangeSharing &&
                              widget.onToggleSharing != null)))
                    PopupMenuButton<String>(
                      tooltip: 'Report actions',
                      onSelected: (action) {
                        if (action == 'sharing') {
                          widget.onToggleSharing?.call();
                        } else {
                          widget.onDelete?.call();
                        }
                      },
                      itemBuilder: (_) => [
                        if (widget.canChangeSharing &&
                            widget.onToggleSharing != null)
                          PopupMenuItem(
                            value: 'sharing',
                            child: Text(
                              shared
                                  ? 'Keep private from Family Head'
                                  : 'Share with Family Head',
                            ),
                          ),
                        if (widget.onDelete != null)
                          const PopupMenuItem(
                            value: 'delete',
                            child: Text('Delete'),
                          ),
                      ],
                    ),
                  if (!widget.compact && widget.onDelete != null)
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.error,
                      ),
                      onPressed: widget.onDelete,
                      icon: const Icon(Icons.delete_outline, size: 18),
                      label: const Text('Delete'),
                    ),
                ],
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
