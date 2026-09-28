// Phase 2 (S1+S4): sex used only to pick the printed reference range on a lab report — never to infer anything.
export type ClinicalSex = 'NotSpecified' | 'Male' | 'Female'

const CLINICAL_SEX_OPTIONS: Array<{ value: ClinicalSex; label: string }> = [
  { value: 'NotSpecified', label: 'Not specified' },
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
]

type Props = {
  name?: string
  value?: ClinicalSex
  onChange?: (value: ClinicalSex) => void
  label?: string
}

export function ClinicalSexSelect({ name = 'sexForClinicalReference', value, onChange, label = 'Sex for lab reference ranges' }: Props) {
  const controlled = value !== undefined
  return (
    <label className="field">
      <span>{label}</span>
      <select
        name={name}
        {...(controlled ? { value } : { defaultValue: 'NotSpecified' })}
        onChange={(event) => onChange?.(event.target.value as ClinicalSex)}
      >
        {CLINICAL_SEX_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <small className="muted">Only used to show the matching printed reference range. Optional.</small>
    </label>
  )
}
