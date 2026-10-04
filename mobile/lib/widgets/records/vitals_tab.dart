// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// [S2] Vitals tab: latest readings, quick add, and the full history. Shows recorded values and
// their arithmetic change only — never a range comparison or an interpretation (RULE 1, RULE 4).
import 'package:family_veda/models/vital.dart';
import 'package:family_veda/providers/records_provider.dart';
import 'package:family_veda/widgets/records/records_visuals.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

String _when(DateTime measuredAt) =>
    DateFormat.yMMMd().add_jm().format(measuredAt.toLocal());

class VitalsTab extends ConsumerWidget {
  const VitalsTab({super.key, required this.readOnly});

  /// True when the Family Head views another adult: vitals are never shared across adults.
  final bool readOnly;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (readOnly) {
      return const EmptyStateView(
        title: 'Vitals stay private',
        message: 'Another adult\'s vitals are not shared with the Family Head.',
      );
    }
    return ref
        .watch(memberVitalsProvider)
        .when(
          loading: () => const LoadingStateView(label: 'Loading vitals'),
          error: (_, _) => ErrorRetryView(
            onRetry: () => ref.invalidate(memberVitalsProvider),
          ),
          data: (vitals) => _VitalsBody(
            groups: groupVitals(vitals),
            onAdd: (preset) async {
              await context.push('/vitals/new', extra: preset.kind);
              ref.invalidate(memberVitalsProvider);
            },
          ),
        );
  }
}

class _VitalsBody extends StatefulWidget {
  const _VitalsBody({required this.groups, required this.onAdd});

  final List<VitalGroup> groups;
  final Future<void> Function(VitalPreset preset) onAdd;

  @override
  State<_VitalsBody> createState() => _VitalsBodyState();
}

class _VitalsBodyState extends State<_VitalsBody> {
  String _type = 'all';

  void _showReadings(VitalGroup group) {
    final color = RecordTones.forVital(context, group.kind);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.7,
          ),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            children: [
              Text(group.label, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              LayoutBuilder(
                builder: (context, constraints) => VitalSparkline(
                  values: group.trend(12),
                  color: color,
                  width: constraints.maxWidth,
                  height: 96,
                ),
              ),
              const SizedBox(height: 8),
              for (final (index, reading) in group.readings.indexed)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: Text('${reading.display} ${reading.unit}'),
                  subtitle: Text(_when(reading.measuredAt)),
                  trailing: Text(describeVitalChange(group.changeAt(index))),
                ),
              const SizedBox(height: 8),
              Text(
                'Values exactly as recorded. No reference range is applied here.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final groups = widget.groups;
    final shown = groups.where((group) => _type == 'all' || group.key == _type);
    final history = [
      for (final group in shown)
        for (final (index, reading) in group.readings.indexed)
          (group: group, reading: reading, index: index),
    ]..sort((a, b) => b.reading.measuredAt.compareTo(a.reading.measuredAt));

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Text('Latest vitals', style: theme.textTheme.titleMedium),
        Text(
          'Most recent readings from your health records',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: 10),
        if (groups.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Text(
              'No vitals recorded. Add a reading to keep a dated record.',
            ),
          )
        else
          for (final group in groups)
            _LatestVitalCard(group: group, onTap: () => _showReadings(group)),
        const SizedBox(height: 16),
        Text('Quick add vitals', style: theme.textTheme.titleMedium),
        Text(
          'Choose a measurement to record a new reading',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 340 ? 2 : 1;
            final width = (constraints.maxWidth - 10 * (columns - 1)) / columns;
            return Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (final preset in vitalPresets)
                  SizedBox(
                    width: width,
                    child: _QuickAddTile(
                      preset: preset,
                      onTap: () => widget.onAdd(preset),
                    ),
                  ),
              ],
            );
          },
        ),
        if (groups.isNotEmpty) ...[
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Text(
                  'All recorded vitals',
                  style: theme.textTheme.titleMedium,
                ),
              ),
              DropdownButton<String>(
                value: groups.any((group) => group.key == _type)
                    ? _type
                    : 'all',
                underline: const SizedBox.shrink(),
                items: [
                  const DropdownMenuItem(
                    value: 'all',
                    child: Text('All types'),
                  ),
                  for (final group in groups)
                    DropdownMenuItem(
                      value: group.key,
                      child: Text(group.label),
                    ),
                ],
                onChanged: (value) => setState(() => _type = value ?? 'all'),
              ),
            ],
          ),
          for (final row in history)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: TonedIcon(
                icon: vitalIcon(row.group.kind),
                color: RecordTones.forVital(context, row.group.kind),
                size: 36,
              ),
              title: Text(
                '${row.group.label} · ${row.reading.display} ${row.reading.unit}',
              ),
              subtitle: Text(_when(row.reading.measuredAt)),
              trailing: Text(
                describeVitalChange(row.group.changeAt(row.index)),
                style: theme.textTheme.bodySmall,
              ),
              onTap: () => _showReadings(row.group),
            ),
        ],
        const SizedBox(height: 12),
        Text(
          'Recorded trends show values only and are not a clinical interpretation.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _LatestVitalCard extends StatelessWidget {
  const _LatestVitalCard({required this.group, required this.onTap});

  final VitalGroup group;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = RecordTones.forVital(context, group.kind);
    final reading = group.readings.first;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: color),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      TonedIcon(icon: vitalIcon(group.kind), color: color),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              group.label,
                              style: theme.textTheme.labelLarge,
                            ),
                            Text.rich(
                              TextSpan(
                                text: reading.display,
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                                children: [
                                  TextSpan(
                                    text: ' ${reading.unit}',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              _when(reading.measuredAt),
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            describeVitalChange(group.changeAt(0)),
                            style: theme.textTheme.bodySmall,
                          ),
                          VitalSparkline(values: group.trend(8), color: color),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAddTile extends StatelessWidget {
  const _QuickAddTile({required this.preset, required this.onTap});

  final VitalPreset preset;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = RecordTones.forVital(context, preset.kind);
    return Material(
      color: theme.colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              children: [
                TonedIcon(icon: vitalIcon(preset.kind), color: color, size: 36),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        preset.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.labelLarge,
                      ),
                      Text(
                        preset.hint,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
