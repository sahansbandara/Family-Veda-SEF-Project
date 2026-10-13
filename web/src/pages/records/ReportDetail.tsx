// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Extracted-value review for one lab report. Range status uses the printed reference range only (RULE 1, RULE 4).
import { type FormEvent, useEffect, useState, useRef, useId } from 'react'
import { ViewerIcon } from '../../components/records/ViewerIcon'
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
  onDirty,
}: {
  report: LabReportDetailDto
  hasOriginalFile: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void | boolean>
  showOriginal?: boolean
  saving?: boolean
  onDirty?: () => void
}) {
  const [rows, setRows] = useState<LabValueDto[]>(report.values)
  const [pendingRemoval, setPendingRemoval] = useState<LabValueDto | null>(null)
  const removalDialog = useRef<HTMLDialogElement>(null)
  const removalCancel = useRef<HTMLButtonElement>(null)
  const removalTrigger = useRef<HTMLButtonElement | null>(null)
  const reviewForm = useRef<HTMLFormElement>(null)
  const removalTitle = useId()
  useEffect(() => {
    if (!pendingRemoval) return
    const dialog = removalDialog.current
    const trigger = removalTrigger.current
    const fallback = reviewForm.current
    if (dialog?.showModal) dialog.showModal()
    else dialog?.setAttribute('open', '')
    removalCancel.current?.focus()
    return () => {
      if (dialog?.open) { if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open') }
      if (trigger?.isConnected) trigger.focus()
      else fallback?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    }
  }, [pendingRemoval])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  useEffect(() => { setRows(report.values); setDeletedIds([]) }, [report.id, report.values])
  const visibleRows = rows.filter((value) => !deletedIds.includes(value.id))
  const confirmed = visibleRows.filter((value) => value.wasManuallyConfirmed).length
  const reading = report.ocrStatus === 'Pending' || report.ocrStatus === 'Processing'
  function addValue() {
    setRows((values) => [...values, { id: `new-${crypto.randomUUID()}`, analyte: '', value: Number.NaN, unit: '', wasManuallyConfirmed: false }])
    onDirty?.()
  }
  function removeValue(value: LabValueDto) {
    setDeletedIds((ids) => [...ids, value.id])
    onDirty?.()
  }
  function editValue(id: string, field: keyof LabValueDto, value: string | number | null) {
    setRows((values) => values.map((row) => row.id === id ? { ...row, [field]: value, wasManuallyConfirmed: false } : row))
    onDirty?.()
  }
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
      <form ref={reviewForm} className="care-form report-review-form" onSubmit={(event) => void onSubmit(event)}>
        <fieldset disabled={saving || reading}>
        {deletedIds.filter((id) => !id.startsWith('new-')).map((id) => <input key={id} type="hidden" name="deletedValueIds" value={id} />)}
        <div className="report-review-form__actions"><button type="button" className="button button--secondary" onClick={addValue} disabled={rows.length >= 200}><ViewerIcon name="plus" /> Add value</button>{deletedIds.length > 0 && <button type="button" className="button button--secondary" onClick={() => { setDeletedIds([]); onDirty?.() }}>Undo removals ({deletedIds.length})</button>}</div>
        <p className="care-caption">Add any field missed during extraction. Removals are saved only when you confirm values.</p>
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
        {visibleRows.length === 0 ? (
          <div className="care-empty">
            <p>{report.ocrStatus === 'Failed' ? 'No extracted values are available to confirm.' : 'No values are available to check yet.'}</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((value) => (
                  <tr key={value.id}>
                    <td data-label="Test name">
                      <input type="hidden" name="valueIds" value={value.id} />
                      <input
                        aria-label={`Test name ${value.analyte}`}
                        name={`analyte-${value.id}`}
                        value={value.analyte} onChange={(event) => editValue(value.id, 'analyte', event.target.value)}
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
                        value={Number.isNaN(value.value) ? '' : value.value} onChange={(event) => editValue(value.id, 'value', event.target.value === '' ? Number.NaN : Number(event.target.value))}
                        required
                      />
                      {recordedRangeMarker(value)}
                    </td>
                    <td data-label="Unit">
                      <input aria-label={`Unit ${value.analyte}`} name={`unit-${value.id}`} value={value.unit} onChange={(event) => editValue(value.id, 'unit', event.target.value)} required maxLength={32} />
                    </td>
                    <td data-label="Reference low">
                      <input
                        aria-label={`Reference low ${value.analyte}`}
                        name={`low-${value.id}`}
                        type="number"
                        step="any"
                        value={value.referenceLow ?? ''} onChange={(event) => editValue(value.id, 'referenceLow', event.target.value === '' ? null : Number(event.target.value))}
                      />
                    </td>
                    <td data-label="Reference high">
                      <input
                        aria-label={`Reference high ${value.analyte}`}
                        name={`high-${value.id}`}
                        type="number"
                        step="any"
                        value={value.referenceHigh ?? ''} onChange={(event) => editValue(value.id, 'referenceHigh', event.target.value === '' ? null : Number(event.target.value))}
                      />
                    </td>
                    <td data-label="State">
                      <StatusBadge status={value.wasManuallyConfirmed ? 'CONFIRMED' : 'REVIEW_REQUIRED'} />
                    </td>
                    <td data-label="Actions"><button type="button" className="button button--secondary report-review-form__delete" aria-label={`Delete value ${value.analyte || 'new field'}`} title="Delete value" onClick={(event) => { removalTrigger.current = event.currentTarget; setPendingRemoval(value) }}><ViewerIcon name="trash" /></button></td>
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
        {(rows.length > 0 || deletedIds.length > 0) && (
          <div className="report-review-form__footer"><span>{confirmed} of {visibleRows.length} values confirmed</span><button className="button button--primary" type="submit" disabled={saving}>
            {saving ? 'Saving values…' : 'Confirm values'}
          </button></div>
        )}
        </fieldset>
      </form>
      {pendingRemoval && <dialog ref={removalDialog} className="value-removal-dialog" role="alertdialog" aria-modal="true" aria-labelledby={removalTitle} aria-describedby={`${removalTitle}-description`} onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }} onCancel={(event) => { event.preventDefault(); event.stopPropagation(); setPendingRemoval(null) }} onClick={(event) => { if (event.target === event.currentTarget) { event.stopPropagation(); setPendingRemoval(null) } }}>
        <button type="button" className="button button--secondary value-removal-dialog__close" aria-label="Close removal confirmation" onClick={() => setPendingRemoval(null)}><ViewerIcon name="close" /></button>
        <h2 id={removalTitle}>Delete this value?</h2>
        <div className="value-removal-dialog__warning" id={`${removalTitle}-description`}><ViewerIcon name="warning" /><span>This value will be deleted from your report when you confirm values.</span></div>
        <div className="value-removal-dialog__value"><p className="care-caption">Report value</p><span>{pendingRemoval.analyte || 'Unnamed field'}</span>{Number.isFinite(pendingRemoval.value) && <small>{pendingRemoval.value} {pendingRemoval.unit}</small>}</div>
        <div className="value-removal-dialog__footer"><p className="care-caption">You can undo this removal before saving. Your original report is kept.</p><div className="value-removal-dialog__actions"><button ref={removalCancel} type="button" className="button button--secondary" onClick={() => setPendingRemoval(null)}>Cancel</button><button type="button" className="button value-removal-dialog__remove" onClick={() => { removeValue(pendingRemoval); setPendingRemoval(null) }}>Delete value</button></div></div>
      </dialog>}
    </>
  )
}
