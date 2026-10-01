// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family Head dashboard for Flutter, precisely matching web FamilyDashboardPanel:
// royal blue gradient hero banner, clean metric cards, doctor card with verified badge,
// needs attention, members overview, and quick actions.
import 'package:family_veda/models/family_dashboard.dart';
import 'package:family_veda/models/member.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:family_veda/theme/glass.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class HeadDashboardSection extends StatelessWidget {
  const HeadDashboardSection({
    super.key,
    required this.dashboard,
    required this.onNavigate,
    this.activeMember,
    this.onTapProfile,
  });

  final FamilyDashboard dashboard;
  final ValueChanged<String> onNavigate;
  final Member? activeMember;
  final VoidCallback? onTapProfile;

  @override
  Widget build(BuildContext context) {
    final next = dashboard.nextAppointment;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 1. Royal Blue Web-Style Hero Banner
        _Hero(
          dashboard: dashboard,
          onNavigate: onNavigate,
          activeMember: activeMember,
          onTapProfile: onTapProfile,
        ),
        const SizedBox(height: 14),

        // 2. The 4 Web-Aligned Metric Cards
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.45,
          children: [
            _MetricCard(
              label: 'Family Members',
              value: '${dashboard.memberCount}',
              badgeText:
                  '${dashboard.minorCount} minor${dashboard.minorCount == 1 ? '' : 's'}',
              badgeTone: _Tone.ok,
              onTap: () => onNavigate('/members'),
            ),
            _MetricCard(
              label: 'Next Appointment',
              value: next == null
                  ? 'None'
                  : DateFormat('dd MMM').format(next.startsAt),
              badgeText: next == null
                  ? 'Book when needed'
                  : DateFormat('h:mm a').format(next.startsAt),
              badgeTone: next == null ? _Tone.muted : _Tone.info,
              onTap: () => onNavigate('/appointments'),
            ),
            _MetricCard(
              label: 'Open Cases',
              value: '${dashboard.openCases}',
              badgeText: dashboard.openCases > 0 ? 'Doctor review' : 'All clear',
              badgeTone: dashboard.openCases > 0 ? _Tone.warn : _Tone.ok,
              onTap: () => onNavigate('/cases'),
            ),
            _MetricCard(
              label: 'Join Requests',
              value: '${dashboard.pendingJoinRequests}',
              badgeText: dashboard.pendingJoinRequests > 0
                  ? 'Needs action'
                  : 'None pending',
              badgeTone: dashboard.pendingJoinRequests > 0 ? _Tone.warn : _Tone.muted,
              onTap: () => onNavigate('/join-requests'),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // 3. Continuity of Care / My Family Doctor
        _DoctorSection(dashboard: dashboard, onNavigate: onNavigate),
        const SizedBox(height: 18),

        // 4. Priority / Needs Attention
        _NeedsAttentionSection(
          dashboard: dashboard,
          onNavigate: onNavigate,
        ),
        const SizedBox(height: 18),

        // 5. Family Overview / Members
        _MembersSection(dashboard: dashboard, onNavigate: onNavigate),
        const SizedBox(height: 18),

        // 6. Common Tasks / Quick Actions
        _QuickActionsSection(onNavigate: onNavigate),
        const SizedBox(height: 18),

        // 7. Recent Shared Activity
        _ActivitySection(dashboard: dashboard),
      ],
    );
  }
}

/// 1. Royal Blue Web-Style Hero Banner
class _Hero extends StatelessWidget {
  const _Hero({
    required this.dashboard,
    required this.onNavigate,
    this.activeMember,
    this.onTapProfile,
  });

