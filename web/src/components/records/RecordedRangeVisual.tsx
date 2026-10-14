// Owner: S2 · Health Records & Extraction — whole-project UI waiver, 2026-09-28b.
import type { LabValueDto } from '../../services/apiClient'

/** A factual diagram of a confirmed value and its printed interval, never an interpretation. */
export function RecordedRangeVisual({ value }: { value: LabValueDto }) {
  if (!value.wasManuallyConfirmed || !Number.isFinite(value.value)) return null
  const { referenceLow: low, referenceHigh: high } = value
  const hasRange = low != null && high != null && Number.isFinite(low) && Number.isFinite(high) && high > low
  const outside = hasRange && (value.value < low || value.value > high)
  const min = hasRange ? Math.min(low, value.value) - (high - low) * 0.2 : 0
  const max = hasRange ? Math.max(high, value.value) + (high - low) * 0.2 : 1
  const position = (number: number) => 24 + ((number - min) / (max - min)) * 272
  const description = hasRange
    ? `${value.analyte}: ${value.value} ${value.unit}. Printed reference interval ${low} to ${high} ${value.unit}. ${outside ? 'Outside' : 'Within'} the printed interval.`
    : `${value.analyte}: ${value.value} ${value.unit}. Printed reference interval unavailable.`
  return (
    <figure className="care-range-card">
      <figcaption>
        <strong>{value.analyte}</strong>
        <span className="care-caption">Confirmed value</span>
      </figcaption>
      <p className="care-range-value">
        {value.value} <span>{value.unit}</span>
      </p>
      {hasRange ? (
        <>
          <svg viewBox="0 0 320 85" role="img" aria-label={description}>
            <line x1="24" y1="30" x2="296" y2="30" className="care-range-track" />
            <line x1={position(low)} y1="30" x2={position(high)} y2="30" className="care-range-band" />
            <line
              x1={position(value.value)}
              y1="17"
              x2={position(value.value)}
              y2="43"
              className="care-range-marker"
            />
            <text x={position(low)} y="64" textAnchor="middle">
              {low}
            </text>
            <text x={position(high)} y="64" textAnchor="middle">
              {high}
            </text>
          </svg>
          <p className="care-caption">
            {outside ? 'Outside' : 'Within'} the report&apos;s printed interval: {low}–{high} {value.unit}.
          </p>
        </>
      ) : (
        <p className="care-caption">No complete printed reference interval available.</p>
      )}
    </figure>
  )
}
