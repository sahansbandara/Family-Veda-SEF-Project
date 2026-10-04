// S2 · Authenticated thumbnails: never publish storage URLs or retain files across profiles.
import { useEffect, useRef, useState } from 'react'
import { PdfReportCanvas } from './PdfReportCanvas'
import { apiClient } from '../../services/apiClient'

export function ReportThumbnail({ reportId, originalFileName, hasOriginalFile }: {
  reportId: string; originalFileName: string; hasOriginalFile: boolean
}) {
  const target = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [preview, setPreview] = useState<{ id: string; url: string; pdf: boolean } | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!target.current || !hasOriginalFile) return
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect() }
    }, { rootMargin: '160px' })
    observer.observe(target.current)
    return () => observer.disconnect()
  }, [hasOriginalFile, reportId])
  useEffect(() => {
    if (!visible || !hasOriginalFile) return
    const controller = new AbortController()
    let active = true
    let url: string | undefined
    setPreview(null)
    setFailed(false)
    void apiClient.get(`/lab-reports/${reportId}/file`, { responseType: 'blob', signal: controller.signal })
      .then(({ data }) => {
        if (!active) return
        if (!(data instanceof Blob) || (!data.type.startsWith('image/') && data.type !== 'application/pdf')) throw new Error('Unsupported preview')
        url = URL.createObjectURL(data)
        setPreview({ id: reportId, url, pdf: data.type === 'application/pdf' })
      }).catch(() => { if (active && !controller.signal.aborted) setFailed(true) })
    return () => { active = false; controller.abort(); if (url) URL.revokeObjectURL(url) }
  }, [visible, hasOriginalFile, reportId])
  const current = preview?.id === reportId && hasOriginalFile ? preview : null
  return <div ref={target} className="report-thumbnail" aria-label={`Preview of ${originalFileName}`}>
    {current ? current.pdf
      ? <PdfReportCanvas url={current.url} label={`First page of ${originalFileName}`} thumbnail />
      : <img src={current.url} alt={`Report thumbnail: ${originalFileName}`} />
      : <span className="report-thumbnail__fallback"><span aria-hidden="true">▤</span><b>{originalFileName.toLowerCase().endsWith('.pdf') ? 'PDF document' : 'Report image'}</b><small>{!hasOriginalFile ? 'Original not stored' : failed ? 'Open report to retry preview' : 'Loading preview…'}</small></span>}
  </div>
}
