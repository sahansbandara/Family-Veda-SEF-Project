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
  const closeButton = useRef<HTMLButtonElement>(null)
  const invoker = useRef<HTMLElement | null>(null)

  useEffect(() => {
    invoker.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const element = dialog.current
    if (!element) return
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '')
    closeButton.current?.focus()
    return () => {
      if (element.open && typeof element.close === 'function') element.close()
      invoker.current?.focus()
    }
  }, [])

  return (
    <dialog ref={dialog} className="original-report-dialog" aria-label="Original report preview"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="original-report-dialog__content">
        <button ref={closeButton} type="button" className="button button--secondary button--sm original-report-dialog__close" onClick={onClose}>Close preview</button>
        <OriginalReportPreview reportId={reportId} originalFileName={originalFileName} hasOriginalFile fileUrl={fileUrl} />
      </div>
    </dialog>
  )
}
