import { describe, expect, it } from 'vitest'

import type { AppointmentDto } from '../../../services/apiClient'
import { addMonths, allowedActions, canReschedule, dayKey, groupByDay, initials, monthGrid, shiftByView, weekDays, workingHoursFor } from './calendarUtils'

const appointment = (id: string, startsAt: string, status: AppointmentDto['status'] = 'Confirmed') =>
  ({ id, startsAt, status, durationMinutes: 30 }) as AppointmentDto

describe('calendarUtils', () => {
  it('offers only the transitions the backend state machine allows', () => {
    expect(allowedActions.Requested).toEqual(['confirm', 'cancel'])
    expect(allowedActions.Confirmed).toEqual(['complete', 'no-show', 'cancel'])
    expect(allowedActions.Completed).toEqual([])
    expect(allowedActions.Cancelled).toEqual([])
    expect(allowedActions.NoShow).toEqual([])
    expect(canReschedule('Requested')).toBe(true)
    expect(canReschedule('Completed')).toBe(false)
  })

  it('builds whole weeks for a month, Sunday first', () => {
    const grid = monthGrid(new Date(2026, 9, 14)) // October 2026 starts on a Thursday
    expect(grid).toHaveLength(35)
    expect(dayKey(grid[0])).toBe('2026-09-27')
    expect(dayKey(grid[34])).toBe('2026-10-31')
  })

  it('returns the Sunday-to-Saturday week of a date', () => {
    const days = weekDays(new Date(2026, 9, 14))
    expect(days.map(dayKey)).toEqual(['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'])
  })

  it('clamps month steps to the last day of a shorter month', () => {
    expect(dayKey(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28')
    expect(dayKey(shiftByView(new Date(2026, 9, 14), 'week', -1))).toBe('2026-10-07')
    expect(dayKey(shiftByView(new Date(2026, 9, 31), 'day', 1))).toBe('2026-11-01')
  })

  it('groups appointments by local day in start order', () => {
    const noon = new Date(2026, 9, 5, 12, 0).toISOString()
    const morning = new Date(2026, 9, 5, 9, 0).toISOString()
    const map = groupByDay([appointment('late', noon), appointment('early', morning)])
    expect(map.get('2026-10-05')?.map((item) => item.id)).toEqual(['early', 'late'])
  })

  it('lists working hours for the weekday only', () => {
    const windows = [
      { dayOfWeek: 'Wednesday' as const, startTime: '13:00:00', endTime: '17:00:00' },
      { dayOfWeek: 'Wednesday' as const, startTime: '09:00:00', endTime: '12:00:00' },
      { dayOfWeek: 'Friday' as const, startTime: '09:00:00', endTime: '12:00:00' },
    ]
    expect(workingHoursFor(new Date(2026, 9, 14), windows)).toEqual(['09:00 – 12:00', '13:00 – 17:00'])
    expect(workingHoursFor(new Date(2026, 9, 15), windows)).toEqual([])
  })

  it('derives initials', () => {
    expect(initials('Synthetic Head')).toBe('SH')
    expect(initials('')).toBe('?')
  })
})
