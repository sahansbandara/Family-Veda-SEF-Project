// S2 · Health Records — small modal used to view one record or one vital's readings.
import { type ReactNode, useEffect, useId, useRef } from 'react'

type Props = { eyebrow: string; title: string; onClose: () => void; children: ReactNode }

export function RecordDialog({ eyebrow, title, onClose, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()
  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement
    if (dialog.current?.showModal) dialog.current.showModal()
    else dialog.current?.setAttribute('open', '')
    return () => { restoreFocus.current?.focus() }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="care-report-dialog hr-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => { if (event.target === dialog.current) onClose() }}
    >
      <div className="care-report-dialog__content">
        <header className="care-panel-heading">
          <div>
            <p className="care-eyebrow">{eyebrow}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="button button--secondary" onClick={onClose}>Close</button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
