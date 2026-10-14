// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Pure rules for the weekly-hours editor on Profile & Availability. The backend repeats the
// same checks; these only give the doctor an answer before the request is sent.
import type { AvailabilityWindowDto, WeekDay } from '../../services/apiClient'

export const weekDays: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const hhmm = (value: string) => value.slice(0, 5)

const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
const fromMinutes = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** Hours offered when a day is switched on, or the next free range after the day's last one. */
export function nextWindow(day: WeekDay, dayWindows: AvailabilityWindowDto[]): AvailabilityWindowDto {
  if (dayWindows.length === 0) return { dayOfWeek: day, startTime: '09:00', endTime: '16:00' }
  const start = Math.max(...dayWindows.map((w) => toMinutes(w.endTime))) + 60
  if (Number.isNaN(start) || start >= 23 * 60) return { dayOfWeek: day, startTime: '09:00', endTime: '12:00' }
  return { dayOfWeek: day, startTime: fromMinutes(start), endTime: fromMinutes(Math.min(start + 180, 23 * 60 + 59)) }
}

/** First problem found, worded for the doctor, or null when the week can be saved. */
export function validateWindows(windows: AvailabilityWindowDto[]): string | null {
  for (const day of weekDays) {
    const sorted = windows.filter((w) => w.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
    for (let i = 0; i < sorted.length; i++) {
      const { startTime, endTime } = sorted[i]
      if (!startTime || !endTime || startTime >= endTime) return `Check ${day}: end time must be after start time.`
      if (i > 0 && startTime < sorted[i - 1].endTime) return `Check ${day}: time ranges must not overlap.`
    }
  }
  return null
}

export const activeDayCount = (windows: AvailabilityWindowDto[]) => new Set(windows.map((w) => w.dayOfWeek)).size

/** Monday-first, earliest range first: the order the API receives and returns. */
export const sortWindows = (windows: AvailabilityWindowDto[]) =>
  [...windows].sort((a, b) => weekDays.indexOf(a.dayOfWeek) - weekDays.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime))

export const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

export function initials(name: string): string {
  const words = name.replace(/^dr\.?\s+/i, '').split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || 'DR'
}
