// S2 · Health Records — groups recorded vitals for display. Values only: no ranges, no interpretation (RULE 1, RULE 4).
import type { VitalDto } from '../../services/apiClient'
import type { RecordIconName } from './recordIcons'

export type VitalKind = 'heart' | 'pressure' | 'temperature' | 'oxygen' | 'weight' | 'glucose' | 'other'

export type VitalField = { vitalType: string; label: string }

export type VitalPreset = {
  kind: Exclude<VitalKind, 'other'>
  label: string
  hint: string
  unit: string
  icon: RecordIconName
  /** One API vital per field; blood pressure is stored as a systolic and a diastolic reading. */
  fields: VitalField[]
  chartType?: 'bar' | 'line'
}

export const VITAL_PRESETS: readonly VitalPreset[] = [
  { kind: 'heart', label: 'Heart Rate', hint: 'BPM', unit: 'bpm', icon: 'heart', chartType: 'bar', fields: [{ vitalType: 'heart_rate', label: 'Heart rate' }] },
  {
    kind: 'pressure', label: 'Blood Pressure', hint: 'Systolic / Diastolic (mmHg)', unit: 'mmHg', icon: 'pressure',
    chartType: 'bar',
    fields: [
      { vitalType: 'blood_pressure_systolic', label: 'Systolic' },
      { vitalType: 'blood_pressure_diastolic', label: 'Diastolic' },
    ],
  },
  { kind: 'temperature', label: 'Body Temperature', hint: '°C', unit: '°C', icon: 'thermometer', chartType: 'bar', fields: [{ vitalType: 'temperature', label: 'Temperature' }] },
  { kind: 'oxygen', label: 'Oxygen (SpO₂)', hint: 'Percentage (%)', unit: '%', icon: 'lungs', chartType: 'bar', fields: [{ vitalType: 'oxygen_saturation', label: 'Oxygen saturation' }] },
  { kind: 'weight', label: 'Weight', hint: 'Kilograms (kg)', unit: 'kg', icon: 'scale', chartType: 'line', fields: [{ vitalType: 'weight', label: 'Weight' }] },
  { kind: 'glucose', label: 'Blood Glucose', hint: 'mg/dL', unit: 'mg/dL', icon: 'drop', chartType: 'bar', fields: [{ vitalType: 'blood_glucose', label: 'Blood glucose' }] },
]

const KIND_BY_KEY: Record<string, VitalKind> = {
  heart_rate: 'heart', pulse: 'heart',
  blood_pressure: 'pressure', blood_pressure_systolic: 'pressure', blood_pressure_diastolic: 'pressure',
  systolic: 'pressure', diastolic: 'pressure',
  temperature: 'temperature', body_temperature: 'temperature',
  oxygen_saturation: 'oxygen', oxygen_spo2: 'oxygen', spo2: 'oxygen', oxygen: 'oxygen',
  weight: 'weight', body_weight: 'weight',
  blood_glucose: 'glucose', glucose: 'glucose',
}

export function vitalKey(vitalType: string): string {
  return vitalType.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function vitalKind(vitalType: string): VitalKind {
  return KIND_BY_KEY[vitalKey(vitalType)] ?? 'other'
}

export function vitalIcon(kind: VitalKind): RecordIconName {
  return VITAL_PRESETS.find((preset) => preset.kind === kind)?.icon ?? 'pulse'
}

export type VitalReading = {
  id: string
  measuredAt: string
  /** Text shown to the user, e.g. "128/82" for a paired blood pressure reading. */
  display: string
  /** Number plotted on the trend line (systolic for blood pressure). */
  value: number
  unit: string
}

export type VitalGroup = {
  key: string
  kind: VitalKind
  label: string
  unit: string
  /** Newest first. */
  readings: VitalReading[]
}

function titleCase(vitalType: string): string {
  return vitalKey(vitalType).split('_').filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

/** Groups vitals by measurement, pairing systolic and diastolic readings taken at the same time. */
export function groupVitals(vitals: readonly VitalDto[]): VitalGroup[] {
  const groups = new Map<string, VitalGroup>()
  const pressure = new Map<string, { id: string; measuredAt: string; unit: string; systolic?: number; diastolic?: number }>()

  for (const vital of vitals) {
    const key = vitalKey(vital.vitalType)
    const kind = vitalKind(vital.vitalType)
    if (kind === 'pressure' && key !== 'blood_pressure') {
      const pair = pressure.get(vital.measuredAt) ?? { id: vital.id, measuredAt: vital.measuredAt, unit: vital.unit }
      const side = key.includes('diastolic') ? 'diastolic' : 'systolic'
      pressure.set(vital.measuredAt, { ...pair, [side]: vital.value })
      continue
    }
    const groupKey = kind === 'other' ? key : kind
    const preset = VITAL_PRESETS.find((item) => item.kind === kind)
    const group = groups.get(groupKey) ?? { key: groupKey, kind, label: preset?.label ?? titleCase(vital.vitalType), unit: vital.unit, readings: [] }
    groups.set(groupKey, {
      ...group,
      readings: [...group.readings, { id: vital.id, measuredAt: vital.measuredAt, display: formatNumber(vital.value), value: vital.value, unit: vital.unit }],
    })
  }

  if (pressure.size > 0) {
    const existing = groups.get('pressure')
    const paired: VitalReading[] = [...pressure.values()].map((pair) => ({
      id: pair.id,
      measuredAt: pair.measuredAt,
      display: `${pair.systolic == null ? '—' : formatNumber(pair.systolic)}/${pair.diastolic == null ? '—' : formatNumber(pair.diastolic)}`,
      value: pair.systolic ?? pair.diastolic ?? 0,
      unit: pair.unit,
    }))
    groups.set('pressure', {
      key: 'pressure', kind: 'pressure', label: 'Blood Pressure', unit: paired[0].unit,
      readings: [...(existing?.readings ?? []), ...paired],
    })
  }

  const order = VITAL_PRESETS.map((preset) => preset.kind as string)
  return [...groups.values()]
    .map((group) => ({ ...group, readings: [...group.readings].sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt)) }))
    .sort((a, b) => {
      const left = order.indexOf(a.key)
      const right = order.indexOf(b.key)
      return (left === -1 ? order.length : left) - (right === -1 ? order.length : right) || a.label.localeCompare(b.label)
    })
}

/** Oldest-to-newest values for a trend line. */
export function trendValues(group: VitalGroup, count: number): number[] {
  return group.readings.slice(0, count).map((reading) => reading.value).reverse()
}

/** `text` is the unsigned size of the change; `direction` carries the sign. */
export type VitalChange = { direction: 'up' | 'down' | 'same'; text: string }

/** Arithmetic difference from the previous reading — a recorded fact, not an assessment. */
export function changeFromPrevious(group: VitalGroup, index = 0): VitalChange | null {
  const current = group.readings[index]
  const previous = group.readings[index + 1]
  if (!current || !previous) return null
  const delta = Number((current.value - previous.value).toFixed(2))
  if (delta === 0) return { direction: 'same', text: 'No change' }
  return { direction: delta > 0 ? 'up' : 'down', text: formatNumber(Math.abs(delta)) }
}

export function formatVitalDate(measuredAt: string): string {
  return new Date(measuredAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
