// Owner: S2 · Health Records & Extraction — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// [S2] "Recently deleted" reports: restore, or delete permanently after a second confirmation.
import 'package:family_veda/services/api/report_trash_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class DeletedReportsSection extends ConsumerStatefulWidget {
  const DeletedReportsSection({
    super.key,
    required this.memberId,
    required this.onRestored,
  });

  final String memberId;
  final VoidCallback onRestored;

  @override
  ConsumerState<DeletedReportsSection> createState() =>
      _DeletedReportsSectionState();
}

class _DeletedReportsSectionState extends ConsumerState<DeletedReportsSection> {
  bool _busy = false;

  void _say(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _restore(DeletedLabReport report) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(reportTrashApiProvider).restore(report.id);
      widget.onRestored();
      _say('${report.fileName} was restored to your reports.');
    } on Object {
      _say('The report could not be restored. Retry.');
    } finally {
      ref.invalidate(deletedLabReportsProvider(widget.memberId));
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _purge(DeletedLabReport report) async {
    if (_busy) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this report permanently?'),
        content: Text(
          '${report.fileName}, its file and the values read from it will be removed for good. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Theme.of(context).colorScheme.onError,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete permanently'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await ref.read(reportTrashApiProvider).deletePermanently(report.id);
      _say('${report.fileName} was permanently deleted.');
    } on ReportHeldException catch (held) {
      _say(held.message);
    } on Object {
      _say('The report could not be permanently deleted. Retry.');
    } finally {
      ref.invalidate(deletedLabReportsProvider(widget.memberId));
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final reports =
        ref.watch(deletedLabReportsProvider(widget.memberId)).valueOrNull ??
        const <DeletedLabReport>[];
    if (reports.isEmpty) return const SizedBox.shrink();
    return Card(
      margin: const EdgeInsets.only(top: 16),
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        leading: const Icon(Icons.delete_outline),
        title: Text('Recently deleted (${reports.length})'),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Deleted reports are hidden from your records, your doctor and symptom checks. Restore one to bring it back unchanged, or delete it permanently.',
            style: theme.textTheme.bodySmall,
          ),
          for (final report in reports) ...[
            const Divider(height: 24),
            Text(report.fileName, style: theme.textTheme.titleSmall),
            Text(
              'Deleted ${DateFormat.yMMMd().format(report.deletedAt.toLocal())}',
              style: theme.textTheme.bodySmall,
            ),
            if (!report.canDeletePermanently)
              Text(
                'Kept: confirmed values may have been used in a symptom case.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.tertiary,
                ),
              ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton(
                  onPressed: _busy ? null : () => _restore(report),
                  child: const Text('Restore'),
                ),
                TextButton.icon(
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.error,
                  ),
                  onPressed: _busy || !report.canDeletePermanently
                      ? null
                      : () => _purge(report),
                  icon: const Icon(Icons.delete_forever_outlined, size: 18),
                  label: const Text('Delete permanently'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
