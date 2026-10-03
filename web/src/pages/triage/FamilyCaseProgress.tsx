// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Ownership is binding — whole-project waiver applies; docs/OWNERSHIP.tsv

const steps = [
  { label: 'Submitted', hint: 'We received your symptoms.' },
  { label: 'Being reviewed', hint: 'Your request is being prepared for a doctor.' },
  { label: 'Doctor review', hint: 'A licensed doctor is looking at your request.' },
  { label: 'Guidance available', hint: 'Your doctor-approved guidance is ready to read.' },
] as const
const doctorStatuses = ['PendingDoctorReview', 'Claimed']
const needsInformationStatuses = ['LowConfidence', 'RequestInformation', 'RequestedInformation']
const doneStatuses = ['Approved', 'ApprovedRevised']
const stoppedStatuses = ['Rejected', 'Escalated', 'FailedSafe']

type StepState = 'complete' | 'current' | 'upcoming'
const stateLabel: Record<StepState, string> = { complete: 'Done', current: 'In progress', upcoming: 'Up next' }

function familyStepIndex(caseStatus: string): number {
  if (doneStatuses.includes(caseStatus)) return 3
  if (doctorStatuses.includes(caseStatus)) return 2
  if (caseStatus === 'Submitted') return 0
  return 1
}

function ProgressNotice({ title, children }: { title: string; children: string }) {
  return (
    <div className="care-progress-notice" role="status">
      <span className="care-progress-notice__icon" aria-hidden="true">
        !
      </span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}

export function FamilyCaseProgress({ caseStatus }: { caseStatus: string }) {
  if (stoppedStatuses.includes(caseStatus))
    return (
      <ProgressNotice title="In-person review needed">
        This request could not be completed online. Please arrange an in-person clinical review.
      </ProgressNotice>
    )
  if (needsInformationStatuses.includes(caseStatus))
    return (
      <ProgressNotice title="Waiting for more information">
        More information is needed before this request can continue.
      </ProgressNotice>
    )
  const current = familyStepIndex(caseStatus)
  const allDone = current === steps.length - 1
  return (
    <ol className="care-stepper" aria-label="Request progress">
      {steps.map((step, index) => {
        const state: StepState = index < current || allDone ? 'complete' : index === current ? 'current' : 'upcoming'
        return (
          <li
            key={step.label}
            className={`care-stepper__step care-stepper__step--${state}`}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="care-stepper__node" aria-hidden="true">
              {state === 'complete' ? '✓' : index + 1}
            </span>
            <div className="care-stepper__body">
              <span className="care-stepper__state">{stateLabel[state]}</span>
              <strong className="care-stepper__label">{step.label}</strong>
              <span className="care-stepper__hint">{step.hint}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
