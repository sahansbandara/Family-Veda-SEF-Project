// S2 · Render protected PDF bytes locally; the worker is bundled with the app.
import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import { ViewerIcon } from './ViewerIcon'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

/** Only nearby pages are rendered; reuse the already authorized document. */
function PageThumbnail({ pdf, page, selected, onSelect }: { pdf: PDFDocumentProxy; page: number; selected: boolean; onSelect: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let active = true
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined
    void pdf.getPage(page).then(async (documentPage) => {
      if (!active || !canvas.current) return
      const base = documentPage.getViewport({ scale: 1 })
      const viewport = documentPage.getViewport({ scale: 72 / base.width })
      canvas.current.width = viewport.width; canvas.current.height = viewport.height
      task = documentPage.render({ canvas: canvas.current, viewport })
      await task.promise
    }).catch(() => { /* Page number remains usable when thumbnail rendering fails. */ })
    return () => { active = false; task?.cancel() }
  }, [pdf, page])
  return <button type="button" className="pdf-page-thumbnail" aria-label={`Go to page ${page}`} aria-current={selected ? 'page' : undefined} onClick={onSelect}><canvas ref={canvas} aria-hidden="true" /><span>Page {page}</span></button>
}

export function PdfReportCanvas({ url, label, thumbnail = false, zoom = 1, rotation = 0, fit = 'width', navigator = false }: { url: string; label: string; thumbnail?: boolean; zoom?: number; rotation?: number; fit?: 'page' | 'width'; navigator?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [width, setWidth] = useState(600)
  const [height, setHeight] = useState(700)
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
    const measure = () => { setWidth(Math.max(160, element.clientWidth || 600)); setHeight(Math.max(160, element.clientHeight || 700)) }
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
      const base = documentPage.getViewport({ scale: 1, rotation: documentPage.rotate + rotation })
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const scale = Math.min((width - 32) / base.width, fit === 'page' && !thumbnail ? (height - 100) / base.height : Infinity, thumbnail ? 0.8 : 2) * zoom
      const viewport = documentPage.getViewport({ scale: scale * ratio, rotation: documentPage.rotate + rotation })
      const element = canvas.current
      element.width = viewport.width; element.height = viewport.height
      element.style.width = `${viewport.width / ratio}px`
      element.style.height = `${viewport.height / ratio}px`
      rendering = documentPage.render({ canvas: element, viewport })
      await rendering.promise
      if (active) setState('ready')
    }).catch(() => { if (active) setState('error') })
    return () => { active = false; rendering?.cancel() }
  }, [pdf, page, width, height, thumbnail, zoom, rotation, fit])
  return <div ref={container} className={thumbnail ? 'pdf-canvas pdf-canvas--thumbnail' : 'pdf-canvas'}>
    {navigator && !thumbnail && pdf && <nav className="pdf-canvas__navigator" aria-label="Page navigator"><div className="pdf-canvas__thumbnails">{Array.from({ length: Math.min(pdf.numPages, page + 1) - Math.max(1, page - 1) + 1 }, (_, index) => { const target = Math.max(1, page - 1) + index; return <PageThumbnail key={target} pdf={pdf} page={target} selected={target === page} onSelect={() => setPage(target)} /> })}</div><label>Go to page<select aria-label="Go to page" value={page} onChange={(event) => setPage(Number(event.target.value))}>{Array.from({ length: pdf.numPages }, (_, index) => <option key={index} value={index + 1}>Page {index + 1}</option>)}</select></label></nav>}
    {state === 'loading' && <span role="status">Loading PDF preview…</span>}
    {state === 'error' && <span role="status">Preview unavailable. Open or download the report to view it.</span>}
    <canvas ref={canvas} aria-label={label} role="img" aria-hidden={state !== 'ready'} style={{ visibility: state === 'ready' ? 'visible' : 'hidden' }} />
    {!thumbnail && pdf && <nav className="pdf-canvas__pages" aria-label="PDF pages"><button type="button" className="button button--secondary button--sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page" title="Previous page"><ViewerIcon name="left" /></button><span>Page {page} of {pdf.numPages}</span><button type="button" className="button button--secondary button--sm" disabled={page >= pdf.numPages} onClick={() => setPage(page + 1)} aria-label="Next page" title="Next page"><ViewerIcon name="right" /></button></nav>}
  </div>
}
