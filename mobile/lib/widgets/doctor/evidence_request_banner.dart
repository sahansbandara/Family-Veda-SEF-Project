// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'dart:async';

import 'package:family_veda/models/evidence_request.dart';
import 'package:family_veda/providers/evidence_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const evidenceChallengeText =
    'Someone has claimed your SLMC number. Upload evidence within 3 days or your account will be suspended.';
const evidenceAdminText =
    'An administrator needs evidence that you hold this SLMC number.';

String formatCountdown(Duration d) {
  if (d.isNegative) return '0d 0h 0m 0s';
  return '${d.inDays}d ${d.inHours % 24}h ${d.inMinutes % 60}m ${d.inSeconds % 60}s';
}

/// Shows the first open evidence request. Hidden when none, while loading, or on error.
class EvidenceRequestBanner extends ConsumerWidget {
  const EvidenceRequestBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requests = ref.watch(evidenceRequestsProvider).valueOrNull;
    final open = requests?.where((r) => r.isOpen).firstOrNull;
    if (open == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: _BannerCard(key: ValueKey(open.id), request: open),
    );
  }
}

class _BannerCard extends ConsumerStatefulWidget {
  const _BannerCard({super.key, required this.request});

  final EvidenceRequest request;

  @override
  ConsumerState<_BannerCard> createState() => _BannerCardState();
}

class _BannerCardState extends ConsumerState<_BannerCard> {
  Timer? _timer;
  late Duration _left;
  String? _busyKind;
  String? _error;

  @override
  void initState() {
    super.initState();
    _left = widget.request.dueAt.difference(DateTime.now());
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _left = widget.request.dueAt.difference(DateTime.now()));
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _pickAndUpload(String kind) async {
    setState(() => _error = null);
    try {
      final file = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: const ['pdf', 'png', 'jpg', 'jpeg'],
      );
      final path = file?.path;
      if (file == null || path == null) return;
      final size = await file.length();
      if (size == null || size > 5242880) {
        if (mounted) {
          setState(() => _error = 'Choose a PDF, PNG or JPEG up to 5 MB.');
        }
        return;
      }
      if (!mounted) return;
      setState(() => _busyKind = kind);
      await ref
          .read(evidenceApiProvider)
          .upload(
            requestId: widget.request.id,
            kind: kind,
            path: path,
            fileName: file.name,
          );
      ref.invalidate(evidenceRequestsProvider);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Upload failed. Check the file and try again.');
      }
    } finally {
      if (mounted) setState(() => _busyKind = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.request;
    final scheme = Theme.of(context).colorScheme;
    final color = r.isChallenge ? scheme.error : scheme.primary;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.gpp_maybe_outlined, color: color),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  r.isChallenge ? evidenceChallengeText : evidenceAdminText,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          if (r.note != null && r.note!.trim().isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(r.note!),
          ],
          const SizedBox(height: 8),
          Text(
            'Time left: ${formatCountdown(_left)}',
            key: const Key('evidence-countdown'),
            style: TextStyle(fontWeight: FontWeight.w700, color: color),
          ),
          const SizedBox(height: 8),
          for (final kind in r.requestedItems)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: _KindRow(
                label: evidenceKindLabels[kind] ?? kind,
                done: r.hasFileFor(kind),
                busy: _busyKind == kind,
                disabled: _busyKind != null,
                onPressed: () => _pickAndUpload(kind),
              ),
            ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: scheme.error)),
          ],
        ],
      ),
    );
  }
}

class _KindRow extends StatelessWidget {
  const _KindRow({
    required this.label,
    required this.done,
    required this.busy,
    required this.disabled,
    required this.onPressed,
  });

  final String label;
  final bool done;
  final bool busy;
  final bool disabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => Wrap(
    crossAxisAlignment: WrapCrossAlignment.center,
    spacing: 8,
    runSpacing: 4,
    children: [
      Icon(
        done ? Icons.check_circle : Icons.radio_button_unchecked,
        size: 20,
        color: done ? Colors.green : null,
      ),
      Text(label),
      OutlinedButton(
        style: OutlinedButton.styleFrom(minimumSize: const Size(48, 44)),
        onPressed: disabled ? null : onPressed,
        child: busy
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(done ? 'Replace' : 'Upload'),
      ),
    ],
  );
}
