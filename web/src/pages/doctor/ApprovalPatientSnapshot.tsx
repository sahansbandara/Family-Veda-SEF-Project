// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// The patient context a doctor reads first. Every field is a recorded fact released under the active
// case grant; age and sex arrive with the authorized workspace and are omitted when it is restricted.
import { AiBadge } from '../../components/shared/AiBadge'
import { StatusBadge } from '../../components/shared/StatusBadge'
import type { CaseReviewDto, MemberWorkspaceDto } from '../../services/apiClient'
import { caseInitials, queueDateTime, shortRef, statusLabel } from './approvalReview'

type Props = { review: CaseReviewDto; submittedAt?: string; failedChecks: number; workspace: MemberWorkspaceDto | null }

export function ApprovalPatientSnapshot({ review, submittedAt, failedChecks, workspace }: Props) {
  const episode = review.submittedEpisode?.memberId === review.memberId ? review.submittedEpisode : null
  const symptoms = episode?.symptoms.map((symptom) => statusLabel(symptom).replaceAll('_', ' ')).join(', ')
  const days = episode && Number.isInteger(episode.durationDays) && episode.durationDays >= 0 ? episode.durationDays : null
  const identity = [
    workspace?.ageYears != null ? `${workspace.ageYears} years` : null,
    workspace?.sexForClinicalReference ?? null,
    review.familyName ?? null,
    `Case ${shortRef(review)}`,
  ].filter(Boolean)
  const expires = workspace?.accessExpiresAt ? `Access until ${queueDateTime(workspace.accessExpiresAt)}` : null

  return (
    <article className="care-panel approval-case-head">
      <div className="approval-case-head__row">
        <div className="approval-case-head__person">
          <span className="approval-avatar approval-avatar--lg" aria-hidden="true">{caseInitials(review)}</span>
          <div>
            <h2 aria-label={`Review case ${review.id}`}>{review.memberDisplayName || `Case ${shortRef(review)}`}</h2>
            <p className="approval-snapshot__identity">{identity.join(' · ')}</p>
            <p className="care-caption">Submitted {queueDateTime(submittedAt)} · Identity is shown under your active case grant.</p>
          </div>
        </div>
        <span className="approval-case-head__tags">
          <AiBadge label="AI draft" />
          <StatusBadge status={review.priority} />
          <span className="status-badge status-badge--primary">{statusLabel(review.status)}</span>
        </span>
      </div>
      <dl className="approval-snapshot">
        <div>
          <dt>Main symptoms</dt>
          <dd>{symptoms || 'Not recorded'}</dd>
          {days != null && <small>For {days} {days === 1 ? 'day' : 'days'}</small>}
        </div>
        <div>
          <dt>Triage priority</dt>
          <dd>{review.priority}</dd>
          <small>{statusLabel(review.status)}</small>
        </div>
        <div>
          <dt>Record access</dt>
          <dd>{workspace ? (workspace.clinicalAccess ? 'Clinical records open' : 'Restricted') : 'Checking access…'}</dd>
          {workspace && <small>{expires ?? workspace.accessBasis}</small>}
        </div>
        <div className={failedChecks > 0 ? 'approval-snapshot__warn' : undefined}>
          <dt>Safety checks</dt>
          <dd>{failedChecks === 0 ? 'All passed' : `${failedChecks} not passed`}</dd>
          <small>Deterministic checks</small>
        </div>
      </dl>
    </article>
  )
}
