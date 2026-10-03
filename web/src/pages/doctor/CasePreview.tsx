// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Selected-case preview for the Triage Cases queue. Complaint details are read from the
// grant-checked review endpoint only for cases this doctor already holds; pool cases show
// limited metadata until the backend authorizes more.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiClient, type CaseReviewDto } from '../../services/apiClient'
import {
  actionFor,
  caseReference,
  formatSubmitted,
  priorityTone,
  statusLabel,
  statusTone,
  workflowSteps,
  type QueueCase,
} from './triageQueue'

type Episode = NonNullable<CaseReviewDto['submittedEpisode']>
type ComplaintState =
  | { kind: 'locked' }
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'ready'; episode: Episode | null }

type CasePreviewProps = {
  item: QueueCase | null
  open: boolean
  busy: boolean
  onClose: () => void
  onClaim: (item: QueueCase) => void
}

export function CasePreview({ item, open, busy, onClose, onClaim }: CasePreviewProps) {
  const [complaint, setComplaint] = useState<ComplaintState>({ kind: 'locked' })
  const caseId = item?.id
  const authorized = item?.mine ?? false

  useEffect(() => {
    if (!caseId || !authorized) {
      setComplaint({ kind: 'locked' })
      return
    }
    let active = true
    setComplaint({ kind: 'loading' })
    apiClient
      .get<CaseReviewDto>(`/triage-cases/${caseId}/review`)
      .then(({ data }) => {
        if (active) setComplaint({ kind: 'ready', episode: data.submittedEpisode ?? null })
      })
      .catch(() => {
        if (active) setComplaint({ kind: 'unavailable' })
      })
    return () => {
      active = false
    }
  }, [caseId, authorized])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!item) {
    return (
      <aside className="care-panel triage-preview" aria-label="Selected case preview">
        <h2>Selected case</h2>
        <p className="care-caption">Choose a case from the list to see its details and the next step.</p>
      </aside>
    )
  }

  const action = actionFor(item)
  const emergency = item.status === 'Escalated'

  return (
    <aside
      className={`care-panel triage-preview${open ? ' triage-preview--open' : ''}`}
      aria-label="Selected case preview"
    >
      <div className="triage-preview__scroll">
        <header className="triage-preview__head">
          <div>
            <p className="care-eyebrow">Selected case</p>
            <h2>Case {caseReference(item.id)}</h2>
            <p className="care-caption">Submitted {formatSubmitted(item.createdAt)}</p>
          </div>
          <button type="button" className="button button--secondary triage-preview__close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="triage-tags">
          <span className={`status-badge status-badge--${priorityTone(item.priority)}`}>{item.priority} priority</span>
          <span className={`status-badge status-badge--${statusTone(item)}`}>{statusLabel(item)}</span>
        </div>

        {emergency ? (
          <div className="triage-alert" role="note">
            <span aria-hidden="true">⚠</span>
            <p>
              <strong>{item.priority === 'Emergency' ? 'Emergency referral.' : 'Escalated for urgent care.'}</strong>{' '}
              {item.priority === 'Emergency'
                ? 'The deterministic safety screen directed this patient to emergency care. No AI guidance was generated.'
                : 'A doctor escalated this case to in-person urgent care.'}
            </p>
          </div>
        ) : null}
        {item.status === 'FailedSafe' ? (
          <div className="care-note care-note--warning">
            <p>Processing stopped safely before any guidance was produced. This is not, by itself, an emergency referral.</p>
          </div>
        ) : null}

        <section aria-label="Patient context">
          <h3>Patient context</h3>
          <p className="care-caption">
            {item.mine
              ? 'Patient request. Identity is limited to what your case grant allows.'
              : 'Patient request in the shared review pool. Identity is not shown before authorized access.'}
          </p>
        </section>

        <section aria-label="Complaint">
          <h3>Complaint</h3>
          {complaint.kind === 'loading' ? (
            <p className="care-caption" role="status">Loading submitted details…</p>
          ) : complaint.kind === 'ready' && complaint.episode ? (
            <dl className="triage-facts">
              <div>
                <dt>Symptoms</dt>
                <dd>{complaint.episode.symptoms.length > 0 ? complaint.episode.symptoms.join(', ') : 'None recorded'}</dd>
              </div>
              <div>
                <dt>Reported duration</dt>
                <dd>
                  {complaint.episode.durationDays} {complaint.episode.durationDays === 1 ? 'day' : 'days'}
                </dd>
              </div>
              <div>
                <dt>Reported severity</dt>
                <dd>{complaint.episode.severity} / 10</dd>
              </div>
              {complaint.episode.notes ? (
                <div>
                  <dt>Patient notes</dt>
                  <dd>{complaint.episode.notes}</dd>
                </div>
              ) : null}
            </dl>
          ) : complaint.kind === 'ready' ? (
            <p className="care-caption">No symptom details were submitted with this request.</p>
          ) : (
            <p className="care-caption">Details available after authorized access.</p>
          )}
        </section>

        <section aria-label="Workflow status">
          <h3>Workflow status</h3>
          <ol className="triage-steps">
            {workflowSteps(item).map((step) => (
              <li key={step.label} className={`triage-step triage-step--${step.state}`}>
                <span aria-hidden="true" className="triage-step__dot" />
                <span>{step.label}</span>
                <span className="sr-only"> — {step.state}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="triage-preview__action">
        {action.kind === 'claim' || action.kind === 'acknowledge' ? (
          <>
            <button
              type="button"
              className={`button button--primary${action.kind === 'acknowledge' ? ' triage-button--emergency' : ''}`}
              disabled={busy}
              onClick={() => onClaim(item)}
            >
              {busy ? 'Working…' : action.label}
            </button>
            <p className="care-caption">
              {action.kind === 'claim'
                ? 'Claiming assigns the case to you. It does not approve anything.'
                : 'Records that you have seen this referral. It does not change the referral.'}
            </p>
          </>
        ) : action.kind === 'approval' || action.kind === 'evidence' ? (
          <>
            <Link className="button button--primary" to={`/approvals?case=${encodeURIComponent(item.id)}`}>
              {action.label}
            </Link>
            <p className="care-caption">The clinical decision is made on the Approval Desk.</p>
          </>
        ) : (
          <p className="care-caption">{action.message}</p>
        )}
      </footer>
    </aside>
  )
}
