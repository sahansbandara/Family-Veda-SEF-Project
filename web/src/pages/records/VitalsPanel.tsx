// S2 · Health Records — vitals dashboard. Shows recorded values and their arithmetic change only;
// it never compares a reading with a range or interprets it (RULE 1, RULE 4).
import { type FormEvent, useMemo, useState } from 'react'
import { EmptyState } from '../../components/shared/ViewState'
import type { VitalDto } from '../../services/apiClient'
import { RecordDialog } from './RecordDialog'
import { RecordIcon } from './recordIcons'
import { Sparkline } from './Sparkline'
import {
  VITAL_PRESETS,
  type VitalChange,
  type VitalGroup,
  type VitalPreset,
  changeFromPrevious,
  formatVitalDate,
  groupVitals,
  trendValues,
  vitalIcon,
} from './vitalMeta'

export type NewVital = { vitalType: string; value: number; unit: string }

type Props = {
  vitals: VitalDto[]
  /** Resolves true when every reading was saved, so the form can be cleared. */
  onAdd: (entries: NewVital[], measuredAt: string) => Promise<boolean>
}

function localNow(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function ChangeChip({ change }: { change: VitalChange | null }) {
  if (!change) return <span className="hr-change" title="No earlier reading to compare">—</span>
  if (change.direction === 'same') return <span className="hr-change" title="Change from the previous reading">No change</span>
  return (
    <span className="hr-change" title="Change from the previous reading">
      <span aria-hidden="true">{change.direction === 'up' ? '↑' : '↓'} </span>
      <span className="sr-only">{change.direction === 'up' ? 'Up' : 'Down'} </span>
      {change.text}
    </span>
  )
}

export function VitalsPanel({ vitals, onAdd }: Props) {
  const groups = useMemo(() => groupVitals(vitals), [vitals])
  const [preset, setPreset] = useState<VitalPreset | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [viewing, setViewing] = useState<string | null>(null)

  const latest = groups.flatMap((group) => group.readings.slice(0, 1)).sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt))[0]
  const rows = groups
    .filter((group) => type === 'all' || group.key === type)
    .filter((group) => group.label.toLowerCase().includes(search.trim().toLowerCase()))
    .flatMap((group) => group.readings.map((reading, index) => ({ group, reading, index })))
    .sort((a, b) => {
      const diff = Date.parse(b.reading.measuredAt) - Date.parse(a.reading.measuredAt)
      return sort === 'newest' ? diff : -diff
    })
  const viewedGroup = groups.find((group) => group.key === viewing)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!preset || saving) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const entries = preset.fields.map((field) => ({
      vitalType: field.vitalType,
      value: Number(form.get(field.vitalType)),
      unit: preset.unit,
    }))
    setSaving(true)
    try {
      const saved = await onAdd(entries, new Date(String(form.get('measuredAt'))).toISOString())
      if (saved) setPreset(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="hr-vitals">
      <div className="hr-vitals__top">
        <section className="care-panel hr-section" aria-labelledby="latest-vitals-title">
          <header className="hr-section__head">
            <span className="hr-section__icon"><RecordIcon name="eye" /></span>
            <div>
              <p className="care-eyebrow">Latest vitals</p>
              <h2 id="latest-vitals-title">Latest Vitals</h2>
              <p className="care-muted">Most recent readings from your health records</p>
            </div>
            {latest && <span className="hr-chip hr-section__aside">Updated: {formatVitalDate(latest.measuredAt)}</span>}
          </header>
          {groups.length === 0 ? (
            <div className="care-empty">
              <EmptyState title="No vitals recorded" message="Add a reading to keep a dated record." />
            </div>
          ) : (
            <div className="hr-vital-cards">
              {groups.map((group) => (
                <LatestVitalCard key={group.key} group={group} onOpen={() => setViewing(group.key)} />
              ))}
            </div>
          )}
        </section>

        <section className="care-panel hr-section" aria-labelledby="quick-vitals-title">
          <header className="hr-section__head">
            <span className="hr-section__icon"><RecordIcon name="plus" /></span>
            <div>
              <p className="care-eyebrow">Quick add vitals</p>
              <h2 id="quick-vitals-title">Quick Add Vitals</h2>
              <p className="care-muted">Choose a measurement to record a new reading</p>
            </div>
          </header>
          <div className="hr-quick-grid">
            {VITAL_PRESETS.map((item) => (
              <button
                key={item.kind}
                type="button"
                className={`hr-quick-tile hr-tone--${item.kind}`}
                aria-pressed={preset?.kind === item.kind}
                onClick={() => setPreset(preset?.kind === item.kind ? null : item)}
              >
                <span className="hr-tone-icon"><RecordIcon name={item.icon} /></span>
                <span className="hr-quick-tile__text">
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </span>
                <RecordIcon name="chevron" className="hr-quick-tile__chevron" />
              </button>
            ))}
          </div>
          {preset && (
            <form className="hr-quick-form" key={preset.kind} onSubmit={(event) => void submit(event)}>
              <h3>Record {preset.label}</h3>
              <div className="hr-quick-form__fields">
                {preset.fields.map((field, index) => (
                  <label className="field" key={field.vitalType}>
                    <span>{field.label} ({preset.unit})</span>
                    <input name={field.vitalType} type="number" min="0" step="any" inputMode="decimal" required autoFocus={index === 0} />
                  </label>
                ))}
                <label className="field">
                  <span>Measured at</span>
                  <input name="measuredAt" type="datetime-local" defaultValue={localNow()} max={localNow()} required />
                </label>
              </div>
              <div className="care-actions">
                <button type="submit" className="button button--primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save vital'}
                </button>
                <button type="button" className="button button--secondary" onClick={() => setPreset(null)}>Cancel</button>
              </div>
            </form>
          )}
        </section>
      </div>

      <section className="care-panel hr-section" aria-labelledby="vitals-history-title">
        <header className="hr-section__head hr-section__head--tools">
          <span className="hr-section__icon"><RecordIcon name="pulse" /></span>
          <div>
            <p className="care-eyebrow">Vitals history</p>
            <h2 id="vitals-history-title">All Recorded Vitals</h2>
            <p className="care-muted">View and track all vital signs over time</p>
          </div>
          <div className="hr-toolbar">
            <label className="hr-search">
              <span className="sr-only">Search vitals</span>
              <RecordIcon name="search" />
              <input type="search" value={search} placeholder="Search vitals by type…" onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className="hr-select">
              <span className="sr-only">Vital type</span>
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="all">All types</option>
                {groups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}
              </select>
            </label>
            <label className="hr-select">
              <span className="sr-only">Sort vitals</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
        </header>
        {rows.length === 0 ? (
          <p className="care-library-empty" role="status">
            {vitals.length === 0 ? 'No vitals have been recorded for this profile.' : 'No vitals match your search or type filter.'}
          </p>
        ) : (
          <div className="hr-table-wrap">
            <table className="hr-table hr-table--stack">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Date &amp; time</th>
                  <th>Trend (last 5)</th>
                  <th>Change</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ group, reading, index }) => (
                  <tr key={`${group.key}:${reading.id}`} className={`hr-tone--${group.kind}`}>
                    <td data-label="Type">
                      <span className="hr-type-cell">
                        <span className="hr-tone-icon hr-tone-icon--sm"><RecordIcon name={vitalIcon(group.kind)} /></span>
                        <b>{group.label}</b>
                      </span>
                    </td>
                    <td data-label="Value"><b className="hr-num">{reading.display}</b> <small>{reading.unit}</small></td>
                    <td data-label="Date & time">{formatVitalDate(reading.measuredAt)}</td>
                    <td data-label="Trend (last 5)"><Sparkline values={trendValues(group, 5)} width={88} height={24} /></td>
                    <td data-label="Change"><ChangeChip change={changeFromPrevious(group, index)} /></td>
                    <td data-label="Actions">
                      <button
                        type="button"
                        className="button button--secondary button--sm hr-action"
                        aria-label={`View ${group.label} readings`}
                        onClick={() => setViewing(group.key)}
                      >
                        <RecordIcon name="eye" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="care-note hr-note">Recorded trends show values only and are not a clinical interpretation.</p>
      </section>

      {viewedGroup && (
        <RecordDialog eyebrow="Recorded readings" title={viewedGroup.label} onClose={() => setViewing(null)}>
          <div className={`hr-dialog-chart hr-tone--${viewedGroup.kind}`}>
            <Sparkline values={trendValues(viewedGroup, 12)} width={520} height={140} filled />
          </div>
          <ul className="hr-reading-list">
            {viewedGroup.readings.map((reading, index) => (
              <li key={reading.id}>
                <span>{formatVitalDate(reading.measuredAt)}</span>
                <ChangeChip change={changeFromPrevious(viewedGroup, index)} />
                <b className="hr-num">{reading.display} <small>{reading.unit}</small></b>
              </li>
            ))}
          </ul>
          <p className="care-caption">Values exactly as recorded. No reference range is applied here.</p>
        </RecordDialog>
      )}
    </div>
  )
}

function LatestVitalCard({ group, onOpen }: { group: VitalGroup; onOpen: () => void }) {
  const reading = group.readings[0]
  return (
    <button type="button" className={`hr-vital-card hr-tone--${group.kind}`} onClick={onOpen} aria-label={`${group.label}: ${reading.display} ${reading.unit}. View readings`}>
      <span className="hr-vital-card__top">
        <span className="hr-tone-icon"><RecordIcon name={vitalIcon(group.kind)} /></span>
        <span className="hr-vital-card__label">{group.label}</span>
        <ChangeChip change={changeFromPrevious(group)} />
      </span>
      <span className="hr-vital-card__body">
        <span>
          <strong className="hr-num">{reading.display}</strong> <small>{reading.unit}</small>
          <span className="hr-vital-card__date">{formatVitalDate(reading.measuredAt)}</span>
        </span>
        <Sparkline values={trendValues(group, 8)} width={84} height={34} filled />
      </span>
    </button>
  )
}
