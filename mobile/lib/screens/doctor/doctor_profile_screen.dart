// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor Profile & Availability: weekly hours, practice profile and time off. Same endpoints
// and rules as web/src/pages/doctor/DoctorProfilePage.tsx. Hours are clinic time (UTC+05:30).
import 'package:family_veda/models/doctor_practice.dart';
import 'package:family_veda/providers/doctor_practice_provider.dart';
import 'package:family_veda/services/api/doctor_practice_api.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:family_veda/widgets/doctor/practice_parts.dart';
import 'package:family_veda/widgets/doctor/practice_sections.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum _Tab { availability, practice, timeOff }

class DoctorProfileScreen extends ConsumerStatefulWidget {
  const DoctorProfileScreen({super.key});

  @override
  ConsumerState<DoctorProfileScreen> createState() =>
      _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends ConsumerState<DoctorProfileScreen> {
  _Tab _tab = _Tab.availability;

  /// The week being edited. Null until the doctor changes something; then it replaces the
  /// saved hours on screen until "Save weekly hours" succeeds.
  List<AvailabilityWindow>? _draft;
  bool _busy = false;

  Future<void> _refresh() async {
    ref.invalidate(doctorPracticeProvider);
    try {
      await ref.read(doctorPracticeProvider.future);
    } catch (_) {
      // The error view is rendered by the provider state.
    }
  }

  void _say(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  /// Runs one write, re-reads server truth, and reports the outcome. True on success.
  Future<bool> _write(
    Future<void> Function(DoctorPracticeApi api) action, {
    required String done,
    required String failed,
  }) async {
    if (_busy) return false;
    setState(() => _busy = true);
    var ok = true;
    String message = done;
    try {
      await action(ref.read(doctorPracticeApiProvider));
    } catch (error) {
      ok = false;
      message = practiceErrorMessage(error, failed);
    }
    if (ok) await _refresh();
    if (!mounted) return ok;
    setState(() => _busy = false);
    _say(message);
    return ok;
  }

  Future<void> _addWindow(List<AvailabilityWindow> windows) async {
    final added = await showModalBottomSheet<AvailabilityWindow>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => AddAvailabilitySheet(existing: windows),
    );
    if (added == null || !mounted) return;
    setState(() => _draft = sortWindows([...windows, added]));
  }

  Future<void> _slotAction(
    List<AvailabilityWindow> windows,
    AvailabilityWindow window,
    SlotAction action,
  ) async {
    final index = windows.indexOf(window);
    if (index < 0) return;
    if (action == SlotAction.remove) {
      setState(() => _draft = [...windows]..removeAt(index));
      return;
    }
    final start = action == SlotAction.start;
    final minutes = await pickClockMinutes(
      context,
      initial: start ? window.start : window.end,
      helpText: '${window.day} · ${start ? 'start' : 'end'} time',
    );
    if (minutes == null || !mounted) return;
    final changed = start
        ? window.copyWith(start: minutes)
        : window.copyWith(end: minutes);
    setState(() => _draft = sortWindows([...windows]..[index] = changed));
  }

  Future<void> _saveHours(List<AvailabilityWindow> windows) async {
    final problem = validateWindows(windows);
    if (problem != null) return _say(problem);
    final saved = await _write(
      (api) => api.replaceAvailability(sortWindows(windows)),
      done:
          'Weekly hours saved. Families now see only free slots inside these hours.',
      failed:
          'Hours could not be saved. Each range must end after it starts and must not overlap another on the same day.',
    );
    if (saved && mounted) setState(() => _draft = null);
  }

  @override
  Widget build(BuildContext context) {
    final practice = ref.watch(doctorPracticeProvider);
    final palette = CalendarPalette.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile & Availability'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _busy ? null : _refresh,
          ),
        ],
      ),
      body: SafeArea(
        child: practice.when(
          skipLoadingOnRefresh: true,
          loading: () => const LoadingStateView(label: 'Loading your profile'),
          error: (_, _) => ErrorRetryView(
            message: 'Your profile could not be loaded.',
            onRetry: () => ref.invalidate(doctorPracticeProvider),
          ),
          data: (data) {
            final windows = _draft ?? sortWindows(data.schedule.windows);
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
                children: [
                  Text(
                    'Manage how families find you and when they can request an appointment.',
                    style: TextStyle(color: palette.muted, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  PracticeSummaryGrid(
                    accepting: data.profile.acceptingNewFamilies,
                    slotMinutes: data.profile.slotMinutes,
                    activeDays: activeDayCount(windows),
                    blockedCount: data.schedule.blocked.length,
                  ),
                  const SizedBox(height: 14),
                  SegmentedButton<_Tab>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(
                        value: _Tab.availability,
                        label: Text('Availability'),
                      ),
                      ButtonSegment(
                        value: _Tab.practice,
                        label: Text('Practice'),
                      ),
                      ButtonSegment(
                        value: _Tab.timeOff,
                        label: Text('Time off'),
                      ),
                    ],
                    selected: {_tab},
                    onSelectionChanged: (value) =>
                        setState(() => _tab = value.first),
                  ),
                  const SizedBox(height: 16),
                  switch (_tab) {
                    _Tab.availability => _availability(windows, palette),
                    _Tab.practice => PracticeProfileForm(
                      profile: data.profile,
                      busy: _busy,
                      onSave: (update) => _write(
                        (api) => api.updateProfile(update),
                        done: 'Practice profile saved.',
                        failed:
                            'Profile could not be saved. Check the fields and try again.',
                      ),
                    ),
                    _Tab.timeOff => TimeOffSection(
                      blocked: data.schedule.blocked,
                      busy: _busy,
                      onBlock: (from, to, reason) => _write(
                        (api) => api.addBlockedTime(from, to, reason: reason),
                        done: 'Time blocked. No new bookings can land in it.',
                        failed:
                            'Time could not be blocked. The end must be after the start.',
                      ),
                      onUnblock: (block) => _write(
                        (api) => api.removeBlockedTime(block.id),
                        done: 'Blocked period removed.',
                        failed: 'Blocked time could not be removed.',
                      ),
                    ),
                  },
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _availability(
    List<AvailabilityWindow> windows,
    CalendarPalette palette,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AddAvailabilityBanner(onTap: () => _addWindow(windows)),
        const SizedBox(height: 6),
        for (final day in weekDays) ...[
          Padding(
            padding: const EdgeInsets.only(top: 14, bottom: 8),
            child: Semantics(
              header: true,
              child: Text(
                day,
                style: TextStyle(
                  color: palette.muted,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          if (windows.every((window) => window.day != day))
            const NotAvailableCard(),
          for (final window in windows.where((window) => window.day == day))
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AvailabilitySlotCard(
                window: window,
                onAction: (action) => _slotAction(windows, window, action),
              ),
            ),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _draft != null && !_busy
              ? () => _saveHours(windows)
              : null,
          child: const Text('Save weekly hours'),
        ),
        if (_draft != null)
          TextButton(
            onPressed: _busy ? null : () => setState(() => _draft = null),
            child: const Text('Discard changes'),
          ),
        const SizedBox(height: 10),
        InfoStrip(
          icon: Icons.info_outline_rounded,
          text:
              '${windows.isEmpty ? 'No hours set yet. Until you add hours, families can request any time. ' : ''}'
              'Clinic time · Sri Lanka (UTC+05:30). Bookable slots are created only inside these hours, after other appointments and blocked periods are excluded. Existing appointments are not silently changed.',
        ),
      ],
    );
  }
}
