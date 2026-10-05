import { type ReactNode, useEffect, useState } from 'react'

import { ImageReportCanvas } from './ImageReportCanvas'
import { PdfReportCanvas } from './PdfReportCanvas'
import { apiClient } from '../../services/apiClient'

type PreviewState = 'loading' | 'ready' | 'unavailable' | 'error'

type OriginalReportPreviewProps = {
  reportId: string
  originalFileName: string
  hasOriginalFile: boolean
  fileUrl?: string
  studio?: boolean
  actions?: ReactNode
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

export function OriginalReportPreview({ reportId, originalFileName, hasOriginalFile, fileUrl, studio = false, actions }: OriginalReportPreviewProps) {
  const [state, setState] = useState<PreviewState>(hasOriginalFile ? 'loading' : 'unavailable')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [reason, setReason] = useState('')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

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
    <section className={`original-report-preview${studio ? ' original-report-preview--studio' : ''}`} aria-label="Original report">
      <h3>Original report</h3>
      <div className="original-report-preview__controls" aria-label="Document controls">
        {actions}
        {state === 'ready' && objectUrl && <>
          <a className="button button--secondary button--sm" href={objectUrl} download={originalFileName}>{isPdf ? 'Download original report' : 'Download original image'}</a>
          <button type="button" className="button button--secondary button--sm" disabled={zoom <= 0.5} onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} aria-label="Zoom out">−</button>
          <span className="original-report-preview__zoom" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" className="button button--secondary button--sm" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.25))} aria-label="Zoom in">+</button>
          <button type="button" className="button button--secondary button--sm" onClick={() => setRotation((value) => (value + 90) % 360)}>Rotate</button>
          <button type="button" className="button button--secondary button--sm" onClick={() => { setZoom(1); setRotation(0) }}>Reset view</button>
          {isPdf && <a className="button button--secondary button--sm" href={objectUrl} target="_blank" rel="noopener noreferrer">Open PDF</a>}
        </>}
      </div>
      <div className="original-report-preview__document">
        {state === 'loading' && <p role="status">Loading original report…</p>}
        {state === 'unavailable' && <p role="status">Original report unavailable.</p>}
        {state === 'error' && <><p role="status">Original report could not be loaded.{reason ? ` ${reason}` : ''}</p><button type="button" className="button button--secondary button--sm" onClick={() => setAttempt((value) => value + 1)}>Retry original report</button></>}
        {state === 'ready' && objectUrl && isPdf && <PdfReportCanvas url={objectUrl} label={`Original report document: ${originalFileName}`} zoom={zoom} rotation={rotation} />}
        {state === 'ready' && objectUrl && !isPdf && <ImageReportCanvas url={objectUrl} label={`Original report image: ${originalFileName}`} zoom={zoom} rotation={rotation} />}
      </div>
    </section>
  )
}
