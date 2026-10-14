// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// What a doctor can do after acknowledging an emergency referral: book a follow-up, share their
// contact number, or close the referral. The backend checks the case grant on every call; nothing
// here releases AI output or changes the referral the patient was given.
import 'package:family_veda/models/doctor_queue_case.dart';
import 'package:family_veda/providers/doctor_cases_provider.dart';
import 'package:family_veda/services/api/doctor_cases_api.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

enum _Mode { idle, book, share, close }

const _durations = [15, 30, 45, 60];
const _defaultReason = 'Follow-up after urgent care referral';

/// Pops the enclosing sheet with a sentence describing the saved action.
class EmergencyFollowUpPanel extends ConsumerStatefulWidget {
  const EmergencyFollowUpPanel({super.key, required this.item});

  final DoctorQueueCase item;

  @override
  ConsumerState<EmergencyFollowUpPanel> createState() =>
      _EmergencyFollowUpPanelState();
}

class _EmergencyFollowUpPanelState
    extends ConsumerState<EmergencyFollowUpPanel> {
  final _reason = TextEditingController(text: _defaultReason);
  _Mode _mode = _Mode.idle;
  DateTime? _startsAt;
  int _duration = 30;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  void _show(_Mode mode) => setState(() {
    _mode = mode;
    _error = null;
  });

  Future<void> _run(
    Future<void> Function(DoctorCasesApi api) request, {
    required String done,
    required String fallback,
  }) async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await request(ref.read(doctorCasesApiProvider));
      if (mounted) Navigator.of(context).pop(done);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = followUpErrorMessage(error, fallback);
      });
    }
  }

  Future<void> _pickTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _startsAt ?? now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(
        _startsAt ?? DateTime(now.year, now.month, now.day, 9),
      ),
    );
    if (time == null || !mounted) return;
    setState(() {
      _startsAt = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
      _error = null;
    });
  }

  void _book() {
    final startsAt = _startsAt;
    if (startsAt == null) {
      setState(() => _error = 'Choose a date and time for the appointment.');
      return;
    }
    if (!startsAt.isAfter(DateTime.now())) {
      setState(() => _error = 'Choose a time in the future.');
      return;
    }
    _run(
      (api) => api.bookFollowUp(
        widget.item.id,
        startsAt: startsAt,
        durationMinutes: _duration,
        reason: _reason.text,
      ),
      done:
          'Follow-up appointment booked for case ${widget.item.reference}. The patient was notified and can cancel it.',
      fallback:
          'The appointment was not booked. Nothing was changed. Try again.',
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final caption = TextStyle(color: palette.muted, fontSize: 12, height: 1.4);
    final reference = widget.item.reference;

    Widget cancel() => OutlinedButton(
      key: const ValueKey('follow-up-cancel'),
      onPressed: _saving ? null : () => _show(_Mode.idle),
      child: const Text('Cancel'),
    );

    final children = switch (_mode) {
      _Mode.idle => [
        FilledButton(
          key: const ValueKey('follow-up-book'),
          onPressed: () => _show(_Mode.book),
          child: const Text('Book Follow-up Appointment'),
        ),
        OutlinedButton(
          key: const ValueKey('follow-up-share'),
          onPressed: () => _show(_Mode.share),
          child: const Text('Share My Contact Number'),
        ),
        OutlinedButton(
          key: const ValueKey('follow-up-close'),
          onPressed: () => _show(_Mode.close),
          child: const Text('Mark Referral Closed'),
        ),
      ],
      _Mode.book => [
        OutlinedButton.icon(
          key: const ValueKey('follow-up-pick-time'),
          onPressed: _saving ? null : _pickTime,
          icon: const Icon(Icons.event_rounded),
          label: Text(
            _startsAt == null
                ? 'Choose date and time'
                : DateFormat('EEE, MMM d · h:mm a').format(_startsAt!),
          ),
        ),
        DropdownButtonFormField<int>(
          initialValue: _duration,
          decoration: const InputDecoration(labelText: 'Duration'),
          items: [
            for (final minutes in _durations)
              DropdownMenuItem(value: minutes, child: Text('$minutes minutes')),
          ],
          onChanged: _saving
              ? null
              : (value) => setState(() => _duration = value ?? 30),
        ),
        TextField(
          controller: _reason,
          maxLength: 200,
          enabled: !_saving,
          decoration: const InputDecoration(
            labelText: 'Reason shown to the patient',
          ),
        ),
        Text(
          'The appointment is confirmed at once and the patient can cancel it. It does not give you access to the patient\'s records.',
          style: caption,
        ),
        FilledButton(
          key: const ValueKey('follow-up-confirm'),
          onPressed: _saving ? null : _book,
          child: Text(_saving ? 'Booking…' : 'Confirm Appointment'),
        ),
        cancel(),
      ],
      _Mode.share => [
        Text(
          'Sends the phone number on your profile to this patient, with a reminder that it does not replace urgent in-person care. This cannot be undone.',
          style: caption,
        ),
        FilledButton(
          key: const ValueKey('follow-up-confirm'),
          onPressed: _saving
              ? null
              : () => _run(
                  (api) => api.shareContact(widget.item.id),
                  done:
                      'Your contact number was sent to the patient for case $reference.',
                  fallback:
                      'Your contact was not shared. Nothing was changed. Try again.',
                ),
          child: Text(_saving ? 'Sending…' : 'Send My Number'),
        ),
        cancel(),
      ],
      _Mode.close => [
        Text(
          'Closing removes this referral from the Emergency queue for every doctor. The patient still sees the referral to in-person care. This cannot be undone.',
          style: caption,
        ),
        FilledButton(
          key: const ValueKey('follow-up-confirm'),
          onPressed: _saving
              ? null
              : () => _run(
                  (api) => api.closeReferral(widget.item.id),
                  done:
                      'Referral $reference closed. It moved to Completed. The patient still sees the referral to in-person care.',
                  fallback:
                      'The referral was not closed. Nothing was changed. Try again.',
                ),
          child: Text(_saving ? 'Closing…' : 'Close Referral'),
        ),
        cancel(),
      ],
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null) ...[
          Container(
            key: const ValueKey('follow-up-error'),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: palette.warning.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: palette.warning),
            ),
            child: Text(
              _error!,
              style: TextStyle(color: palette.text, fontSize: 13),
            ),
          ),
          const SizedBox(height: 8),
        ],
        for (final (index, child) in children.indexed) ...[
          if (index > 0) const SizedBox(height: 8),
          child,
        ],
      ],
    );
  }
}
