// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor My Families: assigned families and family-doctor requests. Same endpoints and rules as
// web/src/pages/doctor/DoctorFamiliesPage.tsx. No clinical member data is shown here: an
// assignment is eligibility only; clinical reads need a member grant and consent.
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/providers/doctor_families_provider.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Tab { assigned, requests }

enum _Sort { next, name }

class DoctorFamiliesScreen extends ConsumerStatefulWidget {
  const DoctorFamiliesScreen({super.key});

  @override
  ConsumerState<DoctorFamiliesScreen> createState() =>
      _DoctorFamiliesScreenState();
}

class _DoctorFamiliesScreenState extends ConsumerState<DoctorFamiliesScreen> {
  _Tab _tab = _Tab.assigned;
  _Sort _sort = _Sort.next;
  String _search = '';
  String? _respondingId;

  Future<void> _refresh() async {
    ref.invalidate(doctorFamiliesOverviewProvider);
    try {
      await ref.read(doctorFamiliesOverviewProvider.future);
    } catch (_) {
      // The error view is rendered by the provider state.
    }
  }

  Future<void> _respond(FamilyDoctorRequest request, bool accept) async {
    if (_respondingId != null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          accept ? 'Accept family request?' : 'Decline family request?',
        ),
        content: Text(
          accept
              ? "${request.familyName} will become one of your long-term families. Accepting does not grant access to any member's clinical records."
              : '${request.familyName} will be told you declined. No assignment is created.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(accept ? 'Accept request' : 'Decline request'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _respondingId = request.id);
    String message;
    try {
      await ref
          .read(doctorFamiliesApiProvider)
          .respondToRequest(request.id, accept: accept);
      message = accept
          ? "You are now the family doctor for ${request.familyName}. This does not open any member's clinical records."
          : 'Request from ${request.familyName} declined.';
    } catch (_) {
      message =
          'Your answer could not be saved. Nothing was changed. Try again.';
    }
    // Always re-read, so the lists show server truth rather than an assumed outcome.
    await _refresh();
    if (!mounted) return;
    setState(() => _respondingId = null);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  List<DoctorFamilyRow> _visible(List<DoctorFamilyRow> families) {
    final term = _search.trim().toLowerCase();
    final rows = [
      for (final family in families)
        if (term.isEmpty || family.familyName.toLowerCase().contains(term))
          family,
    ];
    final far = DateTime(9999);
    rows.sort(
      (a, b) => _sort == _Sort.name
          ? a.familyName.compareTo(b.familyName)
          : (a.nextAppointment ?? far).compareTo(b.nextAppointment ?? far),
    );
    return rows;
  }

  @override
  Widget build(BuildContext context) {
    final overview = ref.watch(doctorFamiliesOverviewProvider);
    final palette = CalendarPalette.of(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('My Families'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
          ),
        ],
      ),
      body: SafeArea(
        child: overview.when(
          skipLoadingOnRefresh: true,
          loading: () => const LoadingStateView(label: 'Loading your families'),
          error: (_, _) => ErrorRetryView(
            message: 'Your families could not be loaded.',
            onRetry: () => ref.invalidate(doctorFamiliesOverviewProvider),
          ),
          data: (data) {
            final visible = _visible(data.families);
            final upcoming = data.upcoming;
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                children: [
                  Text(
                    'Your long-term care relationships and incoming family-doctor requests.',
                    style: TextStyle(color: palette.muted, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  _Summary(
                    families: data.families.length,
                    requests: data.requests.length,
                    next: upcoming.isEmpty ? null : upcoming.first,
                    upcomingFamilies: upcoming.length,
                  ),
                  const SizedBox(height: 12),
                  SegmentedButton<_Tab>(
                    showSelectedIcon: false,
                    segments: [
                      ButtonSegment(
                        value: _Tab.assigned,
                        label: Text('Assigned (${data.families.length})'),
                      ),
                      ButtonSegment(
                        value: _Tab.requests,
                        label: Text('Requests (${data.requests.length})'),
                      ),
                    ],
                    selected: {_tab},
                    onSelectionChanged: (value) =>
                        setState(() => _tab = value.first),
                  ),
                  const SizedBox(height: 12),
                  AnimatedSwitcher(
                    duration: MediaQuery.disableAnimationsOf(context)
                        ? Duration.zero
                        : const Duration(milliseconds: 180),
                    child: _tab == _Tab.assigned
                        ? _assigned(data, visible)
                        : _requests(data.requests),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _assigned(DoctorFamiliesOverview data, List<DoctorFamilyRow> visible) {
    return Column(
      key: const ValueKey('assigned'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          decoration: const InputDecoration(
            hintText: 'Search assigned families',
            prefixIcon: Icon(Icons.search_rounded),
            isDense: true,
          ),
          textInputAction: TextInputAction.search,
          onChanged: (value) => setState(() => _search = value),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: [
            for (final (value, label) in [
              (_Sort.next, 'Next appointment'),
              (_Sort.name, 'Family name'),
            ])
              ChoiceChip(
                label: Text(label),
                selected: _sort == value,
                onSelected: (_) => setState(() => _sort = value),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (visible.isEmpty)
          EmptyCategory(
            title: data.families.isEmpty
                ? 'No assigned families yet'
                : 'No matching families',
            message: data.families.isEmpty
                ? 'Families that choose you as their long-term doctor will appear here after you accept their request.'
                : 'Change the search to see more families.',
          ),
        for (final family in visible)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _FamilyCard(
              family: family,
              onOpen: () => context.push('/families/${family.familyId}'),
            ),
          ),
        const InfoStrip(
          text:
              "Being a family's primary doctor does not automatically grant access to its members' private clinical information. Member records open only during a visit or a shared case, with the member's consent.",
        ),
      ],
    );
  }

  Widget _requests(List<FamilyDoctorRequest> requests) {
    return Column(
      key: const ValueKey('requests'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Awaiting your response',
          subtitle:
              'Accepting creates a long-term assignment, not clinical access.',
        ),
        const SizedBox(height: 12),
        if (requests.isEmpty)
          const EmptyCategory(
            title: 'No family requests',
            message:
                'Families that request you as their long-term doctor will appear here.',
          ),
        for (final request in requests)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _RequestCard(
              request: request,
              busy: _respondingId == request.id,
              locked: _respondingId != null,
              onAccept: () => _respond(request, true),
              onDecline: () => _respond(request, false),
            ),
          ),
      ],
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({
    required this.families,
    required this.requests,
    required this.next,
    required this.upcomingFamilies,
  });

  final int families;
  final int requests;
  final DateTime? next;
  final int upcomingFamilies;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    String two(int value) => value.toString().padLeft(2, '0');
    final cards = [
      ('Assigned households', two(families), palette.primary),
      ('New family requests', two(requests), palette.warning),
      (
        'Next appointment',
        next == null ? 'None' : formatDay(next!),
        palette.primary,
      ),
      ('Families with upcoming visits', two(upcomingFamilies), palette.success),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 720 ? 4 : 2;
        final width = (constraints.maxWidth - (columns - 1) * 10) / columns;
        return Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final (label, value, color) in cards)
              SizedBox(
                width: width,
                child: Semantics(
                  label: '$label: $value',
                  excludeSemantics: true,
                  // Uniform rounded border outside, accent stripe inside: a rounded border
                  // cannot mix colours.
                  child: Container(
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      color: palette.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: palette.border),
                    ),
                    foregroundDecoration: BoxDecoration(
                      border: Border(left: BorderSide(color: color, width: 3)),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          value,
                          style: TextStyle(
                            color: palette.heading,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          label,
                          style: TextStyle(color: palette.muted, fontSize: 12),
                        ),
                      ],
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

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: TextStyle(color: palette.muted, fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: palette.text,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FamilyCard extends StatelessWidget {
  const _FamilyCard({required this.family, required this.onOpen});

  final DoctorFamilyRow family;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final count = family.memberCount;
    return WorkspaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.groups_2_outlined, color: palette.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  family.title,
                  style: TextStyle(
                    color: palette.heading,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              AccessPill(label: 'Assigned', color: palette.success),
            ],
          ),
          const SizedBox(height: 6),
          _Fact(
            'Members',
            '$count linked ${count == 1 ? 'profile' : 'profiles'}',
          ),
          _Fact(
            'Last visit',
            family.lastVisit == null
                ? 'No visit yet'
                : formatDay(family.lastVisit!),
          ),
          _Fact(
            'Next appointment',
            family.nextAppointment == null
                ? 'No upcoming appointment'
                : formatMoment(family.nextAppointment!),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              key: ValueKey('open-family-${family.familyId}'),
              onPressed: onOpen,
              child: const Text('Open Family'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.request,
    required this.busy,
    required this.locked,
    required this.onAccept,
    required this.onDecline,
  });

  final FamilyDoctorRequest request;
  final bool busy;
  final bool locked;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final count = request.memberCount;
    final message = request.message?.trim() ?? '';
    return WorkspaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  request.familyName,
                  style: TextStyle(
                    color: palette.heading,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              AccessPill(label: 'Pending', color: palette.warning),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            [
              '$count household member${count == 1 ? '' : 's'}',
              if (request.createdAt != null)
                'Received ${formatMoment(request.createdAt!)}',
            ].join(' · '),
            style: TextStyle(color: palette.muted, fontSize: 13),
          ),
          if (message.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.only(left: 10),
              decoration: BoxDecoration(
                border: Border(
                  left: BorderSide(color: palette.primary, width: 2),
                ),
              ),
              child: Text('“$message”', style: TextStyle(color: palette.text)),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Profile-level request only. No member records or health information are included.',
            style: TextStyle(color: palette.muted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: locked ? null : onAccept,
                  child: Text(busy ? 'Saving…' : 'Accept'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: locked ? null : onDecline,
                  child: const Text('Decline'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
