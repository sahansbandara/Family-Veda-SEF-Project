// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Profile settings: the signed-in user's own details, display name and password.
// Same API as the web page. Only displayName and the password are editable.
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final myProfileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final response = await ref
      .watch(apiClientProvider)
      .dio
      .get<Map<String, dynamic>>('/profile/me');
  return response.data ?? const <String, dynamic>{};
});

const _familyRoleLabels = {
  'Head': 'Family Head',
  'AdultMember': 'Adult member',
  'MinorMember': 'Minor member',
};

const _accountTypeLabels = {
  'FamilyUser': 'Family account',
  'Doctor': 'Doctor',
  'Admin': 'Clinic administrator',
};

/// Strength from the typed password. Backend requires at least 8 characters.
({int score, String label}) passwordStrength(String value) {
  if (value.isEmpty) return (score: 0, label: 'Enter a new password');
  if (value.length < 8) {
    return (score: 1, label: 'Too short — use at least 8 characters');
  }
  final variety = [
    RegExp('[a-z]'),
    RegExp('[A-Z]'),
    RegExp(r'\d'),
    RegExp('[^A-Za-z0-9]'),
  ].where((re) => re.hasMatch(value)).length;
  final points =
      variety + (value.length >= 12 ? 1 : 0) + (value.length >= 16 ? 1 : 0);
  if (points >= 5) return (score: 4, label: 'Strong');
  if (points >= 4) return (score: 3, label: 'Good');
  return (score: 2, label: 'Fair — add upper case, numbers or symbols');
}

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
  if (parts.isEmpty) return '?';
  final first = parts.first[0];
  final last = parts.length > 1 ? parts.last[0] : '';
  return (first + last).toUpperCase();
}

enum _Section { personal, account, security }

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  _Section _section = _Section.personal;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Profile settings')),
    body: SafeArea(
      child: ref
          .watch(myProfileProvider)
          .when(
            loading: () => const LoadingStateView(label: 'Loading profile'),
            error: (_, _) => ErrorRetryView(
              onRetry: () => ref.invalidate(myProfileProvider),
            ),
            data: (p) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _HeaderCard(profile: p),
                const SizedBox(height: 14),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: SegmentedButton<_Section>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(
                        value: _Section.personal,
                        label: Text('Personal'),
                      ),
                      ButtonSegment(
                        value: _Section.account,
                        label: Text('Account'),
                      ),
                      ButtonSegment(
                        value: _Section.security,
                        label: Text('Security'),
                      ),
                    ],
                    selected: {_section},
                    onSelectionChanged: (s) =>
                        setState(() => _section = s.first),
                  ),
                ),
                const SizedBox(height: 14),
                switch (_section) {
                  _Section.personal => _PersonalSection(profile: p),
                  _Section.account => _AccountSection(profile: p),
                  _Section.security => const _SecuritySection(),
                },
                const SizedBox(height: 14),
                Text(
                  'This page is only for you. Nobody else in your family or '
                  'clinic can see or change it here.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
    ),
  );
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.profile});
  final Map<String, dynamic> profile;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final name = profile['displayName'] as String? ?? '';
    final userType = profile['userType']?.toString() ?? '';
    final role = profile['familyRole'] as String?;
    final family = profile['familyName'] as String?;
    final code = profile['familyCode'] as String?;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          colors: [scheme.primary, scheme.primary.withValues(alpha: 0.75)],
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: scheme.onPrimary.withValues(alpha: 0.2),
            child: Text(
              _initials(name),
              style: TextStyle(
                color: scheme.onPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: DefaultTextStyle(
              style: TextStyle(color: scheme.onPrimary),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(profile['email'] as String? ?? ''),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _Chip(_accountTypeLabels[userType] ?? userType),
                      if (role != null) _Chip(_familyRoleLabels[role] ?? role),
                    ],
                  ),
                  if (role != null && family != null) ...[
                    const SizedBox(height: 6),
                    Text(code == null ? family : '$family · $code'),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    final onPrimary = Theme.of(context).colorScheme.onPrimary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: onPrimary.withValues(alpha: 0.18),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: onPrimary,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.caption,
    required this.child,
  });
  final String title;
  final String caption;
  final Widget child;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(caption, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 14),
          child,
        ],
      ),
    ),
  );
}

class _PersonalSection extends ConsumerStatefulWidget {
  const _PersonalSection({required this.profile});
  final Map<String, dynamic> profile;

  @override
  ConsumerState<_PersonalSection> createState() => _PersonalSectionState();
}

class _PersonalSectionState extends ConsumerState<_PersonalSection> {
  late final TextEditingController _name;
  bool _busy = false;

