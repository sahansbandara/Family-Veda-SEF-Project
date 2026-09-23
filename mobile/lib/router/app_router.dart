// ⚠ SHARED — coordinated route blocks for S1-S4.
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/auth_provider.dart';
import 'package:family_veda/screens/auth/login_screen.dart';
import 'package:family_veda/screens/auth/splash_screen.dart';
import 'package:family_veda/screens/emergency/emergency_screen.dart';
import 'package:family_veda/screens/family/members_screen.dart';
import 'package:family_veda/screens/home/home_screen.dart';
import 'package:family_veda/screens/notifications/notifications_screen.dart';
import 'package:family_veda/screens/records/records_screen.dart';
import 'package:family_veda/screens/records/lab_upload_screen.dart';
import 'package:family_veda/screens/records/record_entry_screen.dart';
import 'package:family_veda/screens/records/vital_entry_screen.dart';
import 'package:family_veda/screens/risk/approved_guidance_screen.dart';
import 'package:family_veda/screens/triage/case_status_screen.dart';
import 'package:family_veda/screens/triage/cases_screen.dart';
import 'package:family_veda/screens/triage/submit_complaint_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  final activeMemberId = ref.watch(activeMemberProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      return routeRedirect(
        auth: auth,
        activeMemberId: activeMemberId,
        location: state.matchedLocation,
      );
    },
    routes: [
      // ===== S1 — Identity, Family, Consent =====
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/members', builder: (_, _) => const MembersScreen()),

      // ===== S3 — Home, Triage, Notifications =====
      GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
      GoRoute(
        path: '/complaints/new',
        builder: (_, _) => const SubmitComplaintScreen(),
      ),
      GoRoute(path: '/cases', builder: (_, _) => const CasesScreen()),
      GoRoute(
        path: '/cases/:caseId',
        builder: (_, state) =>
            CaseStatusScreen(caseId: state.pathParameters['caseId'] ?? ''),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, _) => const NotificationsScreen(),
      ),

      // ===== S2 — Health Records & Extraction =====
      GoRoute(path: '/records', builder: (_, _) => const RecordsScreen()),
      GoRoute(path: '/records/new', builder: (_, _) => const RecordEntryScreen()),
      GoRoute(path: '/vitals/new', builder: (_, _) => const VitalEntryScreen()),
      GoRoute(path: '/lab-upload', builder: (_, _) => const LabUploadScreen()),

      // ===== S4 — Risk, Approval, Emergency =====
      GoRoute(
        path: '/guidance/:caseId',
        builder: (_, state) => ApprovedGuidanceScreen(
          caseId: state.pathParameters['caseId'] ?? '',
        ),
      ),
      GoRoute(path: '/emergency', builder: (_, _) => const EmergencyScreen()),
    ],
  );
});

String? routeRedirect({
  required AuthState auth,
  required String? activeMemberId,
  required String location,
}) {
  if (auth.status == AuthStatus.loading) {
    return location == '/splash' ? null : '/splash';
  }

  final authenticated = auth.status == AuthStatus.authenticated;
  if (!authenticated) return location == '/login' ? null : '/login';
  if (location == '/login' || location == '/splash') return '/home';

  const memberRequired = {'/records', '/records/new', '/vitals/new', '/lab-upload', '/complaints/new', '/cases'};
  final requiresMember =
      memberRequired.contains(location) ||
      location.startsWith('/cases/') ||
      location.startsWith('/guidance/');
  if (requiresMember && activeMemberId == null) return '/members';
  return null;
}
