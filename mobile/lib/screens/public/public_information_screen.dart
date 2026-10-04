import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

enum PublicInformationKind { about, privacy, terms }

class PublicInformationScreen extends StatelessWidget {
  const PublicInformationScreen({super.key, required this.kind});

  final PublicInformationKind kind;

  ({String eyebrow, String title, String lead, List<({String title, String body})> sections}) get _content => switch (kind) {
    PublicInformationKind.about => (
      eyebrow: 'SE3090 UNIVERSITY PROTOTYPE',
      title: 'About Family Veda',
      lead: 'Family Veda is a synthetic-data prototype for learning and demonstrating family health-record workflows.',
      sections: [
        (title: 'What this prototype does', body: 'It brings together family health records, consent-aware sharing, doctor review and educational decision-support workflows. All examples, accounts and records in the prototype are synthetic.'),
        (title: 'How automated support is used', body: 'The hosted architecture uses Gemini as the primary provider and Groq as a fallback. Automated output is treated as untrusted input and is subject to validation. Doctor approval and backend consent rules remain in control of patient-data access.'),
        (title: 'Important safety notice', body: 'Family Veda provides educational information only. It does not provide a clinical diagnosis, prescription, medication dosing or meal plan. If there is an emergency or urgent concern, seek immediate care from local emergency services or a qualified healthcare professional.'),
      ],
    ),
    PublicInformationKind.privacy => (
      eyebrow: 'PRIVACY POLICY',
      title: 'Privacy and data use',
      lead: 'This policy describes the data handling of the Family Veda university prototype.',
      sections: [
        (title: 'Synthetic information only', body: 'This prototype is designed for synthetic information only. Do not enter real patient data, national identity numbers or professional registration numbers.'),
        (title: 'Storage and service providers', body: 'When configured, the prototype uses Vercel, Render and Neon for its web, API and database services. Original report files may be stored in a private Google Drive location configured for the application.'),
        (title: 'Consent and access', body: 'The backend enforces consent and doctor approval rules for relevant workflows. Revoking access stops future access through the application; it does not promise deletion of original files or records already stored by configured services.'),
        (title: 'Prototype limits', body: 'This page is an educational transparency notice for the assignment prototype. It does not make retention, deletion or clinical-care guarantees.'),
      ],
    ),
    PublicInformationKind.terms => (
      eyebrow: 'TERMS OF SERVICE',
      title: 'Terms for using Family Veda',
      lead: 'Use Family Veda only as a synthetic SE3090 university prototype.',
      sections: [
        (title: 'Permitted use', body: 'Use only synthetic identities and synthetic health information. You must not upload or rely on real patient data, real identity numbers or real professional registration numbers.'),
        (title: 'Clinical boundaries', body: 'Family Veda is educational support, not medical care. It does not provide a diagnosis, prescription, medication dosing or meal plan. Seek urgent or emergency care from appropriate local services and qualified professionals.'),
        (title: 'Access and approval', body: 'Access is governed by backend consent checks and doctor approval where the workflow requires it. Viewing these terms does not accept them or create an account. Registration requires a separate, explicit acceptance action.'),
        (title: 'Service availability', body: 'The prototype may use hosted Gemini and Groq AI providers, Vercel, Render, Neon and private Google Drive storage when configured. Availability and storage are subject to those configured services.'),
      ],
    ),
  };

  @override
  Widget build(BuildContext context) {
    final content = _content;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Use a fixed white/light text color because the background image is dark
    const titleColor = Colors.white;
    final bodyColor = Colors.white.withValues(alpha: 0.9);
    final mutedColor = Colors.white.withValues(alpha: 0.7);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Family Veda', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          tooltip: 'Back',
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go('/login'),
        ),
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/mobile-login.png',
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(color: const Color(0xFF1F2937)),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 800),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isDark
                              ? Colors.black.withValues(alpha: 0.5)
                              : Colors.black.withValues(alpha: 0.4), // Darker even in light mode to contrast white text
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              content.eyebrow, 
                              style: const TextStyle(color: Color(0xFF146CFF), fontWeight: FontWeight.bold, letterSpacing: 1.1, fontSize: 13),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              content.title, 
                              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: titleColor),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              content.lead, 
                              style: TextStyle(fontSize: 18, color: bodyColor, height: 1.4),
                            ),
                            const SizedBox(height: 32),
                            for (final section in content.sections) ...[
                              Divider(color: Colors.white.withValues(alpha: 0.2)),
                              const SizedBox(height: 24),
                              Text(
                                section.title, 
                                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: titleColor),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                section.body, 
                                style: TextStyle(fontSize: 16, color: mutedColor, height: 1.5),
                              ),
                              const SizedBox(height: 24),
                            ],
                            Divider(color: Colors.white.withValues(alpha: 0.2)),
                            const SizedBox(height: 24),
                            Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                TextButton(
                                  onPressed: () => context.go('/about'), 
                                  style: TextButton.styleFrom(foregroundColor: Colors.white),
                                  child: const Text('About')
                                ),
                                TextButton(
                                  onPressed: () => context.go('/privacy-policy'), 
                                  style: TextButton.styleFrom(foregroundColor: Colors.white),
                                  child: const Text('Privacy policy')
                                ),
                                TextButton(
                                  onPressed: () => context.go('/terms'), 
                                  style: TextButton.styleFrom(foregroundColor: Colors.white),
                                  child: const Text('Terms of service')
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
          ),
        ],
      ),
    );
  }
}
