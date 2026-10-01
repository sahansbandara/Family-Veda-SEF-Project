// Owner: S1 · Family, Identity & Consent
import 'package:dio/dio.dart';
import 'package:family_veda/providers/auth_provider.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  static const districts = [
    'Ampara',
    'Anuradhapura',
    'Badulla',
    'Batticaloa',
    'Colombo',
    'Galle',
    'Gampaha',
    'Hambantota',
    'Jaffna',
    'Kalutara',
    'Kandy',
    'Kegalle',
    'Kilinochchi',
    'Kurunegala',
    'Mannar',
    'Matale',
    'Matara',
    'Monaragala',
    'Mullaitivu',
    'Nuwara Eliya',
    'Polonnaruwa',
    'Puttalam',
    'Ratnapura',
    'Trincomalee',
    'Vavuniya',
  ];
  static const relationships = [
    'Spouse',
    'Son',
    'Daughter',
    'Parent',
    'Sibling',
    'Other',
  ];
  final form = GlobalKey<FormState>();
  final name = TextEditingController(),
      email = TextEditingController(),
      mobile = TextEditingController(),
      password = TextEditingController(),
      confirm = TextEditingController(),
      dob = TextEditingController(),
      line1 = TextEditingController(),
      line2 = TextEditingController(),
      city = TextEditingController(),
      postal = TextEditingController(),
      family = TextEditingController(),
      nic = TextEditingController(),
      invite = TextEditingController(),
      code = TextEditingController(),
      slmc = TextEditingController(),
      specialization = TextEditingController(),
      hospital = TextEditingController(),
      practiceCity = TextEditingController();
  int step = 0;
  String role = 'FAMILY_HEAD',
      connection = 'INVITATION',
      sex = 'NotSpecified',
      relationship = 'Spouse';
  // No default district: the person must choose one (validated before continuing).
  String? district;
  final languages = {'English'};
  XFile? licence;
  bool terms = false, loading = false;
  String? error;
  Map<String, String> serverErrors = {};
  @override
  void dispose() {
    for (final x in [
      name,
      email,
      mobile,
      password,
      confirm,
      dob,
      line1,
      line2,
      city,
      postal,
      family,
      nic,
      invite,
      code,
      slmc,
      specialization,
      hospital,
      practiceCity,
    ]) {
      x.dispose();
    }
    super.dispose();
  }

  List<String> get labels => switch (role) {
    'FAMILY_HEAD' => ['Role', 'Account', 'Personal', 'Review'],
    'MEMBER' => ['Role', 'Account', 'Personal', 'Connection', 'Review'],
    _ => ['Role', 'Account', 'Professional', 'Verification', 'Review'],
  };
  String? required(String? v, [String m = 'Required']) =>
      v == null || v.trim().isEmpty ? m : null;
  String? server(String key) {
    for (final e in serverErrors.entries) {
      if (e.key == key || e.key.endsWith(key)) return e.value;
    }
    return null;
  }

  String? strong(String? v) {
    final x = v ?? '';
    return x.length >= 8 &&
            x.length <= 128 &&
            RegExp(r'[A-Z]').hasMatch(x) &&
            RegExp(r'[a-z]').hasMatch(x) &&
            RegExp(r'\d').hasMatch(x) &&
            RegExp(r'[^A-Za-z0-9]').hasMatch(x)
        ? null
        : 'Use 8+ characters with upper/lower case, number and symbol.';
  }

  String? adult(String? v) {
    final d = DateTime.tryParse(v?.trim() ?? '');
    if (d == null || d.year < 1900 || !d.isBefore(DateTime.now())) {
      return 'Enter a valid date of birth.';
    }
    return DateTime(d.year + 18, d.month, d.day).isAfter(DateTime.now())
        ? 'You must be at least 18 years old.'
        : null;
  }

  void next() {
    setState(() => serverErrors = {});
    if (!(form.currentState?.validate() ?? false)) return;
    if (role == 'DOCTOR' && step == 3 && licence == null) {
      setState(() => error = 'Choose a PNG or JPEG licence image up to 5 MB.');
      return;
    }
    setState(() => step++);
  }

  Future<void> chooseFile() async {
    final image = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
    );
    if (image == null) return;
    final n = image.name.toLowerCase();
    if (!(n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg'))) {
      setState(() => error = 'Choose a PNG or JPEG licence image.');
      return;
    }
    if (await image.length() > 5 * 1024 * 1024) {
      setState(() => error = 'Licence image must be 5 MB or smaller.');
      return;
    }
    if (mounted) setState(() => licence = image);
  }

  Future<void> submit() async {
    if (!(form.currentState?.validate() ?? false)) return;
    if (!terms) {
      setState(
        () => error = 'Accept the terms and privacy notice to continue.',
      );
      return;
    }
    setState(() {
      loading = true;
      error = null;
      serverErrors = {};
    });
    final account = {
      'fullName': name.text.trim(),
      'email': email.text.trim(),
      'mobileNumber': mobile.text.replaceAll(' ', ''),
      'password': password.text,
      'confirmPassword': confirm.text,
    };
    final address = {
      'addressLine1': line1.text.trim(),
      'addressLine2': line2.text.trim().isEmpty ? null : line2.text.trim(),
      'city': city.text.trim(),
      'district': district,
      'postalCode': postal.text.trim().isEmpty ? null : postal.text.trim(),
    };
    final api = ref.read(authApiProvider);
    final ok = await ref.read(authProvider.notifier).register(() async {
      if (role == 'FAMILY_HEAD') {
        return api.registerFamilyHead({
          'account': account,
          'personal': {
            'dateOfBirth': dob.text.trim(),
            'sexForClinicalReference': sex,
          },
          'familyName': family.text.trim(),
          'nationalId': nic.text.trim(),
          'address': address,
          'acceptTerms': terms,
        });
      }
      if (role == 'MEMBER') {
        return api.registerAdultMember({
          'account': account,
          'personal': {
            'dateOfBirth': dob.text.trim(),
            'sexForClinicalReference': sex,
          },
          'address': address,
          'connection': {
            'method': connection == 'INVITATION'
                ? 'Invitation'
                : connection == 'FAMILY_CODE'
                ? 'FamilyCode'
                : 'Later',
            'invitationToken': connection == 'INVITATION'
                ? invite.text.trim()
                : null,
            'familyCode': connection == 'FAMILY_CODE'
                ? code.text.trim().toUpperCase()
                : null,
            'relationship': connection == 'FAMILY_CODE' ? relationship : null,
          },
          'acceptTerms': terms,
        });
      }
      final f = licence!;
      return api.registerDoctor(
        FormData.fromMap({
          ...account,
          'registrationNumber': slmc.text.trim(),
          'specialization': specialization.text.trim(),
          'hospitalClinic': hospital.text.trim(),
          'practiceCity': practiceCity.text.trim(),
          'district': district,
          'languages': languages.toList(),
          'acceptTerms': terms.toString(),
          'licenseDocument': await MultipartFile.fromFile(
            f.path,
            filename: f.name,
          ),
        }),
      );
    });
    if (!mounted) return;
    if (ok) {
      context.go(role == 'FAMILY_HEAD' ? '/family-head-status' : '/dashboard');
    } else {
      final auth = ref.read(authProvider);
      setState(() {
        error =
            auth.errorMessage ??
            'Registration failed. Check the form and try again.';
        serverErrors = auth.fieldErrors;
      });
    }
    if (mounted) setState(() => loading = false);
  }

  Widget field(
    String label,
    TextEditingController c, {
    required String key,
    String? Function(String?)? validator,
    bool obscure = false,
    TextInputType? type,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: c,
          obscureText: obscure,
          keyboardType: type,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: validator,
          decoration: InputDecoration(
            labelText: label,
            filled: true,
            fillColor: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black.withValues(alpha: 0.3) 
                : Colors.white.withValues(alpha: 0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        if (server(key) case final message?)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 12),
            child: Text(
              message,
              style: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    ),
  );
  Widget select(
    String label,
    String? value,
    List<String> values,
    ValueChanged<String?> set, {
    required String key,
    FormFieldValidator<String>? validator,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField(
          // ignore: deprecated_member_use
          value: value,
          items: values
              .map((x) => DropdownMenuItem(value: x, child: Text(x)))
              .toList(),
          onChanged: set,
          validator: validator,
          decoration: InputDecoration(
            labelText: label,
            filled: true,
            fillColor: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black.withValues(alpha: 0.3) 
                : Colors.white.withValues(alpha: 0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        if (server(key) case final message?)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 12),
            child: Text(
              message,
              style: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    ),
  );
  Widget card(String title, String detail, String id) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: () => setState(() {
        role = id;
        step = 0;
        error = null;
      }),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: role == id
              ? Colors.blue.withValues(alpha: .2)
              : (isDark ? Colors.white.withValues(alpha: .05) : Colors.black.withValues(alpha: .04)),
          border: Border.all(
            color: role == id ? Colors.blue : Colors.transparent,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold, 
                      fontSize: 16,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    detail,
                    style: TextStyle(color: isDark ? Colors.white70 : Colors.black54),
                  ),
                ],
              ),
            ),
            Icon(
              role == id ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: role == id ? Colors.blue : (isDark ? Colors.white54 : Colors.black38),
            ),
          ],
        ),
      ),
    );
  }
  Widget stepIndicator() => Row(
    children: List.generate(labels.length, (index) {
      final complete = index < step;
      final active = index == step;
      final color = complete
          ? Colors.green
          : active
          ? Colors.blue
          : Colors.grey;
      return Expanded(
        child: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: complete ? Colors.green : Colors.transparent,
                border: Border.all(color: color),
              ),
              child: Center(
                child: complete
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : Text(
                        (index + 1).toString(),
                        style: TextStyle(color: color, fontSize: 12),
                      ),
              ),
            ),
            if (index < labels.length - 1)
              Expanded(
                child: Container(
                  height: 1,
                  color: color.withValues(alpha: .45),
                ),
              ),
          ],
        ),
      );
    }),
  );

  Widget account() => Column(
    children: [
      field(
        'Full name',
        name,
        key: 'account.fullname',
        validator: (v) =>
            RegExp(
              r"^[\p{L}][\p{L} .'\-]{1,119}$",
              unicode: true,
            ).hasMatch(v?.trim() ?? '')
            ? null
            : 'Enter your full name.',
      ),
      field(
        'Email address',
        email,
        key: 'account.email',
        validator: (v) =>
            RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v?.trim() ?? '')
            ? null
            : 'Enter a valid email address.',
        type: TextInputType.emailAddress,
      ),
      field(
        'Sri Lankan mobile',
        mobile,
        key: 'account.mobilenumber',
        validator: (v) =>
            RegExp(
              r'^(?:0|\+94)7\d{8}$',
            ).hasMatch((v ?? '').replaceAll(' ', ''))
            ? null
            : 'Use 0771234567 or +94771234567.',
        type: TextInputType.phone,
      ),
      field(
        'Password',
        password,
        key: 'account.password',
        validator: strong,
        obscure: true,
      ),
      field(
        'Confirm password',
        confirm,
        key: 'account.confirmpassword',
        validator: (v) => v == password.text ? null : 'Passwords do not match.',
        obscure: true,
      ),
    ],
  );
  Widget personal() => Column(
    children: [
      field(
        'Date of birth (YYYY-MM-DD)',
        dob,
        key: 'personal.dateofbirth',
        validator: adult,
        type: TextInputType.datetime,
      ),
      select(
        'Clinical sex',
        sex,
        const ['Male', 'Female', 'NotSpecified'],
        (v) => setState(() => sex = v!),
        key: 'personal.sexforclinicalreference',
      ),
      if (role == 'FAMILY_HEAD') ...[
        field('Family name', family, key: 'familyname', validator: required),
        field(
          'Synthetic NIC',
          nic,
          key: 'nationalid',
          validator: (v) =>
              RegExp(r'^(?:\d{9}[VvXx]|\d{12})$').hasMatch(v?.trim() ?? '')
              ? null
              : 'Use 9 digits + V/X or 12 digits.',
        ),
      ],
      field(
        'Address line 1',
        line1,
        key: 'address.addressline1',
        validator: required,
      ),
      field('Address line 2 (optional)', line2, key: 'address.addressline2'),
      field('City', city, key: 'address.city', validator: required),
      select(
        'District',
        district,
        districts,
        (v) => setState(() => district = v),
        key: 'address.district',
        validator: (v) => v == null ? 'Choose a district.' : null,
      ),
      field(
        'Postal code (optional)',
        postal,
        key: 'address.postalcode',
        validator: (v) =>
            v == null || v.isEmpty || RegExp(r'^\d{5}$').hasMatch(v)
            ? null
            : 'Postal code must be 5 digits.',
        type: TextInputType.number,
      ),
    ],
  );
  Widget professional() => Column(
    children: [
      field(
        'SLMC registration number',
        slmc,
        key: 'registrationnumber',
        validator: (v) => RegExp(r'^\d{4,10}$').hasMatch(v?.trim() ?? '')
            ? null
            : 'SLMC number must be 4–10 digits.',
        type: TextInputType.number,
      ),
      field(
        'Specialization',
        specialization,
        key: 'specialization',
        validator: required,
      ),
      field(
        'Hospital or clinic',
        hospital,
        key: 'hospitalclinic',
        validator: required,
      ),
      field(
        'Practice city',
        practiceCity,
        key: 'practicecity',
        validator: required,
      ),
      select(
        'District',
        district,
        districts,
        (v) => setState(() => district = v),
        key: 'district',
        validator: (v) => v == null ? 'Choose a district.' : null,
      ),
      const Align(
        alignment: Alignment.centerLeft,
        child: Text('Languages (select 1–3)'),
      ),
      ...['Sinhala', 'Tamil', 'English'].map(
        (x) => CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(x),
          value: languages.contains(x),
          onChanged: (v) => setState(() {
            if (v == true && languages.length < 3) languages.add(x);
            if (v != true) languages.remove(x);
          }),
        ),
      ),
      if (languages.isEmpty)
        const Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Choose at least one language.',
            style: TextStyle(color: Colors.red, fontSize: 12),
          ),
        ),
    ],
  );
  Widget connectionStep() => Column(
    children: [
      RadioGroup<String>(
        groupValue: connection,
        onChanged: (value) => setState(() => connection = value!),
        child: Column(
          children: [
            for (final x in const {
              'INVITATION': 'I have an invitation',
              'FAMILY_CODE': 'Use a family code',
              'LATER': 'Join a family later',
            }.entries)
              RadioListTile(value: x.key, title: Text(x.value)),
          ],
        ),
      ),
      if (connection == 'INVITATION')
        field(
          'Invitation token',
          invite,
          key: 'connection.invitationtoken',
          validator: required,
        ),
      if (connection == 'FAMILY_CODE') ...[
        field(
          'Family code',
          code,
          key: 'connection.familycode',
          validator: (v) =>
              RegExp(
                r'^FV-[A-HJ-NP-Z2-9]{6}$',
              ).hasMatch(v?.trim().toUpperCase() ?? '')
              ? null
              : 'Family codes look like FV-ABC234.',
        ),
        select(
          'Relationship',
          relationship,
          relationships,
          (v) => setState(() => relationship = v!),
          key: 'connection.relationship',
        ),
      ],
    ],
  );
  Widget review() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Review details',
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      Text('Account: ${name.text}'),
      Text('Email: ${email.text}'),
      if (role == 'FAMILY_HEAD') Text('Family: ${family.text}'),
      if (role == 'MEMBER')
        Text('Connection: ${connection.replaceAll('_', ' ')}'),
      if (role == 'DOCTOR') ...[
        Text('SLMC: ${slmc.text}'),
        const Text(
          'Clinical access remains blocked until verified.',
          style: TextStyle(color: Colors.orange),
        ),
      ],
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        value: terms,
        title: const Text('I accept the Terms of Service and Privacy Notice.'),
        onChanged: (v) => setState(() => terms = v ?? false),
      ),
      if (!terms && error?.contains('Accept the terms') == true)
        const Text(
          'Acceptance is required.',
          style: TextStyle(color: Colors.red, fontSize: 12),
        ),
      if (server('acceptterms') case final message?)
        Text(message, style: const TextStyle(color: Colors.red, fontSize: 12)),
    ],
  );
  @override
  Widget build(BuildContext context) {
    final last = step == labels.length - 1;
    final content = switch (step) {
      0 => Column(
        children: [
          card('Family Head', 'Create a family workspace.', 'FAMILY_HEAD'),
          card('Adult Member', 'Join an existing family.', 'MEMBER'),
          card(
            'Doctor',
            'Register with verifiable credentials.',
            'DOCTOR',
          ),
        ],
      ),
      1 => account(),
      2 => role == 'DOCTOR' ? professional() : personal(),
      3 =>
        role == 'MEMBER'
            ? connectionStep()
            : role == 'DOCTOR'
            ? Column(
                children: [
                  const Text(
                    'Manual verification is required before clinical access is enabled.',
                  ),
                  OutlinedButton.icon(
                    onPressed: chooseFile,
                    icon: const Icon(Icons.upload_file),
                    label: Text(
                      licence?.name ?? 'Choose PNG or JPEG licence (max 5 MB)',
                    ),
                  ),
                  if (server('licensedocument') case final message?)
                    Text(
                      message,
                      style: const TextStyle(color: Colors.red, fontSize: 12),
                    ),
                ],
              )
            : review(),
      _ => review(),
    };
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 800;

    final formWidget = ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
              ),
            ),
            padding: const EdgeInsets.all(32),
            child: Form(
              key: form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    step == 0 ? 'Select Role' : 'Create Account',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (step > 0) stepIndicator(),
                  if (step > 0) const SizedBox(height: 20),
                  content,
                  if (error case final message?)
                    Text(
                      message,
                      style: const TextStyle(color: Colors.red),
                    ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      if (step > 0)
                        Expanded(
                          child: OutlinedButton(
                            onPressed: loading
                                ? null
                                : () => setState(() => step--),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: const Text('Back'),
                          ),
                        ),
                      if (step > 0) const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: loading
                              ? null
                              : last
                              ? submit
                              : next,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: const Color(0xFF146CFF),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: loading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  last ? 'Create account' : 'Continue',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : Colors.black),
          onPressed: () => context.pop(),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/mobile-login.png',
              fit: BoxFit.cover,
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: isDesktop
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(40.0),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Let\'s Get\nStarted',
                                    style: TextStyle(
                                      fontSize: 48,
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Secure access to your health, family and clinical care. Create a unified workspace for seamless clinical decision support and familial risk mapping.',
                                    style: TextStyle(
                                      fontSize: 18,
                                      color: isDark ? Colors.white70 : Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          Expanded(child: Center(child: formWidget)),
                        ],
                      )
                    : formWidget,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
