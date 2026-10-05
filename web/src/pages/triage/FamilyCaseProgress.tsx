// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Ownership is binding — whole-project waiver applies; docs/OWNERSHIP.tsv

const steps = ['Request received', 'AI processing', 'Doctor review', 'Doctor response'] as const
const doctorStatuses = ['PendingDoctorReview', 'Claimed']
const needsInformationStatuses = [ 'RequestInformation', 'RequestedInformation']
const doneStatuses = ['Approved', 'ApprovedRevised']
const stoppedStatuses = ['Escalated', 'FailedSafe']

function familyStepIndex(caseStatus: string): number {
  if (doneStatuses.includes(caseStatus)) return 3
  if (doctorStatuses.includes(caseStatus)) return 2
  if (caseStatus === 'Submitted') return 0
  return 1
}

function ProgressNotice({ tone, title, children }: { tone: 'danger' | 'warn'; title: string; children: string }) {
  return (
    <div className={`current-call current-call--${tone}`} role="status">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}

export function FamilyCaseProgress({ caseStatus, doctorReceivedAt, doctorReviewStartedAt }: { caseStatus: string; doctorReceivedAt?: string | null; doctorReviewStartedAt?: string | null }) {
  if (caseStatus === 'Withdrawn' || caseStatus === 'Superseded') return <p role="status">{caseStatus === 'Withdrawn' ? 'This request was withdrawn.' : 'This request was replaced by an updated submission.'}</p>
  if (caseStatus === 'Rejected') return <p role="status">The doctor closed this request. No approved guidance was released.</p>
  if (stoppedStatuses.includes(caseStatus))
    return (
      <ProgressNotice tone="danger" title="In-person review needed">
        This request could not be completed online. Please arrange an in-person clinical review.
      </ProgressNotice>
    )
  if (needsInformationStatuses.includes(caseStatus))
    return (
      <ProgressNotice tone="warn" title="Waiting for more information">
        More information is needed before this request can continue.
      </ProgressNotice>
    )
  const current = caseStatus === 'LowConfidence' ? 2 : familyStepIndex(caseStatus)
  const allDone = current === steps.length - 1
  return (
    <ol className="progress-track" aria-label="Request progress">
      {steps.map((label, index) => {
        const isPast = index < current || allDone
        const isCurrent = index === current && !allDone
        return (
          <li
            key={label}
            className={`milestone ${isPast ? 'past' : isCurrent ? 'current' : ''}`}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="dot" aria-hidden="true">{isPast ? '✓' : index + 1}</span>
            <strong>{index === 0 && doctorReceivedAt ? 'Received in doctor’s queue' : label}</strong>
            <small>{index === 2 && isCurrent ? (doctorReviewStartedAt || caseStatus === 'Claimed' ? 'Doctor is reviewing your request' : 'Waiting for doctor review') : isPast ? 'Completed' : isCurrent ? 'Current stage' : 'Pending'}</small>
          </li>
        )
      })}
    </ol>
  )
}
