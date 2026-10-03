// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Building blocks of the doctor Triage Cases queue: tone chips, the case card and the detail sheet.
import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:family_veda/providers/doctor_cases_provider.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

String formatSubmitted(DateTime value) =>
    DateFormat('MMM d, h:mm a').format(value.toLocal());

Color queueToneColor(CalendarPalette palette, QueueTone tone) => switch (tone) {
  QueueTone.primary => palette.primary,
  QueueTone.warning => palette.warning,
  QueueTone.success => palette.success,
  QueueTone.danger => palette.danger,
  QueueTone.muted => palette.muted,
};

class ToneChip extends StatelessWidget {
  const ToneChip({
    super.key,
    required this.label,
    required this.tone,
    this.icon,
  });

  final String label;
  final QueueTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final color = queueToneColor(CalendarPalette.of(context), tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.32)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
          ],
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CaseTags extends StatelessWidget {
  const CaseTags({super.key, required this.item, this.longPriority = false});

  final DoctorQueueCase item;
  final bool longPriority;

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 8,
    runSpacing: 6,
    children: [
      ToneChip(
        label: longPriority ? '${item.priority} priority' : item.priority,
        tone: item.priorityTone,
      ),
      ToneChip(
        label: item.statusLabel,
        tone: item.statusTone,
        icon: item.isEmergencyReferral ? Icons.warning_amber_rounded : null,
      ),
    ],
  );
}

class QueueCaseCard extends StatelessWidget {
  const QueueCaseCard({
    super.key,
    required this.item,
    required this.busy,
    required this.actionsLocked,
    required this.onOpen,
    required this.onClaim,
  });

  final DoctorQueueCase item;
  final bool busy;
  final bool actionsLocked;
  final VoidCallback onOpen;
  final VoidCallback onClaim;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final hasAction = item.action != QueueActionKind.none;
    return Material(
      color: palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: item.isEmergencyReferral
              ? palette.danger.withValues(alpha: 0.55)
              : palette.border,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        key: ValueKey('queue-case-${item.id}'),
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Case ${item.reference}',
                style: TextStyle(
                  color: palette.heading,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Submitted ${formatSubmitted(item.createdAt)}'
                '${item.claimable ? ' · Shared review pool' : ''}',
                style: TextStyle(color: palette.muted, fontSize: 13),
              ),
              const SizedBox(height: 10),
              CaseTags(item: item),
              const SizedBox(height: 10),
              Text(
                item.mine
                    ? 'Open the case to see the submitted complaint.'
                    : 'Details available after authorized access.',
                style: TextStyle(color: palette.muted, fontSize: 13),
              ),
              if (hasAction) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    key: ValueKey('queue-action-${item.id}'),
                    style: item.action == QueueActionKind.acknowledge
                        ? FilledButton.styleFrom(
                            backgroundColor: palette.danger,
                          )
                        : null,
                    onPressed: actionsLocked ? null : onClaim,
                    child: Text(busy ? 'Working…' : item.actionLabel),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Opens the case detail sheet. Completes with true when the doctor chose the queue action.
Future<bool?> showQueueCaseSheet(BuildContext context, DoctorQueueCase item) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => QueueCaseSheet(item: item),
  );
}

class QueueCaseSheet extends ConsumerWidget {
  const QueueCaseSheet({super.key, required this.item});

