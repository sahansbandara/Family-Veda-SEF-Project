// S2 · Keep the editable review mounted until explicitly dismissed or access context changes.
import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import type { LabReportDetailDto } from '../../services/apiClient'
import { ReportDetail } from '../../pages/records/ReportDetail'
import { OriginalReportPreview } from './OriginalReportPreview'
import { readingFailure } from './reportReading'

export type ReportReviewDialogProps = {
  report: LabReportDetailDto | null
  hasOriginalFile: boolean
  loading: boolean
  error: string
  title: string
  onRetry: () => void
  onExtract?: () => Promise<boolean>
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>
}

export function ReportReviewDialog({ report, hasOriginalFile, loading, error, title, onRetry, onClose, onSubmit, onExtract }: ReportReviewDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [tab, setTab] = useState<'report' | 'values'>('values')
  const [dirty, setDirty] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [extracting, setExtracting] = useState(false)
  const savingRef = useRef(false)
  const keepReviewing = useRef<HTMLButtonElement>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (dialog.current?.showModal) dialog.current.showModal()
    else dialog.current?.setAttribute('open', '')
    return () => { mounted.current = false; document.body.style.overflow = previousOverflow; previous?.focus() }
  }, [])
  useEffect(() => {
    if (content.current) content.current.inert = leaving
    if (leaving) keepReviewing.current?.focus()
  }, [leaving])
  useEffect(() => {
    if (!dirty && !report?.values.some((value) => !value.wasManuallyConfirmed)) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, report])

  function requestClose() {
    if (savingRef.current) return
    if (dirty || report?.values.some((value) => !value.wasManuallyConfirmed)) setLeaving(true)
    else onClose()
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true); setSaveMessage('')
    try {
      const saved = await onSubmit(event)
      if (!mounted.current) return
      if (saved) { setDirty(false); setSaveMessage('Confirmed values saved.') }
      else setSaveMessage('Values could not be saved. Your edits are still here. Please retry.')
    } catch {
      if (mounted.current) setSaveMessage('Values could not be saved. Your edits are still here. Please retry.')
    } finally {
      savingRef.current = false
      if (mounted.current) setSaving(false)
    }
  }
  return <dialog ref={dialog} className="report-studio report-studio--review" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (leaving) setLeaving(false); else requestClose() }}
    onClick={(event) => { if (event.target === dialog.current && !leaving) requestClose() }}>
    <div className="report-studio__shell">
      <div ref={content} className="report-studio__body" aria-hidden={leaving || undefined}>
      <header className="report-studio__header"><div><p className="care-eyebrow">Report review</p><h2 id={titleId}>{title}</h2><p className="care-caption">Compare the original, correct any reading errors, then confirm.</p></div><button type="button" className="button button--secondary" onClick={requestClose} disabled={saving} aria-label="Close report review">Close</button></header>
      <div className="report-studio__tabs" role="tablist" aria-label="Review panels">
        <button type="button" role="tab" aria-selected={tab === 'report'} aria-controls={`${titleId}-original`} onClick={() => setTab('report')}>Report</button>
        <button type="button" role="tab" aria-selected={tab === 'values'} aria-controls={`${titleId}-values`} onClick={() => setTab('values')}>Values</button>
      </div>
      {loading ? <div className="report-studio__empty" role="status">Loading report details…</div> : error ? <div className="report-studio__empty"><p role="alert">{error}</p><button type="button" className="button button--secondary" onClick={onRetry}>Retry report details</button></div> : report && <div className="report-studio__split" data-active-tab={tab}>
        <section id={`${titleId}-original`} className="report-studio__original" aria-label="Source document"><OriginalReportPreview reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={hasOriginalFile} /></section>
        <section id={`${titleId}-values`} className="report-studio__values" aria-label="Check extracted values" onChangeCapture={() => { setDirty(true); setSaveMessage('') }}>
          {saveMessage && <p className="report-studio__notice" role="status">{saveMessage}</p>}
          {(() => {
            const read = async () => {
              setExtracting(true); setSaveMessage('')
              try {
                const success = await onExtract?.()
                if (mounted.current && !success) setSaveMessage('Reading could not be completed. The reason is shown below.')
              } catch {
                if (mounted.current) setSaveMessage('Reading could not be completed. Please retry.')
              } finally { if (mounted.current) setExtracting(false) }
            }
            const readButton = (label: string) => onExtract && <button type="button" className="button button--primary" disabled={extracting} onClick={() => void read()}>{extracting ? 'Reading report…' : label}</button>
            if (report.values.length === 0 && report.ocrStatus === 'Failed') {
              const failure = readingFailure(report.ocrErrorCode)
              return <div className="report-reading-card report-reading-card--failed" role="alert"><h3>Why it could not be read: {failure.title}</h3><p>{failure.detail}</p><ul>{failure.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul><div className="report-reading-card__actions">{readButton('Read again')}</div></div>
            }
            if (report.values.length === 0 && report.ocrStatus === 'Pending') return <div className="report-reading-card"><h3>Not read yet</h3><p>Read this report now to pull out its test values. It usually takes under a minute.</p><div className="report-reading-card__actions">{readButton('Read report now')}</div></div>
            if (report.ocrStatus === 'Processing') return <div className="report-reading-card" role="status"><h3>Reading the report text…</h3><p>Reports are read one at a time in the background, so this can take a few minutes when several are waiting. You can close this and come back; the values appear when ready.</p><div className="report-reading-card__actions"><button type="button" className="button button--secondary" onClick={onRetry}>Refresh status</button></div></div>
            if (report.values.length > 0 && report.values.every((value) => value.wasManuallyConfirmed)) return <div className="report-reading-card"><h3>Next step: doctor review</h3><p>Your confirmed values are saved. To have them looked at, start a check in Symptoms &amp; Triage. An AI assistant prepares a summary for your doctor, and you only see what your doctor approves.</p><div className="report-reading-card__actions"><a className="button button--primary" href="/triage">Go to Symptoms &amp; Triage</a></div></div>
            return null
          })()}
          <ReportDetail report={report} hasOriginalFile={hasOriginalFile} showOriginal={false} saving={saving} onSubmit={save} />
        </section>
      </div>}
      </div>
      {leaving && <div className="report-studio__guard" role="alertdialog" aria-modal="true" aria-labelledby={`${titleId}-warning`} onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button')
        const first = buttons[0]; const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}>
        <div><span className="report-studio__warning" aria-hidden="true">!</span><h3 id={`${titleId}-warning`}>Leave this review?</h3><p>{dirty ? 'You have unsaved changes. Leaving will discard your edits.' : 'Values haven’t been confirmed yet. Leaving will not confirm them.'}</p><div className="hr-confirm__actions"><button ref={keepReviewing} type="button" className="button button--primary" onClick={() => setLeaving(false)}>Keep reviewing</button><button type="button" className="button button--secondary" onClick={onClose}>Leave without confirming</button></div></div>
      </div>}
    </div>
  </dialog>
}
