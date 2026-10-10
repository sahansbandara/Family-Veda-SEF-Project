import { type ReactNode, useEffect, useState } from 'react'

import { ImageReportCanvas } from './ImageReportCanvas'
import { PdfReportCanvas } from './PdfReportCanvas'
import { ViewerIcon } from './ViewerIcon'
import '../../styles/document-viewer.css'
import { apiClient } from '../../services/apiClient'

type PreviewState = 'loading' | 'ready' | 'unavailable' | 'error'

type OriginalReportPreviewProps = {
  reportId: string
  originalFileName: string
  hasOriginalFile: boolean
  fileUrl?: string
  studio?: boolean
  actions?: ReactNode
  onClose?: () => void
  onCheckReport?: () => void
  checkDisabled?: boolean
  checkReason?: string
  extractionStatus?: string
}

/** Explains a failed load from the HTTP status only; the response body is never shown. */
function failureReason(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status
  if (status === 404) return 'The stored file was not found, or the grant or consent for it is no longer active.'
  if (status === 401 || status === 403) return 'Your session or permission for this file has ended. Sign in again.'
  if (status === 422 || status === 503) return 'Report storage is temporarily unavailable. Retry shortly.'
  if (status == null) return 'The server could not be reached.'
  return `The server returned status ${status}.`
}

