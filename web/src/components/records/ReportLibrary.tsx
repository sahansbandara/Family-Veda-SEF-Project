// S2 · File library. Visibility is descriptive; access is enforced by the API.
import { useState } from 'react'
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
export function ReportLibrary({ reports, ownerName, canChangeSharing, onToggleSharing, onViewOriginal, onReview, reviewLabel }: Props) {
  const [view, setView] = useState<'list' | 'grid'>('grid')
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [sort, setSort] = useState('newest')
  const visible = reports.filter((report) => report.originalFileName.toLowerCase().includes(search.trim().toLowerCase())
    && (visibility === 'all' || (visibility === 'shared') === (report.sharedWithFamilyHead === true)))
    .sort((a, b) => {
      const left = a.collectedAt ? Date.parse(a.collectedAt) : 0
      const right = b.collectedAt ? Date.parse(b.collectedAt) : 0
      return sort === 'newest' ? right - left : left - right
    })
  return <div className="report-library">
    <div className="report-library__tools">
      <label className="report-library__search">Search reports<input type="search" placeholder="Search by report name" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label>Report visibility<select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="all">All reports</option><option value="private">Private</option><option value="shared">Shared with Family Head</option></select></label>
      <label>Sort reports<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <div className="report-library__view" aria-label="Report layout"><button type="button" className="button button--secondary" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}>☰</button><button type="button" className="button button--secondary" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>▦</button></div>
    </div>
    <div className={`report-library__files report-library__files--${view}`}>
      {visible.map((report) => <div key={report.id} className="report-library__item">
        {view === 'grid' && <button className="report-library__preview" type="button" disabled={!report.hasOriginalFile} aria-label={`Preview ${report.originalFileName}`} onClick={() => onViewOriginal(report)}><ReportThumbnail reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={report.hasOriginalFile === true} /></button>}
        <ReportLibraryCard report={report} ownerName={ownerName} canChangeSharing={canChangeSharing} onToggleSharing={onToggleSharing} onViewOriginal={onViewOriginal} onReview={onReview} reviewLabel={reviewLabel?.(report)} />
      </div>)}
    </div>
    {visible.length === 0 && <p className="care-library-empty" role="status">No reports match your search or visibility filter.</p>}
    <p className="care-caption report-library__count">{visible.length} of {reports.length} reports · Files are viewed securely through your account.</p>
  </div>
}
