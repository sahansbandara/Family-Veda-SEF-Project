// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Manual health records: quick add, searchable table, per-record visibility. Sharing is enforced by the API;
// the badges here only describe it.
import { type FormEvent, useState } from 'react'
import { EmptyState } from '../../components/shared/ViewState'
import type { DoctorSummaryDto, HealthRecordDto } from '../../services/apiClient'
import { RecordDialog } from './RecordDialog'
import { RecordForm } from './RecordForm'
import { RecordIcon } from './recordIcons'
import { RecordSummaryText } from './RecordSummaryText'
import { RECORD_TYPES, recordTypeIcon, todayLocalDate } from './recordSummaryMeta'

export type QuickRecord = { recordType: string; title: string; occurredOn: string }

type Props = {
  records: HealthRecordDto[]
  totalCount: number
  pageSize: number
  totalPages: number
  page: number
  isSharedView: boolean
  isOwnProfile: boolean
  showForm: boolean
  editingRecord: HealthRecordDto | null
  assignedDoctor?: DoctorSummaryDto | null
  availableDoctors?: DoctorSummaryDto[]
  search: string
  filter: string
  sort: 'date-desc' | 'date-asc'
  onCloseForm: () => void
  onEdit: (record: HealthRecordDto) => void
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>
  /** Resolves true when the record was saved, so the quick-add row can be cleared. */
  onQuickAdd: (record: QuickRecord) => Promise<boolean>
  onDelete: (id: string) => Promise<void>
  onToggleSharing: (record: HealthRecordDto) => Promise<void>
  onSearch: (value: string) => void
  onFilter: (value: string) => void
  onSort: (value: 'date-desc' | 'date-asc') => void
  onPage: (page: number) => void
}

function VisibilityBadge({ record, isOwnProfile, isSharedView }: { record: HealthRecordDto; isOwnProfile: boolean; isSharedView: boolean }) {
  if (isSharedView) return <span className="hr-badge hr-badge--blue"><RecordIcon name="users" /> Shared with you</span>
  if (!isOwnProfile) return <span className="hr-badge hr-badge--blue"><RecordIcon name="users" /> Managed by Family Head</span>
  return record.sharedWithFamilyHead
    ? <span className="hr-badge hr-badge--blue"><RecordIcon name="users" /> Shared with Family Head</span>
    : <span className="hr-badge hr-badge--rose"><RecordIcon name="lock" /> Private</span>
}

