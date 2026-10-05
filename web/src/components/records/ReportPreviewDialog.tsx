import { useEffect, useRef } from 'react'
import type { LabReportDto } from '../../services/apiClient'
import { OriginalReportPreview } from './OriginalReportPreview'

export function ReportPreviewDialog({ report, onClose }: { report: LabReportDto; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement
    if (dialog.current?.showModal) dialog.current.showModal()
    else dialog.current?.setAttribute('open', '')
    return () => { restoreFocus.current?.focus() }
  }, [])
  return <dialog ref={dialog} className="care-report-dialog" aria-labelledby="report-preview-title" onCancel={onClose} onClick={(event) => { if (event.target === dialog.current) onClose() }}>
    <div className="care-report-dialog__content">
      <header className="care-panel-heading"><div><p className="care-eyebrow">Secure report viewer</p><h2 id="report-preview-title">{report.originalFileName}</h2><p className="care-caption">{report.sharedWithFamilyHead ? 'Shared with Family Head' : 'Private from Family Head'} · Original document</p></div><button type="button" className="button button--secondary" onClick={onClose} aria-label="Close report preview">Close</button></header>
      <OriginalReportPreview key={report.id} reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={report.hasOriginalFile === true} />
    </div>
  </dialog>
}
