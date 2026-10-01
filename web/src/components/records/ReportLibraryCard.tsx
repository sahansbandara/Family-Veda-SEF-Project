// Phase 2 (S4): report-library card. Shows range position counts only — never an interpretation (RULE 1, RULE 6).
import type { LabReportDto } from '../../services/apiClient'

type Props = {
  report: LabReportDto
  ownerName: string
  canChangeSharing: boolean
  onToggleSharing?: (report: LabReportDto) => void
  onReview?: (report: LabReportDto) => void
  onViewOriginal?: (report: LabReportDto) => void
  reviewLabel?: string
}

export function ReportLibraryCard({
  report,
  ownerName,
  canChangeSharing,
  onToggleSharing,
  onReview,
  reviewLabel,
  onViewOriginal,
}: Props) {
  const range = report.rangeSummary
  const shared = report.sharedWithFamilyHead === true
  const readingStatus: Record<string, string> = {
    Pending: 'Waiting to read report',
    Processing: 'Reading report values',
    Completed: 'Values ready to check',
    Failed: 'Could not read this report',
    ManualEntry: 'Entered manually',
  }
  return (
    <article
      className="panel report-card care-value-card"
      aria-label={`Lab report ${report.originalFileName}`}
    >
      <header>
        <h3>{report.originalFileName}</h3>
        <p className="muted">
          {ownerName} ·{' '}
          {report.collectedAt
            ? new Date(report.collectedAt).toLocaleDateString()
            : 'Collected date not recorded'}
        </p>
      </header>
      <dl className="report-card__facts">
        <div>
          <dt>Visibility</dt>
          <dd>{shared ? 'Shared with Family Head' : 'Private from Family Head'}</dd>
        </div>
        <div>
          <dt>Report progress</dt>
          <dd>
            <span
              className={`status-badge status-badge--${report.ocrStatus === 'Failed' ? 'warning' : 'muted'}`}
            >
              {readingStatus[report.ocrStatus] ?? 'Report status unavailable'}
            </span>
          </dd>
        </div>
        <div>
          <dt>Original file</dt>
          <dd>{report.hasOriginalFile ? 'Stored' : 'Not stored'}</dd>
        </div>
        <div>
          <dt>Recorded range position</dt>
          <dd>
            {range
              ? `${range.belowRange} below · ${range.withinRange} within · ${range.aboveRange} above · ${range.rangeUnavailable} no range`
              : 'No values confirmed yet'}
          </dd>
        </div>
      </dl>
      <div className="button-row">
        {report.hasOriginalFile && onViewOriginal && (
          <button type="button" className="button button--secondary" onClick={() => onViewOriginal(report)}>View original image</button>
        )}
        {onReview && (
          <button type="button" className="button button--secondary" onClick={() => onReview(report)}>
            {reviewLabel ?? 'Check values'}
          </button>
        )}
        {canChangeSharing && onToggleSharing && (
          <button
            type="button"
            className="button button--secondary"
            aria-pressed={shared}
            onClick={() => onToggleSharing(report)}
          >
            {shared ? 'Keep private from Family Head' : 'Share with Family Head'}
          </button>
        )}
      </div>
    </article>
  )
}
