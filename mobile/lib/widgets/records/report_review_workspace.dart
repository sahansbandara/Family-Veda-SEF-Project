import 'package:family_veda/models/lab_report.dart';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:family_veda/widgets/records/report_progress.dart';
import 'package:flutter/material.dart';

typedef ReportDetailLoader = Future<Map<String, dynamic>> Function();
typedef ReportReviewSaver =
    Future<Map<String, dynamic>> Function(Map<String, dynamic> body);

/// Manual verification of extracted evidence. This never generates clinical advice.
class ReportReviewWorkspace extends StatefulWidget {
  const ReportReviewWorkspace({
    super.key,
    required this.report,
    required this.loadDetail,
    required this.loadOriginal,
    required this.save,
    this.readAgain,
  });
  final LabReport report;
  final ReportDetailLoader loadDetail;
  final OriginalReportLoader loadOriginal;
  final ReportReviewSaver save;
  final Future<void> Function()? readAgain;
  @override
  State<ReportReviewWorkspace> createState() => _ReportReviewWorkspaceState();
}

class _ReportReviewWorkspaceState extends State<ReportReviewWorkspace> {
  final _form = GlobalKey<FormState>();
  List<_ValueDraft> _values = [];
  List<Map<String, dynamic>> _flags = [];
  final Set<String> _selectedFlags = {};
  bool _loading = true,
      _saving = false,
      _dirty = false,
      _confirmed = false,
      _allowPop = false;
  String? _message;
  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final value in _values) {
      value.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      final detail = await widget.loadDetail();
      if (!mounted) return;
      final values = (detail['values'] as List).cast<Map<String, dynamic>>();
      final flags = (detail['flags'] as List).cast<Map<String, dynamic>>();
      // Validate before replacing the previous state; malformed responses are errors.
      final drafts = values.map(_ValueDraft.new).toList();
      for (final old in _values) {
        old.dispose();
      }
      setState(() {
        _values = drafts;
        _flags = flags;
        _selectedFlags.clear();
        _selectedFlags.addAll(
          flags
              .where((f) => f['manuallyConfirmed'] == true)
              .map((f) => f['id'] as String),
        );
        _confirmed =
            values.isNotEmpty &&
            values.every((v) => v['wasManuallyConfirmed'] == true);
        _dirty = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _message = 'Values could not be loaded. Retry.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _close() async {
    if (_saving) return;
    if (_dirty || !_confirmed) {
      final leave = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Leave this review?'),
          content: const Text(
            'These values have not been confirmed. Unsaved changes will be lost if you leave.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Continue reviewing'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Leave without confirming'),
            ),
          ],
        ),
      );
      if (leave != true || !mounted) return;
    }
    setState(() => _allowPop = true);
    // Rebuild PopScope before popping so native back and the close button agree.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) Navigator.of(context).pop();
    });
  }

  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    for (final value in _values) {
      final low = double.tryParse(value.low.text),
          high = double.tryParse(value.high.text);
      if (low != null && high != null && low > high) {
        setState(
          () => _message = 'Reference low cannot exceed reference high.',
        );
        return;
      }
    }
    setState(() {
      _saving = true;
      _message = null;
    });
    try {
      await widget.save({
        'values': _values.map((v) => v.payload()).toList(),
        'confirmedFlagIds': _selectedFlags.toList(),
      });
      if (mounted) {
        setState(() {
          _confirmed = true;
          _dirty = false;
          _message = 'Values confirmed';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _message =
              'Could not save. Your changes are still here. Retry when ready.',
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _readAgain() async {
    if (_saving || _dirty || _confirmed || widget.readAgain == null) return;
    setState(() {
      _saving = true;
      _message = null;
    });
    try {
      await widget.readAgain!();
      if (mounted) await _load();
    } catch (_) {
      if (mounted) {
        setState(
          () => _message =
              'Reading could not finish. Retry or compare the original report.',
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _original() => widget.report.hasOriginalFile
      ? OriginalReportContent(
          fileName: widget.report.fileName,
          load: widget.loadOriginal,
        )
      : const Center(child: Text('Original not stored'));

  Widget _fields() => _loading
      ? const Center(child: CircularProgressIndicator())
      : Form(
          key: _form,
          onChanged: () {
            if (!_dirty) setState(() => _dirty = true);
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Check every value',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'Compare each item with the original report. Reference intervals alone do not determine your health. These are recorded values, not a diagnosis.',
              ),
              const SizedBox(height: 16),
              if (_values.isEmpty)
                const Text('No values are available to check yet.'),
              if (_values.isEmpty &&
                  _message == 'Values could not be loaded. Retry.')
                OutlinedButton(
                  onPressed: _load,
                  child: const Text('Retry values'),
                ),
              for (final value in _values)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Reported item ${_values.indexOf(value) + 1}',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 12),
                        _field(value.analyte, 'Analyte', max: 120),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _field(
                                value.value,
                                'Value',
                                numeric: true,
                                fieldKey: ValueKey('value-${value.id}'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _field(value.unit, 'Unit', max: 32),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _field(
                                value.low,
                                'Reference low',
                                numeric: true,
                                optional: true,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _field(
                                value.high,
                                'Reference high',
                                numeric: true,
                                optional: true,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              if (_flags.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'Potential hereditary screening flags',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Text(
                  'Confirm only source-supported statements. Screening flags are not diagnoses.',
                ),
                for (final flag in _flags)
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${flag['conditionCode']}: ${flag['finding']}'),
                    value: _selectedFlags.contains(flag['id']),
                    onChanged: _saving
                        ? null
                        : (selected) => setState(() {
                            _dirty = true;
                            if (selected == true) {
                              _selectedFlags.add(flag['id'] as String);
                            } else {
                              _selectedFlags.remove(flag['id']);
                            }
                          }),
                  ),
              ],
              if (_message != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(_message!, semanticsLabel: _message),
                ),
              const SizedBox(height: 16),
              if (_values.isNotEmpty)
                FilledButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: const Icon(Icons.check),
                  label: Text(_saving ? 'Saving…' : 'Confirm values'),
                ),
              if (widget.readAgain != null && !_confirmed)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: OutlinedButton(
                    onPressed: _saving || _dirty ? null : _readAgain,
                    child: const Text('Read report again'),
                  ),
                ),
            ],
          ),
        );

  Widget _field(
    TextEditingController controller,
    String label, {
    bool numeric = false,
    bool optional = false,
    int? max,
    Key? fieldKey,
  }) => TextFormField(
    key: fieldKey,
    controller: controller,
    enabled: !_saving,
    maxLength: max,
    decoration: InputDecoration(
      labelText: label,
      counterText: '',
      border: const OutlineInputBorder(),
    ),
    keyboardType: numeric
        ? const TextInputType.numberWithOptions(decimal: true, signed: true)
        : TextInputType.text,
    validator: (text) {
      final input = (text ?? '').trim();
      if (optional && input.isEmpty) return null;
      if (input.isEmpty) return 'Required';
      if (numeric && (double.tryParse(input)?.isFinite != true)) {
        return 'Enter a number';
      }
      if (max != null && input.length > max) return 'Too long';
      return null;
    },
  );

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: _allowPop,
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop) _close();
    },
    child: LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 800;
        return DefaultTabController(
          length: 2,
          initialIndex: 1,
          child: Scaffold(
            appBar: AppBar(
              automaticallyImplyLeading: false,
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Check values'),
                  Text(
                    widget.report.fileName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              actions: [
                IconButton(
                  tooltip: 'Close review',
                  onPressed: _saving ? null : _close,
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            body: SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: ReportProgress(
                      status: widget.report.ocrStatus,
                      confirmed: _confirmed && !_dirty,
                    ),
                  ),
                  if (!wide)
                    const TabBar(
                      tabs: [
                        Tab(text: 'Report'),
                        Tab(text: 'Values'),
                      ],
                    ),
                  Expanded(
                    child: wide
                        ? Row(
                            children: [
                              Expanded(child: _original()),
                              const VerticalDivider(width: 1),
                              Expanded(child: _fields()),
                            ],
                          )
                        : TabBarView(children: [_original(), _fields()]),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    ),
  );
}

class _ValueDraft {
  _ValueDraft(Map<String, dynamic> value)
    : id = value['id'] as String,
      analyte = TextEditingController(text: value['analyte'] as String),
      value = TextEditingController(text: '${value['value']}'),
      unit = TextEditingController(text: value['unit'] as String),
      low = TextEditingController(
        text: value['referenceLow']?.toString() ?? '',
      ),
      high = TextEditingController(
        text: value['referenceHigh']?.toString() ?? '',
      );
  final String id;
  final TextEditingController analyte, value, unit, low, high;
  Map<String, dynamic> payload() => {
    'id': id,
    'analyte': analyte.text.trim(),
    'value': double.parse(value.text.trim()),
    'unit': unit.text.trim(),
    'referenceLow': double.tryParse(low.text.trim()),
    'referenceHigh': double.tryParse(high.text.trim()),
  };
  void dispose() {
    for (final controller in [analyte, value, unit, low, high]) {
      controller.dispose();
    }
  }
}
