// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor member workspace (docs/Three_Dashboards_UX_Plan.md §5): Overview · Records · Labs · Vitals · Visits · Notes.
// The backend decides what is visible (assignment + visit/case grant + consent + audit, DECISIONS 2026-09-29h).
// A null list means "not permitted", which is shown as restricted and never as "0 items".
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { doctorWorkspaceApi, type MemberWorkspaceDto } from '../../services/apiClient'
import '../../styles/doctor-families.css'
import { extractErrorMessage, formatDateTime } from '../family/threePortalUtils'
import { Avatar, Breadcrumbs, Icon, Pill } from './familyParts'
import { consentLabel, pad2, roleLabel, splitVisits } from './familyWorkspace'
import { NotesTab, VisitsTab } from './memberCareTabs'
import { LabsTab, RecordsTab, VitalsTab } from './memberClinicalTabs'

type Tab = 'overview' | 'records' | 'labs' | 'vitals' | 'visits' | 'notes'
const tabs: Array<[Tab, string]> = [['overview', 'Overview'], ['records', 'Records'], ['labs', 'Labs'], ['vitals', 'Vitals'], ['visits', 'Visits'], ['notes', 'Notes']]

function Overview({ data, open }: { data: MemberWorkspaceDto; open: (tab: Tab) => void }) {
  const nextVisit = splitVisits(data.visits, Date.now()).upcoming[0]
  const categories: Array<[string, Tab, boolean, string]> = [
    ['Health records', 'records', data.records != null, 'View records'],
    ['Lab results', 'labs', data.labReports != null, 'View confirmed results'],
    ['Vital readings', 'vitals', data.vitals != null, 'View trends'],
  ]
  return (
    <>
      <div className="dfam-tiles">
        <article className="dfam-tile">
          <p>Current care access</p>
          <span className="dfam-tile__value">{data.clinicalAccess ? 'Active' : 'Restricted'}</span>
          <p>{data.clinicalAccess ? (data.accessExpiresAt ? `Until ${formatDateTime(data.accessExpiresAt)}` : 'Time-bound grant') : 'No active visit or shared case'}</p>
        </article>
        <article className="dfam-tile">
          <p>Next visit with you</p>
          <span className="dfam-tile__value">{nextVisit ? formatDateTime(nextVisit.startsAt) : 'None booked'}</span>
          <p>{nextVisit ? (nextVisit.status === 'Confirmed' ? 'Confirmed' : 'Awaiting your confirmation') : 'No upcoming appointment'}</p>
        </article>
        <article className="dfam-tile">
          <p>Your notes</p>
          <span className="dfam-tile__value">{pad2(data.notes.length)}</span>
          <button type="button" className="dfam-link" style={{ justifySelf: 'start' }} onClick={() => open('notes')}>Open notes</button>
        </article>
      </div>
      <div className="dfam-split">
        <article className="dfam-tile">
          <div className="dfam-card__top"><h3>Authorized clinical information</h3>{data.clinicalAccess && <Pill tone="ok">Authorized view</Pill>}</div>
          <p>Each category opens only when the member has consented to it.</p>
          <div className="dfam-rows">
            {categories.map(([label, tab, allowed, action]) => (
              <div className="dfam-row" key={tab}>
                <span>{label}</span>
                {allowed
                  ? <button type="button" className="dfam-link" onClick={() => open(tab)}>{action}</button>
                  : <span className="dfam-row__locked"><Icon name="lock" size={14} /> Restricted</span>}
              </div>
            ))}
            <div className="dfam-row"><span>Visits with you</span><button type="button" className="dfam-link" onClick={() => open('visits')}>View visits</button></div>
          </div>
        </article>
        <article className="dfam-tile">
          <div className="dfam-card__top"><h3>Consented categories</h3><Icon name="shield" /></div>
          {!data.clinicalAccess ? <p>Shown during an active visit or shared case.</p> : data.consentedCategories.length === 0 ? <p>The member has not consented to any category.</p> : (
            <div className="dfam-chips">{data.consentedCategories.map((category) => <Pill key={category} tone="ok">{consentLabel(category)}</Pill>)}</div>
          )}
          {data.hereditaryFlags != null && (
            <>
              <h3>Family-history screening context</h3>
              {data.hereditaryFlags.length === 0 ? <p>No confirmed family-history flags.</p> : (
                <ul className="dfam-readings">{data.hereditaryFlags.map((flag) => <li key={flag.conditionCode}><b>{flag.finding}</b><span>{flag.conditionCode}</span></li>)}</ul>
              )}
              <p>A screening indication only. It is never a diagnosis.</p>
            </>
          )}
        </article>
      </div>
    </>
  )
}

