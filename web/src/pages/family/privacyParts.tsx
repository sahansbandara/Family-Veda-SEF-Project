// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Presentational pieces for Privacy & Access (styles/privacy-access.css). Audit rows show metadata only.
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'

import type { AuditDto, ConsentDto } from '../../services/apiClient'
import {
  activityKind,
  activityKindLabels,
  consentHints,
  consentLabels,
  consentStatusLabel,
  describeAccessEvent,
  type ActivityKind,
} from './privacyWording'

export function Switch({ checked, label, disabled, onChange }: { checked: boolean; label: string; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`pa-switch${checked ? ' is-on' : ''}`}
      onClick={onChange}
    >
      <span className="pa-switch__thumb" aria-hidden="true" />
    </button>
  )
}

export function PrivacyHero({ title, eyebrow, purpose, note }: { title: string; eyebrow: string; purpose: string; note: string }) {
  return (
    <header className="pa-hero">
      <div className="pa-hero__text">
        <p className="pa-hero__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{purpose}</p>
      </div>
      <p className="pa-hero__note"><svg className="pa-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg> {note}</p>
    </header>
  )
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div className="pa-stat">
      <span className="pa-stat__label">{label}</span>
      <strong className="pa-stat__value">{value}</strong>
      <span className="pa-stat__hint">{hint}</span>
    </div>
  )
}

export type TabDef = { id: string; label: string }

/** WAI-ARIA tabs with roving focus (arrow keys, Home, End). */
export function Tabs({ tabs, active, onChange, children }: { tabs: TabDef[]; active: string; onChange: (id: string) => void; children: ReactNode }) {
  const base = useId()
  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    if (next < 0) return
    event.preventDefault()
    onChange(tabs[next].id)
    document.getElementById(`${base}-tab-${tabs[next].id}`)?.focus()
  }
  return (
    <>
      <div className="pa-tabs" role="tablist" aria-label="Privacy sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${base}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel`}
            tabIndex={active === tab.id ? 0 : -1}
            className={`pa-tab${active === tab.id ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKey(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="pa-panel" tabIndex={0}>
        {children}
      </div>
    </>
  )
}

export function Chip({ tone, children }: { tone: 'minor' | 'adult' | 'ok' | 'warn' | 'muted' | 'info'; children: ReactNode }) {
  return <span className={`pa-chip pa-chip--${tone}`}>{children}</span>
}

export function Avatar({ text }: { text: string }) {
  return <span className="pa-avatar" aria-hidden="true">{text}</span>
}

/** Doctor clinical consent rows: one real switch per category, saved immediately by the caller. */
export function ConsentRows({ consents, owner, busy, onToggle }: { consents: ConsentDto[]; owner: string; busy: boolean; onToggle: (consent: ConsentDto) => void }) {
  if (consents.length === 0) return <p className="pa-muted">No consent settings yet. They appear once the profile is linked to a family.</p>
  return (
    <ul className="pa-toggles">
      {consents.map((consent) => {
        const label = consentLabels[consent.category] ?? consent.category
        return (
          <li key={consent.id} className="pa-toggle">
            <div>
              <b>{label}</b>
              <span>{consentHints[consent.category] ?? 'Shared with your family doctor during a reviewed case.'}</span>
              <Chip tone={consent.status === 'Granted' ? 'ok' : consent.status === 'PendingReaffirmation' ? 'warn' : 'muted'}>{consentStatusLabel(consent.status)}</Chip>
            </div>
            <Switch checked={consent.status === 'Granted'} disabled={busy} label={`${label} consent for ${owner}`} onChange={() => onToggle(consent)} />
          </li>
        )
      })}
    </ul>
  )
}

export function RuleCards({ rules }: { rules: { title: string; body: string }[] }) {
  return (
    <div className="pa-rules">
      {rules.map((rule) => (
        <article key={rule.title} className="pa-rule">
          <h3>{rule.title}</h3>
          <p>{rule.body}</p>
        </article>
      ))}
    </div>
  )
}

/** Audit timeline: filter + search client-side; details show event metadata only, never clinical content. */
export function AuditTimeline({ events, canLoadMore, loadingMore, onLoadMore }: { events: AuditDto[]; canLoadMore: boolean; loadingMore: boolean; onLoadMore: () => void }) {
  const [kind, setKind] = useState<'all' | ActivityKind>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((event) => (kind === 'all' || activityKind(event.eventType) === kind)
      && (!q || describeAccessEvent(event.eventType).toLowerCase().includes(q) || event.resourceType.toLowerCase().includes(q)))
  }, [events, kind, query])

  return (
    <div className="pa-audit">
      <div className="pa-audit__filters">
        <label className="pa-field">
          <span>Activity type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as 'all' | ActivityKind)}>
            <option value="all">All activity</option>
            {(Object.keys(activityKindLabels) as ActivityKind[]).map((key) => <option key={key} value={key}>{activityKindLabels[key]}</option>)}
          </select>
        </label>
        <label className="pa-field pa-field--grow">
          <span>Search</span>
          <input type="search" value={query} placeholder="Search activity" onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="pa-muted">{events.length === 0 ? 'No access recorded yet. When someone views or changes your family’s data, it is listed here.' : 'No activity matches this filter.'}</p>
      ) : (
        <ol className="pa-timeline">
          {filtered.map((event) => {
            const expanded = open === event.id
            const detailsId = `audit-details-${event.id}`
            return (
              <li key={event.id} className="pa-event">
                <span className={`pa-event__dot pa-event__dot--${activityKind(event.eventType)}`} aria-hidden="true" />
                <div className="pa-event__body">
                  <div className="pa-event__row">
                    <strong>{describeAccessEvent(event.eventType)}</strong>
                    <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time>
                  </div>
                  <button type="button" className="pa-link" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setOpen(expanded ? null : event.id)}>
                    {expanded ? 'Hide details' : 'Details'}
                  </button>
                  {expanded && (
                    <dl id={detailsId} className="pa-event__details">
                      <div><dt>Activity</dt><dd>{activityKindLabels[activityKind(event.eventType)]}</dd></div>
                      <div><dt>Item type</dt><dd>{event.resourceType}</dd></div>
                      <div><dt>Outcome</dt><dd>{event.outcome}</dd></div>
                      <div><dt>Time</dt><dd>{new Date(event.createdAt).toLocaleString()}</dd></div>
                    </dl>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
      {canLoadMore && (
        <button type="button" className="pa-btn" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? 'Loading…' : 'Load more'}</button>
      )}
    </div>
  )
}
