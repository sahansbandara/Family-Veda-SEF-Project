// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// [S4] Presentational pieces for the family My Doctor screen: palette, tags,
// notes, the booking card and the verified-doctor directory.
import 'package:family_veda/models/doctor_summary.dart';
import 'package:family_veda/models/family_doctor_slots.dart';
import 'package:family_veda/providers/family_doctor_slots_provider.dart';
import 'package:family_veda/providers/family_portal_provider.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

/// Day/night colours for the My Doctor surfaces.
class MyDoctorPalette {
  MyDoctorPalette.of(BuildContext context)
    : dark = Theme.of(context).brightness == Brightness.dark;

  final bool dark;
  Color get primary => dark ? AppColors.primaryDark : AppColors.primary;
  Color get surface => dark ? AppColors.surfaceDark : AppColors.surface;
  Color get soft =>
      dark ? AppColors.surfaceSubtleDark : AppColors.surfaceSubtle;
  Color get line => dark ? AppColors.borderDark : AppColors.border;
  Color get heading => dark ? AppColors.textHeadingDark : AppColors.textHeading;
  Color get muted => dark ? AppColors.mutedDark : AppColors.muted;
  Color get success => dark ? AppColors.successDark : AppColors.success;
  Color get warning => dark ? AppColors.warningDark : AppColors.warning;
}

String doctorInitials(String name) {
  // Titles and numeric suffixes carry no initial.
  final parts = name
      .split(' ')
      .where(
        (part) =>
            RegExp(r'^\p{L}', unicode: true).hasMatch(part) &&
            !RegExp(r'^dr\.?$', caseSensitive: false).hasMatch(part),
      )
      .toList();
  final last = parts.length > 2 ? parts.sublist(parts.length - 2) : parts;
  return last.map((part) => part[0]).join().toUpperCase();
}

String doctorPlace(DoctorSummary doctor) => [
  doctor.city,
  doctor.district,
].whereType<String>().where((value) => value.isNotEmpty).join(', ');

class MyDoctorPanel extends StatelessWidget {
  const MyDoctorPanel({super.key, required this.child, this.borderColor});
  final Widget child;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final palette = MyDoctorPalette.of(context);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor ?? palette.line),
      ),
      child: child,
    );
  }
}

class MyDoctorEyebrow extends StatelessWidget {
  const MyDoctorEyebrow(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: TextStyle(
      fontSize: 10,
      fontWeight: FontWeight.w800,
      letterSpacing: 1.6,
      color: MyDoctorPalette.of(context).muted,
    ),
  );
}

class MyDoctorTag extends StatelessWidget {
  const MyDoctorTag(this.label, {super.key, required this.color, this.icon});
  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.13),
      borderRadius: BorderRadius.circular(30),
      border: Border.all(color: color.withValues(alpha: 0.45)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 5),
        ],
        Flexible(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ),
      ],
    ),
  );
}

class MyDoctorNote extends StatelessWidget {
  const MyDoctorNote({
    super.key,
    required this.title,
    required this.body,
    this.icon = Icons.verified_user_outlined,
    this.color,
    this.action,
  });
  final String title;
  final String body;
  final IconData icon;
  final Color? color;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final palette = MyDoctorPalette.of(context);
    final tone = color ?? palette.primary;
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: tone.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: tone),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  body,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.45,
                    color: palette.muted,
                  ),
                ),
                if (action != null) ...[const SizedBox(height: 8), action!],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MyDoctorAvatar extends StatelessWidget {
  const MyDoctorAvatar(this.name, {super.key, this.size = 43});
  final String name;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    alignment: Alignment.center,
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF2064BC), Color(0xFF09305C)],
      ),
      borderRadius: BorderRadius.circular(size * 0.26),
    ),
    child: Text(
      doctorInitials(name),
      style: TextStyle(
        color: Colors.white,
        fontSize: size * 0.32,
        fontWeight: FontWeight.w800,
      ),
    ),
  );
}

