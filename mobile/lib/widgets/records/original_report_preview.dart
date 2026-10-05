// Original lab-report preview (image and PDF from protected bytes). Shows the stored upload only — no interpretation (RULE 1).
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';

typedef OriginalReportLoader = Future<Uint8List> Function();

Future<void> showOriginalReportPreview(
  BuildContext context, {
  required String fileName,
  required OriginalReportLoader load,
}) => showDialog<void>(
  context: context,
  builder: (_) => OriginalReportPreviewDialog(fileName: fileName, load: load),
);

/// True when the stored original starts with the PDF signature (`%PDF-`).
bool isPdfDocument(Uint8List bytes) =>
    bytes.length >= 5 &&
    bytes[0] == 0x25 &&
    bytes[1] == 0x50 &&
    bytes[2] == 0x44 &&
    bytes[3] == 0x46 &&
    bytes[4] == 0x2D;

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
  late Future<Uint8List> _file;

  @override
  void initState() {
    super.initState();
    _file = widget.load();
  }

  void _retry() => setState(() => _file = widget.load());

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Original report'),
    contentPadding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
    content: SizedBox(
      width: double.maxFinite,
      child: FutureBuilder<Uint8List>(
        future: _file,
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
                  Text('Loading original report…'),
                ],
              ),
            );
          }
          final bytes = snapshot.data;
          if (snapshot.hasError || bytes == null || bytes.isEmpty) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Original report could not be loaded.'),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: _retry, child: const Text('Retry')),
                ],
              ),
            );
          }
          if (isPdfDocument(bytes)) {
            return SizedBox(
              height: MediaQuery.sizeOf(context).height * .7,
              child: PdfViewer.data(bytes, sourceName: widget.fileName),
            );
          }
          return InteractiveViewer(
            maxScale: 5,
            child: Image.memory(
              bytes,
              fit: BoxFit.contain,
              semanticLabel: 'Original report image: ${widget.fileName}',
              errorBuilder: (_, _, _) =>
                  const Text('Original report could not be loaded.'),
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
