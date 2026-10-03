// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor Profile & Availability models and the weekly-hours rules. Mirrors
// web/src/pages/doctor/doctorSchedule.ts. The backend repeats every check; these only answer
// the doctor before a request is sent.

/// Monday-first, the order the screen lists and the API receives.
const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const slotLengthOptions = [15, 20, 30, 45, 60];

String plural(int count, String noun) => '$count $noun${count == 1 ? '' : 's'}';

class DoctorPracticeProfile {
  const DoctorPracticeProfile({
    required this.displayName,
    required this.registrationLastFour,
    required this.verificationStatus,
    required this.acceptingNewFamilies,
    required this.slotMinutes,
    this.email,
    this.specialty,
    this.clinic,
    this.phoneNumber,
    this.district,
    this.city,
    this.languages,
    this.consultationModes,
  });

  factory DoctorPracticeProfile.fromJson(Map<String, dynamic> json) =>
      DoctorPracticeProfile(
        displayName: json['displayName'] as String? ?? 'Doctor',
        email: json['email'] as String?,
        registrationLastFour:
            json['registrationNumberLastFour'] as String? ?? '',
        verificationStatus: json['verificationStatus']?.toString() ?? '',
        specialty: json['specialty'] as String?,
        clinic: json['clinic'] as String?,
        phoneNumber: json['phoneNumber'] as String?,
        district: json['district'] as String?,
        city: json['city'] as String?,
        languages: json['languages'] as String?,
        consultationModes: json['consultationModes'] as String?,
        acceptingNewFamilies: json['acceptingNewFamilies'] as bool? ?? false,
        slotMinutes: (json['slotMinutes'] as num?)?.toInt() ?? 30,
      );

  final String displayName;
  final String? email;
  final String registrationLastFour;
  final String verificationStatus;
  final String? specialty;
  final String? clinic;
  final String? phoneNumber;
  final String? district;
  final String? city;
  final String? languages;
  final String? consultationModes;
  final bool acceptingNewFamilies;
  final int slotMinutes;

  bool get isVerified => verificationStatus == 'Verified';
}

/// The editable part of the practice profile, as PUT /doctors/me/profile expects it.
class PracticeProfileUpdate {
  const PracticeProfileUpdate({
    required this.acceptingNewFamilies,
    required this.slotMinutes,
    this.specialty,
    this.clinic,
    this.phoneNumber,
    this.district,
    this.city,
    this.languages,
    this.consultationModes,
  });

  final String? specialty;
  final String? clinic;
  final String? phoneNumber;
  final String? district;
  final String? city;
  final String? languages;
  final String? consultationModes;
  final bool acceptingNewFamilies;
  final int slotMinutes;

  Map<String, dynamic> toJson() => {
    'specialty': specialty,
    'clinic': clinic,
    'phoneNumber': phoneNumber,
    'district': district,
    'city': city,
    'languages': languages,
    'consultationModes': consultationModes,
    'acceptingNewFamilies': acceptingNewFamilies,
    'slotMinutes': slotMinutes,
  };
}

int _minutes(Object? value) {
  final parts = (value as String? ?? '').split(':');
  if (parts.length < 2) return 0;
  return (int.tryParse(parts[0]) ?? 0) * 60 + (int.tryParse(parts[1]) ?? 0);
}

String _two(int value) => value.toString().padLeft(2, '0');

/// One recurring range in clinic time (Sri Lanka, UTC+05:30). Minutes from midnight.
class AvailabilityWindow {
  const AvailabilityWindow({
    required this.day,
    required this.start,
    required this.end,
  });

  factory AvailabilityWindow.fromJson(Map<String, dynamic> json) =>
      AvailabilityWindow(
        day: json['dayOfWeek']?.toString() ?? 'Monday',
        start: _minutes(json['startTime']),
        end: _minutes(json['endTime']),
      );

  final String day;
  final int start;
  final int end;

  AvailabilityWindow copyWith({int? start, int? end}) => AvailabilityWindow(
    day: day,
    start: start ?? this.start,
    end: end ?? this.end,
  );

  Map<String, dynamic> toJson() => {
    'dayOfWeek': day,
    'startTime': '${_two(start ~/ 60)}:${_two(start % 60)}:00',
    'endTime': '${_two(end ~/ 60)}:${_two(end % 60)}:00',
  };

