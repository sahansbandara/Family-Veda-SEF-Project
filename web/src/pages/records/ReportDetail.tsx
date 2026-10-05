// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Extracted-value review for one lab report. Range status uses the printed reference range only (RULE 1, RULE 4).
import type { FormEvent } from 'react'
import { OriginalReportPreview } from '../../components/records/OriginalReportPreview'
import { ReportProgress } from '../../components/records/ReportProgress'
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
  showOriginal = true,
  saving = false,
}: {
  report: LabReportDetailDto
  hasOriginalFile: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void | boolean>
  showOriginal?: boolean
  saving?: boolean
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
      {showOriginal && <OriginalReportPreview reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={hasOriginalFile} />}
      <ReportProgress status={report.ocrStatus} confirmed={confirmed === report.values.length && confirmed > 0} />
      <p className="care-note">
        Extraction reads reported values. Compare each item with the original image before confirming it.
        Range status uses the printed reference range only.
      </p>
      <form className="care-form report-review-form" onSubmit={(event) => void onSubmit(event)}>
        <fieldset disabled={saving}>
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
            <p>{report.ocrStatus === 'Failed' ? 'This report could not be read. No extracted values are available to confirm.' : 'No values are available to check yet.'}</p>
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
                    <td data-label="Test name">
                      <input
                        aria-label={`Test name ${value.analyte}`}
                        name={`analyte-${value.id}`}
                        defaultValue={value.analyte}
                        required
                        maxLength={120}
                      />
                    </td>
                    <td data-label="Value">
                      <input
                        aria-label={`Value ${value.analyte}`}
                        name={`value-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.value}
                        required
                      />
                      {recordedRangeMarker(value)}
                    </td>
                    <td data-label="Unit">
                      <input aria-label={`Unit ${value.analyte}`} name={`unit-${value.id}`} defaultValue={value.unit} required maxLength={32} />
                    </td>
                    <td data-label="Reference low">
                      <input
                        aria-label={`Reference low ${value.analyte}`}
                        name={`low-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.referenceLow ?? ''}
                      />
                    </td>
                    <td data-label="Reference high">
                      <input
                        aria-label={`Reference high ${value.analyte}`}
                        name={`high-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.referenceHigh ?? ''}
                      />
                    </td>
                    <td data-label="State">
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
          <div className="report-review-form__footer"><span>{confirmed} of {report.values.length} values confirmed</span><button className="button button--primary" type="submit" disabled={saving}>
            {saving ? 'Saving values…' : 'Confirm values'}
          </button></div>
        )}
        </fieldset>
      </form>
    </>
  )
}
