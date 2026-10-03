// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Pure display rules for the doctor My Families flow. Mirrors mobile/lib/models/doctor_family_workspace.dart.
// Nothing here decides access: the backend returns null for a restricted category and the UI only labels it.
import type { MemberWorkspaceDto, WorkspaceLabValueDto } from '../../services/apiClient'

export type WorkspaceVital = NonNullable<MemberWorkspaceDto['vitals']>[number]
export type WorkspaceVisit = MemberWorkspaceDto['visits'][number]

const roleLabels: Record<string, string> = { Head: 'Family Head', AdultMember: 'Adult', MinorMember: 'Minor' }
export const roleLabel = (role: string) => roleLabels[role] ?? role

/** Readable names for the consent categories the API returns. Unknown categories are shown as sent. */
const consentLabels: Record<string, string> = {
  Conditions: 'Conditions / Records',
  VitalsSummary: 'Vitals summary',
  HereditaryFlags: 'Family-history screening',
}
export const consentLabel = (category: string) => consentLabels[category] ?? splitWords(category)

const vitalLabels: Record<string, string> = {
  heart_rate: 'Heart rate',
  blood_pressure_systolic: 'Systolic blood pressure',
  blood_pressure_diastolic: 'Diastolic blood pressure',
  weight: 'Weight',
  height: 'Height',
  temperature: 'Temperature',
  respiratory_rate: 'Respiratory rate',
  oxygen_saturation: 'Oxygen saturation',
  blood_glucose: 'Blood glucose',
  bmi: 'Body mass index',
}

function splitWords(value: string) {
  return value.replaceAll(/([a-z])([A-Z])/g, '$1 $2')
}

/** `heart_rate` → `Heart rate`. A name the member typed is kept, only tidied. */
export function vitalLabel(vitalType: string) {
  const known = vitalLabels[vitalType.trim().toLowerCase()]
  if (known) return known
  const words = splitWords(vitalType).replaceAll(/[_-]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Measurement'
}

export type VitalSeries = { key: string; label: string; unit: string; readings: WorkspaceVital[] }

/** Groups readings that share a type and a unit, newest first. Different units are never mixed in one series. */
export function groupVitals(vitals: WorkspaceVital[]): VitalSeries[] {
  const groups = new Map<string, VitalSeries>()
  for (const vital of vitals) {
    const key = `${vital.vitalType.trim().toLowerCase()}|${vital.unit.trim().toLowerCase()}`
    const series = groups.get(key) ?? { key, label: vitalLabel(vital.vitalType), unit: vital.unit, readings: [] }
    series.readings.push(vital)
    groups.set(key, series)
  }
  return [...groups.values()]
    .map((series) => ({ ...series, readings: [...series.readings].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export const rangeLabel: Record<WorkspaceLabValueDto['rangeStatus'], string> = {
  BelowRange: 'Below range',
  WithinRange: 'Within range',
  AboveRange: 'Above range',
  RangeUnavailable: 'Range unavailable',
}
export const rangeTone: Record<WorkspaceLabValueDto['rangeStatus'], 'warn' | 'ok' | 'muted'> = {
  BelowRange: 'warn',
  WithinRange: 'ok',
  AboveRange: 'warn',
  RangeUnavailable: 'muted',
}

/** The interval printed on the report. No interval is invented when the report did not print one. */
export function referenceRange(value: WorkspaceLabValueDto) {
  const { referenceLow: low, referenceHigh: high, unit } = value
  if (low == null && high == null) return 'Not printed'
  if (low != null && high != null) return `${low} – ${high} ${unit}`
  return low != null ? `From ${low} ${unit}` : `Up to ${high} ${unit}`
}

export function splitVisits(visits: WorkspaceVisit[], now: number) {
  const upcoming = visits
    .filter((visit) => new Date(visit.startsAt).getTime() >= now && (visit.status === 'Confirmed' || visit.status === 'Requested'))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const upcomingIds = new Set(upcoming.map((visit) => visit.appointmentId))
  const past = visits.filter((visit) => !upcomingIds.has(visit.appointmentId)).sort((a, b) => b.startsAt.localeCompare(a.startsAt))
  return { upcoming, past }
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join('') || '?'
}

export function shortDate(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function shortDateTime(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export const pad2 = (value: number) => String(value).padStart(2, '0')
