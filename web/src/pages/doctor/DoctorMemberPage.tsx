// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor member workspace (docs/Three_Dashboards_UX_Plan.md §5): Overview · Records · Labs · Vitals · Visits · Notes.
// The backend decides what is visible (assignment + visit/case grant + consent + audit, DECISIONS 2026-09-29h).
// A null list means "not permitted", which is shown as restricted and never as "0 items".
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { doctorWorkspaceApi, type MemberWorkspaceDto } from '../../services/apiClient'
import { Badge, PageHero, SubTabs } from '../dashboard/dashboardParts'
import { FriendlyStatusBadge } from '../family/threePortalShared'
import { extractErrorMessage, formatDateTime } from '../family/threePortalUtils'
import { RecordSummaryText } from '../records/RecordSummaryText'

type Tab = 'overview' | 'records' | 'labs' | 'vitals' | 'visits' | 'notes'

const rangeLabel = { BelowRange: 'Below range', WithinRange: 'Within range', AboveRange: 'Above range', RangeUnavailable: 'Reference range unavailable' } as const
const rangeTone = { BelowRange: 'warn', WithinRange: 'ok', AboveRange: 'warn', RangeUnavailable: 'muted' } as const

function Restricted({ what }: { what: string }) {
  return <EmptyState title={`${what} restricted`} message="Not available: there is no active visit or shared case, or the member has not consented to this category." />
}

