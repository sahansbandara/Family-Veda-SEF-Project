// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../components/layout/AppLayout'
import { AuditPage } from '../pages/audit/AuditPage'
import { AuthPage } from '../pages/auth/AuthPage'
import { DoctorRegisterPage } from '../pages/auth/DoctorRegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { DoctorPortal } from '../pages/doctor/DoctorPortal'
import { ClinicAdminPortal } from '../pages/admin/ClinicAdminPortal'
import { DoctorStatusPage } from '../pages/doctor/DoctorStatusPage'
import { FamilyHeadStatusPage } from '../pages/family/FamilyHeadStatusPage'
import { RecordsPage } from '../pages/records/RecordsPage'
import { FamilyRiskPage } from '../pages/family/FamilyRiskPage'
import { TriagePage } from '../pages/triage/TriagePage'
import { FamilyPage } from '../pages/family/FamilyPage'
import { OnboardingPage } from '../pages/family/OnboardingPage'
import { NotFoundPage } from '../pages/system/SystemPages'
// ===== S4 — Three-portal feature routes (docs/Three_Portal_Feature_Spec.md) =====
import { JoinFamilyPage } from '../pages/family/JoinFamilyPage'
import { MyDoctorPage } from '../pages/family/MyDoctorPage'
import { AppointmentsPage } from '../pages/family/AppointmentsPage'
import { DoctorCalendarPage } from '../pages/doctor/DoctorCalendarPage'
import { CasesPage } from '../pages/doctor/CasesPage'
import { ApprovalsPage } from '../pages/doctor/ApprovalsPage'
import { NotificationsPage } from '../pages/notifications/NotificationsPage'
import { PrivacyPage } from '../pages/family/PrivacyPage'
import { MyFamilyPage } from '../pages/family/MyFamilyPage'
import { RouteGuard } from './RouteGuard'

const allRoles = ['DOCTOR', 'ADMIN', 'FAMILY_HEAD', 'MEMBER', 'ONBOARDING'] as const

export function AppRoutes() {
  return (
    <Routes>
      {/* ===== S1 — Public and identity routes ===== */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/register/doctor" element={<DoctorRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/access-denied" element={<Navigate to="/dashboard" replace />} />

      <Route element={<RouteGuard allowedRoles={[...allRoles]} allowUnverifiedDoctor allowUnverifiedFamilyHead><AppLayout /></RouteGuard>}>
        <Route path="/onboarding" element={<RouteGuard allowedRoles={['ONBOARDING']}><OnboardingPage /></RouteGuard>} />
        <Route path="/family-head-status" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'ONBOARDING']} allowUnverifiedFamilyHead><FamilyHeadStatusPage /></RouteGuard>} />
        <Route path="/doctor-status" element={<RouteGuard allowedRoles={['DOCTOR']} allowUnverifiedDoctor><DoctorStatusPage /></RouteGuard>} />
        {/* ===== S3 — Dashboard foundation ===== */}
        <Route path="/dashboard" element={<RouteGuard allowedRoles={['DOCTOR', 'ADMIN', 'FAMILY_HEAD', 'MEMBER']}><DashboardPage /></RouteGuard>} />
        <Route path="/triage" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><TriagePage /></RouteGuard>} />

        {/* ===== S2 — Records foundation ===== */}
        <Route path="/records" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><RecordsPage /></RouteGuard>} />
        <Route path="/family" element={<RouteGuard allowedRoles={['FAMILY_HEAD']}><FamilyPage /></RouteGuard>} />

        {/* ===== S4 — Doctor and audit foundations ===== */}
        <Route path="/calendar" element={<RouteGuard allowedRoles={['DOCTOR']}><DoctorCalendarPage /></RouteGuard>} />
        <Route path="/families" element={<RouteGuard allowedRoles={['DOCTOR']}><DoctorPortal initialTab="families" /></RouteGuard>} />
        <Route path="/doctor-profile" element={<RouteGuard allowedRoles={['DOCTOR']}><DoctorPortal initialTab="profile" /></RouteGuard>} />
        <Route path="/cases" element={<RouteGuard allowedRoles={['DOCTOR']}><CasesPage /></RouteGuard>} />
        <Route path="/approvals" element={<RouteGuard allowedRoles={['DOCTOR']}><ApprovalsPage /></RouteGuard>} />
        <Route path="/family-risk" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><FamilyRiskPage /></RouteGuard>} />
        <Route path="/audit" element={<RouteGuard allowedRoles={['ADMIN', 'FAMILY_HEAD']}><AuditPage /></RouteGuard>} />
        {/* Family Head "Privacy & Access" and Adult "Privacy" (docs/Three_Dashboards_UX_Plan.md §3, §4). */}
        <Route path="/privacy" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><PrivacyPage /></RouteGuard>} />
        <Route path="/doctor-verification" element={<RouteGuard allowedRoles={['ADMIN']}><ClinicAdminPortal initialTab="doctor-verif" /></RouteGuard>} />
        <Route path="/family-head-verification" element={<RouteGuard allowedRoles={['ADMIN']}><ClinicAdminPortal initialTab="family-verif" /></RouteGuard>} />
        <Route path="/users" element={<RouteGuard allowedRoles={['ADMIN']}><ClinicAdminPortal initialTab="users" /></RouteGuard>} />
        <Route path="/settings" element={<RouteGuard allowedRoles={['ADMIN']}><ClinicAdminPortal initialTab="settings" /></RouteGuard>} />

        {/* ===== S4 — Three-portal feature routes (docs/Three_Portal_Feature_Spec.md) ===== */}
        <Route path="/join-family" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><JoinFamilyPage /></RouteGuard>} />
        <Route path="/my-doctor" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><MyDoctorPage /></RouteGuard>} />
        <Route path="/appointments" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><AppointmentsPage /></RouteGuard>} />
        <Route path="/doctor-calendar" element={<Navigate to="/calendar" replace />} />
        <Route path="/my-family" element={<RouteGuard allowedRoles={['MEMBER']}><MyFamilyPage /></RouteGuard>} />
        <Route path="/notifications" element={<RouteGuard allowedRoles={[...allRoles]}><NotificationsPage /></RouteGuard>} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
