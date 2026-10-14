// ⚠ SHARED — coordinated route blocks for S1-S4.
import 'package:family_veda/providers/active_member_provider.dart';
import 'package:family_veda/providers/auth_provider.dart';
import 'package:family_veda/screens/profile/profile_screen.dart';
import 'package:family_veda/screens/auth/login_screen.dart';
import 'package:family_veda/screens/auth/register_screen.dart';
import 'package:family_veda/screens/auth/splash_screen.dart';
// ===== S1 — Public information routes =====
import 'package:family_veda/screens/public/public_information_screen.dart';
import 'package:family_veda/screens/appointments/appointments_screen.dart';
import 'package:family_veda/screens/appointments/book_appointment_screen.dart';
import 'package:family_veda/screens/emergency/emergency_screen.dart';
import 'package:family_veda/screens/family/join_family_screen.dart';
import 'package:family_veda/screens/family/join_requests_screen.dart';
import 'package:family_veda/screens/family/members_screen.dart';
import 'package:family_veda/screens/family/my_doctor_screen.dart';
import 'package:family_veda/screens/home/home_screen.dart';
import 'package:family_veda/screens/notifications/notifications_screen.dart';
import 'package:family_veda/screens/privacy/privacy_screen.dart';
import 'package:family_veda/screens/records/records_screen.dart';
import 'package:family_veda/screens/records/lab_upload_screen.dart';
import 'package:family_veda/screens/records/record_entry_screen.dart';
import 'package:family_veda/models/vital.dart';
import 'package:family_veda/screens/records/vital_entry_screen.dart';
import 'package:family_veda/screens/risk/approved_guidance_screen.dart';
import 'package:family_veda/screens/triage/case_status_screen.dart';
import 'package:family_veda/screens/triage/cases_screen.dart';
import 'package:family_veda/screens/triage/submit_complaint_screen.dart';
import 'package:family_veda/widgets/shared/app_shell.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:family_veda/screens/doctor/doctor_triage_cases_screen.dart';
import 'package:family_veda/screens/doctor/doctor_calendar_screen.dart';
import 'package:family_veda/screens/doctor/doctor_families_screen.dart';
import 'package:family_veda/screens/doctor/doctor_family_detail_screen.dart';
import 'package:family_veda/screens/doctor/doctor_member_workspace_screen.dart';
import 'package:family_veda/screens/doctor/doctor_profile_screen.dart';

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
      // ===== Auth & Splash (Full screen, no bottom nav) =====
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/about', builder: (_, _) => const PublicInformationScreen(kind: PublicInformationKind.about)),
      GoRoute(path: '/privacy-policy', builder: (_, _) => const PublicInformationScreen(kind: PublicInformationKind.privacy)),
      GoRoute(path: '/terms', builder: (_, _) => const PublicInformationScreen(kind: PublicInformationKind.terms)),

      // ===== Core 7 Portal Destinations wrapped in Persistent Shell & Web Subnav =====
      ShellRoute(
        builder: (context, state, child) => Consumer(
          builder: (context, ref, _) {
            final userType = ref.watch(authProvider.select((auth) => auth.userType));
            return AppShell(
              currentLocation: state.matchedLocation,
              isDoctor: userType == 'Doctor' || userType == '1',
              child: child,
            );
          },
        ),
        routes: [
          GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
          GoRoute(path: '/members', builder: (_, _) => const MembersScreen()),
          GoRoute(path: '/records', builder: (_, _) => const RecordsScreen()),
          GoRoute(path: '/cases', builder: (_, _) => const CasesScreen()),
          GoRoute(path: '/my-doctor', builder: (_, _) => const MyDoctorScreen()),
          GoRoute(path: '/appointments', builder: (_, _) => const AppointmentsScreen()),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
          GoRoute(path: '/privacy', builder: (_, _) => const PrivacyScreen()),
          GoRoute(path: '/calendar', builder: (_, _) => const DoctorCalendarScreen()),
          GoRoute(path: '/triage-cases', builder: (_, _) => const DoctorTriageCasesScreen()),
          GoRoute(path: '/families', builder: (_, _) => const DoctorFamiliesScreen()),
        ],
      ),

      // ===== Sub-flows & Details (Focused full-screen with Back navigation) =====
      GoRoute(
        path: '/complaints/new',
        builder: (_, _) => const SubmitComplaintScreen(),
      ),
      GoRoute(
        path: '/cases/:caseId',
        builder: (_, state) =>
            CaseStatusScreen(caseId: state.pathParameters['caseId'] ?? ''),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, _) => const NotificationsScreen(),
      ),
      GoRoute(path: '/records/new', builder: (_, _) => const RecordEntryScreen()),
      GoRoute(
        path: '/vitals/new',
        builder: (_, state) => VitalEntryScreen(
          initialKind: state.extra is VitalKind ? state.extra as VitalKind : null,
        ),
      ),
      GoRoute(path: '/lab-upload', builder: (_, _) => const LabUploadScreen()),
      GoRoute(
        path: '/guidance/:caseId',
        builder: (_, state) => ApprovedGuidanceScreen(
          caseId: state.pathParameters['caseId'] ?? '',
        ),
      ),
      GoRoute(path: '/emergency', builder: (_, _) => const EmergencyScreen()),
      GoRoute(
        path: '/families/members/:memberId',
        builder: (_, state) => DoctorMemberWorkspaceScreen(
          memberId: state.pathParameters['memberId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/families/:familyId',
        builder: (_, state) => DoctorFamilyDetailScreen(
          familyId: state.pathParameters['familyId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/doctor-profile',
        builder: (_, _) => const DoctorProfileScreen(),
      ),
      GoRoute(
        path: '/appointments/book',
        builder: (_, state) {
          final extra = state.extra;
          return extra is ({DateTime slot, int minutes})
              ? BookAppointmentScreen(
                  initialSlot: extra.slot,
                  initialMinutes: extra.minutes,
                )
              : const BookAppointmentScreen();
        },
      ),
      GoRoute(path: '/join-family', builder: (_, _) => const JoinFamilyScreen()),
      GoRoute(
        path: '/join-requests',
        builder: (_, _) => const JoinRequestsScreen(),
      ),
    ],
  );
});

String? routeRedirect({
  required AuthState auth,
  required String? activeMemberId,
  required String location,
}) {
  // Static information remains available while a session is restored.
  const publicInformation = {'/about', '/privacy-policy', '/terms'};
  if (publicInformation.contains(location)) return null;

  if (auth.status == AuthStatus.loading) {
    return location == '/splash' ? null : '/splash';
  }

  final authenticated = auth.status == AuthStatus.authenticated;
  if (!authenticated) {
    if (location == '/login' || location == '/register') return null;
    return '/login';
  }
  if (location == '/login' || location == '/splash' || location == '/register') return '/home';

  const memberRequired = {
    '/records/new', '/vitals/new', '/lab-upload', '/complaints/new',
  };
  final requiresMember =
      memberRequired.contains(location) ||
      location.startsWith('/cases/') ||
      location.startsWith('/guidance/');
  if (requiresMember && activeMemberId == null) return '/members';
  return null;
}
