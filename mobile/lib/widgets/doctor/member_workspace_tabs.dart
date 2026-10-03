// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Tab bodies of the doctor member workspace. Same rules as the web tabs
// (web/src/pages/doctor/memberClinicalTabs.tsx, memberCareTabs.tsx):
// null = restricted (no count) · empty = authorised and empty · list = what the API returned.
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/models/record_summary_meta.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:flutter/material.dart';

const _gap = SizedBox(height: 12);

class OverviewTab extends StatelessWidget {
  const OverviewTab({super.key, required this.workspace, required this.onOpen});

  final MemberWorkspace workspace;

  /// Opens another tab by index (1 Records · 2 Labs · 3 Vitals · 4 Visits · 5 Notes).
  final ValueChanged<int> onOpen;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final w = workspace;
    final upcoming = w.upcomingVisits(DateTime.now());
    final next = upcoming.isEmpty ? null : upcoming.first;
    final categories = [
      ('Health records', 1, w.records != null),
      ('Lab results', 2, w.labReports != null),
      ('Vital readings', 3, w.vitals != null),
    ];
    final flags = w.hereditaryFlags;

    Widget tile(String label, String value, String hint) => WorkspaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: palette.muted, fontSize: 13)),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              color: palette.heading,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(hint, style: TextStyle(color: palette.muted, fontSize: 13)),
        ],
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        tile(
          'Current care access',
          w.clinicalAccess ? 'Active' : 'Restricted',
          w.clinicalAccess
              ? (w.accessExpiresAt == null
                    ? 'Time-bound grant'
                    : 'Until ${formatMoment(w.accessExpiresAt!)}')
              : 'No active visit or shared case',
        ),
        _gap,
        tile(
          'Next visit with you',
          next == null ? 'None booked' : formatMoment(next.startsAt),
          next == null ? 'No upcoming appointment' : statusLabelOf(next),
        ),
        _gap,
        tile(
          'Your notes',
          w.notes.length.toString().padLeft(2, '0'),
          'Doctor-only entries',
        ),
        _gap,
        WorkspaceCard(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionHeading(
                title: 'Authorized clinical information',
                subtitle:
                    'Each category opens only when the member has consented to it.',
              ),
              for (final (label, index, allowed) in categories)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(label),
                  // Text, not colour alone, and no wide trailing row to overflow at large text.
                  subtitle: allowed ? null : const Text('Restricted'),
                  enabled: allowed,
                  trailing: Icon(
                    allowed
                        ? Icons.chevron_right_rounded
                        : Icons.lock_outline_rounded,
                  ),
                  onTap: allowed ? () => onOpen(index) : null,
                ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Visits with you'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => onOpen(4),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Your notes'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => onOpen(5),
              ),
            ],
          ),
        ),
        _gap,
        WorkspaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionHeading(title: 'Consented categories'),
              const SizedBox(height: 8),
              if (!w.clinicalAccess)
                Text(
                  'Shown during an active visit or shared case.',
                  style: TextStyle(color: palette.muted),
                )
              else if (w.consentedCategories.isEmpty)
                Text(
                  'The member has not consented to any category.',
                  style: TextStyle(color: palette.muted),
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final category in w.consentedCategories)
                      AccessPill(
                        label: consentLabel(category),
                        color: palette.success,
                      ),
                  ],
                ),
              if (flags != null) ...[
                const SizedBox(height: 14),
                const SectionHeading(title: 'Family-history screening context'),
                const SizedBox(height: 6),
                if (flags.isEmpty)
                  Text(
                    'No confirmed family-history flags.',
                    style: TextStyle(color: palette.muted),
                  ),
                for (final flag in flags)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      '${flag.finding} (${flag.conditionCode})',
                      style: TextStyle(color: palette.text),
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  'A screening indication only. It is never a diagnosis.',
                  style: TextStyle(color: palette.muted, fontSize: 13),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

String statusLabelOf(WorkspaceVisit visit) => visit.status.friendlyLabel;

class RecordsTab extends StatefulWidget {
  const RecordsTab({super.key, required this.records});

  final List<WorkspaceRecord>? records;

  @override
  State<RecordsTab> createState() => _RecordsTabState();
}

class _RecordsTabState extends State<RecordsTab> {
  String? _type;

  @override
  Widget build(BuildContext context) {
    final records = widget.records;
    if (records == null) return const RestrictedState(what: 'Records');
    if (records.isEmpty) {
      return const EmptyCategory(
        title: 'No records',
        message: 'This member has no health records yet.',
      );
    }
    final palette = CalendarPalette.of(context);
    final types = {for (final r in records) r.recordType}.toList()..sort();
    final visible = [
      for (final r in records)
        if (_type == null || r.recordType == _type) r,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Health records',
          subtitle: 'History the member recorded, newest first.',
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            for (final type in [null, ...types])
              ChoiceChip(
                label: Text(type ?? 'All'),
                selected: _type == type,
                onSelected: (_) => setState(() => _type = type),
              ),
          ],
        ),
        _gap,
        for (final record in visible)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: WorkspaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${record.occurredOn} · ${record.recordType}',
                    style: TextStyle(color: palette.muted, fontSize: 12),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    record.title,
                    style: TextStyle(
                      color: palette.heading,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _summary(record.summary),
                    style: TextStyle(color: palette.text, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
        const InfoStrip(
          icon: Icons.info_outline_rounded,
          text:
              'What a member shares with their Family Head and what a doctor may read are separate permissions. This workspace shows only records authorised for you and this member.',
        ),
      ],
    );
  }
}