  final DoctorQueueCase item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final palette = CalendarPalette.of(context);
    final heading = TextStyle(
      color: palette.heading,
      fontSize: 15,
      fontWeight: FontWeight.w700,
    );
    final body = TextStyle(color: palette.muted, fontSize: 14, height: 1.4);
    final hasAction = item.action != QueueActionKind.none;

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.9,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Case ${item.reference}',
                    style: TextStyle(
                      color: palette.heading,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'Submitted ${formatSubmitted(item.createdAt)}',
                    style: body,
                  ),
                  const SizedBox(height: 10),
                  CaseTags(item: item, longPriority: true),
                  if (item.isEmergencyReferral) ...[
                    const SizedBox(height: 14),
                    _Banner(
                      color: palette.danger,
                      icon: Icons.warning_amber_rounded,
                      text: item.priority == 'Emergency'
                          ? 'Emergency referral. The deterministic safety screen directed this patient to emergency care. No AI guidance was generated.'
                          : 'Escalated for urgent care. A doctor escalated this case to in-person urgent care.',
                    ),
                  ],
                  if (item.status == 'FailedSafe') ...[
                    const SizedBox(height: 14),
                    _Banner(
                      color: palette.warning,
                      icon: Icons.info_outline_rounded,
                      text:
                          'Processing stopped safely before any guidance was produced. This is not, by itself, an emergency referral.',
                    ),
                  ],
                  const SizedBox(height: 18),
                  Text('Patient context', style: heading),
                  const SizedBox(height: 4),
                  Text(
                    item.mine
                        ? 'Patient request. Identity is limited to what your case grant allows.'
                        : 'Patient request in the shared review pool. Identity is not shown before authorized access.',
                    style: body,
                  ),
                  const SizedBox(height: 18),
                  Text('Complaint', style: heading),
                  const SizedBox(height: 4),
                  if (item.mine)
                    _Complaint(caseId: item.id, body: body, palette: palette)
                  else
                    Text(
                      'Details available after authorized access.',
                      style: body,
                    ),
                  const SizedBox(height: 18),
                  Text('Workflow status', style: heading),
                  const SizedBox(height: 8),
                  for (final (label, state) in item.workflowSteps)
                    _Step(label: label, state: state, palette: palette),
                ],
              ),
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: palette.border)),
            ),
            child: hasAction
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FilledButton(
                        key: const ValueKey('queue-sheet-action'),
                        style: item.action == QueueActionKind.acknowledge
                            ? FilledButton.styleFrom(
                                backgroundColor: palette.danger,
                              )
                            : null,
                        onPressed: () => Navigator.of(context).pop(true),
                        child: Text(item.actionLabel),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item.action == QueueActionKind.claim
                            ? 'Claiming assigns the case to you. It does not approve anything.'
                            : 'Records that you have seen this referral. It does not change the referral.',
                        style: body.copyWith(fontSize: 12),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  )
                : Text(item.nextStepMessage, style: body),
          ),
        ],
      ),
    );
  }
}

class _Complaint extends ConsumerWidget {
  const _Complaint({
    required this.caseId,
    required this.body,
    required this.palette,
  });

  final String caseId;
  final TextStyle body;
  final CalendarPalette palette;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref
        .watch(submittedComplaintProvider(caseId))
        .when(
          loading: () => Text('Loading submitted details…', style: body),
          error: (_, _) =>
              Text('Details available after authorized access.', style: body),
          data: (complaint) {
            if (complaint == null) {
              return Text(
                'No symptom details were submitted with this request.',
                style: body,
              );
            }
            final days = complaint.durationDays;
            final rows = [
              (
                'Symptoms',
                complaint.symptoms.isEmpty
                    ? 'None recorded'
                    : complaint.symptoms.join(', '),
              ),
              ('Reported duration', '$days ${days == 1 ? 'day' : 'days'}'),
              ('Reported severity', '${complaint.severity} / 10'),
              if ((complaint.notes ?? '').isNotEmpty)
                ('Patient notes', complaint.notes!),
            ];
            return Column(
              children: [
                for (final (label, value) in rows)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: palette.surfaceSubtle,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: palette.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(label, style: body.copyWith(fontSize: 12)),
                        const SizedBox(height: 2),
                        Text(
                          value,
                          style: TextStyle(color: palette.text, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
              ],
            );
          },
        );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({required this.color, required this.icon, required this.text});

  final Color color;
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.withValues(alpha: 0.4)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: CalendarPalette.of(context).text,
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ),
      ],
    ),
  );
}

class _Step extends StatelessWidget {
  const _Step({
    required this.label,
    required this.state,
    required this.palette,
  });

  final String label;
  final QueueStepState state;
  final CalendarPalette palette;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (state) {
      QueueStepState.done => (Icons.check_circle_rounded, palette.success),
      QueueStepState.current => (
        Icons.radio_button_checked_rounded,
        palette.primary,
      ),
      QueueStepState.stopped => (
        Icons.pause_circle_filled_rounded,
        palette.warning,
      ),
      QueueStepState.upcoming => (
        Icons.radio_button_unchecked_rounded,
        palette.muted,
      ),
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: state == QueueStepState.upcoming
                    ? palette.muted
                    : palette.text,
                fontSize: 14,
                fontWeight: state == QueueStepState.current
                    ? FontWeight.w700
                    : FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
