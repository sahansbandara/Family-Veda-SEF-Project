// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Presentational pieces shared by the doctor My Families pages (styles/doctor-families.css).
import { type ReactNode, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { initials } from './familyWorkspace'

const iconPaths = {
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20v-2c0-3 3-5 6-5s6 2 6 5v2M16 5a3 3 0 0 1 0 6M17 14c2.5.3 4 2 4 4v2',
  shield: 'M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4ZM9 12l2 2 4-4',
  lock: 'M7 10h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM8 10V7a4 4 0 1 1 8 0v3',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v6M12 7h.01',
  file: 'M6 2h9l5 5v15H6zM15 2v6h5M9 13h8M9 17h8',
  activity: 'M2 12h5l3-8 4 16 3-8h5',
  mail: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3 7l9 7 9-7',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4M17 3v4M3 10h18',
  right: 'm9 18 6-6-6-6',
  left: 'm15 18-6-6 6-6',
  edit: 'm4 17-.8 4 4-.8L19 8l-3-3L4 17ZM14 7l3 3',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12l3 3 5-6',
} as const

export type IconName = keyof typeof iconPaths

export function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  )
}

export type PillTone = 'ok' | 'warn' | 'info' | 'muted'

export function Pill({ tone = 'muted', dot, children }: { tone?: PillTone; dot?: boolean; children: ReactNode }) {
  return <span className={`dfam-pill dfam-pill--${tone}${dot ? ' dfam-pill--dot' : ''}`}>{children}</span>
}

export function Avatar({ name, large }: { name: string; large?: boolean }) {
  return <span className={large ? 'dfam-avatar dfam-avatar--lg' : 'dfam-avatar'} aria-hidden="true">{initials(name)}</span>
}

export function Breadcrumbs({ trail }: { trail: Array<{ label: string; to?: string }> }) {
  return (
    <nav className="dfam-crumbs" aria-label="Breadcrumb">
      {trail.map((crumb, index) => crumb.to ? (
        <span key={crumb.label} className="dfam-crumbs">
          <Link to={crumb.to}>{crumb.label}</Link>
          {index < trail.length - 1 && <Icon name="right" size={12} />}
        </span>
      ) : <span key={crumb.label} aria-current="page">{crumb.label}</span>)}
    </nav>
  )
}

export function Strip({ icon = 'shield', children }: { icon?: IconName; children: ReactNode }) {
  return <p className="dfam-strip"><Icon name={icon} /><span>{children}</span></p>
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint: string; tone?: 'warn' | 'ok' | 'lum' }) {
  return (
    <article className={tone ? `dfam-stat dfam-stat--${tone}` : 'dfam-stat'}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

/** A real empty result: the doctor is authorised and there is nothing to show. */
export function Empty({ title, message }: { title: string; message: string }) {
  return <div className="dfam-empty"><Icon name="info" size={26} /><strong>{title}</strong><p>{message}</p></div>
}

/** Not authorised. Never worded as "none" and never carries a count. */
export function Restricted({ what }: { what: string }) {
  return (
    <div className="dfam-empty">
      <Icon name="lock" size={26} />
      <strong>{what} restricted</strong>
      <p>Not available: there is no active visit or shared case for this member, or the member has not consented to this category. This does not mean there are no {what.toLowerCase()}.</p>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, danger, busy, onConfirm, onCancel }: {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div className="dfam-dialog-backdrop">
      <section className="dfam-dialog" role="dialog" aria-modal="true" aria-labelledby="dfam-dialog-title">
        <h2 id="dfam-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="dfam-actions">
          <button ref={cancelRef} type="button" className="dfam-btn" disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? 'dfam-btn dfam-btn--danger' : 'dfam-btn dfam-btn--primary'} disabled={busy} onClick={onConfirm}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