  bool get isMorning => start < 12 * 60;

  /// "8:00 am – 12:00 pm"
  String get rangeLabel => '${clockLabel(start)} – ${clockLabel(end)}';

  /// "4 hr", "4 hr 30 min" or "45 min". Empty when the range is not valid yet.
  String get durationLabel {
    final length = end - start;
    if (length <= 0) return '';
    final hours = length ~/ 60;
    final minutes = length % 60;
    return [
      if (hours > 0) '$hours hr',
      if (minutes > 0) '$minutes min',
    ].join(' ');
  }

  @override
  bool operator ==(Object other) =>
      other is AvailabilityWindow &&
      other.day == day &&
      other.start == start &&
      other.end == end;

  @override
  int get hashCode => Object.hash(day, start, end);
}

String clockLabel(int minutes) {
  final hour = minutes ~/ 60;
  final hour12 = hour % 12 == 0 ? 12 : hour % 12;
  return '$hour12:${_two(minutes % 60)} ${hour < 12 ? 'am' : 'pm'}';
}

class BlockedTime {
  const BlockedTime({
    required this.id,
    required this.startsAt,
    required this.endsAt,
    this.reason,
  });

  factory BlockedTime.fromJson(Map<String, dynamic> json) => BlockedTime(
    id: json['id'] as String,
    startsAt: DateTime.parse(json['startsAt'] as String),
    endsAt: DateTime.parse(json['endsAt'] as String),
    reason: json['reason'] as String?,
  );

  final String id;
  final DateTime startsAt;
  final DateTime endsAt;
  final String? reason;

  String get title =>
      reason == null || reason!.trim().isEmpty ? 'Unavailable' : reason!;
}

class DoctorSchedule {
  const DoctorSchedule({required this.windows, required this.blocked});

  factory DoctorSchedule.fromJson(Map<String, dynamic> json) => DoctorSchedule(
    windows: (json['windows'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(AvailabilityWindow.fromJson)
        .toList(),
    blocked: (json['blocked'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(BlockedTime.fromJson)
        .toList(),
  );

  final List<AvailabilityWindow> windows;
  final List<BlockedTime> blocked;
}

/// Profile and schedule together: one load for the screen.
class DoctorPractice {
  const DoctorPractice({required this.profile, required this.schedule});

  final DoctorPracticeProfile profile;
  final DoctorSchedule schedule;
}

/// Monday-first, earliest range first.
List<AvailabilityWindow> sortWindows(Iterable<AvailabilityWindow> windows) =>
    [...windows]..sort((a, b) {
      final byDay = weekDays.indexOf(a.day) - weekDays.indexOf(b.day);
      return byDay != 0 ? byDay : a.start - b.start;
    });

int activeDayCount(Iterable<AvailabilityWindow> windows) =>
    {for (final window in windows) window.day}.length;

/// Hours offered for a new range: a working day first, then the next free range after the last.
AvailabilityWindow nextWindow(String day, Iterable<AvailabilityWindow> all) {
  final sameDay = all.where((window) => window.day == day);
  if (sameDay.isEmpty) {
    return AvailabilityWindow(day: day, start: 9 * 60, end: 16 * 60);
  }
  final latest = sameDay.map((w) => w.end).reduce((a, b) => a > b ? a : b);
  final start = latest + 60;
  if (start >= 23 * 60) {
    return AvailabilityWindow(day: day, start: 9 * 60, end: 12 * 60);
  }
  final end = start + 180 > 23 * 60 + 59 ? 23 * 60 + 59 : start + 180;
  return AvailabilityWindow(day: day, start: start, end: end);
}

/// First problem found, worded for the doctor, or null when the week can be saved.
String? validateWindows(Iterable<AvailabilityWindow> windows) {
  final sorted = sortWindows(windows);
  for (var i = 0; i < sorted.length; i++) {
    final window = sorted[i];
    if (window.start >= window.end) {
      return 'Check ${window.day}: end time must be after start time.';
    }
    if (i > 0 &&
        sorted[i - 1].day == window.day &&
        window.start < sorted[i - 1].end) {
      return 'Check ${window.day}: time ranges must not overlap.';
    }
  }
  return null;
}
