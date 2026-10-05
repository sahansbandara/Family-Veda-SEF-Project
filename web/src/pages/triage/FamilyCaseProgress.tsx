// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Ownership is binding — whole-project waiver applies; docs/OWNERSHIP.tsv

const steps = ['Submitted', 'Being reviewed', 'Doctor review', 'Guidance available'] as const
const doctorStatuses = ['PendingDoctorReview', 'Claimed']
const needsInformationStatuses = ['LowConfidence', 'RequestInformation', 'RequestedInformation']
const doneStatuses = ['Approved', 'ApprovedRevised']
const stoppedStatuses = ['Rejected', 'Escalated', 'FailedSafe']

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

export function FamilyCaseProgress({ caseStatus }: { caseStatus: string }) {
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
  const current = familyStepIndex(caseStatus)
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
            <strong>{label}</strong>
            <small>{isPast ? 'Completed' : isCurrent ? 'Current stage' : 'Pending'}</small>
          </li>
        )
      })}
    </ol>
  )
}
