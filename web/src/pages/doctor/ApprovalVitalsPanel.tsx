// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Doctor-only vitals overview: latest value, its position against the cited reference interval for the
// member's age, the recorded history, and the reference table itself. Never a diagnosis (RULE 1).
import { useState } from 'react'

import type { MemberWorkspaceDto, WorkspaceVitalDto } from '../../services/apiClient'
import { queueDateTime } from './approvalReview'
import { changeSummary, chipMark, chipTone, rangePosition, statusText, trendArrow, trendText, vitalCards, vitalIcon, type VitalCard, type VitalIcon } from './approvalVitals'
import type { VitalSeries } from './familyWorkspace'

const READINGS_SHOWN = 6

const glyphs: Record<VitalIcon, string[]> = {
  heart: ['M20.8 4.6a5.1 5.1 0 0 0-7.2 0L12 6.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 20.5l8.8-8.7a5.1 5.1 0 0 0 0-7.2z'],
  pressure: ['M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 12 0V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3', 'M8 15v1a6 6 0 0 0 12 0v-4', 'M20 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  weight: ['M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M8 11a4 4 0 0 1 8 0', 'M12 11l2-2'],
  temperature: ['M10 14V5a2 2 0 0 1 4 0v9a5 5 0 1 1-4 0z', 'M12 9v9'],
  oxygen: ['M12 4v8', 'M12 12c-1.5-2-4-4-5-3-2 2-4 7-3 10 .5 1.5 4 1 5-1 1-1.500 3-4 3-6z', 'M12 12c1.500-2 4-4 5-3 2 2 4 7 3 10-.5 1.500-4 1-5-1-1-1.500-3-4-3-6z'],
  breath: ['M3 8h11a3 3 0 1 0-3-3', 'M3 12h16a3 3 0 1 1-3 3', 'M3 16h7'],
  generic: ['M2 12h4l3-8 5 16 3-8h5'],
}

function VitalGlyph({ icon }: { icon: VitalIcon }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyphs[icon].map((path) => <path key={path} d={path} />)}
    </svg>
  )
}

function RangeChip({ status }: { status: keyof typeof statusText }) {
  return (
    <span className={`approval-chip approval-chip--${chipTone[status]}`}>
      <span aria-hidden="true">{chipMark[status]}</span> {statusText[status]}
    </span>
  )
}

function HistoryChart({ series }: { series: VitalSeries }) {
  const points = [...series.readings].reverse()
  const { referenceLow: low, referenceHigh: high } = series.readings[0]!
  const banded = low != null && high != null
  const all = [...points.map((point) => point.value), ...(banded ? [low, high] : [])]
  const floor = Math.min(...all)
  const ceiling = Math.max(...all)
  const pad = ceiling === floor ? Math.max(1, Math.abs(ceiling) * 0.05) : (ceiling - floor) * 0.15
  const min = floor - pad
  const max = ceiling + pad
  const x = (index: number) => 44 + index * (300 / (points.length - 1))
  const y = (value: number) => 110 - ((value - min) / (max - min)) * 96
  const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return (
    <svg className="approval-history__chart" viewBox="0 0 360 132" role="img"
      aria-label={`${series.label}: ${points.length} readings from ${day(points[0]!.measuredAt)} to ${day(points[points.length - 1]!.measuredAt)}. Each reading is listed below.`}>
      {banded && <rect className="approval-history__band" x="44" width="300" y={y(high)} height={Math.max(1, y(low) - y(high))} />}
      {[max - pad, min + pad].map((value) => (
        <text key={value} x="2" y={y(value) + 4}>{Number(value.toFixed(1))}</text>
      ))}
      <polyline className="approval-history__line" points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')} />
      {points.map((point, index) => (
        <circle key={`${point.measuredAt}-${index}`} cx={x(index)} cy={y(point.value)} r="3.5">
          <title>{`${queueDateTime(point.measuredAt)}: ${point.value} ${series.unit}`}</title>
        </circle>
      ))}
      <text x="44" y="128">{day(points[0]!.measuredAt)}</text>
      <text x="344" y="128" textAnchor="end">{day(points[points.length - 1]!.measuredAt)}</text>
    </svg>
  )
}

