import 'package:flutter/material.dart';

/// Source-reading progress only; confirmation is established from detail values.
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
    final stage = confirmed
        ? 3
        : status.toUpperCase() == 'COMPLETED'
        ? 2
        : 1;
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        for (final (index, label) in [
          'Uploaded',
          'Reading',
          'Ready',
          'Confirmed',
        ].indexed)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                children: [
                  Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: index <= stage
                          ? scheme.primary
                          : scheme.outlineVariant,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    label,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: index <= stage
                          ? scheme.primary
                          : scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
