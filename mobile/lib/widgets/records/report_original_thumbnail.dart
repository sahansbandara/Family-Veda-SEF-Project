// Protected original bytes, loaded only when the user requests a preview.
import 'dart:typed_data';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';

class ReportOriginalThumbnail extends StatefulWidget {
  const ReportOriginalThumbnail({
    super.key,
    required this.load,
    required this.fileName,
  });
  final OriginalReportLoader load;
  final String fileName;
  @override
  State<ReportOriginalThumbnail> createState() =>
      _ReportOriginalThumbnailState();
}

class _ReportOriginalThumbnailState extends State<ReportOriginalThumbnail> {
  late Future<Uint8List> _file;
  @override
  void initState() {
    super.initState();
    _file = widget.load();
  }

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 220,
    child: FutureBuilder<Uint8List>(
      future: _file,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        final bytes = snapshot.data;
        if (snapshot.hasError || bytes == null || bytes.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Original file unavailable'),
                TextButton(
                  onPressed: () => setState(() => _file = widget.load()),
                  child: const Text('Retry preview'),
                ),
              ],
            ),
          );
        }
        if (isPdfDocument(bytes)) {
          return PdfViewer.data(bytes, sourceName: widget.fileName);
        }
        return Image.memory(
          bytes,
          fit: BoxFit.contain,
          semanticLabel: 'Stored original: ${widget.fileName}',
          errorBuilder: (_, _, _) =>
              const Center(child: Text('Original file unavailable')),
        );
      },
    ),
  );
}
