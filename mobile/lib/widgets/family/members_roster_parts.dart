// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// [S1] My Family roster visuals: household summary tiles, grouped sections and member tiles.
// Mirrors the web Members tab (FamilyMembersTab.tsx): minors first, then the head, then adults.
import 'package:family_veda/models/member.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:flutter/material.dart';

enum MemberGroup { minor, head, adult }

/// Groups by the role the API returns; date of birth is the fallback for a minor.
MemberGroup memberGroupOf(Member member, {DateTime? now}) {
  final label = member.relationshipLabel.toLowerCase().replaceAll(' ', '');
  if (label.contains('minor')) return MemberGroup.minor;
  if (label == 'head' || label == 'familyhead') return MemberGroup.head;
  final dob = DateTime.tryParse(member.dateOfBirth ?? '');
  if (dob != null) {
    final today = now ?? DateTime.now();
    final adultFrom = DateTime(dob.year + 18, dob.month, dob.day);
    if (today.isBefore(adultFrom)) return MemberGroup.minor;
  }
  return MemberGroup.adult;
}

Color _accentOf(MemberGroup group, bool isDark) => switch (group) {
  MemberGroup.minor => isDark ? AppColors.warningDark : AppColors.warning,
  MemberGroup.head => isDark ? AppColors.successDark : AppColors.success,
  MemberGroup.adult => isDark ? AppColors.primaryDark : AppColors.primary,
};

class FamilySummaryTiles extends StatelessWidget {
  const FamilySummaryTiles({
    super.key,
    required this.total,
    required this.adults,
    required this.minors,
    required this.pending,
  });

  final int total;
  final int adults;
  final int minors;
  final int pending;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tiles = [
      ('TOTAL MEMBERS', total, isDark ? AppColors.primaryDark : AppColors.primary),
      ('ADULTS', adults, isDark ? AppColors.successDark : AppColors.success),
      ('MINORS', minors, isDark ? AppColors.warningDark : AppColors.warning),
      ('PENDING REQUESTS', pending, isDark ? AppColors.agentDark : AppColors.agent),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 10.0;
        final width = (constraints.maxWidth - gap) / 2;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            for (final (label, value, accent) in tiles)
              SizedBox(
                width: width,
                child: _SummaryTile(label: label, value: value, accent: accent, isDark: isDark),
              ),
          ],
        );
      },
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.label, required this.value, required this.accent, required this.isDark});

  final String label;
  final int value;
  final Color accent;
  final bool isDark;

  @override
  Widget build(BuildContext context) => Semantics(
    label: '$label: $value',
    excludeSemantics: true,
    child: Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: isDark
              ? const [AppColors.surfaceSubtleDark, AppColors.surfaceDark]
              : const [AppColors.surface, AppColors.surfaceSubtle],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(999)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.9,
                    color: isDark ? AppColors.faintDark : AppColors.faint,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$value',
                  style: TextStyle(
                    fontSize: 24,
                    height: 1,
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppColors.textHeadingDark : AppColors.textHeading,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class MemberGroupHeader extends StatelessWidget {
  const MemberGroupHeader({super.key, required this.group, required this.count});

  final MemberGroup group;
  final int count;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final (title, note, unit) = switch (group) {
      MemberGroup.minor => ('Minor profiles', 'Guardian-managed child profiles.', 'minor'),
      MemberGroup.head => ('Family head', 'Controls settings, approvals and transfers.', 'head'),
      MemberGroup.adult => ('Adult members', 'Health data stays private unless shared.', 'adult'),
    };
    final accent = isDark ? AppColors.primaryDark : AppColors.primary;
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w800,
                  color: isDark ? AppColors.textHeadingDark : AppColors.textHeading,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                note,
                style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : AppColors.muted),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isDark ? AppColors.primarySubtleDark : AppColors.primarySubtle,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: accent.withValues(alpha: 0.25)),
          ),
          child: Text(
            '$count $unit${count == 1 ? '' : 's'}',
            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: accent),
          ),
        ),
      ],
    );
  }
}

class FamilyMemberTile extends StatelessWidget {
  const FamilyMemberTile({
    super.key,
    required this.member,
    required this.group,
    required this.isActive,
    required this.onSelected,
  });

  final Member member;
  final MemberGroup group;
  final bool isActive;
  final VoidCallback onSelected;

  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    final first = parts.first.characters.first;
    return (parts.length > 1 ? first + parts.last.characters.first : first).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accent = _accentOf(group, isDark);
    final roleLabel = switch (group) {
      MemberGroup.minor => 'Minor',
      MemberGroup.head => 'Family Head',
      MemberGroup.adult => 'Adult Member',
    };
    final primary = isDark ? AppColors.primaryDark : AppColors.primary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onSelected,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? const [AppColors.surfaceSubtleDark, AppColors.surfaceDark]
                  : const [AppColors.surface, AppColors.surfaceSubtle],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isActive ? primary : accent.withValues(alpha: 0.3),
              width: isActive ? 1.6 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primaryLum, AppColors.primary],
                  ),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: ExcludeSemantics(
                  child: Text(
                    _initials(member.displayName),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.displayName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.textHeadingDark : AppColors.textHeading,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.13),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: accent.withValues(alpha: 0.28)),
                      ),
                      child: Text(
                        roleLabel,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: accent),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              isActive
                  ? Icon(Icons.check_circle, color: primary, semanticLabel: 'Active member')
                  : Icon(Icons.chevron_right, color: isDark ? AppColors.mutedDark : AppColors.faint),
            ],
          ),
        ),
      ),
    );
  }
}
