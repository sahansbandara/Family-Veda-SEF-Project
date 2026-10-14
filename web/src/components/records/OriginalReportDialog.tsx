import { useEffect, useRef } from 'react'

import { OriginalReportPreview } from './OriginalReportPreview'

type OriginalReportDialogProps = {
  reportId: string
  originalFileName: string
  fileUrl: string
  onClose: () => void
}

/** A modal for protected report bytes. Native dialog keeps background controls inert. */
export function OriginalReportDialog({ reportId, originalFileName, fileUrl, onClose }: OriginalReportDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const invoker = useRef<HTMLElement | null>(null)

  useEffect(() => {
    invoker.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const element = dialog.current
    if (!element) return
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '')
    element.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      if (element.open && typeof element.close === 'function') element.close()
      invoker.current?.focus()
    }
  }, [])

  return (
    <dialog ref={dialog} className="original-report-dialog care-report-dialog" aria-label="Original report preview"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="original-report-dialog__content care-report-dialog__content">
        <OriginalReportPreview reportId={reportId} originalFileName={originalFileName} hasOriginalFile fileUrl={fileUrl} onClose={onClose} checkReason="Only an authorized member or guardian can check this report again in Health records." />
      </div>
    </dialog>
  )
}
