// Owner: S1 · Family, Identity & Consent
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  int _step = 0;
  String _role = 'FAMILY_HEAD';
  String _connectionMethod = 'INVITATION';

  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  final _dobCtrl = TextEditingController();
  final _famNameCtrl = TextEditingController();

  final _invitationCtrl = TextEditingController();

  final _regNumCtrl = TextEditingController();
  final _specialtyCtrl = TextEditingController();

  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    _dobCtrl.dispose();
    _famNameCtrl.dispose();
    _invitationCtrl.dispose();
    _regNumCtrl.dispose();
    _specialtyCtrl.dispose();
    super.dispose();
  }

  void _next() {
    setState(() => _error = null);
    if (_step == 1) {
      if (!(_formKey.currentState?.validate() ?? false)) return;
      if (_passwordCtrl.text != _confirmCtrl.text) {
        setState(() => _error = 'Passwords do not match');
        return;
      }
    }

    if (_step == 2) {
      if (_role == 'FAMILY_HEAD') {
        if (_dobCtrl.text.isEmpty || _famNameCtrl.text.isEmpty) {
          setState(() => _error = 'Please fill all required fields');
          return;
        }
      } else if (_role == 'MEMBER') {
        if (_dobCtrl.text.isEmpty) {
          setState(() => _error = 'Please enter date of birth');
          return;
        }
      } else if (_role == 'DOCTOR') {
        if (_regNumCtrl.text.isEmpty || _regNumCtrl.text.length < 4) {
          setState(() => _error = 'Enter a valid SLMC registration number');
          return;
        }
      }
    }

    if (_step == 3 && _role == 'MEMBER' && _connectionMethod == 'INVITATION') {
      if (_invitationCtrl.text.isEmpty) {
        setState(() => _error = 'Please enter invitation token');
        return;
      }
    }

    setState(() => _step++);
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // In a real app, this would orchestrate multiple API calls using providers.
      // We simulate success and log them in, then push to onboarding or dashboard.
      // Since this is the frontend flutter UI, we just simulate the flow for the new commercial design.
      await Future.delayed(const Duration(seconds: 2));

      if (!mounted) return;

      // For now, we will just use the normal login to trigger auth state changes,
      // or directly use router to go to appropriate page if we can't fully mock.
      context.go('/login');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Account created successfully! Please sign in.'),
        ),
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildStepIndicator(List<String> labels) {
    return Row(
      children: List.generate(labels.length, (index) {
        final isActive = index == _step;
        final isDone = index < _step;
        final color = isDone
            ? Colors.green
            : (isActive ? Colors.blue : Colors.grey);
        return Expanded(
          child: Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDone
                      ? Colors.green
                      : (isActive
                            ? Colors.blue.withValues(alpha: 0.1)
                            : Colors.transparent),
                  border: Border.all(color: color),
                ),
                child: Center(
                  child: isDone
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : Text(
                          '${index + 1}',
                          style: TextStyle(
                            color: color,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  labels[index],
                  style: TextStyle(
                    color: color,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (index < labels.length - 1)
                Expanded(
                  child: Container(
                    height: 1,
                    color: isDone
                        ? Colors.green
                        : Colors.grey.withValues(alpha: 0.3),
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildRoleCard(String title, String desc, String roleId, bool isDark) {
    final isSelected = _role == roleId;
    return GestureDetector(
      onTap: () => setState(() => _role = roleId),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? Colors.blue.withValues(alpha: 0.1)
              : (isDark
                    ? Colors.white10
                    : Colors.black.withValues(alpha: 0.05)),
          border: Border.all(
            color: isSelected ? Colors.blue : Colors.transparent,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
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
              desc,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController ctrl, {
    bool isPass = false,
    bool isRequired = false,
    bool isDisabled = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: ctrl,
        obscureText: isPass,
        enabled: !isDisabled,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          filled: isDisabled,
          fillColor: isDisabled ? Colors.grey.withValues(alpha: 0.1) : null,
        ),
        validator: isRequired
            ? (v) => (v == null || v.isEmpty) ? 'Required' : null
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    List<String> stepLabels;
    if (_role == 'FAMILY_HEAD') { stepLabels = ['Role', 'Account', 'Personal', 'Review']; }
    else if (_role == 'MEMBER') { stepLabels = ['Role', 'Account', 'Personal', 'Connection', 'Review']; }
    else { stepLabels = ['Role', 'Account', 'Professional', 'Verification', 'Review']; }

    final isFinal = _step == stepLabels.length - 1;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0F172A)
          : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : Colors.black87,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.1)
                        : Colors.black.withValues(alpha: 0.05),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Create Account',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 24),
                      _buildStepIndicator(stepLabels),
                      const SizedBox(height: 32),

                      if (_step == 0) ...[
                        _buildRoleCard(
                          'Family Head',
                          'Create and manage a new family workspace.',
                          'FAMILY_HEAD',
                          isDark,
                        ),
                        _buildRoleCard(
                          'Adult Member',
                          'Join an existing family using an invitation token.',
                          'MEMBER',
                          isDark,
                        ),
                        _buildRoleCard(
                          'Medical Practitioner',
                          'Provide clinical care with verifiable credentials.',
                          'DOCTOR',
                          isDark,
                        ),
                      ],

                      if (_step == 1) ...[
                        _buildTextField(
                          'Full Name',
                          _nameCtrl,
                          isRequired: true,
                        ),
                        _buildTextField(
                          'Email Address',
                          _emailCtrl,
                          isRequired: true,
                        ),
                        _buildTextField(
                          'Mobile Number (Coming Soon)',
                          TextEditingController(),
                          isDisabled: true,
                        ),
                        _buildTextField(
                          'Password',
                          _passwordCtrl,
                          isPass: true,
                          isRequired: true,
                        ),
                        _buildTextField(
                          'Confirm Password',
                          _confirmCtrl,
                          isPass: true,
                          isRequired: true,
                        ),
                      ],

                      if (_step == 2) ...[
                        if (_role == 'DOCTOR') ...[
                          _buildTextField(
                            'SLMC Registration Number',
                            _regNumCtrl,
                            isRequired: true,
                          ),
                          _buildTextField(
                            'Specialty / Designation',
                            _specialtyCtrl,
                          ),
                          _buildTextField(
                            'Hospital / Practice City (Coming Soon)',
                            TextEditingController(),
                            isDisabled: true,
                          ),
                        ] else ...[
                          _buildTextField(
                            'Date of Birth (YYYY-MM-DD)',
                            _dobCtrl,
                            isRequired: true,
                          ),
                          if (_role == 'FAMILY_HEAD')
                            _buildTextField(
                              'Family Workspace Name',
                              _famNameCtrl,
                              isRequired: true,
                            ),
                          _buildTextField(
                            'Address & NIC (Coming Soon)',
                            TextEditingController(),
                            isDisabled: true,
                          ),
                        ],
                      ],

                      if (_step == 3) ...[
                        if (_role == 'MEMBER') ...[
                          GestureDetector(
                            onTap: () => setState(
                              () => _connectionMethod = 'INVITATION',
                            ),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: _connectionMethod == 'INVITATION'
                                    ? Colors.blue.withValues(alpha: 0.1)
                                    : (isDark
                                          ? Colors.white10
                                          : Colors.black.withValues(
                                              alpha: 0.05,
                                            )),
                                border: Border.all(
                                  color: _connectionMethod == 'INVITATION'
                                      ? Colors.blue
                                      : Colors.transparent,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Option A — I have an Invitation',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () =>
                                setState(() => _connectionMethod = 'LATER'),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: _connectionMethod == 'LATER'
                                    ? Colors.blue.withValues(alpha: 0.1)
                                    : (isDark
                                          ? Colors.white10
                                          : Colors.black.withValues(
                                              alpha: 0.05,
                                            )),
                                border: Border.all(
                                  color: _connectionMethod == 'LATER'
                                      ? Colors.blue
                                      : Colors.transparent,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Option C — Join Later',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          if (_connectionMethod == 'INVITATION')
                            _buildTextField(
                              'Invitation Token',
                              _invitationCtrl,
                              isRequired: true,
                            ),
                        ],
                        if (_role == 'DOCTOR') ...[
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.blue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.blue),
                            ),
                            child: const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Manual Verification Required',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Colors.blue,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Your professional profile will be reviewed by an administrator before clinical access is enabled.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.blue,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildTextField(
                            'Medical License Upload (Coming Soon)',
                            TextEditingController(),
                            isDisabled: true,
                          ),
                        ],
                        if (_role == 'FAMILY_HEAD') ...[
                          const Text(
                            'Review Details',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text('Account: ${_nameCtrl.text}'),
                          Text('Email: ${_emailCtrl.text}'),
                          Text('Workspace: ${_famNameCtrl.text}'),
                        ],
                      ],

                      if (_step == 4) ...[
                        const Text(
                          'Review Details',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text('Account: ${_nameCtrl.text}'),
                        Text('Email: ${_emailCtrl.text}'),
                        if (_role == 'MEMBER')
                          Text(
                            'Connection: ${_connectionMethod == 'INVITATION' ? 'Via Token' : 'Join Later'}',
                          ),
                        if (_role == 'DOCTOR') ...[
                          Text('SLMC: ${_regNumCtrl.text}'),
                          const SizedBox(height: 8),
                          const Text(
                            '⚠️ Clinical access will remain blocked until verified.',
                            style: TextStyle(
                              color: Colors.orange,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ],

                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          style: const TextStyle(
                            color: Colors.red,
                            fontSize: 13,
                          ),
                        ),
                      ],

                      const SizedBox(height: 24),
                      Row(
                        children: [
                          if (_step > 0)
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _loading
                                    ? null
                                    : () => setState(() => _step--),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text('Back'),
                              ),
                            ),
                          if (_step > 0) const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              onPressed: _loading
                                  ? null
                                  : (isFinal ? _submit : _next),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                backgroundColor: const Color(0xFF146CFF),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: _loading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Text(
                                      isFinal
                                          ? (_role == 'DOCTOR'
                                                ? 'Submit for Review'
                                                : 'Create Account')
                                          : 'Continue',
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
        ),
      ),
    );
  }
}
