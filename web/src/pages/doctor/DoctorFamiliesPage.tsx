// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor "My Families" (docs/Three_Dashboards_UX_Plan.md §5): Assigned Families + Family Requests.
// Real data only (DECISIONS 2026-09-29e). Clinical member data is not shown here: an assignment
// is eligibility only; clinical reads need a grant + consent (DECISIONS 2026-09-28).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { threePortalApi, type DoctorFamilyRowDto, type DoctorRequestDto } from '../../services/apiClient'
import { Badge, PageHero, SubTabs } from '../dashboard/dashboardParts'
import { extractErrorMessage, formatDateTime } from '../family/threePortalUtils'

type FamiliesTab = 'assigned' | 'requests'
type SortKey = 'next' | 'name'

function dateOrDash(value?: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '—'
}

export function DoctorFamiliesPage() {
  const [params, setParams] = useSearchParams()
  const tab: FamiliesTab = params.get('tab') === 'requests' ? 'requests' : 'assigned'
  const [families, setFamilies] = useState<DoctorFamilyRowDto[]>([])
  const [requests, setRequests] = useState<DoctorRequestDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('next')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [dashboard, requestResponse] = await Promise.all([
        threePortalApi.getDoctorDashboard(),
        threePortalApi.getMyFamilyDoctorRequests(),
      ])
      setFamilies(dashboard.data.families ?? [])
      setRequests(requestResponse.data.filter((request) => request.status === 'Pending'))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function respond(request: DoctorRequestDto, accept: boolean) {
    try {
      if (accept) await threePortalApi.acceptFamilyDoctorRequest(request.id)
      else await threePortalApi.declineFamilyDoctorRequest(request.id)
      setMessage(accept ? `You are now the family doctor for ${request.familyName}.` : `Request from ${request.familyName} declined.`)
      await load()
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Your answer could not be saved. Try again.'))
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = families.filter((family) => !term || family.familyName.toLowerCase().includes(term))
    return [...rows].sort((a, b) => sort === 'name'
      ? a.familyName.localeCompare(b.familyName)
      : (a.nextAppointment ?? '9999').localeCompare(b.nextAppointment ?? '9999'))
  }, [families, search, sort])

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="Assigned care"
        title="My Families"
        purpose="Families you care for long-term, and families asking you to be their doctor."
        action={status === 'ready' ? <Badge tone="info">{families.length} assigned</Badge> : undefined}
      />
      {message && <p role="status" className="status-banner">{message}</p>}
      <section className="fv-panel">
        <SubTabs<FamiliesTab>
          label="My Families views"
          active={tab}
          onChange={(next) => setParams(next === 'requests' ? { tab: 'requests' } : {})}
          tabs={[
            { id: 'assigned', label: 'Assigned Families' },
            { id: 'requests', label: 'Family Requests', count: requests.length },
          ]}
        />
        {status === 'loading' ? <LoadingState label="Loading your families" /> : status === 'error' ? (
          <ErrorState message="Your families could not be loaded." onRetry={() => void load()} />
        ) : tab === 'assigned' ? (
          <>
            <div className="fv-row" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
              <label className="field">Search family
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search family…" />
              </label>
              <label className="field">Sort
                <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                  <option value="next">Next appointment</option>
                  <option value="name">Family name</option>
                </select>
              </label>
            </div>
            {visible.length === 0 ? (
              <EmptyState
                title={families.length === 0 ? 'No assigned families yet' : 'No matching families'}
                message={families.length === 0 ? 'Families that choose you as their long-term doctor will appear here after you accept their request.' : 'Change the search to see more families.'}
              />
            ) : (
              <div className="fv-scroll">
                <table className="fv-table">
                  <thead><tr><th>Family</th><th>Members</th><th>Last visit</th><th>Next appointment</th></tr></thead>
                  <tbody>
                    {visible.map((family) => (
                      <tr key={family.familyId}>
                        <td><b>{family.memberCount === 1 ? `${family.familyName} · Individual patient` : family.familyName}</b></td>
                        <td>{family.memberCount}</td>
                        <td>{dateOrDash(family.lastVisit)}</td>
                        <td>{dateOrDash(family.nextAppointment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted">Member records open only during a visit or a shared case, with the member's consent.</p>
          </>
        ) : requests.length === 0 ? (
          <EmptyState title="No family requests" message="Families that request you as their long-term doctor will appear here." />
        ) : (
          <div className="fv-stack">
            {requests.map((request) => (
              <div className="fv-item" key={request.id}>
                <div className="fv-row">
                  <div>
                    <b>{request.familyName}</b>
                    <p>{request.memberCount} member{request.memberCount === 1 ? '' : 's'} · Long-term family doctor request · {formatDateTime(request.createdAt)}</p>
                    {request.message && <p>“{request.message}”</p>}
                  </div>
                  <Badge tone="warn">Pending</Badge>
                </div>
                <div className="fv-actions">
                  <button type="button" className="fv-btn fv-btn--primary" onClick={() => void respond(request, true)}>Accept</button>
                  <button type="button" className="fv-btn" onClick={() => void respond(request, false)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
