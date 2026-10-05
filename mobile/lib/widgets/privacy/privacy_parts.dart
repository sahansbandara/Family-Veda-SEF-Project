// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Presentational pieces for the Privacy & Access screen. Audit tiles show metadata only.
import 'package:family_veda/services/api/privacy_api.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:flutter/material.dart';

const _consentLabels = {
  'Conditions': 'Conditions',
  'VitalsSummary': 'Vitals summary',
  'HereditaryFlags': 'Family history (screening flags)',
};

String consentLabel(String category) => _consentLabels[category] ?? category;

String consentStatusLabel(String status) => switch (status) {
  'Granted' => 'Granted',
  'PendingReaffirmation' => 'Needs confirmation',
  'Revoked' => 'Revoked',
  _ => 'Not granted',
};

const _eventNames = {
  'ADULT_SHARED_REPORT_ACCESS': 'You viewed a report an adult shared with you',
  'FAMILY_MEMBERSHIP_CHANGED': 'Family membership changed',
  'CONSENT_CHANGED': 'Consent setting changed',
  'CONSENT_UPDATED': 'Consent setting changed',
  'RECORD_CREATED': 'Health record added',
  'LAB_REPORT_UPLOADED': 'Lab report uploaded',
  'CASE_GRANT_ISSUED': 'A doctor was given access to a case',
  'APPROVAL_DECISION': 'A doctor reviewed a case',
  'ACCOUNT_SUSPENDED': 'An account was deactivated',
  'ACCOUNT_REACTIVATED': 'An account was reactivated',
};

String describeAccessEvent(String eventType) {
  final known = _eventNames[eventType];
  if (known != null) return known;
  final words = eventType.toLowerCase().replaceAll('_', ' ');
  return words.isEmpty ? 'Activity' : words[0].toUpperCase() + words.substring(1);
}

enum ActivityKind {
  consent('Consent changes'),
  access('Record access'),
  doctor('Doctor activity'),
  family('Family & account');

  const ActivityKind(this.label);
  final String label;
}

ActivityKind activityKind(String eventType) {
  final type = eventType.toUpperCase();
  if (type.contains('CONSENT')) return ActivityKind.consent;
  if (type.contains('GRANT') || type.contains('APPROVAL') || type.contains('DOCTOR')) return ActivityKind.doctor;
  if (type.contains('ACCESS') || type.contains('VIEW') || type.contains('READ') || type.contains('SHARE')) return ActivityKind.access;
  return ActivityKind.family;
}

typedef Rule = (String, String);

const doctorAccessRules = <Rule>[
  ('Assignment is not record access', 'Your family doctor is assigned to the family, but assignment alone does not open anyone’s records.'),
  ('Per-case, time-bound grants', 'A doctor reads a member’s data only for a specific triage case, through a grant that expires automatically.'),
  ('Consent categories', 'Conditions, vitals summary and family history screening flags are each shared only when consent is granted.'),
];

const headPrivacyRules = <Rule>[
  ('Adult privacy stays independent', 'Adults control their own records and consent. You see only items an adult chose to share with you.'),
  ('You manage minors', 'As guardian, you set doctor consent for members under 18. Changes apply immediately.'),
  ('Every access is recorded', 'Views and changes are written to an audit log. The history shows the activity, never clinical content.'),
  ('Doctor approval first', 'No AI output reaches anyone in your family until a licensed doctor has reviewed it.'),
];

class PrivacyHero extends StatelessWidget {
  const PrivacyHero({super.key, required this.eyebrow, required this.title, required this.purpose, required this.note});

  final String eyebrow;
  final String title;
  final String purpose;
  final String note;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppColors.primaryDark : AppColors.primary;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(colors: [primary, isDark ? AppColors.primaryLumDark : AppColors.primaryLum]),
      ),
      child: DefaultTextStyle(
        style: const TextStyle(color: AppColors.onAccent),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(eyebrow, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppColors.onAccent)),
            const SizedBox(height: 4),
            Semantics(header: true, child: Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.onAccent))),
            const SizedBox(height: 6),
            Text(purpose, style: const TextStyle(height: 1.4, color: AppColors.onAccent)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
              ),
              child: Row(children: [
                const Icon(Icons.lock_outline_rounded, size: 16, color: AppColors.onAccent),
                const SizedBox(width: 8),
                Expanded(child: Text(note, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.onAccent))),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class StatGrid extends StatelessWidget {
  const StatGrid({super.key, required this.tiles});

  /// (label, value, hint)
  final List<(String, String, String)> tiles;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return LayoutBuilder(builder: (context, constraints) {
      final columns = constraints.maxWidth >= 600 ? tiles.length : 2;
      final width = (constraints.maxWidth - 8 * (columns - 1)) / columns;
      return Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final (label, value, hint) in tiles)
            Container(
              width: width,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: isDark ? AppColors.borderDark : AppColors.border),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label, style: theme.textTheme.labelSmall),
                const SizedBox(height: 4),
                Text(value, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                Text(hint, maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
              ]),
            ),
        ],
      );
    });
  }
}