export function DoctorMemberPage() {
  const { memberId = '' } = useParams()
  const [data, setData] = useState<MemberWorkspaceDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tab, setTab] = useState<Tab>('overview')
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  // Any failed read drops what was on screen, so an expired or revoked grant never leaves stale clinical data visible.
  const refresh = useCallback(async () => {
    try {
      setData((await doctorWorkspaceApi.getMemberWorkspace(memberId)).data)
      setStatus('ready')
    } catch {
      setData(null)
      setStatus('error')
    }
  }, [memberId])
  useEffect(() => {
    setData(null)
    setStatus('loading')
    setTab('overview')
    setMessage(null)
    void refresh()
  }, [refresh])

  async function saveNote(content: string, amendsNoteId: string | null) {
    let saved = true
    try {
      if (amendsNoteId) await doctorWorkspaceApi.amendNote(amendsNoteId, content)
      else await doctorWorkspaceApi.addNote(memberId, { content, noteType: 'VisitNote' })
      setMessage({ text: amendsNoteId ? 'Amendment saved. The original note is kept.' : 'Note saved.' })
    } catch (error) {
      saved = false
      setMessage({ text: extractErrorMessage(error, 'The note could not be saved. Notes need an active visit or shared case.'), error: true })
    }
    await refresh()
    return saved
  }

  if (status === 'loading') return <LoadingState label="Loading member" />
  if (status === 'error' || !data) return <ErrorState message="This member could not be loaded. You may no longer be the family doctor." onRetry={() => { setStatus('loading'); void refresh() }} />

  return (
    <div className="dfam">
      <Breadcrumbs trail={[{ label: 'My Families', to: '/families' }, { label: data.familyName, to: `/families/${data.familyId}` }, { label: data.displayName }]} />
      <header className="dfam-head">
        <div>
          <span className="dfam-eyebrow">Member care workspace</span>
          <div className="dfam-person">
            <Avatar name={data.displayName} large />
            <div>
              <h1>{data.displayName}</h1>
              <p>{data.familyName} · {roleLabel(data.role)} · Doctor-only workspace</p>
            </div>
          </div>
        </div>
        <div className="dfam-head__actions">
          <Link className="dfam-btn" to={`/families/${data.familyId}`}><Icon name="left" /> Back to Family</Link>
        </div>
      </header>

      <div className={data.clinicalAccess ? 'dfam-banner' : 'dfam-banner dfam-banner--restricted'}>
        <Icon name={data.clinicalAccess ? 'shield' : 'lock'} size={20} />
        <div>
          <strong>{data.clinicalAccess ? 'Clinical access permitted' : 'Clinical categories restricted'}</strong>
          <p>
            {/[.!?]$/.test(data.accessBasis.trim()) ? data.accessBasis.trim() : `${data.accessBasis.trim()}.`}
            {data.clinicalAccess && data.accessExpiresAt ? ` Access for ${data.displayName} expires ${formatDateTime(data.accessExpiresAt)}.` : ''}
            {data.clinicalAccess ? ' Consent is checked separately for each category.' : ' Restricted categories are not counted or previewed.'}
          </p>
        </div>
      </div>

      {message && <p role={message.error ? 'alert' : 'status'} className={message.error ? 'dfam-status dfam-status--error' : 'dfam-status'}>{message.text}</p>}

      <section className="dfam-panel">
        <div className="dfam-tabs" role="tablist" aria-label="Member workspace">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" className="dfam-tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="dfam-panel__body" key={tab}>
          {tab === 'overview' && <Overview data={data} open={setTab} />}
          {tab === 'records' && <RecordsTab records={data.records} />}
          {tab === 'labs' && <LabsTab labReports={data.labReports} />}
          {tab === 'vitals' && <VitalsTab vitals={data.vitals} />}
          {tab === 'visits' && <VisitsTab visits={data.visits} />}
          {tab === 'notes' && <NotesTab notes={data.notes} canWrite={data.clinicalAccess} onSave={saveNote} />}
        </div>
      </section>
    </div>
  )
}
