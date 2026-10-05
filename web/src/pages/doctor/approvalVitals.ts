// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Pure display helpers for the vitals overview. Range status and trend come from the backend rule
// table (RULE 4); nothing here decides whether a value is in range.
import type { RangeStatus, VitalTrend, WorkspaceVitalDto } from '../../services/apiClient'
import { groupVitals, type VitalSeries } from './familyWorkspace'

export type VitalCard = {
  key: string
  label: string
  value: string
  unit: string
  latest: WorkspaceVitalDto
  status: RangeStatus
  trend: VitalTrend
  range: string | null
  series: VitalSeries[]
}

export const statusText: Record<RangeStatus, string> = {
  WithinRange: 'Within reference range',
  AboveRange: 'Above reference range',
  BelowRange: 'Below reference range',
  RangeUnavailable: 'No reference range',
}
export const statusTone: Record<RangeStatus, 'ok' | 'warn' | 'muted'> = {
  WithinRange: 'ok', AboveRange: 'warn', BelowRange: 'warn', RangeUnavailable: 'muted',
}
/** Approval-desk chip colour: green inside the interval, amber below it, red above it. */
export const chipTone: Record<RangeStatus, 'ok' | 'warn' | 'high' | 'muted'> = {
  WithinRange: 'ok', BelowRange: 'warn', AboveRange: 'high', RangeUnavailable: 'muted',
}
export const chipMark: Record<RangeStatus, string> = { WithinRange: '✓', BelowRange: '↓', AboveRange: '↑', RangeUnavailable: '–' }

export type VitalIcon = 'heart' | 'pressure' | 'weight' | 'temperature' | 'oxygen' | 'breath' | 'generic'
export function vitalIcon(key: string): VitalIcon {
  const type = key.split('|')[0]
  if (type === 'heart_rate') return 'heart'
  if (type.startsWith('blood_pressure')) return 'pressure'
  if (type === 'weight' || type === 'bmi' || type === 'height') return 'weight'
  if (type === 'temperature') return 'temperature'
  if (type === 'oxygen_saturation') return 'oxygen'
  if (type === 'respiratory_rate') return 'breath'
  return 'generic'
}
export const trendText: Record<VitalTrend, string> = {
  Rising: 'Rising', Falling: 'Falling', Stable: 'Stable', NotEnoughReadings: 'First reading',
}
export const trendArrow: Record<VitalTrend, string> = { Rising: '↗', Falling: '↘', Stable: '→', NotEnoughReadings: '•' }

const typeOf = (series: VitalSeries) => series.key.split('|')[0]
const statusOf = (vital: WorkspaceVitalDto): RangeStatus => vital.rangeStatus ?? 'RangeUnavailable'

function rangeText(vital: WorkspaceVitalDto) {
  return vital.referenceLow != null && vital.referenceHigh != null ? `${vital.referenceLow} – ${vital.referenceHigh}` : null
}

function card(series: VitalSeries): VitalCard {
  const latest = series.readings[0]!
  const range = rangeText(latest)
  return {
    key: series.key, label: series.label, value: String(latest.value), unit: series.unit, latest,
    status: statusOf(latest), trend: latest.trend ?? 'NotEnoughReadings', range: range ? `${range} ${series.unit}` : null, series: [series],
  }
}

/** One card per measurement. Systolic and diastolic become one card only when recorded at the same moment. */
export function vitalCards(vitals: WorkspaceVitalDto[]): VitalCard[] {
  const groups = groupVitals(vitals)
  const systolic = groups.find((series) => typeOf(series) === 'blood_pressure_systolic')
  const diastolic = groups.find((series) => typeOf(series) === 'blood_pressure_diastolic' && series.unit === systolic?.unit)
  const paired = systolic && diastolic && systolic.readings[0]!.measuredAt === diastolic.readings[0]!.measuredAt
  const cards = groups.filter((series) => !paired || (series !== systolic && series !== diastolic)).map(card)
  if (!paired) return cards
  const [high, low] = [card(systolic), card(diastolic)]
  const flagged = [high, low].find((item) => statusTone[item.status] === 'warn')
  const ranged = high.range && low.range
  return [{
    key: 'blood_pressure', label: 'Blood pressure', value: `${high.value} / ${low.value}`, unit: systolic.unit, latest: high.latest,
    status: flagged?.status ?? (high.status === low.status ? high.status : 'RangeUnavailable'),
    trend: (flagged ?? high).trend,
    range: ranged ? `${systolic.readings[0]!.referenceLow}/${diastolic.readings[0]!.referenceLow} – ${systolic.readings[0]!.referenceHigh}/${diastolic.readings[0]!.referenceHigh} ${systolic.unit}` : null,
    series: [systolic, diastolic],
  }, ...cards]
}

/** Arithmetic difference between the oldest and newest loaded reading — a recorded fact, not a judgement. */
export function changeSummary(series: VitalSeries) {
  const latest = series.readings[0]!
  const first = series.readings[series.readings.length - 1]!
  if (series.readings.length < 2) return 'One reading recorded. A change needs at least two readings.'
  const delta = Math.round((latest.value - first.value) * 100) / 100
  const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const moved = delta === 0 ? 'No change' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${series.unit}`
  return `${moved} across ${series.readings.length} readings (${first.value} on ${day(first.measuredAt)} → ${latest.value} on ${day(latest.measuredAt)}).`
}

/** Where a value sits on a bar that shows the reference interval in its middle half, as a 0–100 percentage. */
export function rangePosition(value: number, low: number, high: number) {
  const span = high - low
  if (span <= 0) return 50
  return Math.min(100, Math.max(0, ((value - (low - span / 2)) / (span * 2)) * 100))
}

export function fileKind(fileName: string) {
  const extension = /\.([a-z0-9]{2,5})$/i.exec(fileName.trim())?.[1]?.toUpperCase()
  return extension === 'JPEG' ? 'JPG' : extension ?? 'FILE'
}
