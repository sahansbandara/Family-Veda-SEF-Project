// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Privacy & Access — Flutter equivalent of web/src/pages/family/PrivacyPage.tsx.
// Family sharing and doctor clinical consent are two separate controls (RULE 8).
// Adult privacy stays independent: the Head never sees an adult's private items or toggles.
import 'package:family_veda/models/doctor_summary.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/services/api/privacy_api.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:family_veda/widgets/privacy/privacy_parts.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final privacyApiProvider = Provider<PrivacyApi>(
  (ref) => DioPrivacyApi(ref.watch(apiClientProvider)),
);

class PrivacyScreen extends ConsumerWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: ref.watch(familyDashboardProvider).when(
          loading: () => const LoadingStateView(label: 'Loading privacy settings'),
          error: (_, _) => ErrorRetryView(onRetry: () => ref.invalidate(familyDashboardProvider)),
          data: (dashboard) => dashboard.isHead
              ? _HeadPrivacy(familyId: dashboard.familyId)
              : const _AdultPrivacy(),
        ),
      ),
    );
  }
}

void _toast(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message), backgroundColor: error ? AppColors.danger : AppColors.success),
  );
}

// ───────────────────────── Adult Member ─────────────────────────

class _AdultPrivacy extends ConsumerStatefulWidget {
  const _AdultPrivacy();

  @override
  ConsumerState<_AdultPrivacy> createState() => _AdultPrivacyState();
}

class _AdultPrivacyState extends ConsumerState<_AdultPrivacy> {
  PrivacyMember? _me;
  List<SharedItem> _items = const [];
  List<ConsentSetting> _consents = const [];
  bool _loading = true;
  bool _error = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool quiet = false}) async {
    if (!quiet) setState(() { _loading = true; _error = false; });
    final api = ref.read(privacyApiProvider);
    try {
      final me = await api.getMe();
      final results = await Future.wait([api.getSharingItems(me.id), api.getConsents(me.id)]);
      if (!mounted) return;
      setState(() {
        _me = me;
        _items = results[0] as List<SharedItem>;
        _consents = results[1] as List<ConsentSetting>;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = true; });
    }
  }

  Future<void> _toggleSharing(SharedItem item) async {
    setState(() => _busy = true);
    try {
      await ref.read(privacyApiProvider).setSharing(item, shared: !item.shared);
      if (mounted) _toast(context, item.shared ? '"${item.title}" is now private from the Family Head.' : '"${item.title}" is now shared with the Family Head.');
      await _load(quiet: true);
    } catch (_) {
      if (mounted) _toast(context, 'Sharing could not be changed. Try again.', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _toggleConsent(ConsentSetting consent) async {
    final me = _me;
    if (me == null) return;
    setState(() => _busy = true);
    try {
      await ref.read(privacyApiProvider).setConsent(me.id, consent.category, consent.nextStatus);
      if (mounted) _toast(context, '${consentLabel(consent.category)}: ${consent.granted ? 'revoked' : 'granted'}.');
      await _load(quiet: true);
    } catch (_) {
      if (mounted) _toast(context, 'Consent could not be changed. Try again.', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingStateView(label: 'Loading your privacy settings');
    if (_error) return ErrorRetryView(onRetry: _load, message: 'Your privacy settings could not be loaded.');
    final shared = _items.where((item) => item.shared).length;
    final granted = _consents.where((c) => c.granted).length;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          const PrivacyHero(
            eyebrow: 'PRIVACY',
            title: 'Privacy',
            purpose: 'Family sharing and doctor access are two separate controls. Everything is private from your Family Head until you share it.',
            note: 'Your adult privacy stays independent. Your Family Head cannot change these settings.',
          ),
          const SizedBox(height: 12),
          StatGrid(tiles: [
            ('Shared', '$shared', 'With your Family Head'),
            ('Private', '${_items.length - shared}', 'Visible only to you'),
            ('Doctor consents', '$granted/${_consents.length}', 'Categories granted'),
          ]),
          const SizedBox(height: 12),
          SectionCard(
            eyebrow: 'FAMILY HEAD',
            title: 'Family Sharing',
            caption: 'Choose, item by item, what your Family Head can see.',
            children: _items.isEmpty
                ? const [Text('Reports and records you add will appear here, private by default.')]
                : [
                    for (final item in _items)
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        value: item.shared,
                        onChanged: _busy ? null : (_) => _toggleSharing(item),
                        title: Text(item.title, overflow: TextOverflow.ellipsis),
                        subtitle: Text('${item.isReport ? 'Lab report' : 'Health record'} · ${item.shared ? 'Shared' : 'Private'}'),
                      ),
                  ],
          ),
          const SizedBox(height: 12),
          SectionCard(
            eyebrow: 'FAMILY DOCTOR',
            title: 'Clinical Consent',
            caption: 'What your family doctor may use during a reviewed case. Revoking takes effect immediately.',
            children: [ConsentSwitches(consents: _consents, busy: _busy, onToggle: _toggleConsent)],
          ),
        ],
      ),
    );
  }
}

