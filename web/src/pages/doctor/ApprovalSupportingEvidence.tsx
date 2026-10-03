// Owner: S4 · Familial Risk & Clinical Approval
import { useEffect, useState } from 'react'
import { apiClient, type MemberWorkspaceDto } from '../../services/apiClient'
import { queueDateTime } from './approvalReview'

type EvidenceState = { status: 'loading' | 'error' | 'ready'; data?: MemberWorkspaceDto }

export function ApprovalSupportingEvidence({ memberId }: { memberId: string }) {
  const [state, setState] = useState<EvidenceState>({ status: 'loading' })
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    apiClient.get<MemberWorkspaceDto>(`/doctors/me/members/${memberId}`)
      .then(({ data }) => { if (active) setState({ status: 'ready', data }) })
      .catch(() => { if (active) setState({ status: 'error' }) })
    return () => { active = false }
  }, [memberId, reload])

  function unavailable(category: 'vitals' | 'labReports') {
    if (state.status === 'loading') return <p className="care-caption">Loading authorized records…</p>
    if (state.status === 'error') return <div><p>Records could not be loaded. Access may be unavailable.</p><button type="button" className="button button--secondary" onClick={() => setReload((value) => value + 1)}>Retry supporting evidence</button></div>
    if (!state.data?.clinicalAccess || state.data[category] == null)
      return <p className="care-caption">These records are unavailable under the current grant or consent.</p>
    return null
  }

  const vitals = [...(state.data?.vitals ?? [])].sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt))
    .filter((vital, index, all) => all.findIndex((item) => item.vitalType.toLowerCase() === vital.vitalType.toLowerCase()) === index)
  return <>
    <article className="care-panel approval-tile">
      <h3>Latest recorded vitals</h3>
      {unavailable('vitals') ?? (vitals.length ? <div className="approval-vitals">{vitals.map((vital) => <div className="approval-vital" key={vital.vitalType}>
        <span>{vital.vitalType.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ')}</span>
        <strong>{vital.value} <small>{vital.unit}</small></strong>
        <small>Recorded {queueDateTime(vital.measuredAt)}</small>
      </div>)}</div> : <p className="care-caption">No vitals have been recorded in the available records.</p>)}
    </article>
    <article className="care-panel approval-tile approval-reports">
      <h3>Supporting reports</h3>
      {unavailable('labReports') ?? (state.data?.labReports?.length ? state.data.labReports.map((report) => <details className="approval-report" key={report.id}>
        <summary>{report.fileName}</summary>
        <p className="care-caption">{report.collectedAt ? `Collected ${queueDateTime(report.collectedAt)}` : 'Collection date not recorded'}</p>
        {report.values.length ? <ul>{report.values.map((value, index) => <li key={index}>{value.analyte}: {value.value} {value.unit} · Member-confirmed value</li>)}</ul> : <p>No member-confirmed values are available in this report.</p>}
      </details>) : <p className="care-caption">No supporting reports are available in the authorized records.</p>)}
    </article>
  </>
}