  final FamilyDashboard dashboard;
  final ValueChanged<String> onNavigate;
  final Member? activeMember;
  final VoidCallback? onTapProfile;

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final familyName = dashboard.familyName ?? 'Synthetic Demonstration Family';

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0F52BA), // Royal Blue
            Color(0xFF1D61E0),
            Color(0xFF2563EB), // Vibrant Web Blue
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1D61E0).withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTapProfile,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Eyebrow + Notification Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'FAMILY HEAD WORKSPACE',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.1,
                        color: Color(0xFFB9D5FD),
                      ),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      tooltip: '${dashboard.unreadNotifications} unread notifications',
                      onPressed: () => onNavigate('/notifications'),
                      icon: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.notifications,
                              size: 13,
                              color: Color(0xFFFBBF24), // Yellow Bell
                            ),
                            if (dashboard.unreadNotifications > 0) ...[
                              const SizedBox(width: 4),
                              Text(
                                '${dashboard.unreadNotifications}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Greeting + Family Name Title
                Text(
                  '${_greeting()},',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFFD0E1FD),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  familyName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.4,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),

                // Subtitle: Family Code + Family-level care description
                Row(
                  children: [
                    if (dashboard.familyCode != null)
                      Text(
                        'Family Code ${dashboard.familyCode}',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    if (dashboard.familyCode != null)
                      const Text(
                        ' · ',
                        style: TextStyle(color: Color(0xFFB9D5FD)),
                      ),
                    const Expanded(
                      child: Text(
                        'Family-level care without exposing private adult health activity.',
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.35,
                          color: Color(0xFFE0EDFE),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

enum _Tone { ok, info, warn, muted }

/// 2. Web Metric Card
class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.badgeText,
    required this.badgeTone,
    required this.onTap,
  });

  final String label;
  final String value;
  final String badgeText;
  final _Tone badgeTone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final Color badgeBg;
    final Color badgeTxt;

    switch (badgeTone) {
      case _Tone.ok:
        badgeBg = isDark ? const Color(0x3310B981) : const Color(0xFFE0F2FE);
        badgeTxt = isDark ? const Color(0xFF34D399) : const Color(0xFF0284C7);
        break;
      case _Tone.info:
        badgeBg = isDark ? const Color(0x3338BDF8) : const Color(0xFFE0F2FE);
        badgeTxt = isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7);
        break;
      case _Tone.warn:
        badgeBg = isDark ? const Color(0x33F59E0B) : const Color(0xFFFEF3C7);
        badgeTxt = isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309);
        break;
      case _Tone.muted:
        badgeBg = isDark ? const Color(0x3364748B) : const Color(0xFFF1F5F9);
        badgeTxt = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Label
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.mutedDark : const Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                // Large Bold Value
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                // Bottom Pill Badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 2.5,
                  ),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    badgeText,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: badgeTxt,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// 3. Continuity of Care / My Family Doctor Section
class _DoctorSection extends StatelessWidget {
  const _DoctorSection({required this.dashboard, required this.onNavigate});

  final FamilyDashboard dashboard;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final doctor = dashboard.familyDoctor;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header + Manage button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CONTINUITY OF CARE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                      color: isDark ? AppColors.primaryLumDark : AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'My Family Doctor',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              OutlinedButton(
                onPressed: () => onNavigate('/my-doctor'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Manage', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 14),

          if (doctor == null) ...[
            const Text(
              'No family doctor yet. Search the directory and send a request.',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor.displayName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        [doctor.specialty, doctor.city, doctor.languages].whereType<String>().join(' · '),
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.mutedDark : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'VERIFIED',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0284C7),
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              dashboard.nextAppointment != null
                  ? 'Next shared appointment: ${DateFormat('dd MMM · h:mm a').format(dashboard.nextAppointment!.startsAt)}'
                  : 'No upcoming appointment for you or your minors.',
              style: TextStyle(
                fontSize: 12.5,
                color: isDark ? AppColors.mutedDark : const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => onNavigate('/appointments/book'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1D61E0),
                      foregroundColor: Colors.white,
                      minimumSize: const Size(0, 40),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text('Book Appointment', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 10),
                OutlinedButton(
                  onPressed: () => onNavigate('/my-doctor'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 40),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('View Doctor', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// 4. Priority / Needs Attention Section
class _NeedsAttentionSection extends StatelessWidget {
  const _NeedsAttentionSection({
    required this.dashboard,
    required this.onNavigate,
  });

  final FamilyDashboard dashboard;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final pending = dashboard.pendingJoinRequests;
    final guidance = dashboard.approvedGuidanceCount;
    final unread = dashboard.unreadNotifications;

    final hasItems = pending > 0 || guidance > 0 || unread > 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PRIORITY',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: isDark ? AppColors.primaryLumDark : AppColors.primary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Needs Attention',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          if (!hasItems)
            Text(
              'Nothing needs your attention right now.',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.mutedDark : const Color(0xFF64748B),
              ),
            )
          else ...[
            if (pending > 0)
              _AttentionItem(
                title: '$pending join request${pending == 1 ? '' : 's'}',
                body: 'Review adults requesting to join.',
                action: 'Review',
                onTap: () => onNavigate('/join-requests'),
              ),
            if (guidance > 0)
              _AttentionItem(
                title: 'Guidance available',
                body: 'Doctor-approved guidance is ready to read.',
                action: 'Open',
                onTap: () => onNavigate('/cases'),
              ),
            if (unread > 0)
              _AttentionItem(
                title: '$unread unread notification${unread == 1 ? '' : 's'}',
                body: 'Updates about your family.',
                action: 'Open',
                onTap: () => onNavigate('/notifications'),
              ),
          ],
        ],
      ),
    );
  }
}

class _AttentionItem extends StatelessWidget {
  const _AttentionItem({
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFFDE68A)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF92400E),
                      ),
                    ),
                    Text(
                      body,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: onTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD97706),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(0, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(action, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 5. Members Section
class _MembersSection extends StatelessWidget {
  const _MembersSection({required this.dashboard, required this.onNavigate});

  final FamilyDashboard dashboard;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'FAMILY OVERVIEW',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                      color: isDark ? AppColors.primaryLumDark : AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Members',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              OutlinedButton(
                onPressed: () => onNavigate('/members'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Manage Family', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final member in dashboard.members) _MemberRow(member: member),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceSubtleDark : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  member.displayName,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
                Text(
                  member.summary,
                  style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : const Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: member.role == 'Head'
                  ? const Color(0xFFE0F2FE)
                  : (member.isMinor ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9)),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              member.roleLabel,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: member.role == 'Head'
                    ? const Color(0xFF0284C7)
                    : (member.isMinor ? const Color(0xFFB45309) : const Color(0xFF475569)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 6. Common Tasks / Quick Actions Section
class _QuickActionsSection extends StatelessWidget {
  const _QuickActionsSection({required this.onNavigate});

  final ValueChanged<String> onNavigate;

  static const _actions = <(String, String, String)>[
    ('+ Add Minor', 'Guardian-managed', '/members'),
    ('Invite Adult', 'Email invitation', '/members'),
    ('Upload Report', 'Self or minor', '/lab-upload'),
    ('Book Appointment', 'Self or minor', '/appointments/book'),
    ('Report Symptoms', 'Doctor-reviewed triage', '/complaints/new'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'COMMON TASKS',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: isDark ? AppColors.primaryLumDark : AppColors.primary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final (label, sub, path) in _actions)
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => onNavigate(path),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceSubtleDark : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                          Text(sub, style: TextStyle(fontSize: 11, color: isDark ? AppColors.faintDark : const Color(0xFF94A3B8))),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// 7. Activity Section
class _ActivitySection extends StatelessWidget {
  const _ActivitySection({required this.dashboard});

  final FamilyDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'RECENT SHARED ACTIVITY',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: isDark ? AppColors.primaryLumDark : AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          if (dashboard.activity.isEmpty)
            Text(
              'Activity for you and your minors will appear here.',
              style: TextStyle(fontSize: 12.5, color: isDark ? AppColors.faintDark : const Color(0xFF64748B)),
            )
          else
            for (final entry in dashboard.activity)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(color: Color(0xFF1D61E0), shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(entry.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}
