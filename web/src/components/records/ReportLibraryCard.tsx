// Phase 2 (S4): compact report-library tile for grid view. Status shows reading progress and
// position against the printed range only — never an interpretation (RULE 1, RULE 6).
import { RecordIcon } from '../../pages/records/recordIcons'
import type { LabReportDto } from '../../services/apiClient'
import { ReportStatusBadge } from './ReportStatusBadge'

type Props = {
  report: LabReportDto
  ownerName: string
  canChangeSharing: boolean
  onToggleSharing?: (report: LabReportDto) => void
  onReview?: (report: LabReportDto) => void
  onViewOriginal?: (report: LabReportDto) => void
  reviewLabel?: string
  onDelete?: (report: LabReportDto) => void
}

export function ReportLibraryCard({ report, ownerName, canChangeSharing, onToggleSharing, onReview, reviewLabel, onViewOriginal, onDelete }: Props) {
  const shared = report.sharedWithFamilyHead === true
  const collected = report.collectedAt ? new Date(report.collectedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Date not recorded'
  return (
    <article className="report-tile" aria-label={`Lab report ${report.originalFileName}`}>
      <h3>{report.originalFileName}</h3>
      <p className="report-tile__meta">{collected} · {ownerName}</p>
      <div className="report-tile__badges">
        <ReportStatusBadge report={report} />
        <span className={`hr-badge ${shared ? 'hr-badge--blue' : ''}`}><RecordIcon name={shared ? 'users' : 'lock'} /> {shared ? 'Shared with Family Head' : 'Private from Family Head'}</span>
      </div>
      <div className="report-tile__actions">
        {report.hasOriginalFile && onViewOriginal && (
          <button type="button" className="button button--secondary button--sm" aria-label="View original report" onClick={() => onViewOriginal(report)}><RecordIcon name="file" /> Open</button>
        )}
        {onReview && (
          <button type="button" className="button button--secondary button--sm" onClick={() => onReview(report)}><RecordIcon name="chart" /> {reviewLabel ?? 'Check values'}</button>
        )}
        {canChangeSharing && onToggleSharing && (
          <button type="button" className="button button--secondary button--sm" aria-pressed={shared}
            aria-label={shared ? 'Keep private from Family Head' : 'Share with Family Head'} onClick={() => onToggleSharing(report)}>
            <RecordIcon name={shared ? 'lock' : 'users'} /> {shared ? 'Make private' : 'Share'}
          </button>
        )}
        {onDelete && (
          <button type="button" className="button button--secondary button--sm hr-action--danger" aria-label={`Delete ${report.originalFileName}`} onClick={() => onDelete(report)}><RecordIcon name="trash" /> Delete</button>
        )}
      </div>
    </article>
  )
}
