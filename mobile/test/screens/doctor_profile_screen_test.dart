// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import 'package:family_veda/models/doctor_practice.dart';
import 'package:family_veda/models/practice_options.dart';
import 'package:family_veda/providers/doctor_practice_provider.dart';
import 'package:family_veda/screens/doctor/doctor_profile_screen.dart';
import 'package:family_veda/services/api/doctor_practice_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

AvailabilityWindow _window(String day, int startHour, int endHour) =>
    AvailabilityWindow(day: day, start: startHour * 60, end: endHour * 60);

/// In-memory stand-in for the HTTP client. Synthetic data only.
class _FakeApi implements DoctorPracticeApi {
  List<AvailabilityWindow> windows = [
    _window('Monday', 8, 12),
    _window('Monday', 15, 20),
  ];
  List<BlockedTime> blocked = [
    BlockedTime(
      id: 'b-1',
      startsAt: DateTime(2026, 10, 12, 9),
      endsAt: DateTime(2026, 10, 12, 17),
      reason: 'Illustrative day off',
    ),
  ];
  bool accepting = true;
  // Stored the way older rows are, so the form has to cope with them.
  String? district;
  String? city;
  String? languages;
  String? consultationModes;
  final replaced = <List<AvailabilityWindow>>[];
  final updates = <PracticeProfileUpdate>[];
  final added = <(DateTime, DateTime, String?)>[];
  final removed = <String>[];
  bool fail = false;

  @override
  Future<DoctorPractice> getPractice() async => DoctorPractice(
    profile: DoctorPracticeProfile(
      displayName: 'Dr. Synthetic Perera',
      email: 'doctor@example.invalid',
      registrationLastFour: '0001',
      verificationStatus: 'Verified',
      specialty: 'General Practice',
      district: district,
      city: city,
      languages: languages,
      consultationModes: consultationModes,
      acceptingNewFamilies: accepting,
      slotMinutes: 30,
    ),
    schedule: DoctorSchedule(windows: windows, blocked: blocked),
  );

  @override
  Future<DoctorPracticeProfile> updateProfile(
    PracticeProfileUpdate update,
  ) async {
    updates.add(update);
    if (fail) throw StateError('synthetic failure');
    accepting = update.acceptingNewFamilies;
    return (await getPractice()).profile;
  }

  @override
  Future<DoctorSchedule> replaceAvailability(
    List<AvailabilityWindow> next,
  ) async {
    replaced.add(next);
    if (fail) throw StateError('synthetic failure');
    windows = next;
    return DoctorSchedule(windows: windows, blocked: blocked);
  }

  @override
  Future<void> addBlockedTime(
    DateTime startsAt,
    DateTime endsAt, {
    String? reason,
  }) async {
    added.add((startsAt, endsAt, reason));
  }

  @override
  Future<void> removeBlockedTime(String id) async {
    removed.add(id);
    blocked = [];
  }
}

Future<_FakeApi> _pump(
  WidgetTester tester, {
  _FakeApi? api,
  Size size = const Size(390, 844),
}) async {
  final fake = api ?? _FakeApi();
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    ProviderScope(
      overrides: [doctorPracticeApiProvider.overrideWithValue(fake)],
      child: const MaterialApp(home: DoctorProfileScreen()),
    ),
  );
  await tester.pumpAndSettle();
  return fake;
}