// ───────────────────────── Family Head ─────────────────────────

class _HeadRow {
  const _HeadRow(this.member, {this.consents = const [], this.sharedCount = 0});
  final PrivacyMember member;
  final List<ConsentSetting> consents;
  final int sharedCount;
}

class _HeadPrivacy extends ConsumerStatefulWidget {
  const _HeadPrivacy({required this.familyId});
  final String? familyId;

  @override
  ConsumerState<_HeadPrivacy> createState() => _HeadPrivacyState();
}

class _HeadPrivacyState extends ConsumerState<_HeadPrivacy> {
  _HeadRow? _self;
  List<_HeadRow> _rows = const [];
  List<AuditEntry> _events = const [];
  int _auditPage = 1;
  int _auditPages = 1;
  int _auditTotal = 0;
  bool _loading = true;
  bool _error = false;
  bool _busy = false;
  bool _loadingMore = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<List<ConsentSetting>> _consentsFor(String id) =>
      ref.read(privacyApiProvider).getConsents(id).catchError((_) => <ConsentSetting>[]);

  Future<void> _loadMembers() async {
    final api = ref.read(privacyApiProvider);
    final me = await api.getMe();
    final members = await api.getFamilyMembers();
    final rows = await Future.wait(members.where((m) => m.id != me.id).map((m) async {
      if (m.isMinor) return _HeadRow(m, consents: await _consentsFor(m.id));
      // Adults: the API returns only items they shared; private items are never counted.
      final shared = await api.getSharingItems(m.id).catchError((_) => <SharedItem>[]);
      return _HeadRow(m, sharedCount: shared.length);
    }));
    final selfConsents = await _consentsFor(me.id);
    if (!mounted) return;
    setState(() {
      _self = _HeadRow(me, consents: selfConsents);
      _rows = rows;
    });
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = false; });
    try {
      await _loadMembers();
      final audit = await ref.read(privacyApiProvider).getAudit();
      if (!mounted) return;
      setState(() {
        _events = audit.items;
        _auditPage = 1;
        _auditPages = audit.totalPages;
        _auditTotal = audit.totalCount;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = true; });
    }
  }

  Future<void> _loadMore() async {
    setState(() => _loadingMore = true);
    try {
      final next = await ref.read(privacyApiProvider).getAudit(page: _auditPage + 1);
      if (!mounted) return;
      final known = _events.map((e) => e.id).toSet();
      setState(() {
        _events = [..._events, ...next.items.where((e) => !known.contains(e.id))];
        _auditPage = _auditPage + 1;
        _auditPages = next.totalPages;
      });
    } catch (_) {
      if (mounted) _toast(context, 'More access history could not be loaded.', error: true);
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _toggleConsent(PrivacyMember owner, ConsentSetting consent) async {
    setState(() => _busy = true);
    try {
      await ref.read(privacyApiProvider).setConsent(owner.id, consent.category, consent.nextStatus);
      if (mounted) _toast(context, '${owner.displayName} · ${consentLabel(consent.category)}: ${consent.granted ? 'revoked' : 'granted'}.');
      await _loadMembers();
    } catch (_) {
      if (mounted) _toast(context, 'Consent could not be changed. Try again.', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingStateView(label: 'Loading family privacy');
    if (_error) return ErrorRetryView(onRetry: _load, message: 'Family privacy could not be loaded.');
    final familyId = widget.familyId;
    final DoctorSummary? doctor = familyId == null ? null : ref.watch(familyDoctorProvider(familyId)).valueOrNull;
    final minors = _rows.where((r) => r.member.isMinor).toList();
    final managed = [if (_self != null) _self!, ...minors];
    final granted = managed.fold<int>(0, (s, r) => s + r.consents.where((c) => c.granted).length);
    final total = managed.fold<int>(0, (s, r) => s + r.consents.length);

    return DefaultTabController(
      length: 4,
      child: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            sliver: SliverList.list(children: [
              const PrivacyHero(
                eyebrow: 'PRIVACY & ACCESS',
                title: 'Privacy & Access',
                purpose: 'Manage doctor consent for yourself and your minors, and see who accessed your family’s data.',
                note: 'Adult privacy stays independent. Adults’ private items and settings are never shown here.',
              ),
              const SizedBox(height: 12),
              StatGrid(tiles: [
                ('Minors you manage', '${minors.length}', 'Guardian-managed'),
                ('Consents granted', '$granted/$total', 'You and your minors'),
                ('Recorded access', '$_auditTotal', 'Access history entries'),
                ('Family doctor', doctor == null ? 'None' : 'Assigned', doctor?.displayName ?? 'No doctor connected'),
              ]),
              const SizedBox(height: 8),
              const TabBar(
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: [
                  Tab(text: 'Member permissions'),
                  Tab(text: 'Doctor access'),
                  Tab(text: 'Access history'),
                  Tab(text: 'Privacy rules'),
                ],
              ),
            ]),
          ),
        ],
        body: TabBarView(children: [
          _membersTab(context),
          _doctorTab(context, doctor),
          AuditList(
            events: _events,
            canLoadMore: _auditPage < _auditPages,
            loadingMore: _loadingMore,
            onLoadMore: _loadMore,
          ),
          const RuleList(rules: headPrivacyRules),
        ]),
      ),
    );
  }

  Widget _membersTab(BuildContext context) {
    final self = _self;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        if (self != null)
          MemberCard(
            name: self.member.displayName,
            subtitle: 'You · Family Head',
            chip: 'You',
            child: ConsentSwitches(consents: self.consents, busy: _busy, onToggle: (c) => _toggleConsent(self.member, c)),
          ),
        if (_rows.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text('Only you in this family. Invite family members from My Family any time.'),
          ),
        for (final row in _rows)
          MemberCard(
            name: row.member.displayName,
            subtitle: row.member.isMinor ? 'Guardian managed by you' : 'Manages their own privacy',
            chip: row.member.isMinor ? 'Minor' : 'Adult',
            minor: row.member.isMinor,
            child: row.member.isMinor
                ? ConsentSwitches(consents: row.consents, busy: _busy, onToggle: (c) => _toggleConsent(row.member, c))
                : Text(
                    '${row.sharedCount == 0 ? 'Nothing shared with you.' : '${row.sharedCount} item${row.sharedCount == 1 ? '' : 's'} shared with you.'} Their other settings stay private.',
                  ),
          ),
        TextButton.icon(
          onPressed: () => context.go('/members'),
          icon: const Icon(Icons.people_outline_rounded),
          label: const Text('Manage relationships in My Family'),
        ),
      ],
    );
  }

  Widget _doctorTab(BuildContext context, DoctorSummary? doctor) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        SectionCard(
          eyebrow: 'FAMILY DOCTOR',
          title: 'Assigned doctor',
          children: [
            if (doctor == null)
              const Text('No family doctor is connected.')
            else
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: InitialsAvatar(name: doctor.displayName.replaceFirst(RegExp(r'^Dr\.?\s*'), '')),
                title: Text(doctor.displayName),
                subtitle: Text([doctor.specialty, doctor.clinic].whereType<String>().where((s) => s.isNotEmpty).join(' · ')),
              ),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton(
                onPressed: () => context.go('/my-doctor'),
                child: Text(doctor == null ? 'Find a doctor in My Doctor' : 'My Doctor'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        const RuleList(rules: doctorAccessRules, shrinkWrap: true),
      ],
    );
  }
}
