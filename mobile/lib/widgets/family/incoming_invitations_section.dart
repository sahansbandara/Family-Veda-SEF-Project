// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Invitations another Family Head sent to this account's email. Approve joins; reject tells the Head.
import 'package:family_veda/models/incoming_invitation.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class IncomingInvitationsSection extends ConsumerWidget {
  const IncomingInvitationsSection({super.key});

  Future<void> _respond(
    BuildContext context,
    WidgetRef ref,
    IncomingInvitation invitation,
    bool approve,
  ) async {
    if (approve) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text('Join ${invitation.familyName}?'),
          content: const Text(
            'Your health data stays private unless you share it.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Join'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }
    try {
      final api = ref.read(familyPortalApiProvider);
      if (approve) {
        await api.approveInvitation(invitation.id);
      } else {
        await api.rejectInvitation(invitation.id);
      }
      ref.invalidate(incomingInvitationsProvider);
      ref.invalidate(familyDashboardProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              approve
                  ? 'You joined ${invitation.familyName}.'
                  : 'Invitation rejected.',
            ),
          ),
        );
      }
    } on Object {
      ref.invalidate(incomingInvitationsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not update this invitation. Try again.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Optional section: loading or failure must not hide the rest of the screen.
    final items =
        ref.watch(incomingInvitationsProvider).valueOrNull ??
        const <IncomingInvitation>[];
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Invitations for you',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          for (final item in items)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.familyName,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text('Invited by ${item.invitedByName}'),
                    if (item.relationshipType != null)
                      Text('Relationship: ${item.relationshipType}'),
                    if (item.blockedReason != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          item.blockedReason!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => _respond(context, ref, item, false),
                          child: const Text('Reject'),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: item.canApprove
                              ? () => _respond(context, ref, item, true)
                              : null,
                          child: const Text('Approve'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
