// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Selectors for the practice profile form: a field that opens a searchable bottom sheet, and a
// multi-select field that shows its choices as chips. Same behaviour as
// web/src/pages/doctor/practiceSelectors.tsx, with native touch patterns.
import 'package:family_veda/models/practice_options.dart';
import 'package:flutter/material.dart';

/// A read-only field that looks like the text fields around it and opens a picker when tapped.
class PickerField extends StatelessWidget {
  const PickerField({
    super.key,
    required this.label,
    required this.value,
    required this.onTap,
    this.helper,
  });

  final String label;
  final String value;
  final VoidCallback onTap;
  final String? helper;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      value: value.isEmpty ? 'Not set' : value,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: InputDecorator(
          isEmpty: value.isEmpty,
          decoration: InputDecoration(
            labelText: label,
            helperText: helper,
            helperMaxLines: 3,
            suffixIcon: const Icon(Icons.expand_more_rounded),
          ),
          child: value.isEmpty
              ? null
              : Text(value, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ),
    );
  }
}

/// Opens a searchable list. Resolves to the chosen value, to '' when the doctor clears the
/// field, or to null when the sheet is dismissed. With [customLabel] set, text that matches no
/// option can be kept as the value.
Future<String?> showOptionSheet(
  BuildContext context, {
  required String title,
  required List<PracticeOption> options,
  required String selected,
  String? customLabel,
  int maxLength = 120,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    useSafeArea: true,
    builder: (_) => _OptionSheet(
      title: title,
      options: options,
      selected: selected,
      customLabel: customLabel,
      maxLength: maxLength,
    ),
  );
}

class _OptionSheet extends StatefulWidget {
  const _OptionSheet({
    required this.title,
    required this.options,
    required this.selected,
    required this.customLabel,
    required this.maxLength,
  });

  final String title;
  final List<PracticeOption> options;
  final String selected;
  final String? customLabel;
  final int maxLength;

  @override
  State<_OptionSheet> createState() => _OptionSheetState();
}

class _OptionSheetState extends State<_OptionSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selected = widget.selected;
    final typed = _query.trim();
    final needle = typed.toLowerCase();
    // A value saved before this list existed stays selectable instead of being dropped.
    final all = <PracticeOption>[
      if (selected.isNotEmpty &&
          widget.options.every((option) => option.value != selected))
        (value: selected, group: 'Saved value'),
      ...widget.options,
    ];
    final matches = [
      for (final option in all)
        if (option.value.toLowerCase().contains(needle) ||
            (option.group?.toLowerCase().contains(needle) ?? false))
          option,
    ];
    final offerCustom =
        widget.customLabel != null &&
        typed.isNotEmpty &&
        all.every((option) => option.value.toLowerCase() != needle);

    return Padding(
      // Keeps the list and the search field above the keyboard.
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.72,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  if (selected.isNotEmpty)
                    TextButton(
                      onPressed: () => Navigator.pop(context, ''),
                      child: const Text('Clear'),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                maxLength: widget.maxLength,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: widget.customLabel == null
                      ? 'Search'
                      : 'Search or type a name',
                  prefixIcon: const Icon(Icons.search_rounded),
                  counterText: '',
                ),
                onChanged: (value) => setState(() => _query = value),
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.only(bottom: 12),
                children: [
                  if (matches.isEmpty && !offerCustom)
                    const ListTile(title: Text('No matches.')),
                  for (final option in matches)
                    ListTile(
                      title: Text(option.value),
                      subtitle: option.group == null
                          ? null
                          : Text(option.group!),
                      selected: option.value == selected,
                      trailing: option.value == selected
                          ? const Icon(Icons.check_rounded)
                          : null,
                      onTap: () => Navigator.pop(context, option.value),
                    ),
                  if (offerCustom)
                    ListTile(
                      leading: const Icon(Icons.edit_outlined),
                      title: Text('${widget.customLabel}: “$typed”'),
                      onTap: () => Navigator.pop(context, typed),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A field that opens a checkbox sheet and lists the choices as removable chips. A saved choice
/// that is no longer offered stays as a chip until the doctor removes it; it cannot be added back.
class MultiPickerField extends StatelessWidget {
  const MultiPickerField({
    super.key,
    required this.label,
    required this.options,
    required this.values,
    required this.onChanged,
    this.helper,
  });

  final String label;
  final List<String> options;
  final List<String> values;
  final ValueChanged<List<String>> onChanged;
  final String? helper;

  Future<void> _open(BuildContext context) async {
    final picked = await showModalBottomSheet<List<String>>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) =>
          _MultiSheet(title: label, options: options, initial: values),
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PickerField(
          label: label,
          value: values.join(' · '),
          helper: helper,
          onTap: () => _open(context),
        ),
        if (values.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Wrap(
              spacing: 8,
              children: [
                for (final value in values)
                  InputChip(
                    label: Text(
                      options.contains(value)
                          ? value
                          : '$value · saved earlier',
                    ),
                    deleteButtonTooltipMessage: 'Remove $value',
                    onDeleted: () => onChanged(
                      values.where((item) => item != value).toList(),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class _MultiSheet extends StatefulWidget {
  const _MultiSheet({
    required this.title,
    required this.options,
    required this.initial,
  });

  final String title;
  final List<String> options;
  final List<String> initial;

  @override
  State<_MultiSheet> createState() => _MultiSheetState();
}

class _MultiSheetState extends State<_MultiSheet> {
  late List<String> _values = [...widget.initial];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
            child: Text(
              widget.title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          for (final option in widget.options)
            CheckboxListTile(
              value: _values.contains(option),
              title: Text(option),
              controlAffinity: ListTileControlAffinity.leading,
              onChanged: (checked) => setState(
                () => _values = checked ?? false
                    ? [..._values, option]
                    : _values.where((item) => item != option).toList(),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: FilledButton(
              onPressed: () => Navigator.pop(context, _values),
              child: const Text('Done'),
            ),
          ),
        ],
      ),
    );
  }
}
