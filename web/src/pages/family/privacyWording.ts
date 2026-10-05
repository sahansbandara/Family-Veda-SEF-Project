// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Plain-language names for audit events on family screens (docs/Three_Dashboards_UX_Plan.md §7).
const known: Record<string, string> = {
  ADULT_SHARED_REPORT_ACCESS: 'You viewed a report an adult shared with you',
  FAMILY_MEMBERSHIP_CHANGED: 'Family membership changed',
  CONSENT_CHANGED: 'Consent setting changed',
  CONSENT_UPDATED: 'Consent setting changed',
  RECORD_CREATED: 'Health record added',
  LAB_REPORT_UPLOADED: 'Lab report uploaded',
  CASE_GRANT_ISSUED: 'A doctor was given access to a case',
  APPROVAL_DECISION: 'A doctor reviewed a case',
  ACCOUNT_SUSPENDED: 'An account was deactivated',
  ACCOUNT_REACTIVATED: 'An account was reactivated',
}

export function describeAccessEvent(eventType: string): string {
  if (known[eventType]) return known[eventType]
  const words = eventType.toLowerCase().replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Doctor clinical consent categories as the family sees them. */
export const consentLabels: Record<string, string> = {
  Conditions: 'Conditions',
  VitalsSummary: 'Vitals summary',
  HereditaryFlags: 'Family history (screening flags)',
}

export const consentHints: Record<string, string> = {
  Conditions: 'Recorded conditions, during a reviewed case.',
  VitalsSummary: 'Summarised vitals such as blood pressure trends.',
  HereditaryFlags: 'Screening indications from family history. Never a diagnosis.',
}

export function consentStatusLabel(status: string): string {
  if (status === 'Granted') return 'Granted'
  if (status === 'PendingReaffirmation') return 'Needs confirmation'
  if (status === 'Revoked') return 'Revoked'
  return 'Not granted'
}

export type ActivityKind = 'consent' | 'access' | 'doctor' | 'family'

export const activityKindLabels: Record<ActivityKind, string> = {
  consent: 'Consent changes',
  access: 'Record access',
  doctor: 'Doctor activity',
  family: 'Family & account',
}

/** Groups an audit event type for the client-side filter. Metadata only, never clinical content. */
export function activityKind(eventType: string): ActivityKind {
  const type = eventType.toUpperCase()
  if (type.includes('CONSENT')) return 'consent'
  if (type.includes('GRANT') || type.includes('APPROVAL') || type.includes('DOCTOR')) return 'doctor'
  if (type.includes('ACCESS') || type.includes('VIEW') || type.includes('READ') || type.includes('SHARE')) return 'access'
  return 'family'
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