export function ManualRecordsPanel(props: Props) {
  const [visibility, setVisibility] = useState('all')
  const [viewing, setViewing] = useState<HealthRecordDto | null>(null)
  const [adding, setAdding] = useState(false)
  const canEdit = !props.isSharedView
  const visible = props.records.filter(
    (record) => visibility === 'all' || (visibility === 'shared') === (record.sharedWithFamilyHead === true),
  )
  const first = props.totalCount === 0 ? 0 : (props.page - 1) * props.pageSize + 1
  const last = Math.min(props.totalCount, (props.page - 1) * props.pageSize + props.records.length)

  async function quickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (adding) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setAdding(true)
    try {
      const saved = await props.onQuickAdd({
        recordType: String(form.get('recordType') ?? 'Condition'),
        title: String(form.get('title') ?? '').trim(),
        occurredOn: String(form.get('occurredOn') ?? ''),
      })
      if (saved) formElement.reset()
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="hr-stack">
      {canEdit && !props.showForm && (
        <form className="care-panel hr-quick-record" aria-label="Add a manual record" onSubmit={(event) => void quickAdd(event)}>
          <span className="hr-section__icon hr-section__icon--lg"><RecordIcon name="file" /></span>
          <div className="hr-quick-record__copy">
            <h2>Add a manual record</h2>
            <p className="care-muted">Quickly add a health condition, surgery, allergy or note.</p>
          </div>
          <label className="hr-select">
            <span className="sr-only">Quick record type</span>
            <select name="recordType" defaultValue="Condition">
              {RECORD_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="hr-input">
            <span className="sr-only">Quick record title</span>
            <input name="title" placeholder="Enter title (e.g. Asthma)" required minLength={2} maxLength={160} />
          </label>
          <label className="hr-input">
            <span className="sr-only">Quick record date</span>
            <input name="occurredOn" type="date" defaultValue={todayLocalDate()} max={todayLocalDate()} required />
          </label>
          <button type="submit" className="button button--primary" disabled={adding}>
            {adding ? 'Adding…' : 'Add record'}
          </button>
        </form>
      )}

      {props.showForm && canEdit && (
        <section className="care-panel">
          <RecordForm
            key={props.editingRecord?.id ?? 'new-record'}
            editingRecord={props.editingRecord}
            assignedDoctor={props.assignedDoctor}
            availableDoctors={props.availableDoctors}
            onSave={props.onSave}
            onCloseForm={props.onCloseForm}
          />
        </section>
      )}

      <section className="care-panel hr-section" aria-labelledby="manual-records-title">
        <header className="hr-section__head hr-section__head--tools">
          <div>
            <h2 id="manual-records-title">Manual health records ({props.totalCount})</h2>
            <p className="care-muted">Manage non-lab health information, notes, and history.</p>
          </div>
          <div className="hr-toolbar">
            <label className="hr-search hr-field">
              <span>Search records</span>
              <span className="hr-search__box">
                <RecordIcon name="search" />
                <input
                  type="search"
                  value={props.search}
                  onChange={(event) => props.onSearch(event.target.value)}
                  placeholder="Search by title or summary…"
                />
              </span>
            </label>
            <label className="hr-select hr-field">
              <span>Type</span>
              <select value={props.filter} onChange={(event) => props.onFilter(event.target.value)}>
                <option value="ALL">All types</option>
                {RECORD_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            {props.isOwnProfile && (
              <label className="hr-select hr-field">
                <span>Visibility</span>
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                  <option value="all">All visibility</option>
                  <option value="private">Private</option>
                  <option value="shared">Shared with Family Head</option>
                </select>
              </label>
            )}
            <label className="hr-select hr-field">
              <span>Sort by</span>
              <select value={props.sort} onChange={(event) => props.onSort(event.target.value as 'date-desc' | 'date-asc')}>
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
              </select>
            </label>
          </div>
        </header>

        {visible.length === 0 ? (
          <div className="care-empty">
            <EmptyState title="No matching records" message="Add a record or change the search and filters." />
          </div>
        ) : (
          <div className="hr-table-wrap">
            <table className="hr-table hr-table--stack">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Summary</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((record) => (
                  <tr key={record.id}>
                    <td data-label="Title">
                      <span className="hr-type-cell">
                        <span className={`hr-record-icon hr-record-icon--${record.recordType.toLowerCase()}`}>
                          <RecordIcon name={recordTypeIcon(record.recordType)} />
                        </span>
                        <strong className="record-title">{record.title}</strong>
                      </span>
                    </td>
                    <td data-label="Type">
                      <span className={`hr-badge hr-type--${record.recordType.toLowerCase()}`}>{record.recordType}</span>
                    </td>
                    <td data-label="Date">
                      <span className="hr-date"><RecordIcon name="calendar" /> {record.occurredOn}</span>
                    </td>
                    <td data-label="Summary" className="hr-summary">
                      <RecordSummaryText summary={record.summary} emptyLabel="No summary recorded" />
                    </td>
                    <td data-label="Visibility">
                      <VisibilityBadge record={record} isOwnProfile={props.isOwnProfile} isSharedView={props.isSharedView} />
                    </td>
                    <td data-label="Actions">
                      <div className="hr-actions">
                        <button type="button" className="button button--secondary button--sm hr-action" onClick={() => setViewing(record)}>
                          <RecordIcon name="eye" /> View
                        </button>
                        {canEdit && (
                          <button type="button" className="button button--secondary button--sm hr-action" onClick={() => props.onEdit(record)}>
                            <RecordIcon name="edit" /> Edit
                          </button>
                        )}
                        {props.isOwnProfile && (
                          <button
                            type="button"
                            className="button button--secondary button--sm hr-action"
                            aria-pressed={record.sharedWithFamilyHead === true}
                            title={record.sharedWithFamilyHead ? 'Shared with the Family Head' : 'Private from the Family Head'}
                            onClick={() => void props.onToggleSharing(record)}
                          >
                            <RecordIcon name={record.sharedWithFamilyHead ? 'lock' : 'users'} />
                            {record.sharedWithFamilyHead ? 'Make private' : 'Share'}
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            className="button button--danger-subtle button--sm hr-action hr-action--danger"
                            onClick={() => void props.onDelete(record.id)}
                          >
                            <RecordIcon name="trash" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="hr-pager">
          <span className="care-caption">Showing {first} to {last} of {props.totalCount} records</span>
          {props.totalPages > 1 && (
            <div className="hr-pager__buttons">
              <button type="button" className="button button--secondary button--sm" disabled={props.page === 1} onClick={() => props.onPage(props.page - 1)}>
                Previous
              </button>
              <span className="hr-pager__page" aria-current="page">Page {props.page} of {props.totalPages}</span>
              <button type="button" className="button button--secondary button--sm" disabled={props.page === props.totalPages} onClick={() => props.onPage(props.page + 1)}>
                Next
              </button>
            </div>
          )}
        </footer>
      </section>

      {viewing && (
        <RecordDialog eyebrow={`${viewing.recordType} · ${viewing.occurredOn}`} title={viewing.title} onClose={() => setViewing(null)}>
          <div className="hr-record-view">
            <RecordSummaryText summary={viewing.summary} emptyLabel="No summary recorded" />
            <p><VisibilityBadge record={viewing} isOwnProfile={props.isOwnProfile} isSharedView={props.isSharedView} /></p>
            <p className="care-caption">Family visibility and a doctor's access are separate. A doctor needs consent and an active access grant.</p>
          </div>
        </RecordDialog>
      )}
    </div>
  )
}
