// Owner: S4 · SLMC claim disputes — per-claimant evidence requests (admin side).
import { useState } from 'react'

import { apiClient, type ClaimDisputeClaimantDto, type EvidenceKind, type EvidenceRequestDto } from '../../services/apiClient'
import { EVIDENCE_KINDS, EVIDENCE_KIND_LABEL, formatRemaining, openEvidenceFile } from './claimDisputes'

type Props = { disputeId: string; claimant: ClaimDisputeClaimantDto; onChanged: () => void }

function RequestSummary({ request, onError }: { request: EvidenceRequestDto; onError: (message: string) => void }) {
  return (
    <li className="evidence-request">
      <div>
        <strong>{request.isChallenge ? 'Urgent challenge' : 'Evidence request'}</strong> · {request.status}
        {' · '}Requested: {request.requestedItems.map((kind) => EVIDENCE_KIND_LABEL[kind]).join(', ')}
      </div>
      <div className="muted">
        Due {new Date(request.dueAt).toLocaleString()}
        {request.status === 'Open' && <> ({formatRemaining(request.dueAt)} left)</>}
      </div>
      {request.note && <div className="muted">Note: {request.note}</div>}
      {request.files.length > 0 && (
        <ul className="evidence-request__files">
          {request.files.map((file) => (
            <li key={file.id}>
              {EVIDENCE_KIND_LABEL[file.kind]}: {file.fileName}{' '}
              <button type="button" className="link-button" onClick={() => void openEvidenceFile(file.id).catch(() => onError('The evidence file could not be opened.'))}>
                View
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function ClaimantEvidence({ disputeId, claimant, onChanged }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [items, setItems] = useState<EvidenceKind[]>([])
  const [note, setNote] = useState('')
  const [isChallenge, setIsChallenge] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (kind: EvidenceKind) =>
    setItems((current) => (current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind]))

  const submit = async () => {
    if (items.length === 0) return setError('Choose at least one item to request.')
    setBusy(true)
    setError('')
    try {
      await apiClient.post(`/admin/disputes/${disputeId}/evidence-requests`, { doctorId: claimant.doctorId, items, note: note.trim(), isChallenge })
      setFormOpen(false)
      setItems([])
      setNote('')
      setIsChallenge(false)
      onChanged()
    } catch {
      setError('The evidence request could not be sent. Refresh and try again.')
    } finally {
      setBusy(false)
    }
  }

  const name = claimant.displayName ?? 'Doctor applicant'
  return (
    <div className="claim-evidence">
      {claimant.evidenceRequests.length > 0 && (
        <ul className="evidence-requests" aria-label={`Evidence requests for ${name}`}>
          {claimant.evidenceRequests.map((request) => <RequestSummary key={request.id} request={request} onError={setError} />)}
        </ul>
      )}
      {!formOpen ? (
        <button type="button" className="fv-btn" onClick={() => setFormOpen(true)}>Request evidence</button>
      ) : (
        <fieldset className="evidence-form">
          <legend>Request evidence from {name}</legend>
          <div className="evidence-form__kinds">
            {EVIDENCE_KINDS.map((kind) => (
              <label key={kind}>
                <input type="checkbox" checked={items.includes(kind)} onChange={() => toggle(kind)} /> {EVIDENCE_KIND_LABEL[kind]}
              </label>
            ))}
          </div>
          <label>
            Note (optional)
            <textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label>
            <input type="checkbox" checked={isChallenge} onChange={(event) => setIsChallenge(event.target.checked)} /> Urgent 3-day challenge
          </label>
          <p className="muted">{isChallenge ? 'The doctor has 3 days before the account is suspended.' : 'The doctor has 30 days to respond.'}</p>
          <div className="claim-dispute__actions">
            <button type="button" className="fv-btn fv-btn--primary" disabled={busy} onClick={() => void submit()}>
              {busy ? 'Sending…' : 'Send request'}
            </button>
            <button type="button" className="fv-btn" disabled={busy} onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </fieldset>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}
