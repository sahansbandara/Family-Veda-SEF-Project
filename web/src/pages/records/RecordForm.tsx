// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Full add/edit form for a manual health record. Extracted from RecordsPage so each file stays small.
import { type FormEvent, useState } from 'react'
import type { DoctorSummaryDto, HealthRecordDto } from '../../services/apiClient'
import { RECORD_SEVERITIES, RECORD_STATUSES, RECORD_TYPES, parseRecordSummary, todayLocalDate } from './recordSummaryMeta'

type Props = {
  editingRecord: HealthRecordDto | null
  assignedDoctor?: DoctorSummaryDto | null
  availableDoctors?: DoctorSummaryDto[]
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onCloseForm: () => void
}

/** Keeps a value saved by an older form version selectable instead of silently dropping it on edit. */
function withSavedValue(options: readonly string[], saved: string): string[] {
  return saved && !options.includes(saved) ? [...options, saved] : [...options]
}

export function RecordForm(props: Props) {
  const [attachmentName, setAttachmentName] = useState('')
  const parsedMeta = parseRecordSummary(props.editingRecord?.summary)
  const otherDoctors = (props.availableDoctors ?? []).filter(
    (doc) => doc.id !== props.assignedDoctor?.id,
  )
  const knownDoctorNames = new Set<string>()
  if (props.assignedDoctor?.displayName) knownDoctorNames.add(props.assignedDoctor.displayName)
  for (const doc of otherDoctors) {
    if (doc.displayName) knownDoctorNames.add(doc.displayName)
  }

  return (
    <form
      className="care-form hr-record-form"
      key={props.editingRecord?.id ?? 'new-record'}
      onSubmit={(event) => void props.onSave(event)}
    >
      <h3>{props.editingRecord ? `Edit ${props.editingRecord.title}` : 'Add health record'}</h3>

      <div className="care-field-grid">
        <label className="field">
          <span className="field-label-required">Type</span>
          <select name="recordType" defaultValue={props.editingRecord?.recordType ?? 'Condition'}>
            {RECORD_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label-required">Title</span>
          <input
            name="title"
            defaultValue={props.editingRecord?.title ?? ''}
            placeholder="Asthma"
            required
            minLength={2}
            maxLength={160}
          />
        </label>
      </div>

      <div className="care-field-grid">
        <label className="field">
          <span className="field-label-required">Date</span>
          <input
            name="occurredOn"
            type="date"
            defaultValue={props.editingRecord?.occurredOn ?? todayLocalDate()}
            required
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={parsedMeta.status}>
            <option value="">Not specified</option>
            {withSavedValue(RECORD_STATUSES, parsedMeta.status).map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="care-field-grid">
        <label className="field">
          <span>Severity</span>
          <select name="severity" defaultValue={parsedMeta.severity}>
            <option value="">Not specified</option>
            {withSavedValue(RECORD_SEVERITIES, parsedMeta.severity).map((sev) => (
              <option key={sev}>{sev}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Doctor / Healthcare Provider</span>
          <select
            name="doctor"
            aria-label="Doctor / Healthcare Provider"
            defaultValue={parsedMeta.doctor}
          >
            <option value="">None / Not specified</option>
            {props.assignedDoctor && (
              <optgroup label="Assigned Doctor">
                <option value={props.assignedDoctor.displayName}>
                  {props.assignedDoctor.displayName}
                  {props.assignedDoctor.specialty ? ` (${props.assignedDoctor.specialty})` : ''}
                </option>
              </optgroup>
            )}
            {otherDoctors.length > 0 && (
              <optgroup label={props.assignedDoctor ? 'Other Available Doctors' : 'Available Doctors'}>
                {otherDoctors.map((doc) => (
                  <option key={doc.id} value={doc.displayName}>
                    {doc.displayName}
                    {doc.specialty ? ` (${doc.specialty})` : ''}
                  </option>
                ))}
              </optgroup>
            )}
            {parsedMeta.doctor && !knownDoctorNames.has(parsedMeta.doctor) && (
              <optgroup label="Preserved Provider">
                <option value={parsedMeta.doctor}>{parsedMeta.doctor}</option>
              </optgroup>
            )}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Summary</span>
        <textarea
          name="summary"
          defaultValue={parsedMeta.cleanSummary}
          placeholder="Patient has a history of asthma..."
          maxLength={2000}
          rows={3}
        />
      </label>

      <label className="field">
        <span>Attachment</span>
        <div className="care-attachment-box" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="file"
            name="attachment"
            id="record-attachment"
            accept=".pdf,image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              setAttachmentName(f ? f.name : '')
            }}
          />
          <label
            htmlFor="record-attachment"
            className="button button--secondary"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📎</span>
            <span>{attachmentName ? 'Change report' : 'Upload medical report'}</span>
          </label>
          {attachmentName && (
            <span className="care-caption" style={{ fontWeight: 500 }}>
              {attachmentName}
            </span>
          )}
        </div>
      </label>

      <div className="care-actions">
        <button type="submit" className="button button--primary">
          {props.editingRecord ? 'Update record' : 'Save record'}
        </button>
        <button type="button" className="button button--secondary" onClick={props.onCloseForm}>
          Cancel
        </button>
      </div>
    </form>
  )
}
