// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import 'package:family_veda/models/appointment.dart';
import 'package:family_veda/providers/doctor_provider.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

String _dayKey(DateTime date) =>
    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

class DoctorCalendarScreen extends ConsumerStatefulWidget {
  const DoctorCalendarScreen({super.key});

  @override
  ConsumerState<DoctorCalendarScreen> createState() => _DoctorCalendarScreenState();
}

class _DoctorCalendarScreenState extends ConsumerState<DoctorCalendarScreen> {
  DateTime _selectedDate = DateTime.now();

  void _showAppointmentDetails(Appointment appointment) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AppointmentDetailSheet(
        appointment: appointment,
        onActionComplete: () {
          ref.invalidate(doctorAppointmentsProvider);
          if (mounted) Navigator.pop(ctx);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appointmentsAsync = ref.watch(doctorAppointmentsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? const Color(0xFF172640) : Colors.white;
    final textColor = isDark ? const Color(0xFFF1F7FF) : Colors.black87;
    final mutedColor = isDark ? const Color(0xFFAAB9CF) : Colors.black54;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('My Calendar'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: appointmentsAsync.when(
          loading: () => const LoadingStateView(label: 'Loading appointments'),
          error: (_, _) => ErrorRetryView(onRetry: () => ref.invalidate(doctorAppointmentsProvider)),
          data: (items) {
            final appointmentsByDate = <String, List<Appointment>>{};
            for (final a in items) {
              final k = _dayKey(a.startsAt.toLocal());
              appointmentsByDate.putIfAbsent(k, () => []).add(a);
            }
            
            final selectedKey = _dayKey(_selectedDate);
            final dayAppointments = appointmentsByDate[selectedKey] ?? [];
            dayAppointments.sort((a, b) => a.startsAt.compareTo(b.startsAt));

            // Metric calculation
            final todayKey = _dayKey(DateTime.now());
            final todayVisits = appointmentsByDate[todayKey]?.length ?? 0;
            final pendingRequests = items.where((a) => a.status == AppointmentStatus.requested).length;
            final monthStr = '${DateTime.now().year}-${DateTime.now().month.toString().padLeft(2, '0')}';
            final monthVisits = items.where((a) => _dayKey(a.startsAt.toLocal()).startsWith(monthStr)).length;

            return Column(
              children: [
                // Metrics
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? const Color(0xFF203451) : Colors.grey.shade300),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMetric('Today', todayVisits.toString(), textColor, mutedColor),
                      _buildMetric('Pending', pendingRequests.toString(), textColor, mutedColor),
                      _buildMetric('Month', monthVisits.toString(), textColor, mutedColor),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // Date Strip
                SizedBox(
                  height: 90,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: 14,
                    itemBuilder: (ctx, i) {
                      final d = DateTime.now().subtract(const Duration(days: 3)).add(Duration(days: i));
                      final dKey = _dayKey(d);
                      final count = appointmentsByDate[dKey]?.length ?? 0;
                      final isSelected = dKey == selectedKey;
                      
                      return GestureDetector(
                        onTap: () => setState(() => _selectedDate = d),
                        child: Container(
                          width: 64,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF207EF2) : surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isSelected ? const Color(0xFF207EF2) : (isDark ? const Color(0xFF203451) : Colors.grey.shade300)),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(DateFormat('E').format(d), style: TextStyle(fontSize: 12, color: isSelected ? Colors.white70 : mutedColor)),
                              const SizedBox(height: 4),
                              Text(d.day.toString(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : textColor)),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate(
                                  count > 3 ? 3 : count,
                                  (idx) => Container(
                                    margin: const EdgeInsets.symmetric(horizontal: 1),
                                    width: 4, height: 4,
                                    decoration: BoxDecoration(color: isSelected ? Colors.white : const Color(0xFF207EF2), shape: BoxShape.circle),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                
                // Agenda list
                Expanded(
                  child: dayAppointments.isEmpty
                      ? const Center(child: Text('No appointments on this date.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: dayAppointments.length,
                          itemBuilder: (ctx, i) {
                            final a = dayAppointments[i];
                            final endsAt = a.startsAt.add(Duration(minutes: a.durationMinutes));
                            return GestureDetector(
                              onTap: () => _showAppointmentDetails(a),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: surfaceColor,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: isDark ? const Color(0xFF203451) : Colors.grey.shade300),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${DateFormat('jm').format(a.startsAt.toLocal())} - ${DateFormat('jm').format(endsAt.toLocal())}',
                                      style: TextStyle(fontWeight: FontWeight.bold, color: textColor),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(a.memberDisplayName, style: TextStyle(fontSize: 16, color: textColor)),
                                    const SizedBox(height: 2),
                                    Text(a.reason, style: TextStyle(color: mutedColor, fontSize: 13)),
                                    const SizedBox(height: 8),
                                    _buildStatusBadge(a.status),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildMetric(String label, String val, Color text, Color muted) {
    return Column(
      children: [
        Text(val, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF207EF2))),
        Text(label.toUpperCase(), style: TextStyle(fontSize: 10, color: muted)),
      ],
    );
  }

  Widget _buildStatusBadge(AppointmentStatus status) {
    Color bg;
    Color fg;
    if (status == AppointmentStatus.confirmed) { bg = const Color(0xFF207EF2).withValues(alpha: 0.1); fg = const Color(0xFF207EF2); }
    else if (status == AppointmentStatus.requested) { bg = Colors.amber.withValues(alpha: 0.1); fg = Colors.amber; }
    else if (status == AppointmentStatus.completed) { bg = AppColors.success.withValues(alpha: 0.1); fg = AppColors.success; }
    else { bg = Colors.grey.withValues(alpha: 0.1); fg = Colors.grey; }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(status.friendlyLabel, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }
}

class _AppointmentDetailSheet extends ConsumerStatefulWidget {
  final Appointment appointment;
  final VoidCallback onActionComplete;

  const _AppointmentDetailSheet({required this.appointment, required this.onActionComplete});

  @override
  ConsumerState<_AppointmentDetailSheet> createState() => _AppointmentDetailSheetState();
}

class _AppointmentDetailSheetState extends ConsumerState<_AppointmentDetailSheet> {
  bool _isLoading = false;

  Future<void> _act(String action) async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(doctorApiProvider);
      if (action == 'confirm') await api.confirmAppointment(widget.appointment.id);
      if (action == 'complete') await api.completeAppointment(widget.appointment.id);
      if (action == 'no-show') await api.noShowAppointment(widget.appointment.id);
      if (action == 'cancel') await api.cancelAppointment(widget.appointment.id, 'Cancelled via mobile app');
      widget.onActionComplete();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action failed. Try again.')));
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.appointment;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? const Color(0xFF172640) : Colors.white;
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Appointment Details', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            Text('Patient: ${a.memberDisplayName}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            if (a.familyName != null) Text('Family: ${a.familyName}'),
            const SizedBox(height: 16),
            Text('Time: ${DateFormat('yMMMd').format(a.startsAt.toLocal())} at ${DateFormat('jm').format(a.startsAt.toLocal())}'),
            Text('Duration: ${a.durationMinutes} mins'),
            Text('Reason: ${a.reason}'),
            const SizedBox(height: 24),
            if (_isLoading) const Center(child: CircularProgressIndicator())
            else ...[
              Wrap(
                spacing: 8,
                children: [
                  if (a.status == AppointmentStatus.requested) ActionChip(label: const Text('Confirm'), onPressed: () => _act('confirm')),
                  if (a.status == AppointmentStatus.requested || a.status == AppointmentStatus.confirmed) ActionChip(label: const Text('Cancel'), onPressed: () => _act('cancel')),
                  if (a.status == AppointmentStatus.confirmed) ActionChip(label: const Text('Complete'), onPressed: () => _act('complete')),
                  if (a.status == AppointmentStatus.confirmed) ActionChip(label: const Text('No-Show'), onPressed: () => _act('no-show')),
                ],
              ),
              if (a.status == AppointmentStatus.confirmed) ...[
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    context.push('/cases/new?appointmentId=${a.id}');
                  },
                  child: const Text('View Records'),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
