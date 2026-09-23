// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../components/layout/AppLayout'
import { AuditPage } from '../pages/audit/AuditPage'
import { DoctorVerificationPage } from '../pages/admin/DoctorVerificationPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { DoctorRegisterPage } from '../pages/auth/DoctorRegisterPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { ApprovalsPage } from '../pages/doctor/ApprovalsPage'
import { CasesPage } from '../pages/doctor/CasesPage'
import { DoctorStatusPage } from '../pages/doctor/DoctorStatusPage'
import { RecordsPage } from '../pages/records/RecordsPage'
import { FamilyPage } from '../pages/family/FamilyPage'
import { OnboardingPage } from '../pages/family/OnboardingPage'
import { AccessDeniedPage, NotFoundPage } from '../pages/system/SystemPages'
import { RouteGuard } from './RouteGuard'

const allRoles = ['DOCTOR', 'ADMIN', 'FAMILY_HEAD', 'MEMBER', 'ONBOARDING'] as const

export function AppRoutes() {
  return (
    <Routes>
      {/* ===== S1 — Public and identity routes ===== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/doctor" element={<DoctorRegisterPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      <Route element={<RouteGuard allowedRoles={[...allRoles]} allowUnverifiedDoctor><AppLayout /></RouteGuard>}>
        <Route path="/onboarding" element={<RouteGuard allowedRoles={['ONBOARDING']}><OnboardingPage /></RouteGuard>} />
        <Route path="/doctor-status" element={<RouteGuard allowedRoles={['DOCTOR']} allowUnverifiedDoctor><DoctorStatusPage /></RouteGuard>} />
        {/* ===== S3 — Dashboard foundation ===== */}
        <Route path="/dashboard" element={<RouteGuard allowedRoles={['DOCTOR', 'ADMIN', 'FAMILY_HEAD', 'MEMBER']}><DashboardPage /></RouteGuard>} />

        {/* ===== S2 — Records foundation ===== */}
        <Route path="/records" element={<RouteGuard allowedRoles={['FAMILY_HEAD', 'MEMBER']}><RecordsPage /></RouteGuard>} />
        <Route path="/family" element={<RouteGuard allowedRoles={['FAMILY_HEAD']}><FamilyPage /></RouteGuard>} />

        {/* ===== S4 — Doctor and audit foundations ===== */}
        <Route path="/cases" element={<RouteGuard allowedRoles={['DOCTOR']}><CasesPage /></RouteGuard>} />
        <Route path="/approvals" element={<RouteGuard allowedRoles={['DOCTOR']}><ApprovalsPage /></RouteGuard>} />
        <Route path="/audit" element={<RouteGuard allowedRoles={['ADMIN', 'FAMILY_HEAD']}><AuditPage /></RouteGuard>} />
        <Route path="/doctor-verification" element={<RouteGuard allowedRoles={['ADMIN']}><DoctorVerificationPage /></RouteGuard>} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