class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.title, required this.children, this.eyebrow, this.caption});

  final String title;
  final String? eyebrow;
  final String? caption;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (eyebrow != null)
            Text(eyebrow!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1, color: isDark ? AppColors.primaryLumDark : AppColors.primary)),
          Semantics(header: true, child: Text(title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800))),
          if (caption != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(caption!, style: theme.textTheme.bodySmall)),
          const SizedBox(height: 8),
          ...children,
        ]),
      ),
    );
  }
}

class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar({super.key, required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    final text = parts.isEmpty ? '?' : (parts.first[0] + (parts.length > 1 ? parts.last[0] : '')).toUpperCase();
    return CircleAvatar(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.onAccent,
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700)),
    );
  }
}

class MemberCard extends StatelessWidget {
  const MemberCard({super.key, required this.name, required this.subtitle, required this.chip, required this.child, this.minor = false});

  final String name;
  final String subtitle;
  final String chip;
  final bool minor;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final color = minor ? AppColors.warning : AppColors.primary;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              InitialsAvatar(name: name),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.w800), overflow: TextOverflow.ellipsis),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                ]),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: color.withValues(alpha: 0.4)),
                ),
                child: Text(chip, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ]),
            const SizedBox(height: 8),
            child,
          ]),
        ),
      ),
    );
  }
}

class ConsentSwitches extends StatelessWidget {
  const ConsentSwitches({super.key, required this.consents, required this.busy, required this.onToggle});

  final List<ConsentSetting> consents;
  final bool busy;
  final ValueChanged<ConsentSetting> onToggle;

  @override
  Widget build(BuildContext context) {
    if (consents.isEmpty) return const Text('No consent settings yet.');
    return Column(children: [
      for (final consent in consents)
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          value: consent.granted,
          onChanged: busy ? null : (_) => onToggle(consent),
          title: Text(consentLabel(consent.category)),
          subtitle: Text(consentStatusLabel(consent.status)),
        ),
    ]);
  }
}

class RuleList extends StatelessWidget {
  const RuleList({super.key, required this.rules, this.shrinkWrap = false});

  final List<Rule> rules;
  final bool shrinkWrap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cards = [
      for (final (title, body) in rules)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Card(
            margin: EdgeInsets.zero,
            child: Container(
              decoration: const BoxDecoration(border: Border(left: BorderSide(color: AppColors.primary, width: 3))),
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(body, style: theme.textTheme.bodySmall),
              ]),
            ),
          ),
        ),
    ];
    if (shrinkWrap) return Column(children: cards);
    return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 32), children: cards);
  }
}

/// Access history: client-side filter + search, expandable metadata-only details, paged "Load more".
class AuditList extends StatefulWidget {
  const AuditList({super.key, required this.events, required this.canLoadMore, required this.loadingMore, required this.onLoadMore});

  final List<AuditEntry> events;
  final bool canLoadMore;
  final bool loadingMore;
  final VoidCallback onLoadMore;

  @override
  State<AuditList> createState() => _AuditListState();
}

class _AuditListState extends State<AuditList> {
  ActivityKind? _kind;
  String _query = '';

  String _time(DateTime? at) => at == null
      ? '—'
      : '${at.year}-${at.month.toString().padLeft(2, '0')}-${at.day.toString().padLeft(2, '0')} '
          '${at.hour.toString().padLeft(2, '0')}:${at.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final filtered = widget.events.where((e) =>
        (_kind == null || activityKind(e.eventType) == _kind) &&
        (q.isEmpty || describeAccessEvent(e.eventType).toLowerCase().contains(q) || e.resourceType.toLowerCase().contains(q))).toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        DropdownButtonFormField<ActivityKind?>(
          initialValue: _kind,
          decoration: const InputDecoration(labelText: 'Activity type'),
          items: [
            const DropdownMenuItem(value: null, child: Text('All activity')),
            for (final kind in ActivityKind.values) DropdownMenuItem(value: kind, child: Text(kind.label)),
          ],
          onChanged: (value) => setState(() => _kind = value),
        ),
        const SizedBox(height: 8),
        TextField(
          decoration: const InputDecoration(labelText: 'Search activity', prefixIcon: Icon(Icons.search_rounded)),
          onChanged: (value) => setState(() => _query = value),
        ),
        const SizedBox(height: 8),
        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(widget.events.isEmpty
                ? 'No access recorded yet. When someone views or changes your family’s data, it is listed here.'
                : 'No activity matches this filter.'),
          ),
        for (final event in filtered)
          ExpansionTile(
            key: ValueKey(event.id),
            tilePadding: EdgeInsets.zero,
            leading: const Icon(Icons.history_rounded),
            title: Text(describeAccessEvent(event.eventType)),
            subtitle: Text(_time(event.createdAt)),
            trailing: const Text('Details'),
            childrenPadding: const EdgeInsets.only(left: 40, bottom: 8),
            expandedCrossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Activity: ${activityKind(event.eventType).label}'),
              Text('Item type: ${event.resourceType}'),
              Text('Outcome: ${event.outcome}'),
              Text('Time: ${_time(event.createdAt)}'),
            ],
          ),
        if (widget.canLoadMore)
          Center(
            child: OutlinedButton(
              onPressed: widget.loadingMore ? null : widget.onLoadMore,
              child: Text(widget.loadingMore ? 'Loading…' : 'Load more'),
            ),
          ),
      ],
    );
  }
}
