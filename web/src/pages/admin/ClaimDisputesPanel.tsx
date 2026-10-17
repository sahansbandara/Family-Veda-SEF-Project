// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// SLMC claim disputes: claimants side by side, admin picks the real holder with a written reason.
// The backend enforces Admin role, reason and winner validity; this panel only collects the decision.
import { useCallback, useEffect, useState } from 'react'

import { ErrorState } from '../../components/shared/ViewState'
import { apiClient, type ClaimDisputeDto } from '../../services/apiClient'
import { ClaimantEvidence } from './ClaimantEvidence'
import { RegisterMatchBadge } from './RegisterMatchBadge'
import { openLicenseDocument } from './claimDisputes'
import './claimDisputes.css'

type Props = { onResolved?: () => void }

function DisputeCard({ dispute, onResolved, onChanged }: { dispute: ClaimDisputeDto; onResolved: () => void; onChanged: () => void }) {
  const [winner, setWinner] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const resolve = async () => {
    if (!winner) return setError('Choose the claimant who holds this SLMC number.')
    if (!reason.trim()) return setError('A reason is required.')
    setBusy(true)
    setError('')
    try {
      await apiClient.post(`/admin/disputes/${dispute.id}/resolve`, { winnerDoctorId: winner, reason: reason.trim() })
      onResolved()
    } catch {
      setError('The dispute could not be resolved. Refresh and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="claim-dispute" aria-label={`Dispute for SLMC ending ${dispute.registrationNumberLastFour}`}>
      <div className="claim-dispute__head">
        <h3>SLMC ••••{dispute.registrationNumberLastFour} · {dispute.claimants.length} claimants</h3>
        <span className="muted">Register name: {dispute.registeredName ?? 'Not in register'}</span>
      </div>
      {dispute.duplicateLicenseFile && (
        <p className="claim-dispute__warning" role="alert">Duplicate licence file: the same licence document was uploaded by more than one claimant.</p>
      )}
      <div className="claim-dispute__claimants" role="radiogroup" aria-label="Claimants">
        {dispute.claimants.map((claimant) => (
          <div key={claimant.doctorId} className="claim-claimant-wrap">
          <label className={`claim-claimant${winner === claimant.doctorId ? ' claim-claimant--selected' : ''}`}>
            <span>
              <input type="radio" name={`winner-${dispute.id}`} value={claimant.doctorId}
                checked={winner === claimant.doctorId} onChange={() => setWinner(claimant.doctorId)} />
              <strong>{claimant.displayName ?? 'Doctor applicant'}</strong>
            </span>
            <RegisterMatchBadge match={claimant.registerMatch} />
            {claimant.ownershipConfirmed && <span className="ownership-badge">Ownership confirmed</span>}
            <dl>
              <dt>Email</dt><dd>{claimant.email ?? '—'}</dd>
              <dt>Status</dt><dd>{claimant.verificationStatus}</dd>
              <dt>Submitted</dt><dd>{new Date(claimant.submittedAt).toLocaleString()}</dd>
              <dt>Licence</dt>
              <dd>
                {claimant.hasLicenseDocument ? (
                  <button type="button" className="link-button" onClick={() => void openLicenseDocument(claimant.doctorId).catch(() => setError('The licence document could not be opened.'))}>
                    View licence
                  </button>
                ) : 'Not uploaded'}
              </dd>
            </dl>
          </label>
          <ClaimantEvidence disputeId={dispute.id} claimant={claimant} onChanged={onChanged} />
          </div>
        ))}
      </div>
      <div className="claim-dispute__resolve">
        <label htmlFor={`reason-${dispute.id}`}>Reason (required, audited)</label>
        <textarea id={`reason-${dispute.id}`} value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="muted">If you choose the claimant whose evidence convinces you, every other claimant is suspended immediately. The chosen claimant is verified; the others are deactivated and lose case access.</p>
        <div className="claim-dispute__actions">
          <button type="button" className="fv-btn fv-btn--primary" disabled={busy} onClick={() => void resolve()}>
            {busy ? 'Resolving…' : 'Resolve dispute'}
          </button>
        </div>
      </div>
    </article>
  )
}

export function ClaimDisputesPanel({ onResolved }: Props) {
  const [disputes, setDisputes] = useState<ClaimDisputeDto[] | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      setDisputes((await apiClient.get<ClaimDisputeDto[]>('/admin/disputes')).data)
    } catch {
      setFailed(true)
    }
  }, [])
  useEffect(() => { void load() }, [load])

  if (failed) return <ErrorState message="SLMC claim disputes could not be loaded." onRetry={() => void load()} />
  if (!disputes || disputes.length === 0) return null

  return (
    <section className="claim-disputes" aria-labelledby="claim-disputes-heading">
      <div>
        <h2 id="claim-disputes-heading">SLMC claim disputes</h2>
        <p className="muted">More than one account claims these registration numbers. Compare the claimants and decide who holds the number.</p>
      </div>
      {disputes.map((dispute) => (
        <DisputeCard key={dispute.id} dispute={dispute} onResolved={() => { void load(); onResolved?.() }} onChanged={() => void load()} />
      ))}
    </section>
  )
}
