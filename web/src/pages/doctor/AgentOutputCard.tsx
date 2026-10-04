// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// One agent's output on the doctor-only AI analysis tab, readable as plain language or as the raw JSON.
import { useId, useState, type ReactNode } from 'react'

import type { AgentTraceDto } from '../../services/apiClient'
import { formatJson, statusLabel, structuredEntries } from './approvalReview'

type View = 'plain' | 'json'

type AgentOutputCardProps = {
  title: string
  raw?: string | null
  empty: string
  icon?: ReactNode
  tag?: string
  caption?: string
  trace?: AgentTraceDto
  /** Replaces the generated plain-language list (used where the readable view is a checklist). */
  plain?: ReactNode
  wide?: boolean
  draft?: boolean
}

export function AgentOutputCard({ title, raw, empty, icon, tag, caption, trace, plain, wide, draft }: AgentOutputCardProps) {
  const [view, setView] = useState<View>('plain')
  const headingId = useId()
  const entries = plain ? [] : structuredEntries(raw)
  const className = `care-panel approval-tile approval-agent${wide ? ' approval-tile--wide' : ''}${draft ? ' approval-tile--draft' : ''}`

  return (
    <article className={className} aria-labelledby={headingId}>
      <div className="approval-agent__head">
        <h3 id={headingId}>{icon} {title}</h3>
        <div className="approval-toggle" role="group" aria-label={`${title} view`}>
          <button type="button" aria-pressed={view === 'plain'} onClick={() => setView('plain')}>
            Plain language
          </button>
          <button type="button" aria-pressed={view === 'json'} onClick={() => setView('json')}>
            JSON
          </button>
        </div>
      </div>
      {tag && <p className="approval-tag">{tag}</p>}
      {trace && (
        <p className="care-caption">
          {statusLabel(trace.status)} · Confidence {Math.round(trace.confidence * 100)}% · {trace.latencyMilliseconds} ms
        </p>
      )}

      {view === 'json' ? (
        raw ? (
          <pre className="approval-json" tabIndex={0} aria-label={`${title} raw JSON`}>{formatJson(raw)}</pre>
        ) : (
          <p className="care-caption">{empty}</p>
        )
      ) : plain ? (
        plain
      ) : entries.length === 0 ? (
        <p className="care-caption">{empty}</p>
      ) : (
        <div className="approval-sections">
          {entries.map((entry) => (
            <section className="approval-section" key={entry.label} aria-label={entry.label}>
              <h4>{entry.label} {entry.values.length > 1 && <span className="approval-count">{entry.values.length}</span>}</h4>
              {entry.values.length === 1 ? <p>{entry.values[0]}</p> : (
                <ul>
                  {entry.values.map((value, index) => (
                    <li key={`${entry.label}-${index}`}>{value}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      {caption && <p className="care-caption">{caption}</p>}
    </article>
  )
}
