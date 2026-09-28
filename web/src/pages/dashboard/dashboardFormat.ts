// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Formatting helpers for the three portal dashboards.
export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'muted'

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function shortDate(iso?: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

export function shortTime(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function appointmentTone(status: string): Tone {
  if (status === 'Confirmed' || status === 'Completed') return 'ok'
  if (status === 'Requested') return 'warn'
  if (status === 'NoShow') return 'danger'
  return 'muted'
}

export function roleLabel(role: string): string {
  if (role === 'Head') return 'Head'
  if (role === 'MinorMember') return 'Minor'
  return 'Adult'
}

export function vitalLabel(vitalType: string): string {
  const words = vitalType.replaceAll('_', ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
