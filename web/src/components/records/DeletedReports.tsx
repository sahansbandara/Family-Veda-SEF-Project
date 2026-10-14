// S2 · "Recently deleted" for uploaded reports. A deleted report is hidden from every list, the
// doctor and the agents until it is restored here; permanent deletion is a second, separate step.
// Who may use this is enforced by the API; a profile the viewer cannot manage simply shows nothing.
import { useCallback, useEffect, useRef, useState } from 'react'
import { RecordDialog } from '../../pages/records/RecordDialog'
import { RecordIcon } from '../../pages/records/recordIcons'
import { apiClient, type DeletedLabReportDto } from '../../services/apiClient'

type Props = { memberId: string; ownerName: string; refreshKey: number; onRestored: () => void; onMessage: (text: string) => void }

export function DeletedReports({ memberId, ownerName, refreshKey, onRestored, onMessage }: Props) {
  const [reports, setReports] = useState<DeletedLabReportDto[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [toPurge, setToPurge] = useState<DeletedLabReportDto | null>(null)
  const sequence = useRef(0)
  const load = useCallback(async () => {
    const current = ++sequence.current
    try {
      const { data } = await apiClient.get<DeletedLabReportDto[]>(`/members/${memberId}/lab-reports/deleted`)
      if (current === sequence.current) setReports(data)
    } catch { if (current === sequence.current) setReports([]) }
  }, [memberId])
  useEffect(() => { const lifecycle = sequence; void load(); return () => { lifecycle.current++ } }, [load, refreshKey])

  async function restore(report: DeletedLabReportDto) {
    if (busy) return
    setBusy(report.id)
    try {
      await apiClient.post(`/lab-reports/${report.id}/restore`)
      onMessage(`${report.originalFileName} was restored to your reports.`)
      onRestored()
    } catch { onMessage('The report could not be restored. Retry.') }
    finally { setBusy(null); await load() }
  }
  async function purge(report: DeletedLabReportDto) {
    if (busy) return
    setBusy(report.id)
    try {
      await apiClient.delete(`/lab-reports/${report.id}/permanent`)
      onMessage(`${report.originalFileName} was permanently deleted.`)
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string; message?: string } } }).response?.data
      onMessage(detail?.detail ?? detail?.message ?? 'The report could not be permanently deleted. Retry.')
    }
    finally { setBusy(null); setToPurge(null); await load() }
  }

  if (reports.length === 0) return null
  return <section className="hr-trash" aria-label="Recently deleted reports">
    <button type="button" className="hr-trash__toggle" aria-expanded={open} aria-controls="hr-trash-list" onClick={() => setOpen((value) => !value)}>
      <RecordIcon name="trash" /> <span>Recently deleted ({reports.length})</span> <RecordIcon name="chevron" className={open ? 'hr-trash__chevron is-open' : 'hr-trash__chevron'} />
    </button>
    {open && <div id="hr-trash-list">
      <p className="care-caption hr-trash__note">Deleted reports are hidden from your records, your doctor and symptom checks. Restore one to bring it back unchanged, or delete it permanently.</p>
      <ul className="hr-trash__list">
        {reports.map((report) => <li key={report.id} className="hr-trash__item" aria-label={`Deleted report ${report.originalFileName}`}>
          <span className="hr-file__name"><b>{report.originalFileName}</b><small>{ownerName} · Deleted {new Date(report.deletedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</small>
            {!report.canDeletePermanently && <small className="hr-trash__held">Kept: confirmed values may have been used in a symptom case.</small>}</span>
          <div className="hr-actions">
            <button type="button" className="button button--secondary button--sm hr-action" disabled={busy !== null} onClick={() => void restore(report)} aria-label={`Restore ${report.originalFileName}`}>Restore</button>
            <button type="button" className="button button--danger button--sm hr-action" disabled={busy !== null || !report.canDeletePermanently} onClick={() => setToPurge(report)} aria-label={`Delete ${report.originalFileName} permanently`}><RecordIcon name="trash" /> Delete permanently</button>
          </div>
        </li>)}
      </ul>
    </div>}
    {toPurge && <RecordDialog eyebrow="This cannot be undone" title="Delete this report permanently?" onClose={() => { if (!busy) setToPurge(null) }}>
      <p className="hr-confirm__text"><b>{toPurge.originalFileName}</b>, its file and the values read from it will be removed for good.</p>
      <div className="hr-confirm__actions">
        <button type="button" className="button button--secondary" disabled={busy !== null} onClick={() => setToPurge(null)}>Keep in Recently deleted</button>
        <button type="button" className="button button--danger" disabled={busy !== null} onClick={() => void purge(toPurge)}>{busy ? 'Deleting…' : 'Delete permanently'}</button>
      </div>
    </RecordDialog>}
  </section>
}
