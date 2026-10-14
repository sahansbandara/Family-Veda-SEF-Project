// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor "My Families" (docs/Three_Dashboards_UX_Plan.md §5): Assigned Families + Family Requests.
// Real data only (DECISIONS 2026-09-29e). Clinical member data is not shown here: an assignment
// is eligibility only; clinical reads need a grant + consent (DECISIONS 2026-09-28).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { threePortalApi, type DoctorFamilyRowDto, type DoctorRequestDto } from '../../services/apiClient'
import '../../styles/doctor-families.css'
import { extractErrorMessage, formatDateTime } from '../family/threePortalUtils'
import { ConfirmDialog, Empty, Icon, Pill, Stat, Strip } from './familyParts'
import { pad2, shortDate, shortDateTime } from './familyWorkspace'

type FamiliesTab = 'assigned' | 'requests'
type SortKey = 'next' | 'name'
type Decision = { request: DoctorRequestDto; accept: boolean }

export function DoctorFamiliesPage() {
  const [params, setParams] = useSearchParams()
  const tab: FamiliesTab = params.get('tab') === 'requests' ? 'requests' : 'assigned'
  const [families, setFamilies] = useState<DoctorFamilyRowDto[]>([])
  const [requests, setRequests] = useState<DoctorRequestDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('next')
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
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

  const setTab = (next: FamiliesTab) => setParams(next === 'requests' ? { tab: 'requests' } : {})
  const cancelDecision = useCallback(() => setDecision(null), [])

  async function respond() {
    if (!decision || saving) return
    const { request, accept } = decision
    setSaving(true)
    try {
      if (accept) await threePortalApi.acceptFamilyDoctorRequest(request.id)
      else await threePortalApi.declineFamilyDoctorRequest(request.id)
      setMessage({ text: accept
        ? `You are now the family doctor for ${request.familyName}. This does not open any member's clinical records.`
        : `Request from ${request.familyName} declined.` })
    } catch (error) {
      setMessage({ text: extractErrorMessage(error, 'Your answer could not be saved. Nothing was changed. Try again.'), error: true })
    }
    // Always re-read, so the lists show server truth rather than an assumed outcome.
    await load()
    setSaving(false)
    setDecision(null)
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = families.filter((family) => !term || family.familyName.toLowerCase().includes(term))
    return [...rows].sort((a, b) => sort === 'name'
      ? a.familyName.localeCompare(b.familyName)
      : (a.nextAppointment ?? '9999').localeCompare(b.nextAppointment ?? '9999'))
  }, [families, search, sort])

  const upcoming = families.map((family) => family.nextAppointment).filter((value): value is string => Boolean(value)).sort()
  const next = upcoming[0] ? new Date(upcoming[0]) : null

  return (
    <div className="dfam">
      <header className="dfam-head">
        <div>
          <span className="dfam-eyebrow">Longitudinal care workspace</span>
          <h1>My Families</h1>
          <p>Your long-term care relationships and incoming family-doctor requests.</p>
        </div>
        <div className="dfam-head__actions">
          <button type="button" className="dfam-btn" onClick={() => setTab('requests')}>
            <Icon name="mail" /> Family Requests {requests.length > 0 && <Pill tone="warn">{requests.length}</Pill>}
          </button>
          <Link className="dfam-btn" to="/calendar"><Icon name="calendar" /> View Calendar</Link>
        </div>
      </header>

      {message && <p role={message.error ? 'alert' : 'status'} className={message.error ? 'dfam-status dfam-status--error' : 'dfam-status'}>{message.text}</p>}

      {status === 'loading' ? <LoadingState label="Loading your families" /> : status === 'error' ? (
        <ErrorState message="Your families could not be loaded." onRetry={() => { setStatus('loading'); void load() }} />
      ) : (
        <>
          <div className="dfam-stats">
            <Stat label="Assigned households" value={pad2(families.length)} hint="Long-term assignments" />
            <Stat label="New family requests" value={pad2(requests.length)} hint="Awaiting your response" tone="warn" />
            <Stat
              label="Next appointment"
              value={next ? next.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'None'}
              hint={next ? `${next.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · earliest across your families` : 'No upcoming appointment'}
              tone="lum"
            />
            <Stat label="Families with upcoming visits" value={pad2(upcoming.length)} hint="Appointment-based summary" tone="ok" />
          </div>

          <section className="dfam-panel">
            <div className="dfam-tabs" role="tablist" aria-label="My Families views">
              <button type="button" role="tab" className="dfam-tab" aria-selected={tab === 'assigned'} onClick={() => setTab('assigned')}>
                Assigned Families <span className="dfam-tab__count">{families.length}</span>
              </button>
              <button type="button" role="tab" className="dfam-tab" aria-selected={tab === 'requests'} onClick={() => setTab('requests')}>
                Family Requests {requests.length > 0 && <span className="dfam-tab__count">{requests.length}</span>}
              </button>
            </div>

            {tab === 'assigned' ? (
              <div className="dfam-panel__body" key="assigned">
                <div className="dfam-section-head">
                  <div className="dfam-tools">
                    <input className="dfam-input" type="search" aria-label="Search assigned families" placeholder="Search assigned families…" value={search} onChange={(event) => setSearch(event.target.value)} />
                    <label>Sort
                      <select className="dfam-select" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                        <option value="next">Next appointment</option>
                        <option value="name">Family name</option>
                      </select>
                    </label>
                  </div>
                  <Pill>{visible.length} {visible.length === 1 ? 'result' : 'results'}</Pill>
                </div>
                {visible.length === 0 ? (
                  <Empty
                    title={families.length === 0 ? 'No assigned families yet' : 'No matching families'}
                    message={families.length === 0 ? 'Families that choose you as their long-term doctor will appear here after you accept their request.' : 'Change the search to see more families.'}
                  />
                ) : (
                  <div className="dfam-grid">
                    {visible.map((family) => (
                      <article className="dfam-card" key={family.familyId}>
                        <div className="dfam-person">
                          <span className="dfam-icon-tile"><Icon name="users" size={21} /></span>
                          <div>
                            <h3>{family.memberCount === 1 ? `${family.familyName} · Individual patient` : family.familyName}</h3>
                            <small>Long-term primary care</small>
                          </div>
                        </div>
                        <dl className="dfam-facts">
                          <div><dt>Members</dt><dd>{family.memberCount} linked {family.memberCount === 1 ? 'profile' : 'profiles'}</dd></div>
                          <div><dt>Last visit</dt><dd>{shortDate(family.lastVisit) ?? 'No visit yet'}</dd></div>
                          <div className="dfam-facts__wide"><dt>Next appointment</dt><dd>{shortDateTime(family.nextAppointment) ?? 'No upcoming appointment'}</dd></div>
                        </dl>
                        <div className="dfam-card__foot">
                          <Pill tone="ok" dot>Assigned</Pill>
                          <Link className="dfam-btn dfam-btn--primary" to={`/families/${family.familyId}`} aria-label={`Open Family: ${family.familyName}`}>Open Family <Icon name="right" size={14} /></Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <Strip>Being a family's primary doctor does not automatically grant access to its members' private clinical information. Member records open only during a visit or a shared case, with the member's consent.</Strip>
              </div>
            ) : (
              <div className="dfam-panel__body" key="requests">
                <div className="dfam-section-head">
                  <h2>Awaiting your response</h2>
                  <p>Accepting creates a long-term assignment, not clinical access.</p>
                </div>
                {requests.length === 0 ? (
                  <Empty title="No family requests" message="Families that request you as their long-term doctor will appear here." />
                ) : (
                  <div className="dfam-stack">
                    {requests.map((request) => (
                      <article className="dfam-card dfam-request" key={request.id}>
                        <div>
                          <div className="dfam-card__top"><h3>{request.familyName}</h3><Pill tone="warn" dot>Pending</Pill></div>
                          <p className="dfam-card__meta">{request.memberCount} household member{request.memberCount === 1 ? '' : 's'} · Received {formatDateTime(request.createdAt)}</p>
                          {request.message && <blockquote className="dfam-quote">“{request.message}”</blockquote>}
                          <p className="dfam-note">Profile-level request only. No member records or health information are included.</p>
                        </div>
                        <div className="dfam-actions">
                          <button type="button" className="dfam-btn dfam-btn--primary" disabled={saving} onClick={() => setDecision({ request, accept: true })}><Icon name="check" size={15} /> Accept</button>
                          <button type="button" className="dfam-btn" disabled={saving} onClick={() => setDecision({ request, accept: false })}>Decline</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {decision && (
        <ConfirmDialog
          title={decision.accept ? 'Accept family request?' : 'Decline family request?'}
          message={decision.accept
            ? `${decision.request.familyName} will become one of your long-term families. Accepting does not grant access to any member's clinical records.`
            : `${decision.request.familyName} will be told you declined. No assignment is created.`}
          confirmLabel={decision.accept ? 'Accept request' : 'Decline request'}
          danger={!decision.accept}
          busy={saving}
          onConfirm={() => void respond()}
          onCancel={cancelDecision}
        />
      )}
    </div>
  )
}
