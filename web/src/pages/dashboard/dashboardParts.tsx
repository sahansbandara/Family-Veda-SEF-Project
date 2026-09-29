// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Shared building blocks for the three portal dashboards (Family Head, Adult Member, Doctor mockups).
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { Tone } from './dashboardFormat'

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`fv-badge fv-badge--${tone}`}>{children}</span>
}

export function Metric({ label, value, badge, to }: { label: string; value: ReactNode; badge?: ReactNode; to?: string }) {
  const body = (
    <>
      <small>{label}</small>
      <strong>{value}</strong>
      {badge}
    </>
  )
  // Every number has a destination (docs/Three_Dashboards_UX_Plan.md §6).
  if (to) return <Link className="fv-metric fv-metric--link" to={to} aria-label={`${label}: open`}>{body}</Link>
  return <article className="fv-metric">{body}</article>
}

/**
 * Page template (UX plan §2): the title equals the nav label, one plain purpose sentence,
 * and at most one primary action on the right.
 */
export function PageHero({ eyebrow, title, purpose, action, children }: {
  eyebrow: string
  title: string
  purpose: string
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="fv-hero">
      <div>
        <p className="fv-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{purpose}</p>
        {children}
      </div>
      {action}
    </header>
  )
}

export type SubTab<T extends string> = { id: T; label: string; count?: number }

/** Sub-tabs inside a page. Keyboard-accessible tablist. */
export function SubTabs<T extends string>({ tabs, active, onChange, label }: {
  tabs: SubTab<T>[]
  active: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div className="fv-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? 'fv-tab fv-tab--active' : 'fv-tab'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count ? <span className="fv-badge fv-badge--warn">{tab.count}</span> : null}
        </button>
      ))}
    </div>
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