export function DoctorMemberPage() {
  const { memberId = '' } = useParams()
  const [data, setData] = useState<MemberWorkspaceDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tab, setTab] = useState<Tab>('overview')
  const [message, setMessage] = useState('')
  const [amending, setAmending] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setData((await doctorWorkspaceApi.getMemberWorkspace(memberId)).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [memberId])
  useEffect(() => { void load() }, [load])

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const content = String(new FormData(formElement).get('content') ?? '').trim()
    try {
      if (amending) await doctorWorkspaceApi.amendNote(amending, content)
      else await doctorWorkspaceApi.addNote(memberId, { content, noteType: 'VisitNote' })
      formElement.reset()
      setMessage(amending ? 'Amendment saved. The original note is kept.' : 'Note saved.')
      setAmending(null)
      await load()
    } catch (error) {
      setMessage(extractErrorMessage(error, 'The note could not be saved. Notes need an active visit or shared case.'))
    }
  }

  const now = Date.now()
  const nextVisit = data?.visits
    .filter((v) => new Date(v.startsAt).getTime() > now && (v.status === 'Confirmed' || v.status === 'Requested'))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]

  if (status === 'loading') return <LoadingState label="Loading member" />
  if (status === 'error' || !data) return <ErrorState message="This member could not be loaded. You may no longer be the family doctor." onRetry={() => void load()} />

  return (
    <div className="fv-page">
      <PageHero
        eyebrow={`Family workspace · ${data.familyName}`}
        title={data.displayName}
        purpose={`Access basis: ${data.accessBasis}`}
        action={data.clinicalAccess ? <Badge tone="ok">ACCESS PERMITTED</Badge> : <Badge tone="muted">RESTRICTED</Badge>}
      >
        <p><Link to={`/families/${data.familyId}`}>Back to {data.familyName}</Link>{data.accessExpiresAt ? ` · Access until ${formatDateTime(data.accessExpiresAt)}` : ''}</p>
      </PageHero>
      {message && <p role="status" className="status-banner">{message}</p>}
      <section className="fv-panel">
        <SubTabs<Tab> label="Member workspace" active={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' }, { id: 'records', label: 'Records' }, { id: 'labs', label: 'Labs' },
          { id: 'vitals', label: 'Vitals' }, { id: 'visits', label: 'Visits' }, { id: 'notes', label: 'Notes' },
        ]} />

        {tab === 'overview' && (
          <div className="fv-stack">
            <div className="fv-item"><b>Consent</b><p>{data.clinicalAccess ? (data.consentedCategories.length ? data.consentedCategories.join(', ') : 'No categories consented') : 'Shown during an active visit or shared case.'}</p></div>
            <div className="fv-item"><b>Visits with you</b><p>{data.visits.length} · next: {nextVisit ? formatDateTime(nextVisit.startsAt) : 'none booked'}</p></div>
            <div className="fv-item"><b>Your notes</b><p>{data.notes.length}</p></div>
          </div>
        )}

        {tab === 'records' && (!data.records ? <Restricted what="Records" /> : data.records.length === 0 ? <EmptyState title="No records" message="This member has no health records yet." /> : (
          <div className="fv-scroll"><table className="fv-table"><thead><tr><th className="fv-date">Date</th><th className="fv-type">Type</th><th>Title</th><th>Summary</th></tr></thead><tbody>
            {data.records.map((r) => <tr key={r.id}><td className="fv-date">{r.occurredOn}</td><td className="fv-type">{r.recordType}</td><td><strong>{r.title}</strong></td><td><RecordSummaryText summary={r.summary} /></td></tr>)}
          </tbody></table></div>
        ))}

        {tab === 'labs' && (!data.labReports ? <Restricted what="Lab reports" /> : data.labReports.length === 0 ? <EmptyState title="No lab reports" message="No reports uploaded yet." /> : (
          <div className="fv-stack">
            {data.labReports.map((report) => (
              <div className="fv-item" key={report.id}>
                <div className="fv-row"><b>{report.fileName}</b><span className="muted">{report.collectedAt ? formatDateTime(report.collectedAt) : 'Date not recorded'}</span></div>
                {report.values.length === 0 ? <p>No values confirmed by the member yet.</p> : (
                  <table className="fv-table"><thead><tr><th>Analyte</th><th>Value</th><th>Reference</th><th>Status</th></tr></thead><tbody>
                    {report.values.map((v, i) => <tr key={i}><td>{v.analyte}</td><td>{v.value} {v.unit}</td><td>{v.referenceLow ?? '—'}–{v.referenceHigh ?? '—'}</td><td><Badge tone={rangeTone[v.rangeStatus]}>{rangeLabel[v.rangeStatus]}</Badge></td></tr>)}
                  </tbody></table>
                )}
              </div>
            ))}
            <p className="muted">Range status is calculated from the printed reference interval. Clinical interpretation remains with you.</p>
          </div>
        ))}

        {tab === 'vitals' && (!data.vitals ? <Restricted what="Vitals" /> : data.vitals.length === 0 ? <EmptyState title="No vitals" message="No readings recorded yet." /> : (
          <div className="fv-scroll"><table className="fv-table"><thead><tr><th className="fv-date">Measured</th><th className="fv-type">Type</th><th>Value</th></tr></thead><tbody>
            {data.vitals.map((v, i) => <tr key={i}><td className="fv-date">{formatDateTime(v.measuredAt)}</td><td className="fv-type">{v.vitalType}</td><td>{v.value} {v.unit}</td></tr>)}
          </tbody></table></div>
        ))}

        {tab === 'visits' && (data.visits.length === 0 ? <EmptyState title="No visits yet" message="Appointments this member books with you appear here." /> : (
          <div className="fv-stack">{data.visits.map((v) => <div className="fv-item fv-row" key={v.appointmentId}><span><b>{formatDateTime(v.startsAt)}</b> · {v.reason}</span><FriendlyStatusBadge status={v.status} /></div>)}</div>
        ))}

        {tab === 'notes' && (
          <div className="fv-stack">
            {data.clinicalAccess ? (
              <form className="form-grid" onSubmit={(event) => void addNote(event)}>
                <label>{amending ? 'Amendment (the original note is kept)' : 'New visit note'}<textarea name="content" required maxLength={4000} rows={4} /></label>
                <div className="fv-actions">
                  <button className="fv-btn fv-btn--primary" type="submit">{amending ? 'Save amendment' : 'Save note'}</button>
                  {amending && <button className="fv-btn" type="button" onClick={() => setAmending(null)}>Cancel</button>}
                </div>
              </form>
            ) : <p className="muted">You can add notes during an active visit or shared case.</p>}
            {data.notes.length === 0 ? <EmptyState title="No notes" message="Your notes about this member appear here. They are never shown to the family." /> : data.notes.map((note) => (
              <div className="fv-item" key={note.id}>
                <div className="fv-row"><b>{formatDateTime(note.createdAt)}{note.version > 1 ? ` · amendment v${note.version}` : ''}</b>{data.clinicalAccess && <button className="fv-btn" type="button" onClick={() => setAmending(note.amendsNoteId ?? note.id)}>Amend</button>}</div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
