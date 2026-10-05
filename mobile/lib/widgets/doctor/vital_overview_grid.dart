// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Vital signs overview grid for the doctor member workspace. Mirrors the web
// `.approval-vitals` grid: 3 columns on wide screens, 2 on tablets, 1 on phones.
// Range labels come from the deterministic reference tables, never AI (RULE 4).
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:flutter/material.dart';

/// Column count for a given available width: 1 (<600) · 2 (<1024) · 3.
int vitalGridColumns(double width) => width < 600 ? 1 : (width < 1024 ? 2 : 3);

class VitalOverviewGrid extends StatelessWidget {
  const VitalOverviewGrid({
    super.key,
    required this.groups,
    required this.selectedKey,
    required this.onSelect,
  });

  final List<VitalSeries> groups;
  final String selectedKey;
  final ValueChanged<String> onSelect;

  static const _spacing = 10.0;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final columns = vitalGridColumns(constraints.maxWidth);
      final width =
          (constraints.maxWidth - _spacing * (columns - 1)) / columns;
      return Wrap(
        spacing: _spacing,
        runSpacing: _spacing,
        children: [
          for (final group in groups)
            SizedBox(
              key: ValueKey('vital-card-${group.key}'),
              width: width,
              child: _VitalCard(
                group: group,
                selected: group.key == selectedKey,
                onTap: () => onSelect(group.key),
              ),
            ),
        ],
      );
    },
  );
}

class _VitalCard extends StatelessWidget {
  const _VitalCard({
    required this.group,
    required this.selected,
    required this.onTap,
  });

  final VitalSeries group;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final latest = group.latest;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? palette.primary : palette.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                group.label,
                style: TextStyle(
                  color: palette.heading,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                latest.valueLabel,
                style: TextStyle(
                  color: palette.text,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              // Wrap lets the badge drop to its own line and wrap its text
              // instead of overflowing the card.
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  AccessPill(
                    label: vitalRangeLabel(latest.range),
                    color: switch (latest.range) {
                      LabRange.within => palette.success,
                      LabRange.unavailable => palette.muted,
                      LabRange.above => palette.danger,
                      LabRange.below => palette.warning,
                    },
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Trend: ${latest.trend.label}',
                style: TextStyle(color: palette.muted, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
