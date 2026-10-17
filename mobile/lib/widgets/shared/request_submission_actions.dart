// Owner: S3 · whole-project ownership waiver.
import 'package:dio/dio.dart';
import 'package:family_veda/models/triage_case.dart';
import 'package:family_veda/providers/cases_provider.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/screens/triage/submit_complaint_screen.dart';
import 'package:family_veda/screens/triage/case_status_screen.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RequestSubmissionActions extends ConsumerStatefulWidget {
  const RequestSubmissionActions({
    super.key,
    required this.item,
    this.allowPurge = false,
  });
  final TriageCase item;

  /// Permanent delete is offered only when opened from the Deleted filter.
  final bool allowPurge;
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
          'This moves the request to Deleted, where you can remove it permanently. You can submit a new request later.',
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
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .post<Map<String, dynamic>>(
            '/triage-cases/${widget.item.id}/withdraw',
          );
      ref.invalidate(memberCasesProvider);
      ref.read(showDeletedRequestsProvider.notifier).state = true;
      messenger.showSnackBar(
        const SnackBar(content: Text('Request moved to Deleted.')),
      );
      if (navigator.canPop()) navigator.pop();
    } catch (error) {
      if (mounted) setState(() => _error = userFacingApiError(error));
    } finally {
      ref.invalidate(caseStatusProvider(widget.item.id));
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _purge() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove permanently?'),
        content: const Text(
          'This erases the request and its symptoms. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep request'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete permanently'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busy = true);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete<void>('/triage-cases/${widget.item.id}');
      ref.invalidate(memberCasesProvider);
      messenger.showSnackBar(
        const SnackBar(content: Text('Request removed permanently.')),
      );
      if (navigator.canPop()) navigator.pop();
    } catch (error) {
      final status = error is DioException ? error.response?.statusCode : null;
      final message = switch (status) {
        409 => 'This request can no longer be removed permanently.',
        404 || 405 => 'Permanent delete is not available on this server yet.',
        _ => 'Could not remove the request. Try again.',
      };
      messenger.showSnackBar(SnackBar(content: Text(message)));
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _pill({
    required BuildContext context,
    required Color color,
    required IconData icon,
    required String label,
    required VoidCallback? onPressed,
  }) => SizedBox(
    height: 44,
    child: OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 18),
      label: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
      style: OutlinedButton.styleFrom(
        backgroundColor: color.withValues(alpha: .10),
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: .35)),
        shape: const StadiumBorder(),
        minimumSize: const Size(0, 44),
        padding: const EdgeInsets.symmetric(horizontal: 18),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
  );

  Future<void> _edit() async {
    final replacementId = await Navigator.of(context).push<String>(
      MaterialPageRoute<String>(
        builder: (_) => SubmitComplaintScreen(replacementCase: widget.item),
      ),
    );
    if (!mounted || !context.mounted) return;
    ref.invalidate(caseStatusProvider(widget.item.id));
    if (replacementId != null) {
      await showCaseProgressSheet(context, replacementId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final showEdit =
        widget.item.canEdit && widget.item.submittedEpisode != null;
    final showDelete = widget.item.canWithdraw;
    final narrow = MediaQuery.sizeOf(context).width < 400;
    final buttons = <Widget>[
      if (showEdit)
        _pill(
          context: context,
          color: scheme.primary,
          icon: Icons.edit_outlined,
          label: 'Edit request',
          onPressed: _busy ? null : _edit,
        ),
      if (showDelete)
        _pill(
          context: context,
          color: scheme.error,
          icon: Icons.delete_outline,
          label: 'Delete request',
          onPressed: _busy ? null : _withdraw,
        ),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.item.canEdit || widget.item.canWithdraw) ...[
          const Text(
            'You can change or withdraw this request until a doctor starts reviewing it.',
          ),
          const SizedBox(height: 12),
          if (narrow)
            Row(
              children: [
                for (var i = 0; i < buttons.length; i++) ...[
                  if (i > 0) const SizedBox(width: 8),
                  Expanded(child: buttons[i]),
                ],
              ],
            )
          else
            Align(
              alignment: Alignment.centerRight,
              child: Wrap(spacing: 8, runSpacing: 8, children: buttons),
            ),
        ],
        if (widget.allowPurge && widget.item.status == 'WITHDRAWN')
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: _busy ? null : _purge,
              icon: const Icon(Icons.delete_forever_outlined),
              label: const Text('Delete permanently'),
            ),
          ),
        if (_error != null)
          Text(_error!, style: TextStyle(color: scheme.error)),
      ],
    );
  }
}