void showDoctorProfile(BuildContext context, DoctorSummary doctor) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              doctor.displayName,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            for (final detail in [
              ('Specialty', doctor.specialty),
              ('Clinic', doctor.clinic),
              ('City', doctor.city),
              ('District', doctor.district),
              ('Languages', doctor.languages),
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  '${detail.$1}: ${detail.$2?.trim().isNotEmpty == true ? detail.$2 : 'Not provided'}',
                ),
              ),
            const SizedBox(height: 8),
            const Text(
              'Verified directory profile. Clinical access still requires consent and an active grant.',
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Date strip, live slots and the hand-off to the booking screen.
class MyDoctorBookingCard extends ConsumerStatefulWidget {
  const MyDoctorBookingCard({super.key, required this.familyId});
  final String familyId;

  @override
  ConsumerState<MyDoctorBookingCard> createState() =>
      _MyDoctorBookingCardState();
}

class _MyDoctorBookingCardState extends ConsumerState<MyDoctorBookingCard> {
  static const _quickDays = 5;
  late final DateTime _today;
  late DateTime _date;
  DateTime? _slot;

  @override
  void initState() {
    super.initState();
    final now = sriLankaTime(DateTime.now());
    _today = DateTime.utc(now.year, now.month, now.day);
    _date = _today;
  }

  void _setDate(DateTime date) => setState(() {
    _date = DateTime.utc(date.year, date.month, date.day);
    _slot = null;
  });

  Future<void> _pickOtherDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: _today,
      lastDate: DateTime.utc(_today.year + 1, _today.month, _today.day),
    );
    if (picked != null && mounted) _setDate(picked);
  }

  @override
  Widget build(BuildContext context) {
    final palette = MyDoctorPalette.of(context);
    final request = (
      familyId: widget.familyId,
      date: DateFormat('yyyy-MM-dd').format(_date),
    );
    final availability = ref.watch(familyDoctorSlotsProvider(request));
    final minutes = availability.valueOrNull?.slotMinutes ?? 30;
    final slot = availability.valueOrNull?.slots.contains(_slot) == true
        ? _slot
        : null;

    return MyDoctorPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MyDoctorEyebrow('Plan your next visit'),
                    SizedBox(height: 4),
                    Text(
                      'Book an appointment',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              MyDoctorTag(
                'Sri Lanka time',
                color: palette.primary,
                icon: Icons.schedule,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Select a date and an available time. Your doctor will confirm the request.',
            style: TextStyle(fontSize: 12, color: palette.muted),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Choose a date',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                ),
              ),
              TextButton.icon(
                onPressed: _pickOtherDate,
                icon: const Icon(Icons.calendar_month_outlined, size: 16),
                label: const Text('Other date'),
              ),
            ],
          ),
          Row(
            children: [
              for (var index = 0; index < _quickDays; index++) ...[
                if (index > 0) const SizedBox(width: 6),
                Expanded(
                  child: _DateButton(
                    date: _today.add(Duration(days: index)),
                    selected: _date == _today.add(Duration(days: index)),
                    onTap: _setDate,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Available time slots',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                DateFormat('EEE, MMM d').format(_date),
                style: TextStyle(fontSize: 11, color: palette.muted),
              ),
            ],
          ),
          const SizedBox(height: 8),
          availability.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, _) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Availability could not be loaded.'),
                TextButton(
                  onPressed: () =>
                      ref.invalidate(familyDoctorSlotsProvider(request)),
                  child: const Text('Retry availability'),
                ),
              ],
            ),
            data: (value) {
              if (!value.configured) {
                return Text(
                  'The doctor has not configured availability yet. You can still send an appointment request.',
                  style: TextStyle(fontSize: 12.5, color: palette.muted),
                );
              }
              if (value.slots.isEmpty) {
                return Text(
                  'No available slots on this date. Choose another day.',
                  style: TextStyle(fontSize: 12.5, color: palette.muted),
                );
              }
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final option in value.slots)
                    ChoiceChip(
                      label: Text(DateFormat.jm().format(sriLankaTime(option))),
                      selected: slot == option,
                      onSelected: (selected) =>
                          setState(() => _slot = selected ? option : null),
                    ),
                ],
              );
            },
          ),
          Divider(height: 30, color: palette.line),
          Text(
            'SELECTED APPOINTMENT',
            style: TextStyle(fontSize: 10.5, color: palette.muted),
          ),
          const SizedBox(height: 2),
          Text(
            slot == null
                ? 'Choose a date & time'
                : '${DateFormat('EEE, MMM d').format(_date)} at ${DateFormat.jm().format(sriLankaTime(slot))}',
            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700),
          ),
          Text(
            'Requests are not confirmed automatically.',
            style: TextStyle(fontSize: 11, color: palette.muted),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed:
                  slot == null && availability.valueOrNull?.configured != false
                  ? null
                  : () => context.push(
                      '/appointments/book',
                      extra: slot == null
                          ? null
                          : (slot: slot, minutes: minutes),
                    ),
              icon: const Icon(Icons.calendar_month_outlined, size: 18),
              label: const Text('Request appointment'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DateButton extends StatelessWidget {
  const _DateButton({
    required this.date,
    required this.selected,
    required this.onTap,
  });
  final DateTime date;
  final bool selected;
  final ValueChanged<DateTime> onTap;

  @override
  Widget build(BuildContext context) {
    final palette = MyDoctorPalette.of(context);
    final small = TextStyle(
      fontSize: 10.5,
      color: selected ? Colors.white : palette.muted,
    );
    return Semantics(
      button: true,
      selected: selected,
      label: DateFormat('EEEE, MMMM d').format(date),
      child: InkWell(
        borderRadius: BorderRadius.circular(11),
        onTap: () => onTap(date),
        child: Container(
          constraints: const BoxConstraints(minHeight: 66),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            gradient: selected
                ? const LinearGradient(
                    colors: [Color(0xFF174D98), Color(0xFF226FDE)],
                  )
                : null,
            color: selected ? null : palette.soft,
            borderRadius: BorderRadius.circular(11),
            border: Border.all(
              color: selected ? const Color(0xFF55A3FF) : palette.line,
            ),
          ),
          child: ExcludeSemantics(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  DateFormat('EEE').format(date).toUpperCase(),
                  style: small,
                ),
                Text(
                  DateFormat('dd').format(date),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : palette.heading,
                  ),
                ),
                Text(
                  DateFormat('MMM').format(date).toUpperCase(),
                  style: small,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Verified directory with local search, district and specialty filters.
class MyDoctorDirectory extends ConsumerStatefulWidget {
  const MyDoctorDirectory({
    super.key,
    required this.requestLabel,
    required this.onRequest,
    this.currentDoctorId,
  });
  final String requestLabel;
  final String? currentDoctorId;
  final ValueChanged<DoctorSummary> onRequest;

  @override
  ConsumerState<MyDoctorDirectory> createState() => _MyDoctorDirectoryState();
}

class _MyDoctorDirectoryState extends ConsumerState<MyDoctorDirectory> {
  String _query = '';
  String? _district;
  String? _specialty;

  List<String> _options(
    List<DoctorSummary> doctors,
    String? Function(DoctorSummary) pick,
  ) =>
      doctors
          .map(pick)
          .whereType<String>()
          .where((value) => value.isNotEmpty)
          .toSet()
          .toList()
        ..sort();

  @override
  Widget build(BuildContext context) {
    final palette = MyDoctorPalette.of(context);
    return ref
        .watch(doctorDirectoryProvider)
        .when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, _) => ErrorRetryView(
            onRetry: () => ref.invalidate(doctorDirectoryProvider),
          ),
          data: (doctors) {
            final query = _query.trim().toLowerCase();
            final results = doctors.where((doctor) {
              final matchesQuery =
                  query.isEmpty ||
                  [
                    doctor.displayName,
                    doctor.clinic,
                    doctor.city,
                    doctor.specialty,
                    doctor.languages,
                  ].whereType<String>().any(
                    (value) => value.toLowerCase().contains(query),
                  );
              return matchesQuery &&
                  (_district == null || doctor.district == _district) &&
                  (_specialty == null || doctor.specialty == _specialty);
            }).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Search doctor or clinic',
                    hintText: 'Name, specialty or clinic',
                    prefixIcon: Icon(Icons.search, size: 20),
                  ),
                  onChanged: (value) => setState(() => _query = value),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String?>(
                  initialValue: _district,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'District'),
                  items: [
                    const DropdownMenuItem(
                      value: null,
                      child: Text('All districts'),
                    ),
                    for (final value in _options(doctors, (d) => d.district))
                      DropdownMenuItem(value: value, child: Text(value)),
                  ],
                  onChanged: (value) => setState(() => _district = value),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String?>(
                  initialValue: _specialty,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Specialty'),
                  items: [
                    const DropdownMenuItem(
                      value: null,
                      child: Text('All specialties'),
                    ),
                    for (final value in _options(doctors, (d) => d.specialty))
                      DropdownMenuItem(value: value, child: Text(value)),
                  ],
                  onChanged: (value) => setState(() => _specialty = value),
                ),
                const SizedBox(height: 14),
                if (results.isEmpty)
                  Text(
                    doctors.isEmpty
                        ? 'No verified doctors are accepting families right now.'
                        : 'No matching doctors. Try clearing the filters.',
                    style: TextStyle(fontSize: 13, color: palette.muted),
                  ),
                for (final doctor in results)
                  _DirectoryCard(
                    doctor: doctor,
                    isCurrent: doctor.id == widget.currentDoctorId,
                    requestLabel: widget.requestLabel,
                    onRequest: () => widget.onRequest(doctor),
                  ),
              ],
            );
          },
        );
  }
}

class _DirectoryCard extends StatelessWidget {
  const _DirectoryCard({
    required this.doctor,
    required this.isCurrent,
    required this.requestLabel,
    required this.onRequest,
  });
  final DoctorSummary doctor;
  final bool isCurrent;
  final String requestLabel;
  final VoidCallback onRequest;

  @override
  Widget build(BuildContext context) {
    final palette = MyDoctorPalette.of(context);
    final meta = [
      doctorPlace(doctor),
      doctor.languages ?? '',
      doctor.clinic ?? '',
    ].where((value) => value.isNotEmpty).join(' · ');
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: palette.soft,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: palette.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              MyDoctorAvatar(doctor.displayName),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.displayName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      doctor.specialty ?? 'Specialty not provided',
                      style: TextStyle(fontSize: 12, color: palette.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (meta.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(meta, style: TextStyle(fontSize: 12, color: palette.muted)),
          ],
          const SizedBox(height: 10),
          MyDoctorTag(
            'Verified · Accepting families',
            color: palette.success,
            icon: Icons.verified_user_outlined,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => showDoctorProfile(context, doctor),
                  child: const Text('View profile'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: isCurrent ? null : onRequest,
                  child: Text(isCurrent ? 'Current doctor' : requestLabel),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
