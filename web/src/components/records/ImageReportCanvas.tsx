import { useEffect, useRef, useState } from 'react'

// Size the rotated document's scroll area, so zoom never hides an edge off-canvas.
export function ImageReportCanvas({ url, label, zoom, rotation }: { url: string; label: string; zoom: number; rotation: number }) {
  const host = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(350)
  const [size, setSize] = useState({ width: 1, height: 1 })
  useEffect(() => {
    const element = host.current
    if (!element) return
    const measure = () => { if (element.clientWidth > 0) setWidth(Math.max(1, element.clientWidth - 32)) }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  const sideways = rotation % 180 !== 0
  const fit = Math.min(900, width) / (sideways ? size.height : size.width)
  const imageWidth = size.width * fit * zoom
  const imageHeight = size.height * fit * zoom
  const stageWidth = sideways ? imageHeight : imageWidth
  const stageHeight = sideways ? imageWidth : imageHeight
  return <div ref={host} className="original-report-preview__image-scroll">
    <div className="original-report-preview__image-stage" style={{ width: stageWidth, height: stageHeight }}>
      <img className="original-report-preview__image" src={url} alt={label} onLoad={(event) => {
        const element = event.currentTarget
        if (element.naturalWidth && element.naturalHeight) setSize({ width: element.naturalWidth, height: element.naturalHeight })
      }} style={{ width: imageWidth, height: imageHeight, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }} />
    </div>
  </div>
}
