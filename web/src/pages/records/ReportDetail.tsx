// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Extracted-value review for one lab report. Range status uses the printed reference range only (RULE 1, RULE 4).
import type { FormEvent } from 'react'
import { OriginalReportPreview } from '../../components/records/OriginalReportPreview'
import { RecordedRangeVisual } from '../../components/records/RecordedRangeVisual'
import { StatusBadge } from '../../components/shared/StatusBadge'
import type { LabReportDetailDto, LabValueDto } from '../../services/apiClient'

function recordedRangeMarker(value: LabValueDto) {
  const below = value.rangeStatus
    ? value.rangeStatus === 'BelowRange'
    : value.referenceLow != null && value.value < value.referenceLow
  const above = value.rangeStatus
    ? value.rangeStatus === 'AboveRange'
    : value.referenceHigh != null && value.value > value.referenceHigh
  if (value.rangeStatus === 'RangeUnavailable')
    return <span className="status-badge">Reference range unavailable</span>
  if (!below && !above) return null
  return (
    <span className="status-badge status-badge--warning" title="Outside recorded reference range">
      {below ? '▼' : '▲'} Outside recorded range
    </span>
  )
}

export function ReportDetail({
  report,
  hasOriginalFile,
  onSubmit,
}: {
  report: LabReportDetailDto
  hasOriginalFile: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const confirmed = report.values.filter((value) => value.wasManuallyConfirmed).length
  return (
    <>
      <div className="care-panel-heading">
        <div>
          <p className="care-eyebrow">Report detail</p>
          <h2>{report.originalFileName}</h2>
          <p className="care-caption">
            {report.collectedAt
              ? new Date(report.collectedAt).toLocaleDateString()
              : 'Collected date not recorded'}
          </p>
        </div>
        <StatusBadge status={report.ocrStatus} />
      </div>
      <OriginalReportPreview reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={hasOriginalFile} />
      <ol className="care-steps">
        <li className="care-step--complete">Uploaded</li>
        <li className={report.ocrStatus === 'Completed' ? 'care-step--complete' : ''}>Extracted</li>
        <li
          className={
            confirmed === report.values.length && report.values.length > 0 ? 'care-step--complete' : ''
          }
        >
          Values confirmed
        </li>
      </ol>
      <p className="care-note">
        Extraction reads reported values. Compare each item with the original image before confirming it.
        Range status uses the printed reference range only.
      </p>
      <form className="care-form" onSubmit={(event) => void onSubmit(event)}>
        {report.values.some((value) => value.wasManuallyConfirmed) && (
          <section className="care-range-overview" aria-label="Confirmed report values">
            <div className="care-range-grid">
              {report.values.map((value) => (
                <RecordedRangeVisual key={value.id} value={value} />
              ))}
            </div>
            <p className="care-caption">
              Reference intervals alone do not determine your health. These are recorded values, not a
              diagnosis.
            </p>
          </section>
        )}
        {report.values.length === 0 ? (
          <div className="care-empty">
            <p>No values are available to check yet.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Analyte</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Low</th>
                  <th>High</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {report.values.map((value) => (
                  <tr key={value.id}>
                    <td>
                      <input
                        name={`analyte-${value.id}`}
                        defaultValue={value.analyte}
                        required
                        maxLength={120}
                      />
                    </td>
                    <td>
                      <input
                        name={`value-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.value}
                        required
                      />
                      {recordedRangeMarker(value)}
                    </td>
                    <td>
                      <input name={`unit-${value.id}`} defaultValue={value.unit} required maxLength={32} />
                    </td>
                    <td>
                      <input
                        name={`low-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.referenceLow ?? ''}
                      />
                    </td>
                    <td>
                      <input
                        name={`high-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.referenceHigh ?? ''}
                      />
                    </td>
                    <td>
                      <StatusBadge status={value.wasManuallyConfirmed ? 'CONFIRMED' : 'REVIEW_REQUIRED'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h3>Potential hereditary screening flags</h3>
        {report.flags.length === 0 ? (
          <p className="care-muted">No flags were extracted.</p>
        ) : (
          report.flags.map((flag) => (
            <label key={flag.id} className="field">
              <span>
                <input name={`flag-${flag.id}`} type="checkbox" defaultChecked={flag.manuallyConfirmed} />{' '}
                Confirm {flag.conditionCode}: {flag.finding}
              </span>
              <span className={`status-badge status-badge--${flag.confidence < 0.6 ? 'warning' : 'muted'}`}>
                Extraction confidence {Math.round(flag.confidence * 100)}%
              </span>
            </label>
          ))
        )}
        {report.values.length > 0 && (
          <button className="button button--primary" type="submit">
            Confirm values
          </button>
        )}
      </form>
    </>
  )
}
