import 'package:flutter/material.dart';

/// Real report states as numbered steps, without invented percentages.
/// The last step is doctor review: AI only assists the doctor, and nothing
/// reaches the patient without approval (RULE 2).
class ReportProgress extends StatelessWidget {
  const ReportProgress({
    super.key,
    required this.status,
    this.confirmed = false,
  });
  final String status;
  final bool confirmed;

  @override
  Widget build(BuildContext context) {
    final upper = status.toUpperCase();
    final failed = upper == 'FAILED' || upper == 'FAILED_SAFE';
    final ready = upper == 'COMPLETED' || upper == 'MANUALENTRY';
    final current = confirmed
        ? 4
        : ready
        ? 2
        : 1;
    final scheme = Theme.of(context).colorScheme;
    const warning = Color(0xFFD59A3D);
    final labels = [
      'Uploaded',
      failed ? 'Could not read' : 'Reading text',
      'Values found',
      'You confirmed',
      'Doctor review',
    ];
    return Semantics(
      label: 'Report progress, step ${current + 1} of 5: ${labels[current]}',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final (index, label) in labels.indexed)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: index < current
                          ? const Color(0xFF10B981)
                          : index == current
                          ? (failed ? warning : scheme.primary)
                          : scheme.outlineVariant,
                      child: Text(
                        index < current ? '✓' : '${index + 1}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      label,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: index == current
                            ? (failed ? warning : scheme.primary)
                            : index < current
                            ? scheme.onSurface
                            : scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
