// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Member workspace tabs for member-owned clinical categories: Records, Labs, Vitals.
// null = not authorised (restricted, no count) · [] = authorised and empty · list = what the API returned.
import { useEffect, useMemo, useState } from 'react'

import type { MemberWorkspaceDto } from '../../services/apiClient'
import { OriginalReportDialog } from '../../components/records/OriginalReportDialog'
import { formatDateTime } from '../family/threePortalUtils'
import { RecordSummaryText } from '../records/RecordSummaryText'
import { changeSummary, statusText, statusTone, trendText } from './approvalVitals'
import { Empty, Icon, type IconName, Pill, Restricted, Strip } from './familyParts'
import { groupVitals, rangeLabel, rangeTone, referenceRange, shortDate, type VitalSeries } from './familyWorkspace'

const recordIcon: Record<string, IconName> = { Surgery: 'activity', Allergy: 'shield' }

export function RecordsTab({ records }: { records: MemberWorkspaceDto['records'] }) {
  const [type, setType] = useState('All')
  if (!records) return <Restricted what="Records" />
  const types = [...new Set(records.map((record) => record.recordType))].sort()
  const visible = records.filter((record) => type === 'All' || record.recordType === type)

  return (
    <>
      <div className="dfam-section-head">
        <div><h2>Health records</h2><p>History the member recorded, newest first.</p></div>
        {records.length > 0 && (
          <div className="dfam-tools">
            <label>Record type
              <select className="dfam-select" value={type} onChange={(event) => setType(event.target.value)}>
                <option>All</option>
                {types.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>
      {records.length === 0 ? <Empty title="No records" message="This member has no health records yet." /> : (
        <div className="dfam-stack">
          {visible.map((record) => (
            <article className="dfam-record" key={record.id}>
              <span className="dfam-icon-tile"><Icon name={recordIcon[record.recordType] ?? 'file'} size={18} /></span>
              <div>
                <small className="dfam-note">{shortDate(record.occurredOn) ?? record.occurredOn} · {record.recordType}</small>
                <h3>{record.title}</h3>
                <p><RecordSummaryText summary={record.summary} emptyLabel="No summary recorded." /></p>
              </div>
            </article>
          ))}
        </div>
      )}
      <Strip icon="info">What a member shares with their Family Head and what a doctor may read are separate permissions. This workspace shows only records authorised for you and this member.</Strip>
    </>
  )
}

export function LabsTab({ memberId, labReports }: { memberId: string; labReports: MemberWorkspaceDto['labReports'] }) {
  const [originalReport, setOriginalReport] = useState<NonNullable<MemberWorkspaceDto['labReports']>[number] | null>(null)
  useEffect(() => { setOriginalReport(null) }, [memberId])
  if (!labReports) return <Restricted what="Lab reports" />
  return (
    <>
      <div className="dfam-section-head">
        <div><h2>Lab results</h2><p>Uploaded reports with the values the member confirmed.</p></div>
      </div>
      {labReports.length === 0 ? <Empty title="No lab reports" message="No reports uploaded yet." /> : (
        <div className="dfam-stack">
          {labReports.map((report) => (
            <article className="dfam-report" key={report.id}>
              <div className="dfam-report__head">
                <div className="dfam-person">
                  <span className="dfam-icon-tile"><Icon name="file" size={19} /></span>
                  <div>
                    <strong>{report.fileName}</strong>
                    <p className="dfam-note">{report.collectedAt ? `Collected ${formatDateTime(report.collectedAt)}` : 'Collection date not recorded'}</p>
                  </div>
                </div>
                {report.values.length > 0 && <Pill tone="ok">Member-confirmed values</Pill>}
              </div>
              {report.values.length === 0 ? <p className="dfam-note dfam-report__foot">No values confirmed by the member yet.</p> : (
                <table className="dfam-table">
                  <thead><tr><th>Analyte</th><th>Confirmed value</th><th>Printed reference range</th><th>Range status</th></tr></thead>
                  <tbody>
                    {report.values.map((value, index) => (
                      <tr key={index}>
                        <td><b>{value.analyte}</b></td>
                        <td data-label="Confirmed value">{value.value} {value.unit}</td>
                        <td data-label="Printed range">{referenceRange(value)}</td>
                        <td data-label="Range status"><Pill tone={rangeTone[value.rangeStatus]} dot>{rangeLabel[value.rangeStatus]}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {report.hasOriginalFile === true && <button type="button" className="button button--secondary button--sm" onClick={() => setOriginalReport(report)}>View original report</button>}
            </article>
          ))}
        </div>
      )}
      {originalReport && <OriginalReportDialog reportId={originalReport.id} originalFileName={originalReport.fileName} fileUrl={`/doctors/me/members/${memberId}/lab-reports/${originalReport.id}/file`} onClose={() => setOriginalReport(null)} />}
      <Strip>Range status is calculated from the printed reference interval. It is not a diagnosis; clinical interpretation remains with you.</Strip>
    </>
  )
}

function TrendChart({ series }: { series: VitalSeries }) {
  const points = [...series.readings].reverse()
  const values = points.map((point) => point.value)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const pad = high === low ? Math.max(1, Math.abs(high) * 0.05) : (high - low) * 0.15
  const min = low - pad
  const max = high + pad
  const x = (index: number) => 56 + index * (600 / (points.length - 1))
  const y = (value: number) => 180 - ((value - min) / (max - min)) * 150
  const digits = max - min < 10 ? 1 : 0
  const labelEvery = Math.ceil(points.length / 6)
  const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  const latest = series.readings[0]!

  return (
    <svg viewBox="0 0 690 220" role="img"
      aria-label={`${series.label}: ${points.length} readings from ${day(points[0]!.measuredAt)} to ${day(latest.measuredAt)}. Latest ${latest.value} ${series.unit}. Each reading is listed below.`}>
      {[0, 1, 2, 3].map((step) => {
        const value = max - (step * (max - min)) / 3
        return (
          <g key={step}>
            <line className="dfam-chart__grid" x1="52" x2="664" y1={y(value)} y2={y(value)} />
            <text x="4" y={y(value) + 4}>{value.toFixed(digits)}</text>
          </g>
        )
      })}
      <polyline className="dfam-chart__line" points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')} />
      {points.map((point, index) => (
        <g key={`${point.measuredAt}-${index}`}>
          <circle cx={x(index)} cy={y(point.value)} r="4.5"><title>{`${formatDateTime(point.measuredAt)}: ${point.value} ${series.unit}`}</title></circle>
          {(index % labelEvery === 0 || index === points.length - 1) && <text x={x(index)} y="206" textAnchor="middle">{day(point.measuredAt)}</text>}
        </g>
      ))}
    </svg>
  )
}

const READINGS_SHOWN = 6

export function VitalsTab({ vitals }: { vitals: MemberWorkspaceDto['vitals'] }) {
  const groups = useMemo(() => (vitals ? groupVitals(vitals) : []), [vitals])
  const [selected, setSelected] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  if (!vitals) return <Restricted what="Vitals" />
  const series = groups.find((group) => group.key === selected) ?? groups[0]

  return (
    <>
      <div className="dfam-section-head">
        <div><h2>Vitals &amp; trends</h2><p>Readings the member recorded, grouped by measurement and unit.</p></div>
        <Pill>Recorded readings</Pill>
      </div>
      {!series ? <Empty title="No vitals" message="No readings recorded yet." /> : (
        <>
          <div className="dfam-vital-picks" role="group" aria-label="Measurement">
            {groups.map((group) => (
              <button key={group.key} type="button" className="dfam-vital-pick" aria-pressed={group.key === series.key} onClick={() => { setSelected(group.key); setShowAll(false) }}>
                <small>{group.label}</small>
                <b>{group.readings[0]!.value} <span>{group.unit}</span></b>
                <small>Latest · {shortDate(group.readings[0]!.measuredAt)}</small>
              </button>
            ))}
          </div>
          <div className="dfam-chart">
            <div className="dfam-section-head">
              <h3>{series.label}{series.readings.length > 1 ? ' trend' : ''}</h3>
              <span className="dfam-note">{series.readings.length} reading{series.readings.length === 1 ? '' : 's'} · Unit: {series.unit}</span>
            </div>
            <p className="dfam-note">
              <Pill tone={statusTone[series.readings[0]!.rangeStatus ?? 'RangeUnavailable']} dot>{statusText[series.readings[0]!.rangeStatus ?? 'RangeUnavailable']}</Pill>{' '}
              Trend: {trendText[series.readings[0]!.trend ?? 'NotEnoughReadings']} ·{' '}
              {series.readings[0]!.referenceLow != null && series.readings[0]!.referenceHigh != null
                ? `Reference ${series.readings[0]!.referenceLow} – ${series.readings[0]!.referenceHigh} ${series.unit}${series.readings[0]!.rangeSource ? ` · ${series.readings[0]!.rangeSource}` : ''}`
                : 'No reference interval for this measurement or age.'}
            </p>
            {series.readings.length > 1 && <p className="dfam-note">{changeSummary(series)}</p>}
            {series.readings.length > 1 ? <TrendChart series={series} /> : <p className="dfam-note">One reading recorded. A trend needs at least two readings of the same measurement and unit.</p>}
            <ul className="dfam-readings" aria-label={`${series.label} readings`}>
              {(showAll ? series.readings : series.readings.slice(0, READINGS_SHOWN)).map((reading, index) => (
                <li key={`${reading.measuredAt}-${index}`}><span>{formatDateTime(reading.measuredAt)}</span><b>{reading.value} {reading.unit}</b></li>
              ))}
            </ul>
            {series.readings.length > READINGS_SHOWN && (
              <button type="button" className="dfam-link" onClick={() => setShowAll((value) => !value)}>
                {showAll ? 'Show fewer readings' : `Show all ${series.readings.length} readings`}
              </button>
            )}
          </div>
          <Strip icon="info">Range and trend labels come from cited reference tables, not AI, and are not a diagnosis. A systolic value on its own is not a complete blood-pressure reading.</Strip>
        </>
      )}
    </>
  )
}