String _summary(String? summary) {
  final meta = RecordSummaryMeta.parse(summary);
  final parts = [
    if (meta.status.isNotEmpty) 'Status: ${meta.status}',
    if (meta.severity.isNotEmpty) 'Severity: ${meta.severity}',
    if (meta.doctor.isNotEmpty) 'Doctor: ${meta.doctor}',
    if (meta.cleanSummary.isNotEmpty) meta.cleanSummary,
  ];
  return parts.isEmpty ? 'No summary recorded.' : parts.join('\n');
}

class LabsTab extends StatelessWidget {
  const LabsTab({super.key, required this.reports});

  final List<LabReport>? reports;

  @override
  Widget build(BuildContext context) {
    final reports = this.reports;
    if (reports == null) return const RestrictedState(what: 'Lab reports');
    if (reports.isEmpty) {
      return const EmptyCategory(
        title: 'No lab reports',
        message: 'No reports uploaded yet.',
      );
    }
    final palette = CalendarPalette.of(context);
    Color tone(LabRange range) => switch (range) {
      LabRange.within => palette.success,
      LabRange.unavailable => palette.muted,
      _ => palette.warning,
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Lab results',
          subtitle: 'Uploaded reports with the values the member confirmed.',
        ),
        _gap,
        for (final (index, report) in reports.indexed)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: WorkspaceCard(
              padding: EdgeInsets.zero,
              child: Theme(
                data: Theme.of(
                  context,
                ).copyWith(dividerColor: Colors.transparent),
                child: ExpansionTile(
                  initiallyExpanded: index == 0,
                  leading: Icon(
                    Icons.description_outlined,
                    color: palette.primary,
                  ),
                  title: Text(
                    report.fileName,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    report.collectedAt == null
                        ? 'Collection date not recorded'
                        : 'Collected ${formatDay(report.collectedAt!)}',
                  ),
                  childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                  expandedCrossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (report.values.isEmpty)
                      Text(
                        'No values confirmed by the member yet.',
                        style: TextStyle(color: palette.muted),
                      ),
                    for (final value in report.values) ...[
                      Divider(color: palette.border, height: 16),
                      Text(
                        value.analyte,
                        style: TextStyle(
                          color: palette.heading,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        value.valueLabel,
                        style: TextStyle(color: palette.text),
                      ),
                      Text(
                        'Printed range: ${value.referenceLabel}',
                        style: TextStyle(color: palette.muted, fontSize: 12),
                      ),
                      const SizedBox(height: 6),
                      AccessPill(
                        label: value.range.label,
                        color: tone(value.range),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        const InfoStrip(
          text:
              'Range status is calculated from the printed reference interval. It is not a diagnosis; clinical interpretation remains with you.',
        ),
      ],
    );
  }
}

class VitalsTab extends StatefulWidget {
  const VitalsTab({super.key, required this.vitals});

  final List<VitalReading>? vitals;

  @override
  State<VitalsTab> createState() => _VitalsTabState();
}

class _VitalsTabState extends State<VitalsTab> {
  static const _shown = 6;
  String? _selected;
  bool _showAll = false;

  @override
  Widget build(BuildContext context) {
    final vitals = widget.vitals;
    if (vitals == null) return const RestrictedState(what: 'Vitals');
    final groups = groupVitals(vitals);
    if (groups.isEmpty) {
      return const EmptyCategory(
        title: 'No vitals',
        message: 'No readings recorded yet.',
      );
    }
    final palette = CalendarPalette.of(context);
    final series = groups.firstWhere(
      (g) => g.key == _selected,
      orElse: () => groups.first,
    );
    final count = series.readings.length;
    final readings = _showAll ? series.readings : series.readings.take(_shown);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Vitals & trends',
          subtitle:
              'Readings the member recorded, grouped by measurement and unit.',
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final group in groups)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text('${group.label} · ${group.latest.valueLabel}'),
                    selected: group.key == series.key,
                    onSelected: (_) => setState(() {
                      _selected = group.key;
                      _showAll = false;
                    }),
                  ),
                ),
            ],
          ),
        ),
        _gap,
        WorkspaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                count > 1 ? '${series.label} trend' : series.label,
                style: TextStyle(
                  color: palette.heading,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                '$count reading${count == 1 ? '' : 's'} · Unit: ${series.unit}',
                style: TextStyle(color: palette.muted, fontSize: 12),
              ),
              const SizedBox(height: 10),
              if (count > 1)
                VitalTrendChart(series: series)
              else
                Text(
                  'One reading recorded. A trend needs at least two readings of the same measurement and unit.',
                  style: TextStyle(color: palette.muted, fontSize: 13),
                ),
              const SizedBox(height: 6),
              for (final reading in readings) ...[
                Divider(color: palette.border, height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        formatMoment(reading.measuredAt),
                        style: TextStyle(color: palette.muted, fontSize: 13),
                      ),
                    ),
                    Text(
                      reading.valueLabel,
                      style: TextStyle(
                        color: palette.text,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
              if (count > _shown)
                TextButton(
                  onPressed: () => setState(() => _showAll = !_showAll),
                  child: Text(
                    _showAll
                        ? 'Show fewer readings'
                        : 'Show all $count readings',
                  ),
                ),
            ],
          ),
        ),
        _gap,
        const InfoStrip(
          icon: Icons.info_outline_rounded,
          text:
              'Values are shown as recorded; nothing is inferred or judged. A systolic value on its own is not a complete blood-pressure reading.',
        ),
      ],
    );
  }
}

