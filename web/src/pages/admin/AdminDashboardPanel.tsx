// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Clinic Admin dashboard (docs/Three_Dashboards_UX_Plan.md §11). Real counts only: no fallback or
// sample numbers (DECISIONS 2026-09-29e). The admin runs the platform and never reads health data.
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { useAppSelector } from '../../store/hooks'
import { apiClient, type AdminUserDto, type AuditDto, type DoctorDto, type PagedResult } from '../../services/apiClient'
import { Badge, Metric, PageHero } from '../dashboard/dashboardParts'
import { describeAccessEvent } from '../family/privacyWording'

type Snapshot = {
  doctors: DoctorDto[]
  doctorTotal: number
  users: AdminUserDto[]
  userTotal: number
  events: AuditDto[]
}

const upper = (value?: string | null) => (value ?? '').toUpperCase()

export function AdminDashboardPanel() {
  const name = useAppSelector((state) => state.auth.user?.name)
  const [data, setData] = useState<Snapshot | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [doctors, users, audit] = await Promise.all([
        apiClient.get<PagedResult<DoctorDto>>('/admin/doctors', { params: { page: 1, pageSize: 100 } }),
        apiClient.get<PagedResult<AdminUserDto>>('/auth/admin/users', { params: { page: 1, pageSize: 100 } }),
        apiClient.get<PagedResult<AuditDto>>('/audit', { params: { page: 1, pageSize: 8 } }),
      ])
      setData({
        doctors: doctors.data.items,
        doctorTotal: doctors.data.totalCount ?? doctors.data.items.length,
        users: users.data.items,
        userTotal: users.data.totalCount ?? users.data.items.length,
        events: audit.data.items,
      })
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  if (status === 'loading') return <LoadingState label="Loading the admin dashboard" />
  if (status === 'error' || !data) return <ErrorState message="The admin dashboard could not be loaded." onRetry={() => void load()} />

  const pending = data.doctors.filter((doctor) => ['PENDING', 'MOREINFORMATIONREQUIRED'].includes(upper(doctor.verificationStatus)))
  const verified = data.doctors.filter((doctor) => upper(doctor.verificationStatus) === 'VERIFIED').length
  const deactivated = data.users.filter((user) => !user.isActive).length
  const families = data.users.filter((user) => upper(user.userType) === 'FAMILYUSER').length
  // Counts come from the first page (100 rows); say so rather than implying a full total.
  const partial = data.doctorTotal > data.doctors.length || data.userTotal > data.users.length

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="Clinic administration"
        title="Dashboard"
        purpose={`Good day${name ? `, ${name}` : ''}. Platform health and anything waiting for you. You never see members' health data here.`}
        action={<Badge tone="ok">10 safety rules always on</Badge>}
      />
      <section className="fv-metrics" aria-label="Platform metrics">
        <Metric label="Doctors awaiting verification" to="/doctor-verification" value={pending.length}
          badge={pending.length > 0 ? <Badge tone="warn">Needs action</Badge> : <Badge tone="ok">Queue clear</Badge>} />
        <Metric label="Verified doctors" to="/doctor-verification" value={verified}
          badge={<Badge tone="info">{data.doctorTotal} registered</Badge>} />
        <Metric label="Family accounts" to="/users" value={families}
          badge={<Badge tone="info">{data.userTotal} accounts in total</Badge>} />
        <Metric label="Deactivated accounts" to="/users" value={deactivated}
          badge={deactivated > 0 ? <Badge tone="muted">History kept</Badge> : <Badge tone="ok">None</Badge>} />
      </section>
      {partial && <p className="muted">Counts cover the first 100 records of each list. Open the list for the full view.</p>}
      <div className="fv-grid2">
        <section className="fv-panel" aria-labelledby="admin-attention-heading">
          <div className="fv-head"><div><p className="fv-eyebrow">Priority</p><h2 id="admin-attention-heading">Needs Attention</h2></div><Link className="fv-btn" to="/doctor-verification">Open queue</Link></div>
          {pending.length === 0 ? (
            <EmptyState title="Nothing waiting" message="New doctor applications will appear here for verification." />
          ) : (
            <div className="fv-stack">
              {pending.slice(0, 5).map((doctor) => (
                <div className="fv-item" key={doctor.id}>
                  <div className="fv-row"><b>{doctor.displayName ?? doctor.email ?? 'Doctor application'}</b><Badge tone="warn">{upper(doctor.verificationStatus) === 'PENDING' ? 'Pending' : 'More info requested'}</Badge></div>
                  <p>{doctor.specialty ?? 'Specialty not given'} · SLMC ••••{doctor.registrationNumberLastFour}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="fv-panel" aria-labelledby="admin-activity-heading">
          <div className="fv-head"><div><p className="fv-eyebrow">Audit</p><h2 id="admin-activity-heading">Recent Activity</h2></div><Link className="fv-btn" to="/audit">Audit Log</Link></div>
          {data.events.length === 0 ? (
            <EmptyState title="No recent activity" message="Account, verification and access events will be listed here." />
          ) : (
            <ul className="fv-timeline">
              {data.events.map((event) => (
                <li className="fv-event" key={event.id}>
                  <strong>{describeAccessEvent(event.eventType)}</strong>
                  <p>{event.resourceType} · {new Date(event.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
