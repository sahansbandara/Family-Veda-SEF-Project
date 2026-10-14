// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor → one assigned family: roster (names and roles only) with the real grant state per
// member. Same endpoint as web/src/pages/doctor/DoctorFamilyDetailPage.tsx.
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/providers/doctor_families_provider.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _AccessFilter {
  all('All members'),
  active('Active care grant'),
  restricted('Restricted');

  const _AccessFilter(this.label);
  final String label;
}

class DoctorFamilyDetailScreen extends ConsumerStatefulWidget {
  const DoctorFamilyDetailScreen({super.key, required this.familyId});

  final String familyId;

  @override
  ConsumerState<DoctorFamilyDetailScreen> createState() =>
      _DoctorFamilyDetailScreenState();
}

class _DoctorFamilyDetailScreenState
    extends ConsumerState<DoctorFamilyDetailScreen> {
  _AccessFilter _filter = _AccessFilter.all;

  Future<void> _refresh() async {
    ref.invalidate(doctorFamilyRosterProvider(widget.familyId));
    try {
      await ref.read(doctorFamilyRosterProvider(widget.familyId).future);
    } catch (_) {
      // The error view is rendered by the provider state.
    }
  }

  @override
  Widget build(BuildContext context) {
    final roster = ref.watch(doctorFamilyRosterProvider(widget.familyId));
    final palette = CalendarPalette.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(roster.valueOrNull?.familyName ?? 'Family')),
      body: SafeArea(
        child: roster.when(
          skipLoadingOnRefresh: true,
          loading: () => const LoadingStateView(label: 'Loading family'),
          error: (_, _) => ErrorRetryView(
            message:
                'This family could not be loaded. You may no longer be its family doctor.',
            onRetry: () =>
                ref.invalidate(doctorFamilyRosterProvider(widget.familyId)),
          ),
          data: (family) {
            final members = family.members;
            final withGrant = members.where((m) => m.clinicalAccess).length;
            // Filters only the roster the API already returned for this assigned family.
            final visible = [
              for (final member in members)
                if (_filter == _AccessFilter.all ||
                    (_filter == _AccessFilter.active) == member.clinicalAccess)
                  member,
            ];
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: [
                  Text(
                    '${members.length} member${members.length == 1 ? '' : 's'} · $withGrant with an active care grant',
                    style: TextStyle(color: palette.muted, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  const InfoStrip(
                    text:
                        "Assignment makes you eligible to care for this family; it is not blanket clinical access. Clinical details open only during a confirmed visit or a shared case, with the member's consent.",
                  ),
                  const SizedBox(height: 14),
                  const SectionHeading(
                    title: 'Household members',
                    subtitle: 'Select a member to open their care workspace.',
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final filter in _AccessFilter.values)
                        ChoiceChip(
                          label: Text(filter.label),
                          selected: _filter == filter,
                          onSelected: (_) => setState(() => _filter = filter),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (visible.isEmpty)
                    EmptyCategory(
                      title: 'No members in this filter',
                      message: members.isEmpty
                          ? 'This family has no members yet.'
                          : 'Choose another access status.',
                    ),
                  for (final member in visible)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _MemberCard(
                        member: member,
                        onOpen: () =>
                            context.push('/families/members/${member.id}'),
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

class _MemberCard extends StatelessWidget {
  const _MemberCard({required this.member, required this.onOpen});

  final RosterMember member;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final allowed = member.clinicalAccess;
    final tone = allowed ? palette.success : palette.muted;
    final action = allowed ? 'Open Member Workspace' : 'View Access Details';
    return WorkspaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InitialsAvatar(name: member.displayName),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.displayName,
                      style: TextStyle(
                        color: palette.heading,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      roleLabel(member.role),
                      style: TextStyle(color: palette.muted, fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    // Under the name, so a long label never squeezes it at large text sizes.
                    AccessPill(
                      label: allowed ? 'Active care grant' : 'Restricted',
                      color: tone,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                allowed
                    ? Icons.verified_user_outlined
                    : Icons.lock_outline_rounded,
                size: 16,
                color: tone,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  allowed
                      ? 'Clinical access active (visit or shared case).'
                      : 'Clinical data restricted until a confirmed visit or shared case.',
                  style: TextStyle(color: tone, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: allowed
                ? FilledButton(
                    key: ValueKey('open-member-${member.id}'),
                    onPressed: onOpen,
                    child: Text(action),
                  )
                : OutlinedButton(
                    key: ValueKey('open-member-${member.id}'),
                    onPressed: onOpen,
                    child: Text(action),
                  ),
          ),
        ],
      ),
    );
  }
}