function History({ card }: { card: VitalCard }) {
  const [showAll, setShowAll] = useState(false)
  return (
    <div className="approval-history" id="approval-vital-history" role="region" aria-label={`${card.label} history`}>
      {card.series.map((series) => (
        <section key={series.key}>
          <h4>{series.label} history <small>{series.readings.length} reading{series.readings.length === 1 ? '' : 's'} · {series.unit}</small></h4>
          <p className="approval-history__change">{changeSummary(series)}</p>
          {series.readings.length > 1 && <HistoryChart series={series} />}
          {series.readings[0]!.referenceLow != null && series.readings.length > 1 && (
            <p className="care-caption">Shaded band: reference interval for this age.</p>
          )}
          <ul className="approval-history__list" aria-label={`${series.label} readings`}>
            {(showAll ? series.readings : series.readings.slice(0, READINGS_SHOWN)).map((reading, index) => (
              <li key={`${reading.measuredAt}-${index}`}>
                <span>{queueDateTime(reading.measuredAt)}</span>
                <b>{reading.value} {reading.unit}</b>
                <RangeChip status={reading.rangeStatus ?? 'RangeUnavailable'} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {card.series.some((series) => series.readings.length > READINGS_SHOWN) && (
        <button type="button" className="button button--secondary button--sm" onClick={() => setShowAll((value) => !value)}>
          {showAll ? 'Show fewer readings' : 'Show all readings'}
        </button>
      )}
    </div>
  )
}

function ReferenceTable({ workspace, vitals }: { workspace: MemberWorkspaceDto; vitals: WorkspaceVitalDto[] }) {
  const rows = workspace.vitalReferences ?? []
  const latest = (type: string) => vitals.find((vital) => vital.vitalType.trim().toLowerCase() === type && vital.referenceLow != null)
  const age = workspace.ageYears
  return (
    <details className="approval-reference">
      <summary>Reference ranges{age != null ? ` for age ${age}` : ''}</summary>
      {rows.length === 0 ? (
        <p className="care-caption">
          No reference intervals are configured for this age. Review the recorded values clinically.
        </p>
      ) : (
        <>
          <p className="care-caption">
            Published resting intervals for the {rows[0]!.ageBand} band. The marker shows this patient&rsquo;s latest recorded value.
          </p>
          <ul className="approval-reference__rows">
            {rows.map((row) => {
              const reading = latest(row.vitalType)
              return (
                <li key={row.vitalType}>
                  <span className="approval-reference__label">{row.label}</span>
                  <span className="approval-reference__bar" aria-hidden="true">
                    {reading && <i style={{ left: `${rangePosition(reading.value, row.low, row.high)}%` }} />}
                  </span>
                  <span className="approval-reference__range">
                    <b>{row.low} – {row.high} {row.unit}</b>
                    <small>{reading ? `Latest ${reading.value} ${reading.unit}` : 'No reading recorded'}</small>
                  </span>
                  <small className="approval-reference__source">Source: {row.source}</small>
                </li>
              )
            })}
          </ul>
          <p className="care-caption">Weight has no age-only reference interval; use its recorded history.</p>
        </>
      )}
    </details>
  )
}

export function ApprovalVitalsPanel({ workspace }: { workspace: MemberWorkspaceDto }) {
  const vitals = workspace.vitals ?? []
  const cards = vitalCards(vitals)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const open = cards.find((item) => item.key === openKey)
  if (cards.length === 0) return <p className="care-caption">No vitals are recorded in the authorized records.</p>
  return (
    <>
      <div className="approval-vitals">
        {cards.map((item) => (
          <button key={item.key} type="button" className="approval-vital" aria-expanded={item.key === openKey}
            aria-controls="approval-vital-history" onClick={() => setOpenKey(item.key === openKey ? null : item.key)}>
            <span className="approval-vital__label">
              <span className={`approval-vital__icon approval-vital__icon--${vitalIcon(item.key)}`}><VitalGlyph icon={vitalIcon(item.key)} /></span>
              {item.label}
            </span>
            <strong>{item.value} <small>{item.unit}</small></strong>
            <RangeChip status={item.status} />
            <small>{item.range ? `Reference ${item.range}` : 'No reference interval for this measurement or age'}</small>
            <span className="approval-vital__foot">
              <span className={`approval-trend approval-trend--${item.trend.toLowerCase()}`}><span aria-hidden="true">{trendArrow[item.trend]}</span> {trendText[item.trend]}</span>
              <small>{queueDateTime(item.latest.measuredAt)}</small>
            </span>
            <span className="sr-only">Show {item.label} history</span>
          </button>
        ))}
      </div>
      {open && <History key={open.key} card={open} />}
      <ReferenceTable workspace={workspace} vitals={vitals} />
      <p className="care-caption">
        Range and trend labels are computed from cited reference tables, not by AI. They are not a diagnosis.
      </p>
    </>
  )
}
