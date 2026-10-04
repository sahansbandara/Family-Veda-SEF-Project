// S2 · Health Records — trend line of recorded values. Decorative: the numbers are always shown as text nearby.
type Props = { values: number[]; width?: number; height?: number; filled?: boolean; className?: string }

export function Sparkline({ values, width = 96, height = 32, filled = false, className }: Props) {
  if (values.length < 2) return <span className="hr-sparkline hr-sparkline--empty" aria-hidden="true" />
  const low = Math.min(...values)
  const span = Math.max(Math.max(...values) - low, Number.EPSILON)
  const pad = 3
  const points = values.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / (values.length - 1)
    const y = height - pad - ((value - low) / span) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg
      className={className ? `hr-sparkline ${className}` : 'hr-sparkline'}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      {filled && <polygon className="hr-sparkline__fill" points={`${pad},${height} ${points.join(' ')} ${width - pad},${height}`} />}
      <polyline className="hr-sparkline__line" points={points.join(' ')} fill="none" />
    </svg>
  )
}
