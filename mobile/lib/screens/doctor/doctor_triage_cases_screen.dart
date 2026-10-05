// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor Triage Cases: the work queue (find, claim, open). Same endpoints, statuses and actions
// as the web queue (web/src/pages/doctor/CasesPage.tsx). The clinical decision stays on the
// Approval Desk.
import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:family_veda/providers/doctor_cases_provider.dart';
import 'package:family_veda/services/api/doctor_cases_api.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/triage_queue_parts.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _tabLabels = {
  QueueTab.available: 'Available',
  QueueTab.mine: 'My Cases',
  QueueTab.completed: 'Completed',
  QueueTab.emergency: 'Emergency',
};

const _emptyCopy = {
  QueueTab.available: 'No cases are waiting to be claimed right now.',
  QueueTab.mine: 'You have no active cases. Claim one from Available.',
  QueueTab.completed:
      'Cases you have decided appear here while your access remains active.',
  QueueTab.emergency: 'There are no emergency referrals.',
};

class DoctorTriageCasesScreen extends ConsumerStatefulWidget {
  const DoctorTriageCasesScreen({super.key});

  @override
  ConsumerState<DoctorTriageCasesScreen> createState() =>
      _DoctorTriageCasesScreenState();
}

class _DoctorTriageCasesScreenState
    extends ConsumerState<DoctorTriageCasesScreen> {
  QueueTab _tab = QueueTab.available;
  QueueSort _sort = QueueSort.oldest;
  String? _priority;
  String _search = '';
  String? _claimingId;

  Future<void> _refresh() async {
    ref.invalidate(doctorQueueProvider);
    try {
      await ref.read(doctorQueueProvider.future);
    } catch (_) {
      // The error view is rendered by the provider state.
    }
  }

  Future<void> _claim(DoctorQueueCase item) async {
    if (_claimingId != null) return;
    setState(() => _claimingId = item.id);
    String message;
    var claimed = false;
    try {
      await ref.read(doctorCasesApiProvider).claimCase(item.id);
      claimed = true;
      message = item.isEmergencyReferral
          ? 'Emergency referral ${item.reference} acknowledged. It is now assigned to you and stays under Emergency.'
          : 'Case ${item.reference} is now assigned to you. It moved to My Cases, where the patient name is shown.';
    } catch (error) {
      message = claimErrorMessage(error);
    }
    // Always re-read, so the queue shows server truth rather than an assumed transition.
    await _refresh();
    if (!mounted) return;
    setState(() {
      _claimingId = null;
      // Take the doctor to where the case now lives.
      if (claimed && !item.isEmergencyReferral) _tab = QueueTab.mine;
    });
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _open(DoctorQueueCase item) async {
    final act = await showQueueCaseSheet(context, item);
    if (!mounted) return;
    if (act == true) {
      await _claim(item);
    } else if (act is String) {
      // A follow-up was saved inside the sheet; re-read so the queue shows server truth.
      await _refresh();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(act)));
    }
  }

  Future<void> _openFilters() async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) => StatefulBuilder(
        builder: (context, setSheet) {
          void update(VoidCallback change) {
            setState(change);
            setSheet(() {});
          }

          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Priority',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final value in [
                      null,
                      'Routine',
                      'Priority',
                      'Emergency',
                    ])
                      ChoiceChip(
                        label: Text(value ?? 'All'),
                        selected: _priority == value,
                        onSelected: (_) => update(() => _priority = value),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Text('Sort', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final (value, label) in [
                      (QueueSort.oldest, 'Oldest first'),
                      (QueueSort.newest, 'Newest first'),
                      (QueueSort.priority, 'Priority first'),
                    ])
                      ChoiceChip(
                        label: Text(label),
                        selected: _sort == value,
                        onSelected: (_) => update(() => _sort = value),
                      ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final queue = ref.watch(doctorQueueProvider);
    final palette = CalendarPalette.of(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Triage Cases'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Filter and sort',
            icon: const Icon(Icons.tune_rounded),
            onPressed: _openFilters,
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
          ),
        ],
      ),
      body: SafeArea(
        child: queue.when(
          skipLoadingOnRefresh: true,
          loading: () => const LoadingStateView(label: 'Loading triage cases'),
          error: (_, _) => ErrorRetryView(
            message: 'The triage case queue could not be loaded.',
            onRetry: () => ref.invalidate(doctorQueueProvider),
          ),
          data: (cases) {
            final counts = QueueCounts(cases);
            final visible = filterAndSortQueue(
              cases,
              tab: _tab,
              priority: _priority,
              search: _search,
              sort: _sort,
            );
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                children: [
                  Text(
                    'Manage incoming requests and cases assigned to you.',
                    style: TextStyle(color: palette.muted, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  _Summary(
                    counts: counts,
                    onOpen: (tab) => setState(() => _tab = tab),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    decoration: const InputDecoration(
                      hintText: 'Search case reference',
                      prefixIcon: Icon(Icons.search_rounded),
                      isDense: true,
                    ),
                    textInputAction: TextInputAction.search,
                    onChanged: (value) => setState(() => _search = value),
                  ),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final tab in QueueTab.values)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              key: ValueKey('queue-tab-${tab.name}'),
                              label: Text(
                                '${_tabLabels[tab]} (${counts.of(tab)})',
                              ),
                              selected: _tab == tab,
                              onSelected: (_) => setState(() => _tab = tab),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  AnimatedSwitcher(
                    duration: MediaQuery.disableAnimationsOf(context)
                        ? Duration.zero
                        : const Duration(milliseconds: 180),
                    child: Column(
                      key: ValueKey(_tab),
                      children: [
                        if (visible.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 32),
                            child: EmptyStateView(
                              title: 'No matching cases',
                              message: counts.of(_tab) > 0
                                  ? 'No cases match the current search or filters.'
                                  : _emptyCopy[_tab]!,
                            ),
                          ),
                        for (final item in visible)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: QueueCaseCard(
                              item: item,
                              busy: _claimingId == item.id,
                              actionsLocked: _claimingId != null,
                              onOpen: () => _open(item),
                              onClaim: () => _claim(item),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.counts, required this.onOpen});

  final QueueCounts counts;
  final ValueChanged<QueueTab> onOpen;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final cards = [
      (
        'Available Cases',
        counts.available,
        palette.primary,
        QueueTab.available,
      ),
      ('My Active Cases', counts.mine, palette.primary, QueueTab.mine),
      (
        'Awaiting Review',
        counts.awaitingReview,
        palette.warning,
        QueueTab.mine,
      ),
      (
        'Emergency Referrals',
        counts.emergency,
        palette.danger,
        QueueTab.emergency,
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 720 ? 4 : 2;
        final width = (constraints.maxWidth - (columns - 1) * 10) / columns;
        return Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final (label, value, color, tab) in cards)
              SizedBox(
                width: width,
                child: Material(
                  color: palette.surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: palette.border),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => onOpen(tab),
                    child: Semantics(
                      label: '$label: $value',
                      excludeSemantics: true,
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              value.toString().padLeft(2, '0'),
                              style: TextStyle(
                                color: color,
                                fontSize: 26,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              label,
                              style: TextStyle(
                                color: palette.muted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
