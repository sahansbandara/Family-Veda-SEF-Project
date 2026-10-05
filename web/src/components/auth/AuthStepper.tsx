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
    <nav className="auth-stepper-modern" aria-label="Registration progress">
      {steps.map((step, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'
        return (
          <div key={`step-${i}`} className="auth-stepper-segment">
            <div className={`auth-stepper-label ${state}`}>
              {step.label}
            </div>
            <div className={`auth-stepper-bar ${state}`} />
          </div>
        )
      })}
    </nav>
  )
}
