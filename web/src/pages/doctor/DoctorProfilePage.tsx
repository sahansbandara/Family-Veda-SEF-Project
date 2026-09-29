// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor "Profile & Availability" (docs/Three_Dashboards_UX_Plan.md §5). Shows the real /doctors/me
// record only. Editing practice details and weekly availability needs the P3 doctor-workspace
// migration, so that panel shows an empty state instead of sample values (DECISIONS 2026-09-29e).
import { useCallback, useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { apiClient, type DoctorDto } from '../../services/apiClient'
import { Badge, PageHero } from '../dashboard/dashboardParts'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="fv-item">
      <b>{label}</b>
      <p>{value && value.trim() ? value : 'Not provided'}</p>
    </div>
  )
}

export function DoctorProfilePage() {
  const [doctor, setDoctor] = useState<DoctorDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setDoctor((await apiClient.get<DoctorDto>('/doctors/me')).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="Clinician profile"
        title="Profile & Availability"
        purpose="Practice details help families find you. Your registration ID stays protected: only its last four characters are ever shown."
        action={doctor ? <Badge tone="ok">SLMC ••••{doctor.registrationNumberLastFour}</Badge> : undefined}
      />
      {status === 'loading' ? <LoadingState label="Loading your profile" /> : status === 'error' || !doctor ? (
        <ErrorState message="Your profile could not be loaded." onRetry={() => void load()} />
      ) : (
        <div className="fv-gridhalf">
          <section className="fv-panel" aria-labelledby="practice-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Practice</p><h2 id="practice-heading">Practice Profile</h2></div><Badge tone={doctor.verificationStatus === 'Verified' ? 'ok' : 'warn'}>{doctor.verificationStatus}</Badge></div>
            <div className="fv-stack">
              <Field label="Name" value={doctor.displayName} />
              <Field label="Specialty" value={doctor.specialty} />
              <Field label="Clinic" value={doctor.hospitalClinic} />
              <Field label="Phone" value={doctor.phoneNumber} />
              <Field label="Email" value={doctor.email} />
            </div>
          </section>
          <section className="fv-panel" aria-labelledby="availability-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Schedule</p><h2 id="availability-heading">Weekly Availability</h2></div></div>
            <div className="view-state">
              <h2>Availability not set up yet</h2>
              <p>Weekly hours, slot length and blocked time are coming with the next update. Until then, families request a time and you confirm it in Calendar.</p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
