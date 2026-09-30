// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Profile settings: the signed-in user's own details and display name. Same API as the web page.
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _editName(
    BuildContext context,
    WidgetRef ref,
    String current,
  ) async {
    final controller = TextEditingController(text: current);
    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Display name'),
        content: TextField(
          controller: controller,
          maxLength: 120,
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () =>
                Navigator.pop(dialogContext, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (name == null || name.length < 2) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .put<void>('/profile/me', data: {'displayName': name});
      ref.invalidate(myProfileProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Profile saved.')));
      }
    } on Object {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not save. Try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('Profile settings')),
    body: SafeArea(
      child: ref
          .watch(myProfileProvider)
          .when(
            loading: () => const LoadingStateView(label: 'Loading profile'),
            error: (_, _) => ErrorRetryView(
              onRetry: () => ref.invalidate(myProfileProvider),
            ),
            data: (p) {
              final name = p['displayName'] as String? ?? '';
              final role = p['familyRole'] as String?;
              final sex = p['sexForClinicalReference'] as String?;
              final rows = <(String, String?)>[
                ('Name', name),
                ('Email', p['email'] as String?),
                if (role != null) ...[
                  ('Family role', _familyRoleLabels[role] ?? role),
                  ('Family', p['familyName'] as String?),
                  ('Family Code', p['familyCode'] as String?),
                  ('Date of birth', p['dateOfBirth'] as String?),
                  (
                    'Sex for clinical reference',
                    sex == 'NotSpecified' ? 'Not specified' : sex,
                  ),
                ],
              ];
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Column(
                      children: [
                        for (final row in rows)
                          ListTile(
                            title: Text(row.$1),
                            subtitle: Text(
                              row.$2 == null || row.$2!.isEmpty ? '—' : row.$2!,
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => _editName(context, ref, name),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit display name'),
                  ),
                ],
              );
            },
          ),
    ),
  );
}
