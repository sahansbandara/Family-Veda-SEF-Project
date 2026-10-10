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
    this.onCheckAgain,
    this.export = saveOriginalReport,
  });

  final String fileName;
  final OriginalReportLoader load;
  final Future<bool> Function()? onDelete;

  /// Opens the existing review workspace; never starts extraction directly.
  final VoidCallback? onCheckAgain;
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

  bool _dark = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF487DBB),
      brightness: _dark ? Brightness.dark : Brightness.light,
      surface: _dark ? const Color(0xFF132033) : const Color(0xFFF6F8FC),
    );
    return Theme(
      data: theme.copyWith(colorScheme: scheme),
      child: Builder(
        builder: (context) => Dialog.fullscreen(
          child: Scaffold(
            backgroundColor: scheme.surface,
            appBar: AppBar(
              backgroundColor: scheme.surface,
              foregroundColor: scheme.onSurface,
              automaticallyImplyLeading: false,
              titleSpacing: 16,
              title: Row(
                children: [
                  const Icon(Icons.description_outlined, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.fileName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  tooltip: _dark ? 'Use light theme' : 'Use dark theme',
                  onPressed: () => setState(() => _dark = !_dark),
                  icon: Icon(
                    _dark
                        ? Icons.light_mode_outlined
                        : Icons.dark_mode_outlined,
                  ),
                ),
                IconButton(
                  tooltip: 'Close',
                  onPressed: _deleting
                      ? null
                      : () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            body: SafeArea(
              child: OriginalReportContent(
                fileName: widget.fileName,
                load: widget.load,
                export: widget.export,
                onCheckAgain: widget.onCheckAgain,
                onDelete: widget.onDelete == null ? null : _delete,
                deleting: _deleting,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Authenticated bytes are kept only while this viewer is mounted.
class OriginalReportContent extends StatefulWidget {
  const OriginalReportContent({
    super.key,
    required this.fileName,
    required this.load,
    this.export = saveOriginalReport,
    this.onCheckAgain,
    this.onDelete,
    this.deleting = false,
  });
  final VoidCallback? onCheckAgain;
  final VoidCallback? onDelete;
  final bool deleting;
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
  bool _ready = false;
  int _generation = 0;
  Route<void>? _sheetRoute;
  int _rotation = 0;
  double _zoomLevel = 1;
  Size? _imageSize;
  Size _viewport = Size.zero;
  late final PdfViewerParams _pdfParams = PdfViewerParams(
    backgroundColor: Colors.transparent,
    onViewerReady: (_, _) => _fit(),
    onPageChanged: (_) => _updatePdf(),
  );

  void _updatePdf() {
    if (mounted && _pdfController.isReady) {
      setState(() => _zoomLevel = _pdfController.currentZoom);
    }
  }

  void _updateImage() {
    if (mounted) {
      setState(() => _zoomLevel = _imageController.value.getMaxScaleOnAxis());
    }
  }

  Future<Uint8List> _load() async {
    final generation = ++_generation;
    final bytes = await widget.load();
    if (!mounted || generation != _generation) return bytes;
    if (!isPdfDocument(bytes) && bytes.isNotEmpty) {
      final stream = MemoryImage(bytes).resolve(ImageConfiguration.empty);
      late ImageStreamListener listener;
      listener = ImageStreamListener(
        (info, _) {
          if (mounted && generation == _generation) {
            _imageSize = Size(
              info.image.width.toDouble(),
              info.image.height.toDouble(),
            );
          }
          info.dispose();
          stream.removeListener(listener);
        },
        onError: (_, _) {
          stream.removeListener(listener);
        },
      );
      stream.addListener(listener);
    }
    if (mounted && generation == _generation) {
      setState(() {
        _ready = bytes.isNotEmpty;
        _pdf = isPdfDocument(bytes);
      });
    }
    return bytes;
  }

  void _reload() => setState(() {
    _ready = false;
    _rotation = 0;
    _zoomLevel = 1;
    _imageSize = null;
    _imageController.value = Matrix4.identity();
    _file = _load();
  });

  void _fit({bool width = false}) {
    if (_pdf) {
      if (!_pdfController.isReady) return;
      final page = _pdfController.pageNumber ?? 1;
      final matrix = width
          ? _pdfController.calcMatrixFitWidthForPage(pageNumber: page)
          : _pdfController.calcMatrixForFit(pageNumber: page);
      if (matrix != null) _pdfController.value = matrix;
      _updatePdf();
    } else {
      double scale = 1;
      final size = _imageSize;
      if (width && size != null && _viewport.height > 0) {
        final ratio = _rotation.isOdd
            ? size.height / size.width
            : size.width / size.height;
        final fittedWidth = (_viewport.height * ratio).clamp(
          0.0,
          _viewport.width,
        );
        if (fittedWidth > 0) {
          scale = (_viewport.width / fittedWidth).clamp(1.0, 5.0);
        }
      }
      _imageController.value = Matrix4.identity()
        ..scaleByDouble(scale, scale, 1, 1);
      setState(() => _zoomLevel = scale);
    }
  }

  void _reset() {
    setState(() => _rotation = 0);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _fit();
    });
  }

  void _sheet(List<Widget> items) => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    constraints: BoxConstraints(
      maxHeight: MediaQuery.sizeOf(context).height * .85,
    ),
    builder: (sheetContext) {
      _sheetRoute = ModalRoute.of(sheetContext);
      return SafeArea(
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: items),
        ),
      );
    },
  );

  Widget _action(IconData icon, String label, VoidCallback? action) => ListTile(
    leading: Icon(icon),
    title: Text(label),
    enabled: action != null,
    onTap: action == null
        ? null
        : () {
            if (!mounted) return;
            Navigator.of(context).pop();
            action();
          },
  );

  void _details() => _sheet([
    ListTile(
      title: const Text('Document details'),
      subtitle: Text(widget.fileName),
    ),
    ListTile(
      leading: const Icon(Icons.lock_outline),
      title: const Text('Stored original'),
      subtitle: Text(
        _ready
            ? (_pdf ? 'PDF document' : 'Report image')
            : 'Original unavailable',
      ),
    ),
    const Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Text(
        'This is the uploaded file. Extracted values are checked separately; the original is not changed.',
      ),
    ),
  ]);

  void _more() => _sheet([
    _action(Icons.fit_screen, 'Fit page', _ready ? () => _fit() : null),
    _action(
      Icons.width_normal_outlined,
      'Fit width',
      _ready ? () => _fit(width: true) : null,
    ),
    _action(
      Icons.rotate_right,
      'Rotate report',
      _ready ? () => setState(() => _rotation = (_rotation + 1) % 4) : null,
    ),
    _action(Icons.restart_alt, 'Reset view', _ready ? _reset : null),
    _action(Icons.refresh, 'Reload original', _reload),
    if (widget.onCheckAgain != null) ...[
      _action(
        Icons.document_scanner_outlined,
        'Check report again',
        widget.onCheckAgain,
      ),
      const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Text(
          'Open value review first. Confirmed values and unsaved edits cannot be rechecked.',
        ),
      ),
    ],
    if (widget.onDelete != null)
      _action(
        Icons.delete_outline,
        'Delete report',
        widget.deleting ? null : widget.onDelete,
      ),
  ]);
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
    _file = _load();
    _pdfController.addListener(_updatePdf);
    _imageController.addListener(_updateImage);
  }

  @override
  void dispose() {
    final sheet = _sheetRoute;
    if (sheet?.isActive == true) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (sheet!.isActive) sheet.navigator?.removeRoute(sheet);
      });
    }
    _pdfController.removeListener(_updatePdf);
    _imageController.removeListener(_updateImage);
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
      setState(() => _zoomLevel = next);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
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
                        onPressed: _reload,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                );
              }

              if (_pdf) {
                return RotatedBox(
                  quarterTurns: _rotation,
                  child: PdfViewer.data(
                    bytes,
                    controller: _pdfController,
                    sourceName: widget.fileName,
                    params: _pdfParams,
                  ),
                );
              }
              return LayoutBuilder(
                builder: (context, constraints) {
                  _viewport = constraints.biggest;
                  return Center(
                    child: InteractiveViewer(
                      transformationController: _imageController,
                      maxScale: 5,
                      child: SizedBox(
                        width: constraints.maxWidth,
                        height: constraints.maxHeight,
                        child: RotatedBox(
                          quarterTurns: _rotation,
                          child: Image.memory(
                            bytes,
                            fit: BoxFit.contain,
                            semanticLabel:
                                'Original report image: ${widget.fileName}',
                            errorBuilder: (_, _, _) => const Text(
                              'Original report could not be loaded.',
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
      Material(
        color: Theme.of(context).colorScheme.surface,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_pdf && _pdfController.isReady)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    tooltip: 'Previous page',
                    onPressed: (_pdfController.pageNumber ?? 1) > 1
                        ? () => _pdfController.goToPage(
                            pageNumber: (_pdfController.pageNumber ?? 1) - 1,
                          )
                        : null,
                    icon: const Icon(Icons.chevron_left),
                  ),
                  Text(
                    'Page ${_pdfController.pageNumber ?? 1} of ${_pdfController.pageCount}',
                  ),
                  IconButton(
                    tooltip: 'Next page',
                    onPressed:
                        (_pdfController.pageNumber ?? 1) <
                            _pdfController.pageCount
                        ? () => _pdfController.goToPage(
                            pageNumber: (_pdfController.pageNumber ?? 1) + 1,
                          )
                        : null,
                    icon: const Icon(Icons.chevron_right),
                  ),
                ],
              ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  tooltip: 'Save original report',
                  onPressed: _ready && !_exporting ? _export : null,
                  icon: const Icon(Icons.download_outlined),
                ),
                IconButton(
                  tooltip: 'Zoom out',
                  onPressed: _ready ? () => _zoom(false) : null,
                  icon: const Icon(Icons.remove),
                ),
                SizedBox(
                  width: 44,
                  child: Center(
                    child: Text(
                      '${(_zoomLevel * 100).round()}%',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Zoom in',
                  onPressed: _ready ? () => _zoom(true) : null,
                  icon: const Icon(Icons.add),
                ),
                IconButton(
                  tooltip: 'Document details',
                  onPressed: _details,
                  icon: const Icon(Icons.info_outline),
                ),
                IconButton(
                  tooltip: 'More actions',
                  onPressed: _more,
                  icon: const Icon(Icons.more_horiz),
                ),
              ],
            ),
          ],
        ),
      ),
    ],
  );
}
