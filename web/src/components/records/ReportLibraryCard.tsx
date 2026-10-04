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
  const isPdf = report.originalFileName.toLowerCase().endsWith('.pdf')
  const readingStatus: Record<string, string> = {
    Pending: 'Waiting to read report',
    Processing: 'Reading report values',
    Completed: 'Values ready to check',
    Failed: 'Could not read this report',
    ManualEntry: 'Entered manually',
  }

  const statusTone =
    report.ocrStatus === 'Completed'
      ? 'status-pill--success'
      : report.ocrStatus === 'Processing'
        ? 'status-pill--info'
        : report.ocrStatus === 'Failed'
          ? 'status-pill--danger'
          : 'status-pill--warning'

  return (
    <article
      className={`panel report-card care-value-card report-card--${report.ocrStatus.toLowerCase()}`}
      aria-label={`Lab report ${report.originalFileName}`}
    >
      <header className="report-card__header">
        <div className={`file-type-icon ${isPdf ? 'file-type-icon--pdf' : 'file-type-icon--img'}`}>
          {isPdf ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          )}
          <span>{isPdf ? 'PDF' : 'IMG'}</span>
        </div>
        <div className="report-card__title-group">
          <h3>{report.originalFileName}</h3>
          <p className="muted report-card__meta">
            <span className="report-card__owner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="meta-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {ownerName}
            </span>
            <span className="meta-divider">·</span>
            <span className="report-card__date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="meta-icon">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {report.collectedAt
                ? new Date(report.collectedAt).toLocaleDateString()
                : 'Collected date not recorded'}
            </span>
          </p>
        </div>
      </header>

      <dl className="report-card__facts">
        <div className="fact-item">
          <dt>Visibility</dt>
          <dd>
            <span className={`fact-pill ${shared ? 'fact-pill--shared' : 'fact-pill--private'}`}>
              <span className="pill-dot"></span>
              {shared ? 'Shared with Family Head' : 'Private from Family Head'}
            </span>
          </dd>
        </div>
        <div className="fact-item">
          <dt>Report progress</dt>
          <dd>
            <span className={`status-badge status-badge--${report.ocrStatus === 'Failed' ? 'warning' : 'muted'} ${statusTone}`}>
              <span className="pill-dot"></span>
              {readingStatus[report.ocrStatus] ?? 'Report status unavailable'}
            </span>
          </dd>
        </div>
        <div className="fact-item">
          <dt>Original file</dt>
          <dd>
            <span className={`fact-pill ${report.hasOriginalFile ? 'fact-pill--stored' : 'fact-pill--missing'}`}>
              <span className="pill-dot"></span>
              {report.hasOriginalFile ? 'Stored' : 'Not stored'}
            </span>
          </dd>
        </div>
        <div className="fact-item fact-item--full">
          <dt>Recorded range position</dt>
          <dd className="range-summary-text">
            {range
              ? `${range.belowRange} below · ${range.withinRange} within · ${range.aboveRange} above · ${range.rangeUnavailable} no range`
              : 'No values confirmed yet'}
          </dd>
        </div>
      </dl>

      <div className="button-row">
        {report.hasOriginalFile && onViewOriginal && (
          <button
            type="button"
            className="button button--secondary button--view-orig"
            onClick={() => onViewOriginal(report)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View original report
          </button>
        )}
        {onReview && (
          <button
            type="button"
            className="button button--primary button--review"
            onClick={() => onReview(report)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            {reviewLabel ?? 'Check values'}
          </button>
        )}
        {canChangeSharing && onToggleSharing && (
          <button
            type="button"
            className="button button--secondary button--share"
            aria-pressed={shared}
            onClick={() => onToggleSharing(report)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            {shared ? 'Keep private from Family Head' : 'Share with Family Head'}
          </button>
        )}
      </div>
    </article>
  )
}
