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
