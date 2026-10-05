// S2 · Health Records — trend line of recorded values. Decorative: the numbers are always shown as text nearby.
type Props = { 
  values: number[]; 
  width?: number; 
  height?: number; 
  className?: string; 
  normalMin?: number; 
  normalMax?: number;
  normalLabel?: string;
  chartType?: 'bar' | 'line';
}

export function Sparkline({ values, className, normalMin, normalMax, normalLabel, chartType = 'bar' }: Props) {
  if (values.length === 0) return <span className="hr-sparkline hr-sparkline--empty" aria-hidden="true" />
  
  // Use a fixed viewBox so that font sizes and proportions remain consistent
  // and match the premium look without being blown up by CSS scaling.
  const width = 400
  const height = 180
  
  const hasRange = normalMin !== undefined && normalMax !== undefined
  
  const valsAndNormal = hasRange ? [...values, normalMin, normalMax] : values
  const actualMin = Math.min(...valsAndNormal)
  const actualMax = Math.max(...valsAndNormal)
  const span = Math.max(actualMax - actualMin, Number.EPSILON)
  
  const isLine = chartType === 'line'
  
  // Give line charts a tight bounds, but bar charts need a lower baseline 
  // so bars have visual weight (like temperature 35 shouldn't be a tiny dot).
  const low = isLine 
    ? Math.max(0, actualMin - span * 0.3)
    : Math.max(0, Math.min(actualMin - span * 0.5, actualMin * 0.8))
    
  const displaySpan = (actualMax + span * 0.15) - low
  
  const numSlots = 14
  const padX = isLine ? 24 : 8
  const chartBottom = 140 // Leave 40px at the bottom for badges/labels
  const chartHeight = chartBottom - 20 // 20px padding at top
  const slot = (width - padX * 2) / numSlots
  
  const points = values.map((value, index) => {
    // Bars sit in equal slots so they fill the width; lines span edge to edge.
    // Index goes from 0 to values.length - 1. So they align to the left.
    const x = isLine
      ? padX + (index * (width - padX * 2)) / (numSlots - 1)
      : padX + slot * (index + 0.5)
    const y = chartBottom - ((value - low) / displaySpan) * chartHeight
    return { x, y, value }
  })
  
  const topY = hasRange ? chartBottom - ((normalMax - low) / displaySpan) * chartHeight : 0
  const bottomY = hasRange ? chartBottom - ((normalMin - low) / displaySpan) * chartHeight : 0
  
  // Fallback line for "AVG" if no range is defined
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length
  const avgY = chartBottom - ((avgValue - low) / displaySpan) * chartHeight
    
  const lineLabel = normalLabel || 'AVG'

  const barWidth = Math.min(slot * 0.85, 60)
  const radius = Math.min(barWidth / 2, 8)
  const labelY = Math.max(12, (hasRange ? topY : avgY) - 6)

  const ptsString = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <svg
      className={className ? `hr-sparkline ${className}` : 'hr-sparkline'}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      style={{ overflow: 'visible', width: '100%', height: 'auto' }}
    >
      {/* Normal Range Area */}
      {hasRange && (
        <rect
          x={0}
          y={topY}
          width={width}
          height={Math.max(0, bottomY - topY)}
          fill="var(--success, #22c55e)"
          opacity={0.1}
        />
      )}

      {/* Normal/Average Line(s) */}
      {hasRange ? (
        <>
          <line x1={0} y1={topY} x2={width} y2={topY} stroke="var(--success, #22c55e)" strokeOpacity={0.3} strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1={0} y1={bottomY} x2={width} y2={bottomY} stroke="var(--success, #22c55e)" strokeOpacity={0.3} strokeWidth="1.5" strokeDasharray="4 4" />
        </>
      ) : (
        <line x1={0} y1={avgY} x2={width} y2={avgY} stroke="currentColor" strokeOpacity={0.15} strokeWidth="1.5" />
      )}
      
      {isLine ? (
        <>
          {/* Gradient Fill under line */}
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon 
            points={`${padX},${chartBottom} ${ptsString} ${width - padX},${chartBottom}`} 
            fill="url(#lineGrad)" 
          />
          <polyline points={ptsString} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="4.5" fill="var(--surface)" stroke="currentColor" strokeWidth="2.5" />
          ))}
        </>
      ) : (
        /* Bar Chart */
        points.map((p, i) => {
          const isLast = i === points.length - 1;
          const bw2 = barWidth / 2;
          // Draw rounded top corners, flat bottom
          const d = `
            M ${p.x - bw2},${chartBottom} 
            L ${p.x - bw2},${p.y + radius} 
            A ${radius},${radius} 0 0 1 ${p.x - bw2 + radius},${p.y} 
            L ${p.x + bw2 - radius},${p.y} 
            A ${radius},${radius} 0 0 1 ${p.x + bw2},${p.y + radius} 
            L ${p.x + bw2},${chartBottom} 
            Z
          `;
          return (
            <path 
              key={`bar-${i}`}
              d={d}
              fill="currentColor"
              opacity={isLast ? "1" : "0.2"}
            />
          )
        })
      )}

      {/* Reference label(s), drawn on top so bars never hide it */}
      {hasRange ? (
        <>
          <text x={4} y={Math.max(12, topY - 4)} fontSize="10" fill="var(--success, #22c55e)" fontWeight="800" letterSpacing="0.5" stroke="var(--surface-subtle, var(--surface))" strokeWidth="4" paintOrder="stroke">
            {normalMax}
          </text>
          <text x={4} y={Math.max(12, bottomY - 4)} fontSize="10" fill="var(--success, #22c55e)" fontWeight="800" letterSpacing="0.5" stroke="var(--surface-subtle, var(--surface))" strokeWidth="4" paintOrder="stroke">
            {normalMin}
          </text>
        </>
      ) : (
        <text x={4} y={labelY} fontSize="11" fill="currentColor" fontWeight="700" letterSpacing="0.5" stroke="var(--surface-subtle, var(--surface))" strokeWidth="4" paintOrder="stroke">
          {lineLabel.toUpperCase()}
        </text>
      )}
      
      {/* Bottom Axis Line */}
      <line x1={0} y1={chartBottom} x2={width} y2={chartBottom} stroke="currentColor" strokeOpacity={0.15} strokeWidth="1" />
      
      {/* X-axis Labels */}
      {Array.from({ length: numSlots }).map((_, i) => {
        const hasPoint = i < points.length;
        if (!hasPoint) {
          const x = isLine
            ? padX + (i * (width - padX * 2)) / (numSlots - 1)
            : padX + slot * (i + 0.5)
          return <text key={`l-${i}`} x={x} y={chartBottom + 24} fontSize="12" fill="currentColor" opacity="0.3" fontWeight="600" textAnchor="middle">{i + 1}</text>
        }
        
        const p = points[i];
        const isLast = i === points.length - 1;
        return isLast ? (
          <g key={`l-${i}`}>
            <rect x={p.x - 14} y={chartBottom + 10} width={28} height={20} rx="10" fill="currentColor" />
            <text x={p.x} y={chartBottom + 24} fontSize="12" fill="var(--surface)" fontWeight="700" textAnchor="middle">{i + 1}</text>
          </g>
        ) : (
          <text key={`l-${i}`} x={p.x} y={chartBottom + 24} fontSize="12" fill="currentColor" opacity="0.6" fontWeight="600" textAnchor="middle">{i + 1}</text>
        )
      })}
    </svg>
  )
}
