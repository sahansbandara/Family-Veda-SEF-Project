// ⚠ SHARED — Family Veda Flutter application entry point.
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/auth_provider.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/router/app_router.dart';
import 'package:family_veda/providers/push_registration_provider.dart';
import 'package:family_veda/theme/app_theme.dart';
import 'package:family_veda/theme/glass.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: FamilyVedaApp()));
}

class FamilyVedaApp extends ConsumerStatefulWidget {
  const FamilyVedaApp({super.key});

  @override
  ConsumerState<FamilyVedaApp> createState() => _FamilyVedaAppState();
}

class _FamilyVedaAppState extends ConsumerState<FamilyVedaApp> {
  String? _memberRestoredForUserId;

  Future<void> _restoreActiveMember(String userId) async {
    if (_memberRestoredForUserId == userId) return;
    _memberRestoredForUserId = userId;
    try {
      final memberId = await ref
          .read(memberPreferenceStoreProvider)
          .readActiveMemberId(userId: userId);
      if (!mounted || _memberRestoredForUserId != userId) return;
      final auth = ref.read(authProvider);
      if (auth.status != AuthStatus.authenticated || auth.userId != userId) {
        return;
      }
      if (memberId != null) {
        ref.read(activeMemberProvider.notifier).state = memberId;
      }
    } on Object {
      // Member selection stays empty when secure storage is unavailable.
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(authLifecycleProvider);
    ref.watch(pushRegistrationProvider);
    ref.listen<AuthState>(authProvider, (_, next) {
      if (next.status == AuthStatus.authenticated && next.userId != null) {
        _restoreActiveMember(next.userId!);
      }
      if (next.status == AuthStatus.unauthenticated ||
          next.status == AuthStatus.cleanupRequired) {
        _memberRestoredForUserId = null;
      }
    });
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'Family Veda',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      darkTheme: buildAppTheme(brightness: Brightness.dark),
      themeMode: ref.watch(themeModeProvider),
      // The ambient colour field every glass surface blurs. Wrapping here
      // means each screen gets it without repeating itself.
      builder: (context, child) =>
          AmbientBackground(child: child ?? const SizedBox.shrink()),
      routerConfig: router,
    );
  }
}