Future<void> _tap(WidgetTester tester, Finder finder) async {
  if (finder.evaluate().isEmpty) {
    await tester.scrollUntilVisible(
      finder,
      200,
      scrollable: find
          .byWidgetPredicate(
            (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
          )
          .first,
    );
  }
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Opens the picker behind [field], types [query] into its search box and taps [option].
Future<void> _pick(
  WidgetTester tester,
  String field,
  String query,
  Finder option,
) async {
  await _tap(tester, find.text(field));
  await tester.enterText(
    find.descendant(
      of: find.byType(BottomSheet),
      matching: find.byType(TextField),
    ),
    query,
  );
  await tester.pumpAndSettle();
  await _tap(tester, option);
}

/// The list is lazy: scroll back up until the summary tile with [text] is built again.
Future<void> _seeAbove(WidgetTester tester, String text) async {
  await tester.scrollUntilVisible(
    find.text(text),
    -200,
    scrollable: find
        .byWidgetPredicate(
          (w) => w is Scrollable && w.axisDirection == AxisDirection.down,
        )
        .first,
  );
  expect(find.text(text), findsOneWidget);
}

void main() {
  test('weekly-hours rules match the web page', () {
    expect(_window('Monday', 8, 12).rangeLabel, '8:00 am – 12:00 pm');
    expect(_window('Monday', 8, 12).durationLabel, '4 hr');
    expect(
      const AvailabilityWindow(
        day: 'Monday',
        start: 540,
        end: 810,
      ).durationLabel,
      '4 hr 30 min',
    );
    expect(_window('Friday', 9, 16).toJson(), {
      'dayOfWeek': 'Friday',
      'startTime': '09:00:00',
      'endTime': '16:00:00',
    });
    expect(
      AvailabilityWindow.fromJson(const {
        'dayOfWeek': 'Sunday',
        'startTime': '15:30:00',
        'endTime': '20:00:00',
      }),
      const AvailabilityWindow(day: 'Sunday', start: 930, end: 1200),
    );
    expect(nextWindow('Monday', const []), _window('Monday', 9, 16));
    expect(
      nextWindow('Monday', [_window('Monday', 9, 12)]),
      _window('Monday', 13, 16),
    );
    expect(
      validateWindows([_window('Monday', 13, 16), _window('Monday', 9, 13)]),
      isNull,
    );
    expect(
      validateWindows([_window('Friday', 15, 9)]),
      'Check Friday: end time must be after start time.',
    );
    expect(
      validateWindows([_window('Sunday', 9, 12), _window('Sunday', 11, 14)]),
      'Check Sunday: time ranges must not overlap.',
    );
  });

  testWidgets('lists each day with its ranges and marks empty days', (
    tester,
  ) async {
    await _pump(tester);

    expect(find.text('Add availability'), findsOneWidget);
    expect(find.text('1 active day'), findsOneWidget);
    expect(find.text('Accepting families'), findsOneWidget);
    expect(find.text('1 blocked period'), findsOneWidget);
    expect(find.text('8:00 am – 12:00 pm'), findsOneWidget);
    expect(find.text('4 hr'), findsOneWidget);
    expect(find.text('3:00 pm – 8:00 pm'), findsOneWidget);
    expect(find.text('5 hr'), findsOneWidget);
    expect(find.text('Not available'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('adds a range, saves the whole week and keeps server truth', (
    tester,
  ) async {
    final api = await _pump(tester);

    await _tap(tester, find.text('Add availability'));
    await _tap(tester, find.text('Tue'));
    await _tap(tester, find.text('Add to Tuesday'));
    await _seeAbove(tester, '2 active days');
    expect(api.replaced, isEmpty);

    await _tap(tester, find.text('Save weekly hours'));
    expect(api.replaced.single, [
      _window('Monday', 8, 12),
      _window('Monday', 15, 20),
      _window('Tuesday', 9, 16),
    ]);
    expect(find.textContaining('Weekly hours saved'), findsOneWidget);
  });

  testWidgets('removes a range from the menu and reports a failed save', (
    tester,
  ) async {
    final api = await _pump(tester)
      ..fail = true;

    await _tap(tester, find.byTooltip('Options for Monday 3:00 pm – 8:00 pm'));
    await _tap(tester, find.text('Remove'));
    expect(find.text('3:00 pm – 8:00 pm'), findsNothing);

    await _tap(tester, find.text('Save weekly hours'));
    expect(api.replaced.single, [_window('Monday', 8, 12)]);
    expect(find.textContaining('Hours could not be saved'), findsOneWidget);
    // The unsaved edit stays on screen so the doctor can retry.
    expect(find.text('Discard changes'), findsOneWidget);
  });

  testWidgets('saves the practice profile through the API', (tester) async {
    final api = await _pump(tester);

    await _tap(tester, find.text('Practice'));
    expect(find.text('Dr. Synthetic Perera'), findsOneWidget);
    expect(find.text('SLMC ••••0001'), findsOneWidget);
    await _pick(tester, 'Specialty', 'cardio', find.text('Cardiology'));
    await _tap(tester, find.text('Accepting new families'));
    await _tap(tester, find.text('Save profile changes'));

    expect(api.updates.single.specialty, 'Cardiology');
    // Nothing is pre-selected for the doctor.
    expect(api.updates.single.languages, isNull);
    expect(api.updates.single.consultationModes, isNull);
    expect(api.updates.single.acceptingNewFamilies, isFalse);
    expect(api.updates.single.slotMinutes, 30);
    expect(find.text('Practice profile saved.'), findsOneWidget);
    await _seeAbove(tester, 'Not accepting');
  });

  testWidgets('selects any combination of languages', (tester) async {
    final api = await _pump(tester);

    await _tap(tester, find.text('Practice'));
    await _tap(tester, find.text('Languages spoken'));
    for (final language in ['Tamil', 'Sinhala', 'English']) {
      await _tap(tester, find.text(language));
    }
    await _tap(tester, find.text('Done'));
    await _tap(tester, find.byTooltip('Remove Sinhala'));
    await _tap(tester, find.text('Save profile changes'));

    expect(api.updates.single.languages, 'Tamil, English');
  });

  testWidgets('clears the city when the district changes', (tester) async {
    final fake = _FakeApi()
      ..district = 'Gampaha'
      ..city = 'Negombo';
    final api = await _pump(tester, api: fake);

    await _tap(tester, find.text('Practice'));
    await _pick(tester, 'District', 'kand', find.text('Kandy'));
    expect(find.text('Negombo'), findsNothing);
    expect(find.textContaining('City cleared'), findsOneWidget);

    await _tap(tester, find.text('City'));
    expect(find.text('City in Kandy'), findsOneWidget);
    expect(find.text('Negombo'), findsNothing);
    await _tap(tester, find.text('Peradeniya'));
    await _tap(tester, find.text('Save profile changes'));

    expect(api.updates.single.district, 'Kandy');
    expect(api.updates.single.city, 'Peradeniya');
    expect(api.updates.single.specialty, 'General Practice');
  });

  testWidgets(
    'accepts an unlisted clinic and keeps a saved unsupported mode until removed',
    (tester) async {
      final fake = _FakeApi()..consultationModes = 'InPerson,Video';
      final api = await _pump(tester, api: fake);

      await _tap(tester, find.text('Practice'));
      await _pick(
        tester,
        'Hospital / Clinic',
        'Synthetic New Clinic',
        find.textContaining('Not listed — use'),
      );
      expect(find.text('Video · saved earlier'), findsOneWidget);
      // Only in-person can be booked, so it is the only mode offered.
      await _tap(tester, find.text('Consultation modes'));
      expect(find.byType(CheckboxListTile), findsOneWidget);
      await _tap(tester, find.text('Done'));
      await _tap(tester, find.text('Save profile changes'));
      expect(api.updates.last.clinic, 'Synthetic New Clinic');
      expect(api.updates.last.consultationModes, 'In-person, Video');

      await _tap(tester, find.byTooltip('Remove Video'));
      await _tap(tester, find.text('Save profile changes'));
      expect(api.updates.last.consultationModes, 'In-person');
    },
  );

  testWidgets('blocks an invalid phone number before calling the API', (
    tester,
  ) async {
    final api = await _pump(tester);

    await _tap(tester, find.text('Practice'));
    await _tap(tester, find.text('Professional phone'));
    await tester.enterText(
      find.widgetWithText(TextField, 'Professional phone'),
      '12345',
    );
    await _tap(tester, find.text('Save profile changes'));

    expect(
      find.textContaining('Enter a Sri Lankan phone number'),
      findsOneWidget,
    );
    expect(api.updates, isEmpty);
  });

  test('practice option helpers match the web module', () {
    expect(districts, hasLength(25));
    expect(parseChoices('sinhala / English', languageOptions), [
      'Sinhala',
      'English',
    ]);
    expect(joinChoices([]), isNull);
    for (final ok in ['', '0771234567', '+94771234567', '011 234 5678']) {
      expect(phoneProblem(ok), isNull);
    }
    for (final bad in ['12345', '+1 555 010 0000', 'call me']) {
      expect(phoneProblem(bad), isNotNull);
    }
  });

  testWidgets('blocks and unblocks time off', (tester) async {
    final api = await _pump(tester);

    await _tap(tester, find.text('Time off'));
    expect(find.text('Illustrative day off'), findsOneWidget);
    for (final label in ['From', 'To']) {
      await _tap(tester, find.textContaining('$label · choose'));
      await _tap(tester, find.text('OK')); // date
      await _tap(tester, find.text('OK')); // time
    }
    await _tap(tester, find.text('Block this period'));
    final (from, to, _) = api.added.single;
    expect(to.difference(from), const Duration(hours: 8));

    await _tap(tester, find.text('Remove'));
    expect(api.removed, ['b-1']);
    expect(find.text('No upcoming blocked periods.'), findsOneWidget);
  });

  testWidgets('fits a small phone without overflow', (tester) async {
    await _pump(tester, size: const Size(320, 568));
    await _tap(tester, find.text('Practice'));
    await _tap(tester, find.text('Time off'));
    expect(tester.takeException(), isNull);
    // The picker sheet has to fit the same width.
    await _tap(tester, find.text('Practice'));
    await _tap(tester, find.text('Hospital / Clinic'));
    expect(find.byType(BottomSheet), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
