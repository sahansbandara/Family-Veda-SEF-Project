// S2 · File library. Visibility is descriptive; access is enforced by the API.
// Status shows reading progress and position against the printed range only — never an interpretation (RULE 1).
import { useState } from 'react'
import { RecordIcon } from '../../pages/records/recordIcons'
import type { LabReportDto } from '../../services/apiClient'
import { ReportLibraryCard } from './ReportLibraryCard'
import { ReportThumbnail } from './ReportThumbnail'

type Props = {
  reports: LabReportDto[]; ownerName: string; canChangeSharing: boolean
  onToggleSharing?: (report: LabReportDto) => void
  onViewOriginal: (report: LabReportDto) => void
  onReview?: (report: LabReportDto) => void
  reviewLabel?: (report: LabReportDto) => string
}

const PAGE_SIZE = 8
const isPdf = (report: LabReportDto) => report.originalFileName.toLowerCase().endsWith('.pdf')

type Progress = 'ready' | 'reading' | 'failed'
function progressOf(report: LabReportDto): Progress {
  if (report.ocrStatus === 'Failed') return 'failed'
  return report.ocrStatus === 'Completed' || report.ocrStatus === 'ManualEntry' ? 'ready' : 'reading'
}

function ReportStatus({ report }: { report: LabReportDto }) {
  const range = report.rangeSummary
  const outside = range ? range.belowRange + range.aboveRange : 0
  if (range && outside > 0) return <span className="hr-badge hr-badge--amber"><i className="hr-dot" /> {outside} outside printed range</span>
  if (range && range.withinRange > 0) return <span className="hr-badge hr-badge--green"><i className="hr-dot" /> Within printed range</span>
  const progress = progressOf(report)
  if (progress === 'failed') return <span className="hr-badge hr-badge--amber"><i className="hr-dot" /> Could not read</span>
  return progress === 'ready'
    ? <span className="hr-badge hr-badge--blue"><i className="hr-dot" /> Values ready to check</span>
    : <span className="hr-badge"><i className="hr-dot" /> Reading report</span>
}

