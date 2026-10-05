// Owner: S3 · whole-project ownership waiver.
import 'package:family_veda/models/triage_case.dart';
import 'package:family_veda/providers/cases_provider.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/screens/triage/submit_complaint_screen.dart';
import 'package:family_veda/screens/triage/case_status_screen.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RequestSubmissionActions extends ConsumerStatefulWidget {
  const RequestSubmissionActions({super.key, required this.item});
  final TriageCase item;
  @override
  ConsumerState<RequestSubmissionActions> createState() =>
      _RequestSubmissionActionsState();
}

class _RequestSubmissionActionsState
    extends ConsumerState<RequestSubmissionActions> {
  bool _busy = false;
  String? _error;

  Future<void> _withdraw() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Withdraw this request?'),
        content: const Text(
          'This stops the request. You can submit a new request later.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep request'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Withdraw'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .post<Map<String, dynamic>>(
            '/triage-cases/${widget.item.id}/withdraw',
          );
      ref.invalidate(memberCasesProvider);
    } catch (error) {
      if (mounted) setState(() => _error = userFacingApiError(error));
    } finally {
      ref.invalidate(caseStatusProvider(widget.item.id));
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      if (widget.item.canEdit || widget.item.canWithdraw) ...[
        const Text(
          'You can change or withdraw this request until a doctor starts reviewing it.',
        ),
        Wrap(
          spacing: 8,
          children: [
            if (widget.item.canEdit && widget.item.submittedEpisode != null)
              OutlinedButton.icon(
                onPressed: _busy
                    ? null
                    : () async {
                        final replacementId = await Navigator.of(context)
                            .push<String>(
                              MaterialPageRoute<String>(
                                builder: (_) => SubmitComplaintScreen(
                                  replacementCase: widget.item,
                                ),
                              ),
                            );
                        if (!mounted || !context.mounted) return;
                        ref.invalidate(caseStatusProvider(widget.item.id));
                        if (replacementId != null) {
                          await showCaseProgressSheet(context, replacementId);
                        }
                      },
                icon: const Icon(Icons.edit_outlined),
                label: const Text('Edit request'),
              ),
            if (widget.item.canWithdraw)
              TextButton.icon(
                onPressed: _busy ? null : _withdraw,
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('Withdraw request'),
              ),
          ],
        ),
      ],
      if (_error != null)
        Text(
          _error!,
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
    ],
  );
}