class VisitsTab extends StatelessWidget {
  const VisitsTab({super.key, required this.workspace});

  final MemberWorkspace workspace;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final now = DateTime.now();

    List<Widget> group(String title, List<WorkspaceVisit> visits) => [
      if (visits.isNotEmpty) ...[
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Semantics(
            header: true,
            child: Text(
              title.toUpperCase(),
              style: TextStyle(
                color: palette.muted,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.1,
              ),
            ),
          ),
        ),
        for (final visit in visits)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: WorkspaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    formatMoment(visit.startsAt),
                    style: TextStyle(
                      color: palette.heading,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    visit.reason,
                    style: TextStyle(color: palette.muted, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  AccessPill(
                    label: visit.status.friendlyLabel,
                    color: palette.tone(visit.status),
                  ),
                ],
              ),
            ),
          ),
      ],
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Visits with you',
          subtitle: 'Appointments between you and this member.',
        ),
        _gap,
        if (workspace.visits.isEmpty)
          const EmptyCategory(
            title: 'No visits yet',
            message: 'Appointments this member books with you appear here.',
          ),
        ...group('Upcoming', workspace.upcomingVisits(now)),
        ...group('Past', workspace.pastVisits(now)),
        Text(
          "A booked visit does not open the member's records by itself. Access follows the time-bound visit grant and the member's consent.",
          style: TextStyle(color: palette.muted, fontSize: 12),
        ),
      ],
    );
  }
}

class NotesTab extends StatelessWidget {
  const NotesTab({
    super.key,
    required this.workspace,
    required this.controller,
    required this.amending,
    required this.saving,
    required this.onSave,
    required this.onAmend,
    required this.onCancelAmend,
  });

  static const maxLength = 4000;

  final MemberWorkspace workspace;
  final TextEditingController controller;
  final bool amending;
  final bool saving;
  final VoidCallback onSave;
  final ValueChanged<ClinicalNote> onAmend;
  final VoidCallback onCancelAmend;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final notes = workspace.notes;
    final canWrite = workspace.clinicalAccess;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Doctor-only clinical notes',
          subtitle:
              'Never shown to the patient or the family. Amendments keep every earlier version.',
        ),
        _gap,
        if (canWrite)
          WorkspaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  key: const ValueKey('note-input'),
                  controller: controller,
                  maxLength: maxLength,
                  minLines: 4,
                  maxLines: 8,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    labelText: amending
                        ? 'Amendment (the original note is kept)'
                        : 'New visit note',
                    alignLabelWithHint: true,
                    hintText:
                        'Document relevant observations and decision rationale…',
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (amending) ...[
                      Expanded(
                        child: OutlinedButton(
                          onPressed: saving ? null : onCancelAmend,
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Expanded(
                      child: ListenableBuilder(
                        listenable: controller,
                        builder: (_, _) => FilledButton(
                          key: const ValueKey('note-save'),
                          onPressed: saving || controller.text.trim().isEmpty
                              ? null
                              : onSave,
                          child: Text(
                            saving
                                ? 'Saving…'
                                : amending
                                ? 'Save amendment'
                                : 'Save note',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          )
        else
          const InfoStrip(
            icon: Icons.lock_outline_rounded,
            text:
                'Notes can be added or amended only during an active visit or shared case for this member. Your earlier notes stay readable below.',
          ),
        const SizedBox(height: 16),
        SectionHeading(
          title: 'Note history',
          subtitle:
              '${notes.length} ${notes.length == 1 ? 'entry' : 'entries'}',
        ),
        const SizedBox(height: 8),
        if (notes.isEmpty)
          const EmptyCategory(
            title: 'No notes',
            message:
                'Your notes about this member appear here. They are never shown to the family.',
          ),
        for (final note in notes)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: WorkspaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              note.createdAt == null
                                  ? 'Date not recorded'
                                  : formatMoment(note.createdAt!),
                              style: TextStyle(
                                color: palette.heading,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${note.versionLabel} · Doctor-only',
                              style: TextStyle(
                                color: palette.muted,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (canWrite)
                        TextButton.icon(
                          key: ValueKey('amend-${note.id}'),
                          onPressed: saving ? null : () => onAmend(note),
                          icon: const Icon(Icons.edit_outlined, size: 16),
                          label: const Text('Amend'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(note.content, style: TextStyle(color: palette.text)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
