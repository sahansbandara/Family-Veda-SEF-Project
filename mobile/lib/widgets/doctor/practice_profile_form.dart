// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// The editable practice profile. Collects input only; the screen owns the API call. Name,
// email, SLMC number and verification status are read-only here and are never sent.
// Same fields, options and rules as web/src/pages/doctor/PracticeProfileForm.tsx.
import 'package:family_veda/models/doctor_practice.dart';
import 'package:family_veda/models/practice_options.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:family_veda/widgets/doctor/practice_selectors.dart';
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
  late String _specialty = widget.profile.specialty ?? '';
  late String _clinic = widget.profile.clinic ?? '';
  late String _district = widget.profile.district ?? '';
  late String _city = widget.profile.city ?? '';
  late List<String> _languages = parseChoices(
    widget.profile.languages,
    languageOptions,
  );
  late List<String> _modes = parseChoices(
    widget.profile.consultationModes,
    consultationModeOptions,
    aliases: consultationModeAliases,
  );
  late final _phone = TextEditingController(text: widget.profile.phoneNumber);
  late bool _accepting = widget.profile.acceptingNewFamilies;
  late int _slotMinutes = widget.profile.slotMinutes;
  bool _cityCleared = false;
  String? _phoneError;

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  /// Opens a picker and hands back the choice; nothing changes when the sheet is dismissed.
  Future<void> _pick(
    String title,
    List<PracticeOption> options,
    String selected,
    ValueChanged<String> apply, {
    String? customLabel,
    int maxLength = 120,
  }) async {
    final picked = await showOptionSheet(
      context,
      title: title,
      options: options,
      selected: selected,
      customLabel: customLabel,
      maxLength: maxLength,
    );
    if (picked == null || !mounted) return;
    setState(() => apply(picked));
  }

  void _changeDistrict(String district) {
    // A city belongs to one district: keep it only if the new district lists it.
    final keep = _city.isEmpty || cityInDistrict(_city, district);
    _district = district;
    _cityCleared = !keep;
    if (!keep) _city = '';
  }

  void _save() {
    final problem = phoneProblem(_phone.text);
    setState(() => _phoneError = problem);
    if (problem != null) return;
    String? text(String value) => value.trim().isEmpty ? null : value.trim();
    widget.onSave(
      PracticeProfileUpdate(
        specialty: text(_specialty),
        clinic: text(_clinic),
        district: text(_district),
        city: text(_city),
        languages: joinChoices(_languages),
        consultationModes: joinChoices(_modes),
        phoneNumber: text(_phone.text),
        acceptingNewFamilies: _accepting,
        slotMinutes: _slotMinutes,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final profile = widget.profile;
    final tone = profile.isVerified ? palette.success : palette.warning;
    Widget group(String title) => Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 10),
      child: Semantics(
        header: true,
        child: Text(
          title.toUpperCase(),
          style: TextStyle(
            color: palette.muted,
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.9,
          ),
        ),
      ),
    );
    const gap = SizedBox(height: 12);

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
        group('Professional details'),
        PickerField(
          label: 'Specialty',
          value: _specialty,
          onTap: () => _pick(
            'Specialty',
            specialtyOptions,
            _specialty,
            (value) => _specialty = value,
          ),
        ),
        gap,
        PickerField(
          label: 'Hospital / Clinic',
          value: _clinic,
          helper:
              'Shown as you enter it. Family Veda does not verify this affiliation.',
          onTap: () => _pick(
            'Hospital / Clinic',
            clinicOptions,
            _clinic,
            (value) => _clinic = value,
            customLabel: 'Not listed — use',
          ),
        ),
        group('Location'),
        PickerField(
          label: 'District',
          value: _district,
          onTap: () =>
              _pick('District', districtOptions, _district, _changeDistrict),
        ),
        gap,
        PickerField(
          label: 'City',
          value: _city,
          helper: _cityCleared
              ? 'City cleared because the district changed. Choose a city in $_district.'
              : null,
          onTap: () => _pick(
            _district.isEmpty ? 'City' : 'City in $_district',
            cityOptions(_district),
            _city,
            (value) {
              _city = value;
              _cityCleared = false;
            },
            customLabel: 'City not listed — use',
            maxLength: 60,
          ),
        ),
        group('Consultation preferences'),
        MultiPickerField(
          label: 'Languages spoken',
          options: languageOptions,
          values: _languages,
          onChanged: (values) => setState(() => _languages = values),
        ),
        gap,
        MultiPickerField(
          label: 'Consultation modes',
          options: consultationModeOptions,
          values: _modes,
          helper:
              'Video and phone consultations cannot be booked in Family Veda yet.',
          onChanged: (values) => setState(() => _modes = values),
        ),
        group('Contact & scheduling'),
        TextField(
          controller: _phone,
          maxLength: 32,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.done,
          // Leaves room for the keyboard and the error text when the field scrolls into view.
          scrollPadding: const EdgeInsets.only(bottom: 120),
          onChanged: (_) {
            if (_phoneError != null) setState(() => _phoneError = null);
          },
          decoration: InputDecoration(
            labelText: 'Professional phone',
            hintText: 'e.g. 0112345678',
            errorText: _phoneError,
            errorMaxLines: 2,
            counterText: '',
          ),
        ),
        gap,
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
        const SizedBox(height: 18),
        WorkspaceCard(
          padding: EdgeInsets.zero,
          child: SwitchListTile(
            value: _accepting,
            onChanged: (value) => setState(() => _accepting = value),
            title: const Text('Accepting new families'),
            subtitle: Text(
              '${_accepting ? 'On' : 'Off'} · Allow new families to request you as their primary doctor.',
            ),
          ),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: widget.busy ? null : _save,
          child: Text(widget.busy ? 'Saving…' : 'Save profile changes'),
        ),
      ],
    );
  }
}
