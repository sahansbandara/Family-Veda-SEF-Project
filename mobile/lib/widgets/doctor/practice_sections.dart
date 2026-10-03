// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// The two form sections of the doctor Profile & Availability screen: the practice profile and
// time off. They collect input only; the screen owns the API calls.
import 'package:family_veda/models/doctor_practice.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:family_veda/widgets/doctor/practice_parts.dart';
import 'package:flutter/material.dart';

class PracticeProfileForm extends StatefulWidget {
  const PracticeProfileForm({
    super.key,
    required this.profile,
    required this.busy,
    required this.onSave,
  });

  final DoctorPracticeProfile profile;
  final bool busy;
  final ValueChanged<PracticeProfileUpdate> onSave;

  @override
  State<PracticeProfileForm> createState() => _PracticeProfileFormState();
}

class _PracticeProfileFormState extends State<PracticeProfileForm> {
  // (label, max length, hint, controller) in the order the web form lists them.
  late final _fields = [
    ('Specialty', 120, null, _text(widget.profile.specialty)),
    ('Hospital / Clinic', 120, null, _text(widget.profile.clinic)),
    ('City', 60, null, _text(widget.profile.city)),
    ('District', 60, null, _text(widget.profile.district)),
    ('Languages', 120, 'Sinhala, English', _text(widget.profile.languages)),
    (
      'Consultation modes',
      60,
      'In-person',
      _text(widget.profile.consultationModes),
    ),
    (
      'Professional phone',
      32,
      'Add professional contact',
      _text(widget.profile.phoneNumber),
    ),
  ];
  late bool _accepting = widget.profile.acceptingNewFamilies;
  late int _slotMinutes = widget.profile.slotMinutes;

  static TextEditingController _text(String? value) =>
      TextEditingController(text: value ?? '');

  @override
  void dispose() {
    for (final field in _fields) {
      field.$4.dispose();
    }
    super.dispose();
  }

  String? _value(int index) {
    final text = _fields[index].$4.text.trim();
    return text.isEmpty ? null : text;
  }

  void _save() => widget.onSave(
    PracticeProfileUpdate(
      specialty: _value(0),
      clinic: _value(1),
      city: _value(2),
      district: _value(3),
      languages: _value(4),
      consultationModes: _value(5),
      phoneNumber: _value(6),
      acceptingNewFamilies: _accepting,
      slotMinutes: _slotMinutes,
    ),
  );

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final profile = widget.profile;
    final tone = profile.isVerified ? palette.success : palette.warning;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Practice Profile',
          subtitle: 'Details families see when discovering a doctor.',
        ),
        const SizedBox(height: 12),
        WorkspaceCard(
          child: Row(
            children: [
              InitialsAvatar(name: profile.displayName, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.displayName,
                      style: TextStyle(
                        color: palette.heading,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (profile.email != null)
                      Text(
                        profile.email!,
                        style: TextStyle(color: palette.muted, fontSize: 12.5),
                      ),
                    Text(
                      'SLMC ••••${profile.registrationLastFour}',
                      style: TextStyle(color: palette.muted, fontSize: 12.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              AccessPill(label: profile.verificationStatus, color: tone),
            ],
          ),
        ),
        const SizedBox(height: 14),
        for (final (label, maxLength, hint, controller) in _fields) ...[
          TextField(
            controller: controller,
            maxLength: maxLength,
            keyboardType: label == 'Professional phone'
                ? TextInputType.phone
                : TextInputType.text,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(
              labelText: label,
              hintText: hint,
              counterText: '',
            ),
          ),
          const SizedBox(height: 12),
        ],
        DropdownButtonFormField<int>(
          initialValue: slotLengthOptions.contains(_slotMinutes)
              ? _slotMinutes
              : null,
          decoration: const InputDecoration(labelText: 'Appointment length'),
          items: [
            for (final minutes in slotLengthOptions)
              DropdownMenuItem(value: minutes, child: Text('$minutes minutes')),
          ],
          onChanged: (value) =>
              setState(() => _slotMinutes = value ?? _slotMinutes),
        ),
        const SizedBox(height: 12),
        WorkspaceCard(
          padding: EdgeInsets.zero,
          child: SwitchListTile(
            value: _accepting,
            onChanged: (value) => setState(() => _accepting = value),
            title: const Text('Accepting new families'),
            subtitle: const Text(
              'Allow new families to request you as their primary doctor.',
            ),
          ),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: widget.busy ? null : _save,
          child: const Text('Save profile changes'),
        ),
      ],
    );
  }
}

