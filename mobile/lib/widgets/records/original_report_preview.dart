// Phase 2 (S2): original lab-report image preview. Shows the stored upload only — no interpretation (RULE 1).
import 'dart:typed_data';

import 'package:flutter/material.dart';

typedef OriginalReportLoader = Future<Uint8List> Function();

Future<void> showOriginalReportPreview(
  BuildContext context, {
  required String fileName,
  required OriginalReportLoader load,
}) => showDialog<void>(
  context: context,
  builder: (_) => OriginalReportPreviewDialog(fileName: fileName, load: load),
);

class OriginalReportPreviewDialog extends StatefulWidget {
  const OriginalReportPreviewDialog({
    super.key,
    required this.fileName,
    required this.load,
  });

  final String fileName;
  final OriginalReportLoader load;

  @override
  State<OriginalReportPreviewDialog> createState() =>
      _OriginalReportPreviewDialogState();
}

class _OriginalReportPreviewDialogState
    extends State<OriginalReportPreviewDialog> {
  late final Future<Uint8List> _image = widget.load();

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Original report image'),
    contentPadding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
    content: SizedBox(
      width: double.maxFinite,
      child: FutureBuilder<Uint8List>(
        future: _image,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox.square(
                    dimension: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 12),
                  Text('Loading original image…'),
                ],
              ),
            );
          }
          final bytes = snapshot.data;
          if (snapshot.hasError || bytes == null || bytes.isEmpty) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text('Original image could not be loaded.'),
            );
          }
          return InteractiveViewer(
            maxScale: 5,
            child: Image.memory(
              bytes,
              fit: BoxFit.contain,
              semanticLabel: 'Original report image: ${widget.fileName}',
              errorBuilder: (_, _, _) =>
                  const Text('Original image could not be loaded.'),
            ),
          );
        },
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Close'),
      ),
    ],
  );
}
