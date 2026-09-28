// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Shared building blocks for the three portal dashboards (Family Head, Adult Member, Doctor mockups).
import { useState, type ReactNode } from 'react'

import type { Tone } from './dashboardFormat'

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`fv-badge fv-badge--${tone}`}>{children}</span>
}

export function Metric({ label, value, badge }: { label: string; value: ReactNode; badge?: ReactNode }) {
  return (
    <article className="fv-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      {badge}
    </article>
  )
}

/**
 * RULE 10: in an emergency the system shows a referral, never AI output.
 * Deterministic and static. The mockups used alert(); a visible card replaces it.
 */
export function EmergencyHelp() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && (
        <div className="fv-referral" role="alert" style={{ position: 'fixed', right: 18, bottom: 70, zIndex: 31, maxWidth: 340 }}>
          <strong>Emergency? Call 1990 now.</strong>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>
            Suwa Seriya ambulance: <a href="tel:1990">1990</a>. Go to the nearest emergency unit. Family Veda does not
            assess emergencies.
          </p>
        </div>
      )}
      <button type="button" className="fv-emergency" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Emergency Help
      </button>
    </>
  )
}