export function ReportLibrary({ reports, ownerName, canChangeSharing, onToggleSharing, onViewOriginal, onReview, reviewLabel }: Props) {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('all')
  const [progress, setProgress] = useState('all')
  const [visibility, setVisibility] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const matching = reports.filter((report) => report.originalFileName.toLowerCase().includes(search.trim().toLowerCase())
    && (fileType === 'all' || (fileType === 'pdf') === isPdf(report))
    && (progress === 'all' || progress === progressOf(report))
    && (visibility === 'all' || (visibility === 'shared') === (report.sharedWithFamilyHead === true)))
    .sort((a, b) => {
      const left = a.collectedAt ? Date.parse(a.collectedAt) : 0
      const right = b.collectedAt ? Date.parse(b.collectedAt) : 0
      return sort === 'newest' ? right - left : left - right
    })
  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = matching.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const change = (apply: () => void) => { apply(); setPage(1) }

  return <div className="report-library">
    <div className="hr-toolbar hr-toolbar--wide">
      <label className="hr-search">
        <span className="sr-only">Search reports</span>
        <RecordIcon name="search" />
        <input type="search" placeholder="Search by report name…" value={search} onChange={(event) => change(() => setSearch(event.target.value))} />
      </label>
      <label className="hr-select"><span className="sr-only">File type</span><select value={fileType} onChange={(event) => change(() => setFileType(event.target.value))}><option value="all">All file types</option><option value="pdf">PDF</option><option value="image">Image</option></select></label>
      <label className="hr-select"><span className="sr-only">Report status</span><select value={progress} onChange={(event) => change(() => setProgress(event.target.value))}><option value="all">All status</option><option value="ready">Values ready</option><option value="reading">Reading report</option><option value="failed">Could not read</option></select></label>
      <label className="hr-select"><span className="sr-only">Report visibility</span><select value={visibility} onChange={(event) => change(() => setVisibility(event.target.value))}><option value="all">All visibility</option><option value="private">Private</option><option value="shared">Shared with Family Head</option></select></label>
      <label className="hr-select hr-toolbar__end"><span className="sr-only">Sort reports</span><select value={sort} onChange={(event) => change(() => setSort(event.target.value))}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
    </div>
    <div className="hr-library-bar">
      <span className="hr-library-bar__count">{matching.length} {matching.length === 1 ? 'report' : 'reports'}</span>
      <div className="hr-view-toggle" role="group" aria-label="Report layout">
        <button type="button" className="button button--secondary button--sm" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><RecordIcon name="list" /> <span aria-hidden="true">List view</span></button>
        <button type="button" className="button button--secondary button--sm" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><RecordIcon name="grid" /> <span aria-hidden="true">Grid view</span></button>
      </div>
    </div>

    {visible.length > 0 && view === 'list' && <div className="hr-table-wrap">
      <table className="hr-table hr-table--stack hr-table--reports">
        <thead><tr><th>Report</th><th>File type</th><th>Date</th><th>Status</th><th>Visibility</th><th>Actions</th></tr></thead>
        <tbody>
          {visible.map((report) => {
            const shared = report.sharedWithFamilyHead === true
            return <tr key={report.id} aria-label={`Lab report ${report.originalFileName}`}>
              <td data-label="Report">
                <span className="hr-file">
                  <button type="button" className="hr-file__thumb" disabled={!report.hasOriginalFile} aria-label={`Preview ${report.originalFileName}`} onClick={() => onViewOriginal(report)}>
                    <ReportThumbnail reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={report.hasOriginalFile === true} />
                  </button>
                  <span className="hr-file__name"><b>{report.originalFileName}</b><small>{ownerName}</small></span>
                </span>
              </td>
              <td data-label="File type"><span className={`hr-badge ${isPdf(report) ? 'hr-badge--rose' : 'hr-badge--violet'}`}>{isPdf(report) ? 'PDF' : 'Image'}</span></td>
              <td data-label="Date">{report.collectedAt ? new Date(report.collectedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not recorded'}</td>
              <td data-label="Status"><ReportStatus report={report} /></td>
              <td data-label="Visibility">
                {canChangeSharing && onToggleSharing
                  ? <label className="hr-select hr-select--sm"><span className="sr-only">Visibility of {report.originalFileName}</span>
                    <select value={shared ? 'shared' : 'private'} onChange={(event) => { if ((event.target.value === 'shared') !== shared) onToggleSharing(report) }}>
                      <option value="private">Private</option><option value="shared">Family Head</option>
                    </select></label>
                  : <span className={`hr-badge ${shared ? 'hr-badge--blue' : ''}`}><RecordIcon name={shared ? 'users' : 'lock'} /> {shared ? 'Shared with Family Head' : 'Private from Family Head'}</span>}
              </td>
              <td data-label="Actions">
                <div className="hr-actions">
                  {report.hasOriginalFile && <button type="button" className="button button--secondary button--sm hr-action hr-action--primary" aria-label="View original report" onClick={() => onViewOriginal(report)}><RecordIcon name="file" /> Open report</button>}
                  {onReview && <button type="button" className="button button--secondary button--sm hr-action" onClick={() => onReview(report)}><RecordIcon name="chart" /> {reviewLabel?.(report) ?? 'Check values'}</button>}
                </div>
              </td>
            </tr>
          })}
        </tbody>
      </table>
    </div>}

    {visible.length > 0 && view === 'grid' && <div className="report-library__files report-library__files--grid">
      {visible.map((report) => <div key={report.id} className="report-library__item">
        <button className="report-library__preview" type="button" disabled={!report.hasOriginalFile} aria-label={`Preview ${report.originalFileName}`} onClick={() => onViewOriginal(report)}><ReportThumbnail reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={report.hasOriginalFile === true} /></button>
        <ReportLibraryCard report={report} ownerName={ownerName} canChangeSharing={canChangeSharing} onToggleSharing={onToggleSharing} onViewOriginal={onViewOriginal} onReview={onReview} reviewLabel={reviewLabel?.(report)} />
      </div>)}
    </div>}

    {matching.length === 0 && <p className="care-library-empty" role="status">No reports match your search or filters.</p>}
    <footer className="hr-pager">
      <span className="care-caption report-library__count">
        Showing {matching.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + visible.length} of {matching.length} reports · Files are viewed securely through your account.
      </span>
      {pages > 1 && <div className="hr-pager__buttons">
        <button type="button" className="button button--secondary button--sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
        <span className="hr-pager__page" aria-current="page">Page {current} of {pages}</span>
        <button type="button" className="button button--secondary button--sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button>
      </div>}
    </footer>
  </div>
}
