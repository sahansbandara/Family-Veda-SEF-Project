import 'package:family_veda/models/family_doctor_slots.dart';
import 'package:family_veda/providers/family_doctor_slots_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class FamilyDoctorAvailability extends ConsumerStatefulWidget {
  const FamilyDoctorAvailability({
    super.key,
    required this.familyId,
    this.onSelected,
    this.initialSlot,
  });
  final String familyId;

  /// A time already chosen elsewhere; it is dropped if the server no longer offers it.
  final DateTime? initialSlot;
  final void Function(DateTime? slot, int minutes)? onSelected;
  @override
  ConsumerState<FamilyDoctorAvailability> createState() =>
      _FamilyDoctorAvailabilityState();
}

class _FamilyDoctorAvailabilityState
    extends ConsumerState<FamilyDoctorAvailability> {
  late DateTime _date;
  DateTime? _selected;
  @override
  void initState() {
    super.initState();
    final initial = widget.initialSlot?.toUtc();
    final day = sriLankaTime(initial ?? DateTime.now());
    _date = DateTime.utc(day.year, day.month, day.day);
    _selected = initial;
  }

  Future<void> _chooseDate() async {
    final today = sriLankaTime(DateTime.now());
    final date = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(today.year, today.month, today.day),
      lastDate: DateTime(today.year + 1, today.month, today.day),
    );
    if (date == null || !mounted) return;
    setState(() {
      _date = date;
      _selected = null;
    });
    widget.onSelected?.call(null, 30);
  }

  @override
  Widget build(BuildContext context) {
    final request = (
      familyId: widget.familyId,
      date: DateFormat('yyyy-MM-dd').format(_date),
    );
    ref.listen<AsyncValue<FamilyDoctorSlots>>(
      familyDoctorSlotsProvider(request),
      (previous, next) {
        if (_selected != null &&
            next.hasValue &&
            !next.requireValue.slots.contains(_selected)) {
          setState(() => _selected = null);
          widget.onSelected?.call(null, next.requireValue.slotMinutes);
        }
      },
    );
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Doctor availability',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            const Text('Sri Lanka time · UTC+05:30'),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _chooseDate,
              icon: const Icon(Icons.calendar_month_outlined),
              label: Text(DateFormat.yMMMEd().format(_date)),
            ),
            const SizedBox(height: 12),
            ref
                .watch(familyDoctorSlotsProvider(request))
                .when(
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
                  data: (availability) {
                    if (!availability.configured) {
                      return const Text(
                        'The doctor has not configured availability yet. Contact the clinic to arrange a visit.',
                      );
                    }
                    if (availability.slots.isEmpty) {
                      return const Text(
                        'No available slots on this date. Choose another day.',
                      );
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${availability.slotMinutes}-minute appointments'),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final slot in availability.slots)
                              widget.onSelected == null
                                  ? Chip(
                                      label: Text(
                                        DateFormat.jm().format(
                                          sriLankaTime(slot),
                                        ),
                                      ),
                                    )
                                  : ChoiceChip(
                                      label: Text(
                                        DateFormat.jm().format(
                                          sriLankaTime(slot),
                                        ),
                                      ),
                                      selected: _selected == slot,
                                      onSelected: (selected) {
                                        setState(
                                          () => _selected = selected
                                              ? slot
                                              : null,
                                        );
                                        widget.onSelected?.call(
                                          _selected,
                                          availability.slotMinutes,
                                        );
                                      },
                                    ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Availability may change. The server checks your request before booking.',
                        ),
                      ],
                    );
                  },
                ),
          ],
        ),
      ),
    );
  }
}
