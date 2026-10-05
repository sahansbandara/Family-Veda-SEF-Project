// Original lab-report preview (image and PDF from protected bytes). Shows the stored upload only — no interpretation (RULE 1).
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:pdfrx/pdfrx.dart';

typedef OriginalReportExporter =
    Future<Uri?> Function(String name, Uint8List bytes);

Future<Uri?> saveOriginalReport(String name, Uint8List bytes) =>
    FilePicker.saveFile(
      dialogTitle: 'Save original report',
      fileName: name
          .split(RegExp(r'[/\\]'))
          .last
          .replaceAll(RegExp(r'[<>:"|?*]'), '_'),
      bytes: bytes,
    );

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
    this.onDelete,
    this.export = saveOriginalReport,
  });

  final String fileName;
  final OriginalReportLoader load;
  final Future<bool> Function()? onDelete;
  final OriginalReportExporter export;

  @override
  State<OriginalReportPreviewDialog> createState() =>
      _OriginalReportPreviewDialogState();
}

class _OriginalReportPreviewDialogState
    extends State<OriginalReportPreviewDialog> {
  bool _deleting = false;
  Future<void> _delete() async {
    setState(() => _deleting = true);
    try {
      final removed = await widget.onDelete!();
      if (removed && mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) => Dialog.fullscreen(
    child: Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Original report'),
            Text(
              widget.fileName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          if (widget.onDelete != null)
            IconButton(
              tooltip: 'Delete report',
              onPressed: _deleting ? null : _delete,
              icon: const Icon(Icons.delete_outline),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
      body: SafeArea(
        child: OriginalReportContent(
          fileName: widget.fileName,
          load: widget.load,
          export: widget.export,
        ),
      ),
    ),
  );
}

/// Authenticated bytes are kept only while this viewer is mounted.
class OriginalReportContent extends StatefulWidget {
  const OriginalReportContent({
    super.key,
    required this.fileName,
    required this.load,
    this.export = saveOriginalReport,
  });
  final String fileName;
  final OriginalReportLoader load;
  final OriginalReportExporter export;
  @override
  State<OriginalReportContent> createState() => _OriginalReportContentState();
}

class _OriginalReportContentState extends State<OriginalReportContent> {
  late Future<Uint8List> _file;
  final _imageController = TransformationController();
  final _pdfController = PdfViewerController();
  bool _pdf = false;
  bool _exporting = false;
  Future<void> _export() async {
    setState(() => _exporting = true);
    try {
      final bytes = await _file;
      if (!mounted) return;
      if (bytes.isEmpty) throw StateError('Original unavailable');
      final path = await widget.export(widget.fileName, bytes);
      if (mounted && path != null) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Original report saved.')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not save the original report. Retry.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _file = widget.load();
  }

  @override
  void dispose() {
    _imageController.dispose();
    super.dispose();
  }

  void _zoom(bool increase) {
    if (_pdf) {
      if (!_pdfController.isReady) return;
      if (increase) {
        _pdfController.zoomUp();
      } else {
        _pdfController.zoomDown();
      }
    } else {
      final scale = _imageController.value.getMaxScaleOnAxis();
      final next = (scale * (increase ? 1.3 : 1 / 1.3)).clamp(1.0, 5.0);
      _imageController.value = Matrix4.identity()
        ..scaleByDouble(next, next, 1, 1);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Stored original · Pinch to zoom',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
            IconButton(
              tooltip: 'Save original report',
              onPressed: _exporting ? null : _export,
              icon: const Icon(Icons.download_outlined),
            ),
            IconButton(
              tooltip: 'Zoom out',
              onPressed: () => _zoom(false),
              icon: const Icon(Icons.remove),
            ),
            IconButton(
              tooltip: 'Zoom in',
              onPressed: () => _zoom(true),
              icon: const Icon(Icons.add),
            ),
            IconButton(
              tooltip: 'Reload original',
              onPressed: () => setState(() {
                _imageController.value = Matrix4.identity();
                _file = widget.load();
              }),
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
      ),
      Expanded(
        child: ColoredBox(
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          child: FutureBuilder<Uint8List>(
            future: _file,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(strokeWidth: 2),
                      SizedBox(height: 12),
                      Text('Loading original report…'),
                    ],
                  ),
                );
              }
              final bytes = snapshot.data;
              if (snapshot.hasError || bytes == null || bytes.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Original report could not be loaded.'),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () => setState(() => _file = widget.load()),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                );
              }
              _pdf = isPdfDocument(bytes);
              if (_pdf) {
                return PdfViewer.data(
                  bytes,
                  controller: _pdfController,
                  sourceName: widget.fileName,
                );
              }
              return Center(
                child: InteractiveViewer(
                  transformationController: _imageController,
                  maxScale: 5,
                  child: Image.memory(
                    bytes,
                    fit: BoxFit.contain,
                    semanticLabel: 'Original report image: ${widget.fileName}',
                    errorBuilder: (_, _, _) =>
                        const Text('Original report could not be loaded.'),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    ],
  );
}
