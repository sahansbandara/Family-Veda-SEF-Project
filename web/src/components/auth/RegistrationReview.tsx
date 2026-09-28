// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Final wizard step: grouped summary styled like the form (label over value, hairline rules).
import type { ReactNode } from 'react'

export type ReviewSection = {
  title: string
  step: number
  rows: Array<[label: string, value: ReactNode]>
}

type Props = {
  sections: ReviewSection[]
  onEdit: (step: number) => void
  acceptTerms: boolean
  onAcceptTermsChange: (accepted: boolean) => void
  termsError?: ReactNode
}

export function RegistrationReview({ sections, onEdit, acceptTerms, onAcceptTermsChange, termsError }: Props) {
  return (
    <div className="reg-review">
      <h3 className="reg-review-heading">Review your details</h3>
      {sections.map((section) => (
        <section key={section.title} className="reg-review-section" aria-label={section.title}>
          <header className="reg-review-section-head">
            <span>{section.title}</span>
            <button type="button" className="reg-review-edit" onClick={() => onEdit(section.step)}>Edit</button>
          </header>
          <dl className="reg-review-rows">
            {section.rows.map(([label, value]) => (
              <div key={label} className="reg-review-row">
                <dt>{label}</dt>
                <dd>{value || <span className="reg-review-empty">Not provided</span>}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <label className="reg-review-terms">
        <input type="checkbox" checked={acceptTerms} onChange={(e) => onAcceptTermsChange(e.target.checked)} />
        <span>I accept the Terms of Service and Privacy Policy.</span>
      </label>
      {termsError}
    </div>
  )
}
