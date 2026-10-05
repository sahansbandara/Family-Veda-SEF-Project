import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/cases_provider.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/providers/members_provider.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:family_veda/widgets/shared/symptom_chip.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class SubmitComplaintScreen extends ConsumerStatefulWidget {
  const SubmitComplaintScreen({super.key});

  @override
  ConsumerState<SubmitComplaintScreen> createState() =>
      _SubmitComplaintScreenState();
}

class _SubmitComplaintScreenState extends ConsumerState<SubmitComplaintScreen> {
  static const _symptomOptions = [
    'Headache',
    'Fever',
    'Cough',
    'Sore throat',
    'Stomach ache',
    'Feeling tired',
    'Body pain',
    'Nausea',
    'Breathing difficulty',
    'Chest pain',
    'Dizziness',
    'Other symptom',
  ];

  final _scrollController = ScrollController();
  final _formKey = GlobalKey<FormState>();
  final _typedSymptomsController = TextEditingController();
  final _durationController = TextEditingController(text: '1');
  final _notesController = TextEditingController();
  final _selectedSymptoms = <String>{};

  String? _selectedMemberId;
  int _severity = 3;
  int _step = 0;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedMemberId = ref.read(activeMemberProvider);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _typedSymptomsController.dispose();
    _durationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedMemberId == null) {
      setState(() => _error = 'Please select a family member.');
      return;
    }

    final symptoms = _selectedSymptoms.toList();
    if (_typedSymptomsController.text.trim().isNotEmpty) {
      symptoms.addAll(
        _typedSymptomsController.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty),
      );
    }

    if (symptoms.isEmpty) {
      setState(() {
        _error = 'Choose a symptom or describe it in your own words.';
        _step = 0;
      });
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final caseId = await ref
          .read(patientApiProvider)
          .submitComplaint(
            memberId: _selectedMemberId!,
            chiefComplaint: symptoms.first,
            durationDays: int.parse(_durationController.text),
            severity: _severity,
            symptoms: symptoms.length > 1 ? symptoms.sublist(1) : [],
            notes: _notesController.text,
          );
      ref.invalidate(memberCasesProvider);

      // Keep activeMemberProvider in sync if user switched member
      if (ref.read(activeMemberProvider) != _selectedMemberId) {
        ref.read(activeMemberProvider.notifier).state = _selectedMemberId;
      }

      if (mounted) {
        context.go('/cases/$caseId');
      }
    } on Object catch (error) {
      if (mounted) setState(() => _error = userFacingApiError(error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(membersProvider);
    ref.watch(activeMemberProvider);

    ref.listen<String?>(activeMemberProvider, (previous, next) {
      if (previous == next) return;
      setState(() {
        _step = 0;
        _selectedMemberId = next;
        _typedSymptomsController.clear();
        _durationController.text = '1';
        _notesController.clear();
        _selectedSymptoms.clear();
        _severity = 3;
        _error = null;
      });
    });

    return Scaffold(
      appBar: AppBar(title: const Text('New symptom request')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          for (int i = 0; i < 3; i++) ...[
                            Flexible(
                              child: TextButton(
                                onPressed: i < _step
                                    ? () => setState(() => _step = i)
                                    : null,
                                child: Column(
                                  children: [
                                    CircleAvatar(
                                      radius: 12,
                                      backgroundColor: _step >= i
                                          ? Theme.of(
                                              context,
                                            ).colorScheme.primary
                                          : Theme.of(context).disabledColor
                                                .withValues(alpha: 0.2),
                                      child: Text(
                                        _step > i ? '✓' : '${i + 1}',
                                        style: TextStyle(
                                          color: _step >= i
                                              ? Theme.of(
                                                  context,
                                                ).colorScheme.onPrimary
                                              : null,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      ['Symptoms', 'Details', 'Review'][i],
                                      style: TextStyle(fontSize: 12),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (i < 2) const Expanded(child: Divider()),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              if (_step == 0) ...[
                membersAsync.when(
                  data: (members) => DropdownButtonFormField<String>(
                    initialValue: _selectedMemberId,
                    decoration: const InputDecoration(
                      labelText: 'Who is this request for?',
                      helperText:
                          'Only members you are authorized to submit for appear here.',
                    ),
                    items: members
                        .map(
                          (m) => DropdownMenuItem(
                            value: m.id,
                            child: Text(m.displayName),
                          ),
                        )
                        .toList(),
                    onChanged: (val) => setState(() => _selectedMemberId = val),
                  ),
                  loading: () => const CircularProgressIndicator(),
                  error: (_, _) => const Text('Could not load members'),
                ),
                const SizedBox(height: 24),
                const Text('What symptoms are you experiencing?'),
                const Text(
                  'Select any that apply.',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final symptom in _symptomOptions)
                      SymptomChip(
                        label: symptom,
                        selected: _selectedSymptoms.contains(symptom),
                        onSelected: (selected) => setState(() {
                          selected
                              ? _selectedSymptoms.add(symptom)
                              : _selectedSymptoms.remove(symptom);
                        }),
                      ),
                  ],
                ),
                const SizedBox(height: 24),
                TextFormField(
                  key: const Key('chief_complaint_field'),
                  controller: _typedSymptomsController,
                  maxLines: 3,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    labelText:
                        'Describe the symptoms in your own words (optional)',
                    hintText:
                        'Tell the doctor what you have noticed, when it started...',
                    alignLabelWithHint: true,
                  ),
                ),
              ],

              if (_step == 1) ...[
                Text(
                  'More about these symptoms',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('duration_field'),
                  controller: _durationController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'How many days have you had them?',
                  ),
                  validator: (value) {
                    final days = int.tryParse(value ?? '');
                    return days == null || days < 0 || days > 365
                        ? 'Enter a duration from 0 to 365 days'
                        : null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<int>(
                  initialValue: _severity,
                  decoration: const InputDecoration(
                    labelText: 'How severe do they feel?',
                  ),
                  items: const [
                    DropdownMenuItem(value: 3, child: Text('Mild')),
                    DropdownMenuItem(value: 6, child: Text('Moderate')),
                    DropdownMenuItem(value: 9, child: Text('Severe')),
                  ],
                  onChanged: (val) => setState(() => _severity = val ?? 3),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _notesController,
                  maxLines: 3,
                  maxLength: 1000,
                  decoration: const InputDecoration(
                    labelText:
                        'Anything else the doctor should know? (optional)',
                    hintText: 'Add relevant context in your own words...',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Emergency decisions are not made by this form. If you need urgent help, use emergency services.',
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              if (_step == 2) ...[
                Text(
                  'Check your request before submitting',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Family member',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          membersAsync.valueOrNull
                                  ?.where((m) => m.id == _selectedMemberId)
                                  .firstOrNull
                                  ?.displayName ??
                              'Family member',
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Symptoms and description',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Wrap(
                          spacing: 4,
                          children: [
                            ..._selectedSymptoms.map(
                              (s) => Chip(label: Text(s)),
                            ),
                            ..._typedSymptomsController.text
                                .split(',')
                                .where((s) => s.trim().isNotEmpty)
                                .map((s) => Chip(label: Text(s.trim()))),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Further details',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Duration: ${_durationController.text} days · Severity: ${_severity == 3
                              ? 'Mild'
                              : _severity == 6
                              ? 'Moderate'
                              : 'Severe'}',
                        ),
                        if (_notesController.text.trim().isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Additional context: ${_notesController.text.trim()}',
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.tertiaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.security,
                        color: Theme.of(context).colorScheme.tertiary,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'A doctor reviews this request before any guidance is shared with you.',
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],

              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (_step > 0)
                    TextButton(
                      onPressed: _submitting
                          ? null
                          : () {
                              setState(() {
                                _step--;
                                _error = null;
                              });
                            },
                      child: const Text('Back'),
                    ),
                  const SizedBox(width: 8),
                  FilledButton(
                    key: const Key('submit_complaint_button'),
                    onPressed: _submitting
                        ? null
                        : () {
                            if (_step < 2) {
                              if (_step == 0 &&
                                  _selectedSymptoms.isEmpty &&
                                  _typedSymptomsController.text
                                      .trim()
                                      .isEmpty) {
                                setState(() {
                                  _error =
                                      'Choose a symptom or describe it in your own words.';
                                });
                                return;
                              }
                              if (_step == 1 &&
                                  !(_formKey.currentState?.validate() ??
                                      false)) {
                                return;
                              }
                              FocusScope.of(context).unfocus();
                              setState(() {
                                _step++;
                                _error = null;
                              });
                              _scrollController.jumpTo(0);
                            } else {
                              _submit();
                            }
                          },
                    child: _submitting
                        ? const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            _step == 2
                                ? 'Submit for doctor review ✓'
                                : 'Continue',
                          ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                _step == 0
                    ? 'Step 1 of 3 · Select at least one symptom.'
                    : _step == 1
                    ? 'Step 2 of 3 · Add duration and details.'
                    : 'Step 3 of 3 · Confirm the summary.',
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