  String get _original => widget.profile['displayName'] as String? ?? '';

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: _original)
      ..addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _busy = true);
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .put<void>('/profile/me', data: {'displayName': _name.text.trim()});
      ref.invalidate(myProfileProvider);
      messenger.showSnackBar(const SnackBar(content: Text('Profile saved.')));
    } on Object {
      messenger.showSnackBar(
        const SnackBar(content: Text('Could not save. Try again.')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final trimmed = _name.text.trim();
    final valid = trimmed.length >= 2 && trimmed.length <= 120;
    final changed = trimmed != _original;
    final userType = widget.profile['userType']?.toString();
    final isDoctor = userType == 'Doctor' || userType == '1';
    return _SectionCard(
      title: 'Personal details',
      caption: 'This is the name shown across Family Veda.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _name,
            maxLength: 120,
            decoration: InputDecoration(
              labelText: 'Display name',
              errorText: valid ? null : 'Use 2 to 120 characters.',
            ),
          ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _busy || _name.text == _original
                      ? null
                      : () => _name.text = _original,
                  child: const Text('Discard'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  onPressed: _busy || !valid || !changed ? null : _save,
                  child: const Text('Save'),
                ),
              ),
            ],
          ),
          if (isDoctor) ...[
            const SizedBox(height: 10),
            // Same destination as the web doctor navigation item.
            OutlinedButton.icon(
              onPressed: () => context.push('/doctor-profile'),
              icon: const Icon(Icons.event_available_outlined),
              label: const Text('Profile & Availability'),
            ),
          ],
        ],
      ),
    );
  }
}

class _AccountSection extends StatelessWidget {
  const _AccountSection({required this.profile});
  final Map<String, dynamic> profile;

  @override
  Widget build(BuildContext context) {
    const headHelper = 'Changed by your Family Head or support';
    final role = profile['familyRole'] as String?;
    final sex = profile['sexForClinicalReference'] as String?;
    final userType = profile['userType']?.toString() ?? '';
    final created = profile['createdAt'] as String?;
    final tiles = <(String, String?, String?)>[
      ('Email', profile['email'] as String?, 'Contact support to change'),
      ('Account type', _accountTypeLabels[userType] ?? userType, null),
      ('Member since', created?.split('T').first, null),
      if (role != null) ...[
        ('Family role', _familyRoleLabels[role] ?? role, null),
        ('Family', profile['familyName'] as String?, null),
        ('Family Code', profile['familyCode'] as String?, null),
        ('Date of birth', profile['dateOfBirth'] as String?, headHelper),
        (
          'Sex for clinical reference',
          sex == 'NotSpecified' ? 'Not specified' : sex,
          headHelper,
        ),
      ],
    ];
    final scheme = Theme.of(context).colorScheme;
    return _SectionCard(
      title: 'Account information',
      caption: 'Read-only details linked to your identity.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final t in tiles)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: scheme.primary.withValues(alpha: 0.06),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t.$1, style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 2),
                  Text(
                    t.$2 == null || t.$2!.isEmpty ? '—' : t.$2!,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  if (t.$3 != null)
                    Text(t.$3!, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          if (role != null)
            TextButton.icon(
              onPressed: () => context.push('/family'),
              icon: const Icon(Icons.groups_outlined),
              label: const Text('Manage family'),
            ),
        ],
      ),
    );
  }
}

class _SecuritySection extends ConsumerStatefulWidget {
  const _SecuritySection();

  @override
  ConsumerState<_SecuritySection> createState() => _SecuritySectionState();
}

class _SecuritySectionState extends ConsumerState<_SecuritySection> {
  final _current = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  final _visible = <String, bool>{};
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _new.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _current.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final messenger = ScaffoldMessenger.of(context);
    void say(String m) => messenger.showSnackBar(SnackBar(content: Text(m)));
    if (_current.text.isEmpty || _new.text.length < 8) {
      say('Enter your current password and a new one of 8+ characters.');
      return;
    }
    if (_new.text != _confirm.text) {
      say('The new passwords do not match.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .post<void>(
            '/auth/change-password',
            data: {'currentPassword': _current.text, 'newPassword': _new.text},
          );
      _current.clear();
      _new.clear();
      _confirm.clear();
      say('Password changed.');
    } on Object {
      say('The password could not be changed. Check your current password.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _field(String label, TextEditingController controller) {
    final visible = _visible[label] ?? false;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: !visible,
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: IconButton(
            tooltip: '${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}',
            isSelected: visible,
            icon: const Icon(Icons.visibility_outlined),
            selectedIcon: const Icon(Icons.visibility_off_outlined),
            onPressed: () => setState(() => _visible[label] = !visible),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final strength = passwordStrength(_new.text);
    final scheme = Theme.of(context).colorScheme;
    final color = switch (strength.score) {
      1 => scheme.error,
      2 => Colors.orange,
      _ => Colors.green,
    };
    return _SectionCard(
      title: 'Security',
      caption: 'Change the password you use to sign in.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _field('Current password', _current),
          _field('New password', _new),
          LinearProgressIndicator(
            value: strength.score / 4,
            color: color,
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
          const SizedBox(height: 6),
          Semantics(
            liveRegion: true,
            child: Text('Strength: ${strength.label}'),
          ),
          const SizedBox(height: 12),
          _field('Confirm new password', _confirm),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: const Text('Change password'),
          ),
        ],
      ),
    );
  }
}
