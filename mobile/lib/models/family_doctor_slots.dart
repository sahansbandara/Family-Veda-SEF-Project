// Family-visible availability from the existing shared API.
class FamilyDoctorSlots {
  const FamilyDoctorSlots({
    required this.configured,
    required this.slotMinutes,
    required this.slots,
  });
  factory FamilyDoctorSlots.fromJson(Map<String, dynamic> json) =>
      FamilyDoctorSlots(
        configured: json['availabilityConfigured'] as bool,
        slotMinutes: (json['slotMinutes'] as num).toInt(),
        slots: (json['slots'] as List)
            .map((value) => DateTime.parse(value as String).toUtc())
            .toList(growable: false),
      );
  final bool configured;
  final int slotMinutes;
  final List<DateTime> slots;
}

/// Sri Lanka has a fixed UTC+05:30 offset and no daylight-saving transition.
DateTime sriLankaTime(DateTime instant) =>
    instant.toUtc().add(const Duration(hours: 5, minutes: 30));
