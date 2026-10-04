import { useEffect, useState } from 'react'

import { apiClient } from '../../services/apiClient'

type PreviewState = 'loading' | 'ready' | 'unavailable' | 'error'

type OriginalReportPreviewProps = {
  reportId: string
  originalFileName: string
  hasOriginalFile: boolean
  fileUrl?: string
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

export function OriginalReportPreview({ reportId, originalFileName, hasOriginalFile, fileUrl }: OriginalReportPreviewProps) {
  const [state, setState] = useState<PreviewState>(hasOriginalFile ? 'loading' : 'unavailable')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [reason, setReason] = useState('')

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
    <section className="original-report-preview" aria-label="Original report">
      <h3>Original report</h3>
      {state === 'loading' && <p role="status">Loading original report…</p>}
      {state === 'unavailable' && <p role="status">Original report unavailable.</p>}
      {state === 'error' && <><p role="status">Original report could not be loaded.{reason ? ` ${reason}` : ''}</p><button type="button" className="button button--secondary button--sm" onClick={() => setAttempt((value) => value + 1)}>Retry original report</button></>}
      {state === 'ready' && objectUrl && isPdf && (
        <>
          <object className="original-report-preview__document" data={objectUrl} type="application/pdf" aria-label={`Original report document: ${originalFileName}`}>
            <p>This browser cannot show the PDF inline. Open or download the original report.</p>
          </object>
          <a className="button button--secondary button--sm" href={objectUrl} target="_blank" rel="noopener noreferrer">Open PDF</a>
          <a className="button button--secondary button--sm" href={objectUrl} download={originalFileName}>Download original report</a>
        </>
      )}
      {state === 'ready' && objectUrl && !isPdf && (
        <>
          <img className="original-report-preview__image" src={objectUrl} alt={`Original report image: ${originalFileName}`} />
          <a className="button button--secondary button--sm" href={objectUrl} download={originalFileName}>Download original image</a>
        </>
      )}
    </section>
  )
}
