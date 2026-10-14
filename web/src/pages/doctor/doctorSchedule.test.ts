import { describe, expect, it } from 'vitest'

import { activeDayCount, initials, nextWindow, sortWindows, validateWindows } from './doctorSchedule'

describe('doctorSchedule', () => {
  it('accepts back-to-back ranges and rejects reversed or overlapping ones', () => {
    expect(validateWindows([
      { dayOfWeek: 'Monday', startTime: '13:00', endTime: '16:00' },
      { dayOfWeek: 'Monday', startTime: '09:00', endTime: '13:00' },
    ])).toBeNull()
    expect(validateWindows([{ dayOfWeek: 'Friday', startTime: '15:00', endTime: '09:00' }])).toBe('Check Friday: end time must be after start time.')
    expect(validateWindows([{ dayOfWeek: 'Friday', startTime: '', endTime: '09:00' }])).toBe('Check Friday: end time must be after start time.')
    expect(validateWindows([
      { dayOfWeek: 'Sunday', startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 'Sunday', startTime: '11:59', endTime: '14:00' },
    ])).toBe('Check Sunday: time ranges must not overlap.')
  })

  it('offers a first range, then one that does not overlap the last', () => {
    expect(nextWindow('Monday', [])).toEqual({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '16:00' })
    const morning = { dayOfWeek: 'Monday' as const, startTime: '09:00', endTime: '12:00' }
    expect(nextWindow('Monday', [morning])).toEqual({ dayOfWeek: 'Monday', startTime: '13:00', endTime: '16:00' })
    const late = nextWindow('Monday', [{ ...morning, startTime: '18:00', endTime: '21:30' }])
    expect(late).toEqual({ dayOfWeek: 'Monday', startTime: '22:30', endTime: '23:59' })
    expect(validateWindows([{ ...morning, startTime: '18:00', endTime: '21:30' }, late])).toBeNull()
  })

  it('counts days, orders the week Monday-first and builds initials', () => {
    const windows = [
      { dayOfWeek: 'Sunday' as const, startTime: '09:00', endTime: '10:00' },
      { dayOfWeek: 'Monday' as const, startTime: '13:00', endTime: '14:00' },
      { dayOfWeek: 'Monday' as const, startTime: '09:00', endTime: '10:00' },
    ]
    expect(activeDayCount(windows)).toBe(2)
    expect(sortWindows(windows).map((w) => `${w.dayOfWeek} ${w.startTime}`)).toEqual(['Monday 09:00', 'Monday 13:00', 'Sunday 09:00'])
    expect(initials('Dr. Synthetic Perera')).toBe('SP')
    expect(initials('')).toBe('DR')
  })
})
