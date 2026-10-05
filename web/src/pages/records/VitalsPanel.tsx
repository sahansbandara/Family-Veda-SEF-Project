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
  const [viewing, setViewing] = useState<string | null>(null)

  const latest = groups.flatMap((group) => group.readings.slice(0, 1)).sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt))[0]
  
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
                onClick={() => setPreset(item)}
              >
                <span className="hr-tone-icon"><RecordIcon name={item.icon} /></span>
                <span className="hr-quick-tile__text">
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
          {preset && (
            <RecordDialog eyebrow="Add vital" title={`Record ${preset.label}`} onClose={() => setPreset(null)}>
              <form className="hr-quick-form" key={preset.kind} onSubmit={(event) => void submit(event)}>
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
            </RecordDialog>
          )}
        </section>

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
      </div>

      {viewedGroup && (
        <RecordDialog eyebrow="Recorded readings" title={viewedGroup.label} onClose={() => setViewing(null)}>
          <div className={`hr-dialog-chart hr-tone--${viewedGroup.kind}`}>
            <Sparkline 
              values={trendValues(viewedGroup, 12)} 
              width={520} 
              height={140} 
              normalValue={VITAL_PRESETS.find((p) => p.kind === viewedGroup.kind)?.normalValue}
              normalLabel={VITAL_PRESETS.find((p) => p.kind === viewedGroup.kind)?.normalLabel}
              chartType={VITAL_PRESETS.find((p) => p.kind === viewedGroup.kind)?.chartType}
            />
          </div>
          <ul className="hr-reading-list">
            {viewedGroup.readings.map((reading, index) => (
              <li key={reading.id}>
                <span>{formatVitalDate(reading.measuredAt)}</span>
                <ChangeChip change={changeFromPrevious(viewedGroup, index)} />
                <b className="hr-num">{reading.display} <small>{reading.unit}</small></b>
                <span className="hr-reading-actions">
                  <button type="button" className="hr-icon-btn" onClick={() => alert('Editing vitals is not available in the current demo.')} aria-label="Edit reading" title="Edit">
                    <RecordIcon name="edit" />
                  </button>
                  <button type="button" className="hr-icon-btn hr-icon-btn--danger" onClick={() => alert('Deleting vitals is not available in the current demo.')} aria-label="Delete reading" title="Delete">
                    <RecordIcon name="trash" />
                  </button>
                </span>
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
        <RecordIcon name="chevron" className="hr-vital-card__chevron" />
      </span>
      <span className="hr-vital-card__body">
        <span className="hr-vital-card__subtitle">Latest reading</span>
        <span className="hr-vital-card__value-group">
          <strong className="hr-num">{reading.display}</strong> <small>{reading.unit}</small>
        </span>
      </span>
      <span className="hr-vital-card__chart">
        <Sparkline 
          values={trendValues(group, 14)} 
          width={240} 
          height={60} 
          normalValue={VITAL_PRESETS.find((p) => p.kind === group.kind)?.normalValue}
          normalLabel={VITAL_PRESETS.find((p) => p.kind === group.kind)?.normalLabel}
          chartType={VITAL_PRESETS.find((p) => p.kind === group.kind)?.chartType}
        />
      </span>
    </button>
  )
}