export function OriginalReportPreview({ reportId, originalFileName, hasOriginalFile, fileUrl, studio = false, actions, onClose, onCheckReport, checkDisabled, checkReason, extractionStatus }: OriginalReportPreviewProps) {
  const [state, setState] = useState<PreviewState>(hasOriginalFile ? 'loading' : 'unavailable')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [reason, setReason] = useState('')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  const [fit, setFit] = useState<'page' | 'width'>('page')
  const [details, setDetails] = useState(false)
  const [more, setMore] = useState(false)
  const [navigator, setNavigator] = useState(false)
  const toolbarButton = (name: string, label: string, action: () => void, disabled = false) => <button type="button" className="viewer-tool" title={label} aria-label={label} disabled={disabled} onClick={action}><ViewerIcon name={name} /></button>


  useEffect(() => {
    if (!hasOriginalFile) {
      setState('unavailable')
      setObjectUrl(null)
      return
    }

    const controller = new AbortController()
    let active = true
    let url: string | null = null
    setState('loading')
    setZoom(1); setRotation(0)
    setObjectUrl(null)

    void apiClient.get(fileUrl ?? `/lab-reports/${reportId}/file`, { responseType: 'blob', signal: controller.signal })
      .then(({ data }) => {
        if (!active) return
        url = URL.createObjectURL(data as Blob)
        setIsPdf((data as Blob).type === 'application/pdf')
        setObjectUrl(url)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return
        setReason(failureReason(error))
        setState('error')
      })

    return () => {
      active = false
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [attempt, fileUrl, hasOriginalFile, reportId])

  return (
    <section className={`original-report-preview premium-viewer${studio ? ' original-report-preview--studio' : ''}`} data-viewer-theme={theme} aria-label="Original report" onKeyDown={(event) => { if (event.key === 'Escape' && (more || details)) { event.preventDefault(); event.stopPropagation(); setMore(false); setDetails(false) } }}>
      <header className="premium-viewer__header">
        {onClose && toolbarButton('close', 'Close preview', onClose)}
        <div className="premium-viewer__identity"><ViewerIcon name="file" /><div><h3 title={originalFileName}>{originalFileName}</h3><small>Original document · Protected access</small></div></div>
        <div className="premium-viewer__actions">
          {state === 'ready' && objectUrl && <a className="viewer-tool" title={isPdf ? 'Download original report' : 'Download original image'} aria-label={isPdf ? 'Download original report' : 'Download original image'} href={objectUrl} download={originalFileName}><ViewerIcon name="download" /></a>}
          {toolbarButton(theme === 'dark' ? 'sun' : 'moon', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', () => setTheme(theme === 'dark' ? 'light' : 'dark'))}
          <button type="button" className="viewer-tool" title="File details" aria-label="File details" aria-expanded={details} onClick={() => { setDetails(!details); setMore(false) }}><ViewerIcon name="info" /></button>
          <button type="button" className="viewer-tool" title="More actions" aria-label="More actions" aria-expanded={more} onClick={() => setMore(!more)}><ViewerIcon name="more" /></button>
        </div>
      </header>
      {more && <div className="premium-viewer__menu" aria-label="More document actions" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setMore(false) } }}>
        <button type="button" onClick={() => { setFit('width'); setZoom(1); setMore(false) }}><ViewerIcon name="width" />Fit width</button>
        <button type="button" onClick={() => { setFit('page'); setZoom(1); setMore(false) }}><ViewerIcon name="fit" />Fit whole page</button>
        <button type="button" onClick={() => { setRotation((value) => (value + 90) % 360); setMore(false) }}><ViewerIcon name="rotate" />Rotate</button>
        <button type="button" onClick={() => { setZoom(1); setRotation(0); setFit('page'); setMore(false) }}><ViewerIcon name="reset" />Reset view</button>
        {isPdf && <button type="button" onClick={() => { setNavigator(!navigator); setMore(false) }}><ViewerIcon name="pages" />Page navigator</button>}
        {isPdf && objectUrl && <a href={objectUrl} target="_blank" rel="noopener noreferrer"><ViewerIcon name="file" />Open PDF</a>}
        {onCheckReport && <><button type="button" disabled={checkDisabled} onClick={() => { setMore(false); onCheckReport() }}><ViewerIcon name="scan" />Check report again</button>{checkReason && <p>{checkReason}</p>}</>}
        {actions && <div className="premium-viewer__extra">{actions}</div>}
      </div>}
      <div className="premium-viewer__body">
        <div className="original-report-preview__document">
          {state === 'loading' && <p role="status">Loading original report…</p>}
          {state === 'unavailable' && <p role="status">Original report unavailable.</p>}
          {state === 'error' && <><p role="status">Original report could not be loaded.{reason ? ` ${reason}` : ''}</p><button type="button" className="button button--secondary button--sm" onClick={() => setAttempt((value) => value + 1)}>Retry original report</button></>}
          {state === 'ready' && objectUrl && isPdf && <PdfReportCanvas url={objectUrl} label={`Original report document: ${originalFileName}`} zoom={zoom} rotation={rotation} fit={fit} navigator={navigator} />}
          {state === 'ready' && objectUrl && !isPdf && <ImageReportCanvas url={objectUrl} label={`Original report image: ${originalFileName}`} zoom={zoom} rotation={rotation} fitMode={fit} />}
        </div>
        {details && <aside className="premium-viewer__details" aria-label="File information"><div><h4>File details</h4>{toolbarButton('close', 'Close file details', () => setDetails(false))}</div><dl><dt>File name</dt><dd>{originalFileName}</dd><dt>Format</dt><dd>{state === 'ready' ? (isPdf ? 'PDF document' : 'Report image') : 'Loading'}</dd><dt>Access</dt><dd>Protected original document</dd>{extractionStatus && <><dt>Extraction status</dt><dd>{extractionStatus}</dd></>}</dl><p>Compare extracted values with the original report before confirming.</p>{checkReason && <p>{checkReason}</p>}</aside>}
      </div>
      {state === 'ready' && <nav className="premium-viewer__dock" aria-label="Document controls">
        {toolbarButton('minus', 'Zoom out', () => setZoom((value) => Math.max(0.5, value - 0.25)), zoom <= 0.5)}
        <span aria-live="polite">{Math.round(zoom * 100)}%</span>
        {toolbarButton('plus', 'Zoom in', () => setZoom((value) => Math.min(3, value + 0.25)), zoom >= 3)}
        {toolbarButton('fit', 'Fit whole page', () => { setFit('page'); setZoom(1) })}
        {toolbarButton('width', 'Fit width', () => { setFit('width'); setZoom(1) })}
        {toolbarButton('rotate', 'Rotate', () => setRotation((value) => (value + 90) % 360))}
        {toolbarButton('reset', 'Reset view', () => { setZoom(1); setRotation(0); setFit('page') })}
      </nav>}
    </section>
  )
}
