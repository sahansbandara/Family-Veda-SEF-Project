// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Presentational sections of Profile & Availability: summary tiles, the weekly-hours editor and
// the time-off list. State and API calls stay in DoctorProfilePage.
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'

import type { AvailabilityWindowDto, BlockedTimeDto, WeekDay } from '../../services/apiClient'
import { formatDateTime } from '../family/threePortalUtils'
import { plural, weekDays } from './doctorSchedule'

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
)
const icons = {
  families: icon(<><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19.5c.6-3.3 3-5 6.2-5s5.6 1.7 6.2 5" /><circle cx="17.5" cy="9" r="2.4" /><path d="M17.5 14.300c2.2.2 3.5 1.6 3.9 3.9" /></>),
  clock: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  calendar: icon(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  blocked: icon(<><circle cx="12" cy="12" r="8.5" /><path d="m6 18 12-12" /></>),
}

export function Pill({ tone = 'ok', children }: { tone?: 'ok' | 'warn'; children: ReactNode }) {
  return <span className={`dprof-pill dprof-pill--${tone}`}><span className="dprof-dot" aria-hidden="true" />{children}</span>
}

export function Switch({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="dprof-switch">
      <input type="checkbox" aria-label={label} {...input} />
      <span className="dprof-track" aria-hidden="true" />
    </label>
  )
}

export function PracticeSummary({ accepting, slotMinutes, activeDays, blockedCount }: {
  accepting: boolean; slotMinutes: number; activeDays: number; blockedCount: number
}) {
  const tiles: Array<[string, string, ReactNode]> = [
    ['Practice status', accepting ? 'Accepting families' : 'Not accepting', icons.families],
    ['Consultation length', `${slotMinutes} minutes`, icons.clock],
    ['Weekly schedule', plural(activeDays, 'active day'), icons.calendar],
    ['Upcoming time off', plural(blockedCount, 'blocked period'), icons.blocked],
  ]
  return (
    <dl className="dprof-metrics" aria-label="Practice summary">
      {tiles.map(([label, value, glyph]) => (
        <div className="dprof-metric" key={label}>
          <div><dt>{label}</dt><dd>{value}</dd></div>
          <span className="dprof-metric__icon">{glyph}</span>
        </div>
      ))}
    </dl>
  )
}

export function WeeklyHours({ windows, onToggleDay, onAdd, onChange, onRemove }: {
  windows: AvailabilityWindowDto[]
  onToggleDay: (day: WeekDay, enabled: boolean) => void
  onAdd: (day: WeekDay) => void
  onChange: (index: number, patch: Partial<AvailabilityWindowDto>) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="dprof-days">
      {weekDays.map((day) => {
        // Keep each window's index in the flat list, so edits address the right row.
        const ranges = windows.map((window, index) => ({ window, index })).filter(({ window }) => window.dayOfWeek === day)
        const enabled = ranges.length > 0
        return (
          <div className={`dprof-day${enabled ? ' is-on' : ''}`} key={day} role="group" aria-label={day}>
            <div className="dprof-day__info">
              <Switch label={`Enable ${day}`} checked={enabled} onChange={(event) => onToggleDay(day, event.target.checked)} />
              <div>
                <div className="dprof-day__name">{day}</div>
                <div className="dprof-day__state">{enabled ? plural(ranges.length, 'time range') : 'Not available'}</div>
              </div>
            </div>
            <div className="dprof-windows">
              {enabled ? ranges.map(({ window, index }, position) => (
                <div className="dprof-window" key={index}>
                  <input type="time" aria-label={`${day} range ${position + 1} start`} value={window.startTime} onChange={(event) => onChange(index, { startTime: event.target.value })} />
                  <span aria-hidden="true">–</span>
                  <input type="time" aria-label={`${day} range ${position + 1} end`} value={window.endTime} onChange={(event) => onChange(index, { endTime: event.target.value })} />
                  <button type="button" aria-label={`Remove ${day} range ${position + 1}`} onClick={() => onRemove(index)}>×</button>
                </div>
              )) : <span className="dprof-off">Day off</span>}
              <button type="button" className="dprof-add" aria-label={`Add time range for ${day}`} onClick={() => onAdd(day)}>+ Add hours</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TimeOff({ blocked, busy, onBlock, onUnblock }: {
  blocked: BlockedTimeDto[]
  busy: boolean
  onBlock: (event: FormEvent<HTMLFormElement>) => void
  onUnblock: (id: string) => void
}) {
  return (
    <div className="dprof-timeoff">
      <form className="dprof-timeoff__form" onSubmit={onBlock}>
        <label className="dprof-field">From<input name="from" type="datetime-local" required /></label>
        <label className="dprof-field">To<input name="to" type="datetime-local" required /></label>
        <label className="dprof-field dprof-field--wide">Reason (optional)<input name="reason" maxLength={120} placeholder="e.g., Annual leave" /></label>
        <button className="dprof-btn dprof-btn--primary" type="submit" disabled={busy}>+ Block this period</button>
      </form>
      <div className="dprof-blocks">
        <h3>Upcoming blocked periods</h3>
        {blocked.length === 0 ? <p className="dprof-note">No upcoming blocked periods.</p> : (
          <ul>
            {blocked.map((block) => (
              <li className="dprof-block" key={block.id}>
                <div>
                  <strong>{block.reason || 'Unavailable'}</strong>
                  <small>{formatDateTime(block.startsAt)} → {formatDateTime(block.endsAt)}</small>
                </div>
                <button type="button" aria-label={`Remove blocked period ${block.reason || formatDateTime(block.startsAt)}`} onClick={() => onUnblock(block.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <p className="dprof-note">These periods override your regular schedule. Booked appointments must be managed separately.</p>
      </div>
    </div>
  )
}
