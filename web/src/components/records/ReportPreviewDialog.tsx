import { useEffect, useRef } from 'react'
import type { LabReportDto } from '../../services/apiClient'
import { OriginalReportPreview } from './OriginalReportPreview'
import { RecordIcon } from '../../pages/records/recordIcons'

export function ReportPreviewDialog({ report, onClose, onReview, onDelete, canRecheck = false }: { report: LabReportDto; onClose: () => void; onReview?: () => void; onDelete?: () => void; canRecheck?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (dialog.current?.showModal) dialog.current.showModal()
    else dialog.current?.setAttribute('open', '')
    return () => { document.body.style.overflow = previousOverflow; previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="report-studio report-studio--viewer" aria-label={`Original report: ${report.originalFileName}`} onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === dialog.current) onClose() }}>
    <div className="report-studio__shell">
      <div className="report-studio__viewer-layout">
        <OriginalReportPreview key={report.id} reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={report.hasOriginalFile === true} studio onClose={onClose} extractionStatus={report.ocrStatus} onCheckReport={canRecheck ? onReview : undefined} checkReason="Opens Health records review to check eligibility and re-read the original. Confirmed values are protected."
          actions={<>
            {onReview && <button type="button" className="button button--secondary" onClick={onReview}><RecordIcon name="chart" />{report.ocrStatus === 'Completed' ? 'Check values' : 'View status'}</button>}
            {onDelete && <button type="button" className="button button--danger" onClick={onDelete}><RecordIcon name="trash" />Delete</button>}
          </>} />
      </div>
    </div>
  </dialog>
}
