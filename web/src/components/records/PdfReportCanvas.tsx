// S2 · Render protected PDF bytes locally; the worker is bundled with the app.
import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export function PdfReportCanvas({ url, label, thumbnail = false }: { url: string; label: string; thumbnail?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [width, setWidth] = useState(600)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    let active = true
    setPdf(null); setPage(1); setState('loading')
    const task = getDocument({ url, enableXfa: false })
    void task.promise.then((document) => { if (active) setPdf(document) }).catch(() => { if (active) setState('error') })
    return () => { active = false; void task.destroy() }
  }, [url])
  useEffect(() => {
    const element = container.current
    if (!element) return
    const measure = () => setWidth(Math.max(160, element.clientWidth || 600))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!pdf || !canvas.current) return
    let active = true
    let rendering: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined
    setState('loading')
    void pdf.getPage(page).then(async (documentPage) => {
      if (!active || !canvas.current) return
      const base = documentPage.getViewport({ scale: 1 })
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = documentPage.getViewport({ scale: Math.min(width / base.width, thumbnail ? 0.8 : 2) * ratio })
      const element = canvas.current
      element.width = viewport.width; element.height = viewport.height
      rendering = documentPage.render({ canvas: element, viewport })
      await rendering.promise
      if (active) setState('ready')
    }).catch(() => { if (active) setState('error') })
    return () => { active = false; rendering?.cancel() }
  }, [pdf, page, width, thumbnail])
  return <div ref={container} className={thumbnail ? 'pdf-canvas pdf-canvas--thumbnail' : 'pdf-canvas'}>
    {state === 'loading' && <span role="status">Loading PDF preview…</span>}
    {state === 'error' && <span role="status">Preview unavailable. Open or download the report to view it.</span>}
    <canvas ref={canvas} aria-label={label} role="img" hidden={state !== 'ready'} />
    {!thumbnail && pdf && <nav className="pdf-canvas__pages" aria-label="PDF pages"><button type="button" className="button button--secondary button--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous page</button><span>Page {page} of {pdf.numPages}</span><button type="button" className="button button--secondary button--sm" disabled={page >= pdf.numPages} onClick={() => setPage(page + 1)}>Next page</button></nav>}
  </div>
}