class TimeOffSection extends StatefulWidget {
  const TimeOffSection({
    super.key,
    required this.blocked,
    required this.busy,
    required this.onBlock,
    required this.onUnblock,
  });

  final List<BlockedTime> blocked;
  final bool busy;

  /// Resolves true when the period was saved, so the form can clear itself.
  final Future<bool> Function(DateTime from, DateTime to, String reason)
  onBlock;
  final ValueChanged<BlockedTime> onUnblock;

  @override
  State<TimeOffSection> createState() => _TimeOffSectionState();
}

class _TimeOffSectionState extends State<TimeOffSection> {
  final _reason = TextEditingController();
  DateTime? _from;
  DateTime? _to;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _pick({required bool from}) async {
    final today = DateUtils.dateOnly(DateTime.now());
    final seed =
        (from ? _from : _to ?? _from) ?? today.add(const Duration(days: 1));
    final date = await showDatePicker(
      context: context,
      initialDate: seed.isBefore(today) ? today : seed,
      firstDate: today,
      lastDate: today.add(const Duration(days: 730)),
      helpText: from ? 'Blocked from' : 'Blocked until',
    );
    if (date == null || !mounted) return;
    final current = from ? _from : _to;
    final minutes = await pickClockMinutes(
      context,
      initial: current != null
          ? current.hour * 60 + current.minute
          : (from ? 9 : 17) * 60,
      helpText: from ? 'Start time' : 'End time',
    );
    if (minutes == null || !mounted) return;
    final moment = DateTime(
      date.year,
      date.month,
      date.day,
      minutes ~/ 60,
      minutes % 60,
    );
    setState(() => from ? _from = moment : _to = moment);
  }

  Future<void> _submit() async {
    final saved = await widget.onBlock(_from!, _to!, _reason.text.trim());
    if (!saved || !mounted) return;
    _reason.clear();
    setState(() => _from = _to = null);
  }

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final ordered = _from != null && _to != null && _to!.isAfter(_from!);
    Widget moment(String label, DateTime? value, bool from) => OutlinedButton(
      onPressed: () => _pick(from: from),
      style: OutlinedButton.styleFrom(
        alignment: Alignment.centerLeft,
        minimumSize: const Size.fromHeight(52),
      ),
      child: Text(
        value == null
            ? '$label · choose date and time'
            : '$label · ${formatMoment(value)}',
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading(
          title: 'Time Off & Blocked Periods',
          subtitle:
              'Block holidays, leave and unavailable periods without editing your recurring hours.',
        ),
        const SizedBox(height: 12),
        moment('From', _from, true),
        const SizedBox(height: 10),
        moment('To', _to, false),
        if (_from != null && _to != null && !ordered)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Choose an end date and time later than the start.',
              style: TextStyle(color: palette.danger, fontSize: 13),
            ),
          ),
        const SizedBox(height: 12),
        TextField(
          controller: _reason,
          maxLength: 120,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
            hintText: 'e.g., Annual leave',
            counterText: '',
          ),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: ordered && !widget.busy ? _submit : null,
          icon: const Icon(Icons.block_rounded, size: 18),
          label: const Text('Block this period'),
        ),
        const SizedBox(height: 22),
        const SectionHeading(title: 'Upcoming blocked periods'),
        const SizedBox(height: 10),
        if (widget.blocked.isEmpty)
          Text(
            'No upcoming blocked periods.',
            style: TextStyle(color: palette.muted, fontSize: 14),
          ),
        for (final block in widget.blocked) ...[
          WorkspaceCard(
            padding: const EdgeInsets.fromLTRB(14, 10, 6, 10),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        block.title,
                        style: TextStyle(
                          color: palette.heading,
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${formatMoment(block.startsAt)} →\n${formatMoment(block.endsAt)}',
                        style: TextStyle(color: palette.muted, fontSize: 12.5),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: widget.busy ? null : () => widget.onUnblock(block),
                  style: TextButton.styleFrom(foregroundColor: palette.danger),
                  child: const Text('Remove'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 8),
        const InfoStrip(
          icon: Icons.info_outline_rounded,
          text:
              'These periods override your regular schedule. Booked appointments must be managed separately.',
        ),
      ],
    );
  }
}
