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

export function FamilyCaseProgress({ caseStatus }: { caseStatus: string }) {
  if (stoppedStatuses.includes(caseStatus))
    return (
      <p className="muted" role="status">
        This request could not be completed online. Please arrange an in-person clinical review.
      </p>
    )
  if (needsInformationStatuses.includes(caseStatus))
    return (
      <p className="muted" role="status">
        More information is needed before this request can continue.
      </p>
    )
  const current = familyStepIndex(caseStatus)
  return (
    <ol className="care-stepper" aria-label="Request progress">
      {steps.map((label, index) => (
        <li key={label} aria-current={index === current ? 'step' : undefined}>
          <span
            className={`status-badge status-badge--${index < current || current === 3 ? 'success' : index === current ? 'primary' : 'muted'}`}
          >
            {index < current || current === 3 ? '✓ ' : ''}
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
