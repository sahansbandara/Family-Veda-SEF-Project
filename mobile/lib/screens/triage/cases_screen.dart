import 'package:family_veda/screens/triage/case_status_screen.dart';
import 'package:family_veda/models/triage_case.dart';
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/cases_provider.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

enum _RequestFilter { all, inReview, guidanceReady }

enum _Tone { info, success, warning, danger, neutral }

const _needsInformation = {
  'LOW_CONFIDENCE',
  'REQUEST_INFORMATION',
  'REQUESTED_INFORMATION',
};
const _needsInPersonCare = {'ESCALATED', 'FAILED_SAFE'};

class CasesScreen extends ConsumerStatefulWidget {
  const CasesScreen({super.key});

  @override
  ConsumerState<CasesScreen> createState() => _CasesScreenState();
}

class _CasesScreenState extends ConsumerState<CasesScreen> {
  _RequestFilter _filter = _RequestFilter.all;

  Future<void> _callEmergency() async {
    final launched = await launchUrl(Uri(scheme: 'tel', path: '1990'));
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Call Suwa Seriya directly on 1990.')),
      );
    }
  }

  bool _matches(TriageCase item) => switch (_filter) {
    _RequestFilter.all => true,
    _RequestFilter.guidanceReady => item.hasApprovedGuidance,
    _RequestFilter.inReview =>
      !item.hasApprovedGuidance &&
          !{'REJECTED', 'WITHDRAWN', 'SUPERSEDED'}.contains(item.status) &&
          !_needsInPersonCare.contains(item.status),
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activeMemberId = ref.watch(activeMemberProvider);
    final memberName =
        ref
            .watch(membersProvider)
            .valueOrNull
            ?.where((member) => member.id == activeMemberId)
            .firstOrNull
            ?.displayName ??
        'Family member';

    return Scaffold(
      appBar: AppBar(title: const Text('Your requests')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/complaints/new'),
        icon: const Icon(Icons.add),
        label: const Text('New request'),
      ),
      body: SafeArea(
        child: ref
            .watch(memberCasesProvider)
            .when(
              loading: () => const LoadingStateView(label: 'Loading requests'),
              error: (_, _) => ErrorRetryView(
                onRetry: () => ref.invalidate(memberCasesProvider),
              ),
              data: (cases) {
                final visible = cases.where(_matches).toList();
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Track case progress and open approved guidance.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Chip(
                          label: Text(
                            '${cases.length} request${cases.length == 1 ? '' : 's'}',
                          ),
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (cases.isEmpty)
                      EmptyStateView(
                        title: 'No symptom requests yet',
                        message:
                            'Submit symptoms when you need a doctor to review them.',
                        action: ElevatedButton(
                          onPressed: () => context.push('/complaints/new'),
                          child: const Text('New symptom request'),
                        ),
                      )
                    else ...[
                      Wrap(
                        spacing: 8,
                        children: [
                          for (final (filter, label) in const [
                            (_RequestFilter.all, 'All'),
                            (_RequestFilter.inReview, 'In review'),
                            (_RequestFilter.guidanceReady, 'Guidance ready'),
                          ])
                            ChoiceChip(
                              label: Text(label),
                              selected: _filter == filter,
                              onSelected: (_) =>
                                  setState(() => _filter = filter),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (visible.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Text(
                            'No requests match this filter.',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      for (final item in visible)
                        _RequestCard(
                          item: item,
                          memberName: memberName,
                          onTap: () => showCaseProgressSheet(context, item.id),
                        ),
                    ],
                    const SizedBox(height: 16),
                    _UrgentHelpCard(onCall: _callEmergency),
                  ],
                );
              },
            ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.item,
    required this.memberName,
    required this.onTap,
  });

  final TriageCase item;
  final String memberName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final reference = item.reference;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(child: Text(_initials(memberName))),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(memberName, style: theme.textTheme.titleSmall),
                    const SizedBox(height: 2),
                    Text(
                      'Case $reference · ${DateFormat.yMMMd().format(item.submittedAt)}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _StatusBadge(status: item.status),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (background, foreground) = switch (_statusTone(status)) {
      _Tone.success => (scheme.tertiaryContainer, scheme.onTertiaryContainer),
      _Tone.danger => (scheme.errorContainer, scheme.onErrorContainer),
      _Tone.warning => (scheme.secondaryContainer, scheme.onSecondaryContainer),
      _Tone.neutral => (scheme.surfaceContainerHighest, scheme.onSurface),
      _Tone.info => (scheme.primaryContainer, scheme.onPrimaryContainer),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        caseStatusLabel(status),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: foreground,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _UrgentHelpCard extends StatelessWidget {
  const _UrgentHelpCard({required this.onCall});

  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.errorContainer,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.error.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.phone_in_talk_outlined, color: scheme.error),
              const SizedBox(width: 8),
              Text(
                'Need urgent help?',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: scheme.onErrorContainer,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Do not wait for an AI or doctor response. Contact emergency services or visit the nearest emergency unit.',
            style: TextStyle(color: scheme.onErrorContainer),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: scheme.error,
              foregroundColor: scheme.onError,
              minimumSize: const Size.fromHeight(48),
            ),
            onPressed: onCall,
            icon: const Icon(Icons.phone),
            label: const Text('Call 1990'),
          ),
        ],
      ),
    );
  }
}

/// Family-facing wording for a persisted case status — never internal agent state.
String caseStatusLabel(String status) => switch (status) {
  'APPROVED' ||
  'APPROVED_REVISED' ||
  'DELIVERED' ||
  'CLOSED' => 'Guidance available',
  'PENDING_DOCTOR_REVIEW' => 'Waiting for doctor review',
  'CLAIMED' => 'Doctor review in progress',
  'REJECTED' => 'Review closed',
  'WITHDRAWN' => 'Withdrawn',
  'SUPERSEDED' => 'Replaced by edited request',
  _ when _needsInformation.contains(status) => 'More information needed',
  _ when _needsInPersonCare.contains(status) => 'In-person care needed',
  _ => 'Being reviewed',
};

_Tone _statusTone(String status) => switch (status) {
  'APPROVED' || 'APPROVED_REVISED' || 'DELIVERED' || 'CLOSED' => _Tone.success,
  'REJECTED' || 'WITHDRAWN' || 'SUPERSEDED' => _Tone.neutral,
  _ when _needsInformation.contains(status) => _Tone.warning,
  _ when _needsInPersonCare.contains(status) => _Tone.danger,
  _ => _Tone.info,
};

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
  if (parts.isEmpty) return 'F';
  final first = parts.first[0];
  return (parts.length > 1 ? '$first${parts.last[0]}' : first).toUpperCase();
}
