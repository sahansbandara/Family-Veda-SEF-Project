// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Password visibility toggle + strength indicator helpers.

import { useState } from 'react'

// SVG icons — inline to avoid adding icon dependencies
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export interface PasswordFieldProps {
  id: string
  label: string
  value: string
  autoComplete?: string
  placeholder?: string
  required?: boolean
  error?: string
  showStrength?: boolean
  onChange: (value: string) => void
}

function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (pw.length === 0) return 0
  let score = 0
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score as 0 | 1 | 2 | 3 | 4
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthClasses = ['', 'weak', 'fair', 'good', 'strong']

export function PasswordField({
  id, label, value, autoComplete = 'new-password',
  placeholder = 'Min 12 characters', required, error, showStrength, onChange
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const strength = showStrength ? getStrength(value) : 0

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <div className="auth-pw-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : showStrength ? `${id}-strength` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="auth-pw-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          tabIndex={0}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} className="auth-field-error" role="alert">
          {error}
        </span>
      )}
      {showStrength && value.length > 0 && (
        <div id={`${id}-strength`} aria-live="polite" aria-label={`Password strength: ${strengthLabels[strength]}`}>
          <div className="auth-pw-strength" aria-hidden="true">
            {[1,2,3,4].map((level) => (
              <div
                key={level}
                className={`auth-pw-strength-bar ${level <= strength ? strengthClasses[strength] : ''}`}
              />
            ))}
          </div>
          <span className="auth-field-hint">{strengthLabels[strength]}</span>
        </div>
      )}
    </div>
  )
}
