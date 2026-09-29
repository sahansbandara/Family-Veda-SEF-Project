// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family Head dashboard for Flutter, following Family_Veda_Family_Head_Mockup:
// summary + next action only. Data: GET /dashboard/family (role == Head).
// Privacy: the backend already filters private adult activity; this widget only
// renders what it is given and never asks for more.
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:family_veda/theme/glass.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class HeadDashboardSection extends StatelessWidget {
  const HeadDashboardSection({
    super.key,
    required this.dashboard,
    required this.onNavigate,
  });

  final FamilyDashboard dashboard;

  /// Route push, e.g. `(path) => context.push(path)`. Injected so the widget
  /// is testable without a router.
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final next = dashboard.nextAppointment;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Hero(dashboard: dashboard, onNavigate: onNavigate),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.6,
          children: [
            _Metric(
              label: 'Family members',
              value: '${dashboard.memberCount}',
              note:
                  '${dashboard.minorCount} minor${dashboard.minorCount == 1 ? '' : 's'}',
            ),
            _Metric(
              label: 'Next shared appointment',
              value: next == null
                  ? 'None'
                  : DateFormat('dd MMM').format(next.startsAt),
              note: next == null
                  ? 'Book when needed'
                  : DateFormat('h:mm a').format(next.startsAt),
            ),
            _Metric(
              label: 'Open family cases',
              value: '${dashboard.openCases}',
              note: dashboard.openCases > 0 ? 'Doctor review' : 'All clear',
            ),
            _Metric(
              label: 'Membership requests',
              value: '${dashboard.pendingJoinRequests}',
              note: dashboard.pendingJoinRequests > 0
                  ? 'Needs action'
                  : 'None pending',
            ),
          ],
        ),
        const SizedBox(height: 16),
        _Heading('Needs attention'),
        ..._attentionItems(),
        const SizedBox(height: 16),
        _Heading('My Family Doctor'),
        _DoctorCard(dashboard: dashboard, onNavigate: onNavigate),
        const SizedBox(height: 16),
        _Heading('Members'),
        for (final member in dashboard.members) _MemberRow(member: member),
        _LinkRow(label: 'Manage family', onTap: () => onNavigate('/members')),
        const SizedBox(height: 16),
        _Heading('Quick actions'),
        _QuickActions(onNavigate: onNavigate),
        const SizedBox(height: 16),
        _Heading('Recent shared activity'),
        if (dashboard.activity.isEmpty)
          const _Muted('Activity for you and your minors will appear here.')
        else
          for (final entry in dashboard.activity) _ActivityRow(entry: entry),
      ],
    );
  }

  List<Widget> _attentionItems() {
    final items = <Widget>[
      if (dashboard.pendingJoinRequests > 0)
        _AttentionCard(
          title:
              '${dashboard.pendingJoinRequests} join request${dashboard.pendingJoinRequests == 1 ? '' : 's'}',
          body: 'Review adults requesting to join.',
          action: 'Review',
          onTap: () => onNavigate('/join-requests'),
        ),
      if (dashboard.approvedGuidanceCount > 0)
        _AttentionCard(
          title: 'Guidance available',
          body: 'Doctor-approved guidance is ready to read.',
          action: 'Open',
          onTap: () => onNavigate('/cases'),
        ),
      if (dashboard.unreadNotifications > 0)
        _AttentionCard(
          title:
              '${dashboard.unreadNotifications} unread notification${dashboard.unreadNotifications == 1 ? '' : 's'}',
          body: 'Updates about your family.',
          action: 'Open',
          onTap: () => onNavigate('/notifications'),
        ),
    ];
    return items.isEmpty
        ? [const _Muted('Nothing needs your attention right now.')]
        : items;
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.dashboard, required this.onNavigate});

  final FamilyDashboard dashboard;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GlassCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'FAMILY HEAD WORKSPACE',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  dashboard.familyName ?? 'Your family',
                  style: theme.textTheme.titleLarge,
                ),
                if (dashboard.familyCode != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Family Code ${dashboard.familyCode}',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            tooltip: '${dashboard.unreadNotifications} unread notifications',
            onPressed: () => onNavigate('/notifications'),
            icon: Badge(
              isLabelVisible: dashboard.unreadNotifications > 0,
              label: Text('${dashboard.unreadNotifications}'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value, required this.note});

  final String label;
  final String value;
  final String note;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GlassCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(value, style: theme.textTheme.headlineSmall),
          Text(
            note,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  const _DoctorCard({required this.dashboard, required this.onNavigate});

  final FamilyDashboard dashboard;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final doctor = dashboard.familyDoctor;
    if (doctor == null) {
      return GlassCard(
        onTap: () => onNavigate('/my-doctor'),
        child: const Text(
          'No family doctor yet. Search the directory and send a request.',
        ),
      );
    }
    final details = [
      doctor.specialty,
      doctor.city,
      doctor.languages,
    ].whereType<String>().join(' · ');
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(doctor.displayName, style: theme.textTheme.titleMedium),
          if (details.isNotEmpty)
            Text(details, style: theme.textTheme.bodySmall),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: [
              FilledButton(
                onPressed: () => onNavigate('/appointments/book'),
                child: const Text('Book appointment'),
              ),
              OutlinedButton(
                onPressed: () => onNavigate('/my-doctor'),
                child: const Text('Manage'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MemberRow extends StatelessWidget {
  const _MemberRow({required this.member});

  final DashboardMember member;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(member.displayName, style: theme.textTheme.titleSmall),
                  Text(member.summary, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
            Chip(
              label: Text(member.roleLabel),
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.onNavigate});

  final ValueChanged<String> onNavigate;

  static const _actions = <(String, String, IconData)>[
    ('Add minor', '/members', Icons.child_care_outlined),
    ('Invite adult', '/members', Icons.person_add_alt_outlined),
    ('Upload report', '/lab-upload', Icons.upload_file_outlined),
    ('Report symptoms', '/complaints/new', Icons.healing_outlined),
    ('Book appointment', '/appointments/book', Icons.event_available_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (label, path, icon) in _actions)
          ActionChip(
            avatar: Icon(icon, size: 18),
            label: Text(label),
            onPressed: () => onNavigate(path),
          ),
      ],
    );
  }
}

class _AttentionCard extends StatelessWidget {
  const _AttentionCard({
    required this.title,
    required this.body,
    required this.action,
    required this.onTap,
  });

  final String title;
  final String body;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        onTap: onTap,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleSmall),
                  Text(body, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
            Text(
              action,
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({required this.entry});

  final DashboardActivity entry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final when = entry.occurredAt == null
        ? null
        : DateFormat('dd MMM').format(entry.occurredAt!.toLocal());
    final meta = [entry.subject, when].whereType<String>().join(' · ');
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: Icon(Icons.circle, size: 10, color: theme.colorScheme.primary),
      title: Text(entry.title),
      subtitle: meta.isEmpty ? null : Text(meta),
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _Muted extends StatelessWidget {
  const _Muted(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: Theme.of(
      context,
    ).textTheme.bodySmall?.copyWith(color: context.glass.faint),
  );
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerLeft,
    child: TextButton(onPressed: onTap, child: Text(label)),
  );
}
