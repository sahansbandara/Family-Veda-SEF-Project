// S2 · Reading progress and position against the printed range only — never an interpretation (RULE 1).
import type { LabReportDto } from '../../services/apiClient'

export function ReportStatusBadge({ report }: { report: LabReportDto }) {
  const range = report.rangeSummary
  const outside = range ? range.belowRange + range.aboveRange : 0
  if (range && outside > 0) return <span className="hr-badge hr-badge--amber"><i className="hr-dot" /> {outside} outside printed range</span>
  if (range && range.withinRange > 0) return <span className="hr-badge hr-badge--green"><i className="hr-dot" /> Within printed range</span>
  if (report.ocrStatus === 'Failed') return <span className="hr-badge hr-badge--amber"><i className="hr-dot" /> Could not read</span>
  return report.ocrStatus === 'Completed' || report.ocrStatus === 'ManualEntry'
    ? <span className="hr-badge hr-badge--blue"><i className="hr-dot" /> Values ready to check</span>
    : <span className="hr-badge"><i className="hr-dot" /> Reading report</span>
}
