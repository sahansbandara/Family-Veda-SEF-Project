// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Step progress indicator for multi-step auth forms.

export interface StepDef {
  label: string
}

export interface AuthStepperProps {
  steps: StepDef[]
  /** 0-indexed current step */
  currentStep: number
}

export function AuthStepper({ steps, currentStep }: AuthStepperProps) {
  return (
    <nav className="auth-stepper" aria-label="Registration progress">
      {steps.map((step, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'
        return (
          <div key={step.label} style={{ display: 'contents' }}>
            <div className={`auth-step ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              <div className="auth-step-badge" aria-hidden="true">
                {state === 'done' ? '✓' : i + 1}
              </div>
              <span className="sr-only">{step.label}{state === 'active' ? ' (current)' : state === 'done' ? ' (complete)' : ''}</span>
              <span aria-hidden="true">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`auth-step-connector ${i < currentStep ? 'done' : ''}`} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
