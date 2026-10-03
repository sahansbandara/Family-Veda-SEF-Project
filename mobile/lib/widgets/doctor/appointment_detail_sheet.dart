// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Appointment details bottom sheet. Offers only the actions the status allows and reports a change
// only after the backend has accepted it.
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/providers/doctor_provider.dart';
import 'package:family_veda/screens/doctor/doctor_calendar_logic.dart';
import 'package:family_veda/services/api/doctor_api.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

/// Opens the sheet. Completes with a success message when the appointment changed, otherwise null.
Future<String?> showAppointmentDetailSheet(
  BuildContext context,
  Appointment appointment,
) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => AppointmentDetailSheet(appointment: appointment),
  );
}

class AppointmentDetailSheet extends ConsumerStatefulWidget {
  const AppointmentDetailSheet({super.key, required this.appointment});

  final Appointment appointment;

  @override
  ConsumerState<AppointmentDetailSheet> createState() =>
      _AppointmentDetailSheetState();
}

class _AppointmentDetailSheetState
    extends ConsumerState<AppointmentDetailSheet> {
  bool _busy = false;
  String? _error;

  Appointment get _appointment => widget.appointment;

  Future<void> _submit(
    Future<Appointment> Function(DoctorApi api) call,
    String done,
  ) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await call(ref.read(doctorApiProvider));
      if (mounted) {
        Navigator.of(
          context,
        ).pop("${_appointment.memberDisplayName}'s appointment $done.");
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = appointmentActionError(error);
      });
    }
  }

  Future<bool> _ask(String title, String body, String yes) async {
    final answer = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Go back'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(yes),
          ),
        ],
      ),
    );
    return answer ?? false;
  }

  Future<void> _run(AppointmentAction action) async {
    final id = _appointment.id;
    switch (action) {
      case AppointmentAction.confirm:
        await _submit((api) => api.confirmAppointment(id), 'confirmed');
      case AppointmentAction.complete:
        if (await _ask(
          'Complete visit?',
          'Mark this visit as completed? This cannot be undone.',
          'Yes, complete visit',
        )) {
          await _submit(
            (api) => api.completeAppointment(id),
            'marked as completed',
          );
        }
      case AppointmentAction.noShow:
        if (await _ask(
          'Mark no-show?',
          'Mark this visit as a no-show? Access granted for the visit is withdrawn.',
          'Yes, mark no-show',
        )) {
          await _submit(
            (api) => api.noShowAppointment(id),
            'marked as a no-show',
          );
        }
      case AppointmentAction.cancel:
        if (await _ask(
          'Cancel appointment?',
          'Cancel this appointment? The family will see it as cancelled.',
          'Yes, cancel appointment',
        )) {
          await _submit((api) => api.cancelAppointment(id), 'cancelled');
        }
    }
  }

  Future<void> _reschedule() async {
    final now = DateTime.now();
    final current = _appointment.startsAt;
    final date = await showDatePicker(
      context: context,
      initialDate: current.isAfter(now) ? current : now,
      firstDate: startOfDay(now),
      lastDate: addDays(now, 365),
      helpText: 'New date',
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(current),
      helpText: 'New time',
    );
    if (time == null || !mounted) return;
    final target = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    if (!target.isAfter(DateTime.now())) {
      setState(() => _error = 'Pick a date and time in the future.');
      return;
    }
    await _submit(
      (api) => api.rescheduleAppointment(_appointment.id, target),
      'moved. The family has been notified',
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final actions = allowedActions(_appointment.status);
    final reschedulable = canReschedule(_appointment.status);
    final primary = actions.contains(AppointmentAction.confirm)
        ? AppointmentAction.confirm
        : (actions.contains(AppointmentAction.complete)
              ? AppointmentAction.complete
              : null);
    final time = DateFormat.Hm();

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.9,
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          16 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Details scroll; the actions below stay pinned so they are always reachable.
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Semantics(
                      header: true,
                      child: Text(
                        'Appointment details',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: palette.heading,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        ExcludeSemantics(
                          child: CircleAvatar(
                            radius: 23,
                            backgroundColor: palette.primary.withValues(
                              alpha: 0.16,
                            ),
                            child: Text(
                              initialsOf(_appointment.memberDisplayName),
                              style: TextStyle(
                                color: palette.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _appointment.memberDisplayName,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: palette.heading,
                                ),
                              ),
                              if (_appointment.familyName != null)
                                Text(
                                  _appointment.familyName!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: palette.muted,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        StatusChip(status: _appointment.status),
                      ],
                    ),
                    Divider(height: 28, color: palette.border),
                    _DetailRow(
                      label: 'Date',
                      value: DateFormat(
                        'EEEE, d MMMM y',
                      ).format(_appointment.startsAt),
                    ),
                    _DetailRow(
                      label: 'Time',
                      value:
                          '${time.format(_appointment.startsAt)} – ${time.format(endsAt(_appointment))} (${_appointment.durationMinutes} min)',
                    ),
                    if (_appointment.doctor != null)
                      _DetailRow(
                        label: 'Doctor',
                        value: _appointment.doctor!.displayName,
                      ),
                    _DetailRow(
                      label: 'Reference',
                      value: _appointment.id.length > 8
                          ? _appointment.id.substring(0, 8)
                          : _appointment.id,
                    ),
                    const SizedBox(height: 6),
                    _InfoBox(
                      title: 'Reason for visit',
                      body: _appointment.reason,
                    ),
                    if ((_appointment.doctorNote ?? '').isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _InfoBox(
                        title: 'Your note',
                        body: _appointment.doctorNote!,
                      ),
                    ],
                    const SizedBox(height: 12),
                    Text(
                      "Clinical records open only while a visit or case grant and the member's consent allow it.",
                      style: TextStyle(fontSize: 12, color: palette.muted),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            if (_error != null) ...[
              Semantics(
                liveRegion: true,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: palette.danger.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: palette.danger.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Text(
                    _error!,
                    style: TextStyle(color: palette.danger, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            if (_busy)
              const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: LinearProgressIndicator(),
              ),
            if (actions.isEmpty && !reschedulable)
              Text(
                'This appointment is closed. No further changes are available.',
                style: TextStyle(fontSize: 13, color: palette.muted),
              )
            else ...[
              if (primary != null)
                FilledButton(
                  onPressed: _busy ? null : () => _run(primary),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: Text(
                    primary == AppointmentAction.confirm
                        ? 'Confirm appointment'
                        : 'Complete visit',
                  ),
                ),
              if (reschedulable) ...[
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: _busy ? null : _reschedule,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: const Text('Reschedule'),
                ),
              ],
              const SizedBox(height: 4),
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                children: [
                  if (actions.contains(AppointmentAction.noShow))
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () => _run(AppointmentAction.noShow),
                      style: TextButton.styleFrom(
                        foregroundColor: palette.warning,
                        minimumSize: const Size(48, 48),
                      ),
                      child: const Text('Mark no-show'),
                    ),
                  if (actions.contains(AppointmentAction.cancel))
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () => _run(AppointmentAction.cancel),
                      style: TextButton.styleFrom(
                        foregroundColor: palette.danger,
                        minimumSize: const Size(48, 48),
                      ),
                      child: const Text('Cancel appointment'),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: MergeSemantics(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 88,
              child: Text(
                label,
                style: TextStyle(fontSize: 13, color: palette.muted),
              ),
            ),
            Expanded(
              child: Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: palette.heading,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  const _InfoBox({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: palette.surfaceSubtle,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: palette.heading,
            ),
          ),
          const SizedBox(height: 4),
          Text(body, style: TextStyle(fontSize: 14, color: palette.text)),
        ],
      ),
    );
  }
}
