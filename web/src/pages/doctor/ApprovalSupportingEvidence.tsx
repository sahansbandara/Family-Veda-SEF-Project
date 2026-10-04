// Owner: S4 · Familial Risk & Clinical Approval
import { useEffect, useRef, useState } from 'react'
import { OriginalReportDialog } from '../../components/records/OriginalReportDialog'
import { apiClient, type MemberWorkspaceDto } from '../../services/apiClient'
import { IconActivity, IconClipboardList } from './ApprovalIcons'
import { ApprovalReportsPanel } from './ApprovalReportsPanel'
import { ApprovalVitalsPanel } from './ApprovalVitalsPanel'

type EvidenceState = { status: 'loading' | 'error' | 'ready'; data?: MemberWorkspaceDto }


export function ApprovalSupportingEvidence({ memberId, caseId, onWorkspace }: { memberId: string; caseId?: string; onWorkspace?: (workspace: MemberWorkspaceDto | null) => void }) {
  const [state, setState] = useState<EvidenceState>({ status: 'loading' })
  const [reload, setReload] = useState(0)
  const [originalReport, setOriginalReport] = useState<NonNullable<MemberWorkspaceDto['labReports']>[number] | null>(null)
  const notify = useRef(onWorkspace)
  notify.current = onWorkspace
  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    apiClient.get<MemberWorkspaceDto>(`/doctors/me/members/${memberId}`)
      .then(({ data }) => { if (active) { setState({ status: 'ready', data }); notify.current?.(data) } })
      .catch(() => { if (active) setState({ status: 'error' }) })
    return () => { active = false }
  }, [memberId, reload])

  useEffect(() => { setOriginalReport(null) }, [caseId, memberId])

  function unavailable(category: 'vitals' | 'labReports') {
    if (state.status === 'loading') return <p className="care-caption">Loading authorized records…</p>
    if (state.status === 'error') return <div><p>Records could not be loaded. Access may be unavailable.</p><button type="button" className="button button--secondary" onClick={() => setReload((value) => value + 1)}>Retry supporting evidence</button></div>
    if (!state.data?.clinicalAccess || state.data[category] == null)
      return <p className="care-caption">These records are unavailable under the current grant or consent.</p>
    return null
  }

  return <>
    <article className="care-panel approval-tile approval-tile--wide approval-vitals-panel">
      <h3><IconActivity /> Vital signs overview <small className="approval-tile__sub">Latest recorded values · select a card for its history</small></h3>
      {unavailable('vitals') ?? <ApprovalVitalsPanel workspace={state.data!} />}
    </article>
    <article className="care-panel approval-tile approval-tile--wide approval-reports">
      <h3><IconClipboardList /> Supporting reports {state.data?.labReports ? <span className="approval-count">{state.data.labReports.length}</span> : null}</h3>
      {unavailable('labReports') ?? <ApprovalReportsPanel reports={state.data!.labReports!} onPreview={setOriginalReport} />}
      {originalReport && <OriginalReportDialog reportId={originalReport.id} originalFileName={originalReport.fileName} fileUrl={`/doctors/me/members/${memberId}/lab-reports/${originalReport.id}/file`} onClose={() => setOriginalReport(null)} />}
    </article>
  </>
}
