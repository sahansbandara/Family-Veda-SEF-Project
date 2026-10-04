// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Supporting reports as scannable rows: file, type, date, member-confirmed values and the original preview.
import { useState } from 'react'

import type { MemberWorkspaceDto } from '../../services/apiClient'
import { queueDateTime } from './approvalReview'
import { fileKind } from './approvalVitals'
import { rangeLabel, rangeTone, referenceRange } from './familyWorkspace'

type Report = NonNullable<MemberWorkspaceDto['labReports']>[number]

export function ApprovalReportsPanel({ reports, onPreview }: { reports: Report[]; onPreview: (report: Report) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  if (reports.length === 0) return <p className="care-caption">No supporting reports are available in the authorized records.</p>
  return (
    <ul className="approval-report-list">
      {reports.map((report) => {
        const open = report.id === openId
        const kind = fileKind(report.fileName)
        return (
          <li className="approval-report" key={report.id}>
            <div className="approval-report__row">
              <span className={`approval-report__icon approval-report__icon--${kind === 'PDF' ? 'pdf' : 'image'}`} aria-hidden="true">{kind}</span>
              <span className="approval-report__name">
                <b>{report.fileName}</b>
                <small>{report.collectedAt ? `Collected ${queueDateTime(report.collectedAt)}` : 'Collection date not recorded'}</small>
              </span>
              <span className="approval-report__actions">
                <button type="button" className="button button--secondary button--sm" aria-expanded={open}
                  aria-controls={`approval-report-values-${report.id}`} onClick={() => setOpenId(open ? null : report.id)}>
                  {report.values.length} confirmed value{report.values.length === 1 ? '' : 's'}
                </button>
                {report.hasOriginalFile === true ? (
                  <button type="button" className="button button--secondary button--sm" aria-label={`Preview ${report.fileName}`} onClick={() => onPreview(report)}>
                    Preview
                  </button>
                ) : <small className="approval-report__missing">Original not stored</small>}
              </span>
            </div>
            {open && (
              <div className="approval-report__values" id={`approval-report-values-${report.id}`}>
                {report.values.length === 0 ? <p className="care-caption">No member-confirmed values are available in this report.</p> : (
                  <ul>
                    {report.values.map((value, index) => (
                      <li key={`${value.analyte}-${index}`}>
                        <span>{value.analyte}</span>
                        <b>{value.value} {value.unit}</b>
                        <small>Printed range: {referenceRange(value)}</small>
                        <span className={`approval-chip approval-chip--${rangeTone[value.rangeStatus ?? 'RangeUnavailable']}`}>
                          {rangeLabel[value.rangeStatus ?? 'RangeUnavailable']}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="care-caption">Member-confirmed values only. Ranges are those printed on the report.</p>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
