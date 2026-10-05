import { useEffect, useId, useRef } from 'react'
import type { LabReportDto } from '../../services/apiClient'
import { OriginalReportPreview } from './OriginalReportPreview'
import { RecordIcon } from '../../pages/records/recordIcons'

export function ReportPreviewDialog({ report, onClose, onReview, onDelete }: { report: LabReportDto; onClose: () => void; onReview?: () => void; onDelete?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (dialog.current?.showModal) dialog.current.showModal()
    else dialog.current?.setAttribute('open', '')
    return () => { document.body.style.overflow = previousOverflow; previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="report-studio report-studio--viewer" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === dialog.current) onClose() }}>
    <div className="report-studio__shell">
      <header className="report-studio__header"><div><p className="care-eyebrow">Secure report viewer</p><h2 id={titleId}>{report.originalFileName}</h2><p className="care-caption">{report.sharedWithFamilyHead ? 'Shared with Family Head' : 'Private from Family Head'} · Original document</p></div><button type="button" className="button button--secondary" onClick={onClose} aria-label="Close report preview">Close</button></header>
      <div className="report-studio__viewer-layout">
        <OriginalReportPreview key={report.id} reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={report.hasOriginalFile === true} studio
          actions={<>
            {onReview && <button type="button" className="button button--secondary" onClick={onReview}><RecordIcon name="chart" />{report.ocrStatus === 'Completed' ? 'Check values' : 'View status'}</button>}
            {onDelete && <button type="button" className="button button--danger" onClick={onDelete}><RecordIcon name="trash" />Delete</button>}
          </>} />
      </div>
    </div>
  </dialog>
}
